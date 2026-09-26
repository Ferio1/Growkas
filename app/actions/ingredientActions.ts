"use server";

import fs from "fs";
import path from "path";

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

export interface DeductionLog {
  id: string;
  timestamp: string;
  invoice_number?: string;
  product_name: string;
  quantity: number;
  deductions: {
    ingredient_name: string;
    amount: number;
    unit: string;
    remaining: number;
    is_low_stock: boolean;
  }[];
}

interface InventoryStoreData {
  ingredients: IngredientItem[];
  recipes: ProductRecipe[];
  deductionLogs: DeductionLog[];
}

const STORE_FILE_PATH = path.join(process.cwd(), "data", "inventory_store.json");

// DATA AWAL MASTER BAHAN BAKU LENGKAP
const DEFAULT_INGREDIENTS: IngredientItem[] = [
  { id: "ing-1", name: "Biji Kopi Arabica Kaliurang", unit: "gram", stock: 4500, min_stock: 1000, cost_per_unit: 200, category: "kopi" },
  { id: "ing-2", name: "Fresh Milk UHT Full Cream", unit: "ml", stock: 12000, min_stock: 3000, cost_per_unit: 20, category: "susu_dairy" },
  { id: "ing-3", name: "Gula Aren Cair Organik", unit: "ml", stock: 3500, min_stock: 800, cost_per_unit: 35, category: "sirup_gula" },
  { id: "ing-4", name: "Sirup Karamel Monin", unit: "ml", stock: 2200, min_stock: 500, cost_per_unit: 60, category: "sirup_gula" },
  { id: "ing-5", name: "Bubuk Matcha Kyoto Premium", unit: "gram", stock: 1500, min_stock: 300, cost_per_unit: 300, category: "kopi" },
  { id: "ing-6", name: "Bubuk Cokelat Artisanal", unit: "gram", stock: 2000, min_stock: 500, cost_per_unit: 250, category: "kopi" },
  { id: "ing-7", name: "Cup Dingin 16oz + Strawless Lid", unit: "pcs", stock: 420, min_stock: 100, cost_per_unit: 650, category: "kemasan" },
  { id: "ing-8", name: "Cup Panas 8oz + Paper Lid", unit: "pcs", stock: 250, min_stock: 50, cost_per_unit: 750, category: "kemasan" },
  { id: "ing-9", name: "Daging Ayam Fillet Marinasi", unit: "gram", stock: 3200, min_stock: 800, cost_per_unit: 65, category: "makanan" },
  { id: "ing-10", name: "Daging Sapi Slice Shortplate", unit: "gram", stock: 2400, min_stock: 600, cost_per_unit: 130, category: "makanan" },
  { id: "ing-11", name: "Beras Wangi Organik (Nasi Matang)", unit: "porsi", stock: 45, min_stock: 15, cost_per_unit: 2500, category: "makanan" },
  { id: "ing-12", name: "Telur Ayam Negeri Fresh", unit: "pcs", stock: 60, min_stock: 20, cost_per_unit: 2000, category: "makanan" },
  { id: "ing-13", name: "Minyak Goreng Sawit", unit: "ml", stock: 5000, min_stock: 1000, cost_per_unit: 18, category: "makanan" },
  { id: "ing-14", name: "Bumbu Rempah Nasi Goreng Saray", unit: "gram", stock: 2000, min_stock: 500, cost_per_unit: 40, category: "makanan" },
  { id: "ing-15", name: "Kecap Manis & Saus Gurih", unit: "ml", stock: 2500, min_stock: 500, cost_per_unit: 25, category: "makanan" },
  { id: "ing-16", name: "Kentang Beku Shoestring Cut", unit: "gram", stock: 5000, min_stock: 1000, cost_per_unit: 45, category: "makanan" },
  { id: "ing-17", name: "Pasta Spaghetti Kering", unit: "gram", stock: 3000, min_stock: 500, cost_per_unit: 35, category: "makanan" },
];

// MASTER RESEP F&B BILL OF MATERIALS LENGKAP
const DEFAULT_RECIPES: ProductRecipe[] = [
  // MAKANAN UTAMA
  {
    product_name: "Nasi Goreng Saray Special",
    selling_price: 27000,
    ingredients: [
      { ingredient_id: "ing-11", ingredient_name: "Beras Wangi Organik (Nasi)", quantity: 1, unit: "porsi" },
      { ingredient_id: "ing-12", ingredient_name: "Telur Ayam Negeri Fresh", quantity: 1, unit: "pcs" },
      { ingredient_id: "ing-9", ingredient_name: "Daging Ayam Fillet", quantity: 50, unit: "gram" },
      { ingredient_id: "ing-13", ingredient_name: "Minyak Goreng Sawit", quantity: 10, unit: "ml" },
      { ingredient_id: "ing-14", ingredient_name: "Bumbu Rempah Nasi Goreng", quantity: 15, unit: "gram" },
      { ingredient_id: "ing-15", ingredient_name: "Kecap Manis & Saus", quantity: 10, unit: "ml" },
    ],
  },
  {
    product_name: "Rice Bowl Ayam Sambal Matah",
    selling_price: 28000,
    ingredients: [
      { ingredient_id: "ing-11", ingredient_name: "Beras Wangi Organik", quantity: 1, unit: "porsi" },
      { ingredient_id: "ing-9", ingredient_name: "Daging Ayam Fillet", quantity: 120, unit: "gram" },
      { ingredient_id: "ing-13", ingredient_name: "Minyak Goreng Sawit", quantity: 15, unit: "ml" },
    ],
  },
  {
    product_name: "Rice Bowl Beef Slice Teriyaki",
    selling_price: 33000,
    ingredients: [
      { ingredient_id: "ing-11", ingredient_name: "Beras Wangi Organik", quantity: 1, unit: "porsi" },
      { ingredient_id: "ing-10", ingredient_name: "Beef Shortplate", quantity: 100, unit: "gram" },
      { ingredient_id: "ing-15", ingredient_name: "Saus Teriyaki Gurih", quantity: 20, unit: "ml" },
    ],
  },
  {
    product_name: "Rice Bowl Chicken Katsu Curry",
    selling_price: 30000,
    ingredients: [
      { ingredient_id: "ing-11", ingredient_name: "Beras Wangi Organik", quantity: 1, unit: "porsi" },
      { ingredient_id: "ing-9", ingredient_name: "Daging Ayam Fillet", quantity: 100, unit: "gram" },
      { ingredient_id: "ing-13", ingredient_name: "Minyak Goreng Sawit", quantity: 20, unit: "ml" },
    ],
  },
  {
    product_name: "Spaghetti Carbonara Creamy",
    selling_price: 32000,
    ingredients: [
      { ingredient_id: "ing-17", ingredient_name: "Pasta Spaghetti", quantity: 100, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 100, unit: "ml" },
      { ingredient_id: "ing-12", ingredient_name: "Telur Ayam Negeri", quantity: 1, unit: "pcs" },
    ],
  },

  // KOPI & ESPRESSO
  {
    product_name: "Saray Signature Palm Sugar",
    selling_price: 22000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 130, unit: "ml" },
      { ingredient_id: "ing-3", ingredient_name: "Gula Aren Cair", quantity: 25, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Americano / Long Black",
    selling_price: 20000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Caffe Latte",
    selling_price: 24000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 160, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Spanish Latte",
    selling_price: 25000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 140, unit: "ml" },
      { ingredient_id: "ing-3", ingredient_name: "Gula Aren Cair", quantity: 20, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Salted Caramel Macchiato",
    selling_price: 27000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 140, unit: "ml" },
      { ingredient_id: "ing-4", ingredient_name: "Sirup Karamel Monin", quantity: 20, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Manual Brew V60 (Arabica Kaliurang)",
    selling_price: 26000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 15, unit: "gram" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin / Server", quantity: 1, unit: "pcs" },
    ],
  },

  // NON-COFFEE & MOCKTAIL
  {
    product_name: "Signature Matcha Latte",
    selling_price: 25000,
    ingredients: [
      { ingredient_id: "ing-5", ingredient_name: "Bubuk Matcha", quantity: 15, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 150, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Artisanal Chocolate Ice/Hot",
    selling_price: 24000,
    ingredients: [
      { ingredient_id: "ing-6", ingredient_name: "Bubuk Cokelat", quantity: 20, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 140, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Lychee Tea Refreshment",
    selling_price: 20000,
    ingredients: [
      { ingredient_id: "ing-3", ingredient_name: "Sirup Gula Aren/Leci", quantity: 25, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Berry Blossom Mocktail",
    selling_price: 26000,
    ingredients: [
      { ingredient_id: "ing-4", ingredient_name: "Sirup Mocktail", quantity: 30, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },

  // PASTRY & SNACK
  {
    product_name: "French Fries Shoestring",
    selling_price: 20000,
    ingredients: [
      { ingredient_id: "ing-16", ingredient_name: "Kentang Beku", quantity: 150, unit: "gram" },
      { ingredient_id: "ing-13", ingredient_name: "Minyak Goreng Sawit", quantity: 30, unit: "ml" },
    ],
  },
  {
    product_name: "Tahu Cabe Garam Saray",
    selling_price: 20000,
    ingredients: [
      { ingredient_id: "ing-13", ingredient_name: "Minyak Goreng Sawit", quantity: 25, unit: "ml" },
      { ingredient_id: "ing-14", ingredient_name: "Bumbu Rempah Cabe Garam", quantity: 10, unit: "gram" },
    ],
  },
];

// Helper membaca data persisten dari disk
function loadStore(): InventoryStoreData {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const raw = fs.readFileSync(STORE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.ingredients) && Array.isArray(parsed.recipes)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to read inventory store file, using defaults:", err);
  }

  // Inisialisasi default
  const initialStore: InventoryStoreData = {
    ingredients: DEFAULT_INGREDIENTS,
    recipes: DEFAULT_RECIPES,
    deductionLogs: [],
  };
  saveStore(initialStore);
  return initialStore;
}

// Helper menyimpan data ke disk
function saveStore(data: InventoryStoreData) {
  try {
    const dir = path.dirname(STORE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save inventory store file:", err);
  }
}

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
  const store = loadStore();
  let totalCost = 0;
  const detailedIngredients = [];

  for (const req of recipe.ingredients) {
    const ing = store.ingredients.find((i) => i.id === req.ingredient_id);
    if (ing) {
      const itemCost = ing.cost_per_unit * req.quantity;
      totalCost += itemCost;
      detailedIngredients.push({
        ingredient_id: req.ingredient_id,
        ingredient_name: req.ingredient_name || ing.name,
        quantity: req.quantity,
        unit: req.unit || ing.unit,
        cost_per_unit: ing.cost_per_unit,
        item_cost: itemCost,
        current_stock: ing.stock,
        min_stock: ing.min_stock,
        is_low_stock: ing.stock <= ing.min_stock,
      });
    } else {
      detailedIngredients.push({
        ingredient_id: req.ingredient_id,
        ingredient_name: req.ingredient_name,
        quantity: req.quantity,
        unit: req.unit,
        cost_per_unit: 0,
        item_cost: 0,
        current_stock: 0,
        min_stock: 0,
        is_low_stock: false,
      });
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
    ingredients: detailedIngredients,
  };
}

// 2. Ambil seluruh data Bahan Baku, Analisis HPP Menu, & Log Pengurangan Real-time
export async function getIngredientsAndCOGS() {
  const store = loadStore();
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
    recentDeductions: store.deductionLogs.slice(0, 15), // 15 log transaksi terbaru
  };
}

// 3. Tambah / Restok Bahan Baku
export async function restockIngredient(ingredientId: string, additionalStock: number) {
  const store = loadStore();
  const ing = store.ingredients.find((i) => i.id === ingredientId);
  if (ing) {
    ing.stock += additionalStock;
    saveStore(store);
    return { success: true, updatedIngredient: ing };
  }
  return { success: false, error: "Bahan baku tidak ditemukan" };
}

// 4. Pemotongan Otomatis Bahan Baku saat Transaksi Berhasil (Real-Time Deduction Engine)
export async function deductRawIngredientsForItems(
  items: { product_name: string; quantity: number }[],
  invoiceNumber?: string
) {
  const store = loadStore();
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

  saveStore(store);

  return {
    success: true,
    deductedSummary: allDeductions,
  };
}

// 5. Inisialisasi awal khusus pesanan user sebelumnya (#INV-684796 50x Nasi Goreng Saray Special)
// Agar saat dibuka langsung terlihat pengurangan stok dan riwayat lognya!
(function initOrderRecordIfEmpty() {
  try {
    const store = loadStore();
    if (store.deductionLogs.length === 0) {
      // Terapkan pemotongan 50x Nasi Goreng Saray Special
      const recipe = resolveRecipe("Nasi Goreng Saray Special", 27000, store.recipes);
      const deductions = [];
      for (const req of recipe.ingredients) {
        const ing = store.ingredients.find((i) => i.id === req.ingredient_id);
        if (ing) {
          const amt = req.quantity * 50;
          ing.stock = Math.max(0, ing.stock - amt);
          deductions.push({
            ingredient_name: ing.name,
            amount: amt,
            unit: ing.unit,
            remaining: ing.stock,
            is_low_stock: ing.stock <= ing.min_stock,
          });
        }
      }
      store.deductionLogs.unshift({
        id: "deduct-init-inv684796",
        timestamp: "Baru saja",
        invoice_number: "INV-684796",
        product_name: "50x Nasi Goreng Saray Special",
        quantity: 50,
        deductions,
      });
      saveStore(store);
    }
  } catch (e) {
    console.warn("Init order fallback:", e);
  }
})();
