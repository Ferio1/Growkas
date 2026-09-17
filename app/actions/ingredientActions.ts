"use server";

import { createClient } from "@/lib/supabase/server";

export interface IngredientItem {
  id: string;
  name: string;
  unit: "gram" | "ml" | "pcs" | "porsi";
  stock: number;
  min_stock: number;
  cost_per_unit: number; // Biaya beli per unit (Rupiah)
  category: "kopi" | "susu_dairy" | "sirup_gula" | "kemasan" | "makanan";
}

export interface RecipeRequirement {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number; // Jumlah yang dipakai per 1 porsi menu
  unit: string;
}

export interface ProductRecipe {
  product_name: string;
  selling_price: number;
  ingredients: RecipeRequirement[];
}

// In-Memory Master Bahan Baku
let MASTER_INGREDIENTS: IngredientItem[] = [
  { id: "ing-1", name: "Biji Kopi Arabica Kaliurang", unit: "gram", stock: 4500, min_stock: 1000, cost_per_unit: 200, category: "kopi" }, // Rp 200/gr = Rp 200.000/kg
  { id: "ing-2", name: "Fresh Milk UHT Full Cream", unit: "ml", stock: 12000, min_stock: 3000, cost_per_unit: 20, category: "susu_dairy" }, // Rp 20/ml = Rp 20.000/liter
  { id: "ing-3", name: "Gula Aren Cair Organik", unit: "ml", stock: 3500, min_stock: 800, cost_per_unit: 35, category: "sirup_gula" }, // Rp 35/ml = Rp 35.000/liter
  { id: "ing-4", name: "Sirup Karamel Monin", unit: "ml", stock: 2200, min_stock: 500, cost_per_unit: 60, category: "sirup_gula" },
  { id: "ing-5", name: "Bubuk Matcha Kyoto Premium", unit: "gram", stock: 1500, min_stock: 300, cost_per_unit: 300, category: "kopi" },
  { id: "ing-6", name: "Bubuk Cokelat Artisanal", unit: "gram", stock: 2000, min_stock: 500, cost_per_unit: 250, category: "kopi" },
  { id: "ing-7", name: "Cup Dingin 16oz + Strawless Lid", unit: "pcs", stock: 420, min_stock: 100, cost_per_unit: 650, category: "kemasan" },
  { id: "ing-8", name: "Cup Panas 8oz + Paper Lid", unit: "pcs", stock: 250, min_stock: 50, cost_per_unit: 750, category: "kemasan" },
  { id: "ing-9", name: "Daging Ayam Fillet Marinasi", unit: "gram", stock: 3200, min_stock: 800, cost_per_unit: 65, category: "makanan" },
  { id: "ing-10", name: "Daging Sapi Slice Shortplate", unit: "gram", stock: 2400, min_stock: 600, cost_per_unit: 130, category: "makanan" },
  { id: "ing-11", name: "Beras Wangi Organik (Nasi Matang)", unit: "porsi", stock: 45, min_stock: 15, cost_per_unit: 2500, category: "makanan" },
];

// In-Memory Master Resep (Bill of Materials) Menu F&B
let MASTER_RECIPES: ProductRecipe[] = [
  {
    product_name: "Saray Signature Palm Sugar",
    selling_price: 22000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" }, // Rp 3.600
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 130, unit: "ml" },      // Rp 2.600
      { ingredient_id: "ing-3", ingredient_name: "Gula Aren Cair", quantity: 25, unit: "ml" },       // Rp 875
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },       // Rp 650
    ],
  },
  {
    product_name: "Americano / Long Black",
    selling_price: 20000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" }, // Rp 3.600
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },       // Rp 650
    ],
  },
  {
    product_name: "Caffe Latte",
    selling_price: 24000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" }, // Rp 3.600
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 160, unit: "ml" },      // Rp 3.200
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },       // Rp 650
    ],
  },
  {
    product_name: "Salted Caramel Macchiato",
    selling_price: 27000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" }, // Rp 3.600
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 140, unit: "ml" },      // Rp 2.800
      { ingredient_id: "ing-4", ingredient_name: "Sirup Karamel", quantity: 20, unit: "ml" },        // Rp 1.200
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },       // Rp 650
    ],
  },
  {
    product_name: "Signature Matcha Latte",
    selling_price: 25000,
    ingredients: [
      { ingredient_id: "ing-5", ingredient_name: "Bubuk Matcha", quantity: 15, unit: "gram" },       // Rp 4.500
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 150, unit: "ml" },      // Rp 3.000
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },       // Rp 650
    ],
  },
  {
    product_name: "Rice Bowl Ayam Sambal Matah",
    selling_price: 28000,
    ingredients: [
      { ingredient_id: "ing-9", ingredient_name: "Ayam Fillet", quantity: 120, unit: "gram" },       // Rp 7.800
      { ingredient_id: "ing-11", ingredient_name: "Nasi Wangi", quantity: 1, unit: "porsi" },        // Rp 2.500
    ],
  },
  {
    product_name: "Rice Bowl Beef Slice Teriyaki",
    selling_price: 33000,
    ingredients: [
      { ingredient_id: "ing-10", ingredient_name: "Beef Shortplate", quantity: 100, unit: "gram" },   // Rp 13.000
      { ingredient_id: "ing-11", ingredient_name: "Nasi Wangi", quantity: 1, unit: "porsi" },        // Rp 2.500
    ],
  },
];

// Helper: Menghitung Total HPP suatu resep
export async function calculateRecipeCOGS(recipe: ProductRecipe) {
  let totalCost = 0;
  for (const req of recipe.ingredients) {
    const ing = MASTER_INGREDIENTS.find((i) => i.id === req.ingredient_id);
    if (ing) {
      totalCost += ing.cost_per_unit * req.quantity;
    }
  }
  const profitMargin = Math.max(0, recipe.selling_price - totalCost);
  const profitPercent = recipe.selling_price > 0 ? (profitMargin / recipe.selling_price) * 100 : 0;

  return {
    product_name: recipe.product_name,
    selling_price: recipe.selling_price,
    total_cogs: totalCost,
    profit_margin: profitMargin,
    profit_percent: Math.round(profitPercent * 10) / 10,
    ingredients: recipe.ingredients,
  };
}

// Ambil seluruh data Bahan Baku & Analisis HPP Menu
export async function getIngredientsAndCOGS() {
  const analysis = [];
  for (const r of MASTER_RECIPES) {
    const cogs = await calculateRecipeCOGS(r);
    analysis.push(cogs);
  }

  // Cek bahan baku yang berada di bawah batas minimum (Stok Menipis)
  const lowStockAlerts = MASTER_INGREDIENTS.filter((i) => i.stock <= i.min_stock);

  return {
    success: true,
    ingredients: MASTER_INGREDIENTS,
    recipesAnalysis: analysis,
    lowStockAlerts,
  };
}

// Tambah / Restok Bahan Baku
export async function restockIngredient(ingredientId: string, additionalStock: number) {
  const ing = MASTER_INGREDIENTS.find((i) => i.id === ingredientId);
  if (ing) {
    ing.stock += additionalStock;
    return { success: true, updatedIngredient: ing };
  }
  return { success: false, error: "Bahan baku tidak ditemukan" };
}

// Pemotongan Otomatis Bahan Baku saat Transaksi Berhasil
export async function deductRawIngredientsForItems(items: { product_name: string; quantity: number }[]) {
  const deductedSummary: Array<{ ingredient_name: string; amountDeducted: number; unit: string; remaining: number }> = [];

  for (const item of items) {
    const recipe = MASTER_RECIPES.find((r) => r.product_name.toLowerCase() === item.product_name.toLowerCase());
    if (!recipe) continue;

    for (const req of recipe.ingredients) {
      const ing = MASTER_INGREDIENTS.find((i) => i.id === req.ingredient_id);
      if (ing) {
        const amountToDeduct = req.quantity * item.quantity;
        ing.stock = Math.max(0, ing.stock - amountToDeduct);
        deductedSummary.push({
          ingredient_name: ing.name,
          amountDeducted: amountToDeduct,
          unit: ing.unit,
          remaining: ing.stock,
        });
      }
    }
  }

  return { success: true, deductedSummary };
}
