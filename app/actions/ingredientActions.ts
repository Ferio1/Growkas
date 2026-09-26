"use server";

import {
  IngredientItem,
  RecipeRequirement,
  ProductRecipe,
  DeductionLog,
  loadMasterStore,
  saveMasterStore,
} from "./storeManager";

export type { IngredientItem, RecipeRequirement, ProductRecipe, DeductionLog };

// Helper cerdas mencocokkan atau membuat resep BOM jika produk baru
function resolveRecipe(productName: string, price: number, allRecipes: ProductRecipe[]): ProductRecipe {
  const norm = productName.trim().toLowerCase();
  const existing = allRecipes.find((r) => r.product_name.toLowerCase() === norm);
  if (existing) return existing;

  // Fuzzy matching berdasarkan nama menu
  if (norm.includes("nasi") || norm.includes("goreng")) {
    return {
      product_name: productName,
      selling_price: price || 27000,
      ingredients: [
        { ingredient_id: "ing-11", ingredient_name: "Beras Wangi Organik (Nasi)", quantity: 1, unit: "porsi" },
        { ingredient_id: "ing-12", ingredient_name: "Telur Ayam Negeri Fresh", quantity: 1, unit: "pcs" },
        { ingredient_id: "ing-9", ingredient_name: "Daging Ayam Fillet", quantity: 50, unit: "gram" },
        { ingredient_id: "ing-13", ingredient_name: "Minyak Goreng Sawit", quantity: 10, unit: "ml" },
        { ingredient_id: "ing-14", ingredient_name: "Bumbu Rempah Nasi Goreng", quantity: 15, unit: "gram" },
      ],
    };
  }

  if (norm.includes("kopi") || norm.includes("latte") || norm.includes("espresso") || norm.includes("americano")) {
    return {
      product_name: productName,
      selling_price: price || 22000,
      ingredients: [
        { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
        { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 140, unit: "ml" },
        { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
      ],
    };
  }

  if (norm.includes("tea") || norm.includes("teh") || norm.includes("mocktail") || norm.includes("juice")) {
    return {
      product_name: productName,
      selling_price: price || 20000,
      ingredients: [
        { ingredient_id: "ing-3", ingredient_name: "Gula / Flavor Base", quantity: 25, unit: "ml" },
        { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
      ],
    };
  }

  // Default Food / Snack
  return {
    product_name: productName,
    selling_price: price || 20000,
    ingredients: [
      { ingredient_id: "ing-13", ingredient_name: "Minyak Goreng", quantity: 20, unit: "ml" },
      { ingredient_id: "ing-16", ingredient_name: "Bahan Makanan Olahan", quantity: 100, unit: "gram" },
    ],
  };
}

// 1. Helper: Menghitung Total HPP suatu resep
export async function calculateRecipeCOGS(recipe: ProductRecipe) {
  const store = loadMasterStore();
  let totalCost = 0;
  const detailedIngredients = [];

  for (const req of recipe.ingredients) {
    const ing = store.ingredients.find((i) => i.id === req.ingredient_id);
    if (ing) {
      const itemCost = ing.cost_per_unit * req.quantity;
      totalCost += itemCost;
      detailedIngredients.push({
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        quantity: req.quantity,
        unit: ing.unit,
        cost_per_unit: ing.cost_per_unit,
        subtotal_cost: itemCost,
        current_stock: ing.stock,
      });
    }
  }

  const profitMargin = recipe.selling_price - totalCost;
  const profitPercent = recipe.selling_price > 0 ? Math.round((profitMargin / recipe.selling_price) * 100) : 0;

  return {
    product_name: recipe.product_name,
    selling_price: recipe.selling_price,
    total_cogs: totalCost,
    profit_margin: profitMargin,
    profit_percent: profitPercent,
    ingredients: detailedIngredients,
  };
}

// 2. Ambil seluruh data Bahan Baku, Analisis HPP Menu, & Log Pengurangan Real-time
export async function getIngredientsAndCOGS() {
  const store = loadMasterStore();
  const analysis = [];

  for (const r of store.recipes) {
    const cogs = await calculateRecipeCOGS(r);
    analysis.push(cogs);
  }

  // Cek bahan baku yang berada di bawah batas minimum (Stok Menipis)
  const lowStockAlerts = store.ingredients.filter((i) => i.stock <= i.min_stock);

  return {
    success: true,
    ingredients: store.ingredients,
    recipesAnalysis: analysis,
    lowStockAlerts,
    recentDeductions: store.deductionLogs.slice(0, 15),
  };
}

// 3. Tambah / Restok Bahan Baku
export async function restockIngredient(ingredientId: string, additionalStock: number) {
  const store = loadMasterStore();
  const ing = store.ingredients.find((i) => i.id === ingredientId);
  if (ing) {
    ing.stock += additionalStock;
    saveMasterStore(store);
    return { success: true, updatedIngredient: ing };
  }
  return { success: false, error: "Bahan baku tidak ditemukan" };
}

// 4. Pemotongan Otomatis Bahan Baku saat Transaksi Berhasil (Real-Time Deduction Engine)
export async function deductRawIngredientsForItems(
  items: { product_name: string; quantity: number }[],
  invoiceNumber?: string
) {
  const store = loadMasterStore();
  const allDeductions: Array<{
    ingredient_name: string;
    amount: number;
    unit: string;
    remaining: number;
    is_low_stock: boolean;
  }> = [];

  for (const item of items) {
    const recipe = resolveRecipe(item.product_name, 25000, store.recipes);

    for (const req of recipe.ingredients) {
      const ing = store.ingredients.find((i) => i.id === req.ingredient_id);
      if (ing) {
        const amountToDeduct = req.quantity * item.quantity;
        ing.stock = Math.max(0, ing.stock - amountToDeduct);

        allDeductions.push({
          ingredient_name: ing.name,
          amount: amountToDeduct,
          unit: ing.unit,
          remaining: ing.stock,
          is_low_stock: ing.stock <= ing.min_stock,
        });
      }
    }
  }

  // Catat riwayat log pemotongan bahan baku
  if (allDeductions.length > 0) {
    const logEntry: DeductionLog = {
      id: "deduct-" + Date.now(),
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      invoice_number: invoiceNumber || "INV-" + Math.floor(100000 + Math.random() * 900000),
      product_name: items.map((i) => `${i.quantity}x ${i.product_name}`).join(", "),
      quantity: items.reduce((acc, i) => acc + i.quantity, 0),
      deductions: allDeductions,
    };

    store.deductionLogs.unshift(logEntry);
    if (store.deductionLogs.length > 100) {
      store.deductionLogs = store.deductionLogs.slice(0, 100);
    }
  }

  saveMasterStore(store);

  return {
    success: true,
    deductedSummary: allDeductions,
  };
}
