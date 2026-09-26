import fs from "fs";
import path from "path";
import os from "os";

export interface ProductItem {
  id: string;
  name: string;
  category_id?: string;
  category_name?: string;
  price: number;
  stock: number;
  barcode?: string;
  image_url?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface IngredientItem {
  id: string;
  name: string;
  unit: "gram" | "ml" | "pcs" | "porsi";
  stock: number;
  min_stock: number;
  cost_per_unit: number;
  category: "kopi" | "susu_dairy" | "sirup_gula" | "kemasan" | "makanan";
}

export interface RecipeRequirement {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
}

export interface ModifierConfig {
  sugarRules?: {
    normalPercent?: number; // 100%
    lessPercent?: number; // default 50%
    noPercent?: number; // default 0%
    extraPercent?: number; // default 150%
  };
  iceRules?: {
    normalPercent?: number; // 100%
    lessMilkCompensationPercent?: number; // default 10%
    noMilkCompensationPercent?: number; // default 20%
    extraIcePercent?: number; // default 130%
  };
  spicyRules?: {
    mildPercent?: number; // default 40%
    mediumPercent?: number; // default 100%
    extraSpicyPercent?: number; // default 160%
  };
}

export interface ProductRecipe {
  product_name: string;
  selling_price: number;
  ingredients: RecipeRequirement[];
  modifierConfig?: ModifierConfig;
}

export interface DeductionLog {
  id: string;
  timestamp: string;
  invoice_number?: string;
  product_name: string;
  quantity: number;
  modifiers_summary?: string;
  deductions: {
    ingredient_name: string;
    amount: number;
    unit: string;
    remaining: number;
    is_low_stock: boolean;
    modifier_note?: string;
  }[];
}

export interface TableOrderItem {
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  modifiers_summary?: string;
}

export interface TableOrder {
  id: string;
  invoice_number: string;
  table_number: string;
  branch_name: string;
  payment_method: "qris" | "cash" | "debit";
  payment_status: "paid" | "unpaid";
  status: "pending" | "processing" | "ready" | "completed" | "cancelled";
  total_amount: number;
  created_at: string;
  items: TableOrderItem[];
  source?: "customer_qr" | "kasir_pos";
}

export interface CashierShift {
  id: string;
  cashier_name: string;
  branch_name: string;
  start_time: string;
  end_time?: string;
  initial_cash: number;
  cash_sales: number;
  qris_sales: number;
  debit_sales: number;
  total_sales: number;
  transaction_count: number;
  expected_cash: number;
  actual_cash?: number;
  discrepancy?: number;
  status: "open" | "closed";
  notes?: string;
}

export interface MasterStoreData {
  products: ProductItem[];
  categories: CategoryItem[];
  ingredients: IngredientItem[];
  recipes: ProductRecipe[];
  deductionLogs: DeductionLog[];
  tableOrders: TableOrder[];
  activeShift: CashierShift | null;
  shiftHistory: CashierShift[];
  transactions: any[];
}

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: "cat-1", name: "Kopi & Espresso" },
  { id: "cat-2", name: "Non-Coffee & Mocktail" },
  { id: "cat-3", name: "Makanan Utama" },
  { id: "cat-4", name: "Pastry & Snack" },
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  // KOPI & ESPRESSO
  { id: "p-1", name: "Saray Signature Palm Sugar", category_id: "cat-1", category_name: "Kopi & Espresso", price: 22000, stock: 60, barcode: "8991001001" },
  { id: "p-2", name: "Americano / Long Black", category_id: "cat-1", category_name: "Kopi & Espresso", price: 20000, stock: 50, barcode: "8991001002" },
  { id: "p-3", name: "Caffe Latte", category_id: "cat-1", category_name: "Kopi & Espresso", price: 24000, stock: 45, barcode: "8991001003" },
  { id: "p-4", name: "Spanish Latte", category_id: "cat-1", category_name: "Kopi & Espresso", price: 25000, stock: 40, barcode: "8991001004" },
  { id: "p-5", name: "Salted Caramel Macchiato", category_id: "cat-1", category_name: "Kopi & Espresso", price: 27000, stock: 35, barcode: "8991001005" },
  { id: "p-6", name: "Manual Brew V60 (Arabica Kaliurang)", category_id: "cat-1", category_name: "Kopi & Espresso", price: 26000, stock: 30, barcode: "8991001006" },

  // NON-COFFEE & MOCKTAIL
  { id: "p-7", name: "Signature Matcha Latte", category_id: "cat-2", category_name: "Non-Coffee & Mocktail", price: 25000, stock: 50, barcode: "8991001007" },
  { id: "p-8", name: "Artisanal Chocolate Ice/Hot", category_id: "cat-2", category_name: "Non-Coffee & Mocktail", price: 24000, stock: 45, barcode: "8991001008" },
  { id: "p-9", name: "Berry Blossom Mocktail", category_id: "cat-2", category_name: "Non-Coffee & Mocktail", price: 26000, stock: 40, barcode: "8991001009" },
  { id: "p-10", name: "Mango Passion Mocktail", category_id: "cat-2", category_name: "Non-Coffee & Mocktail", price: 25000, stock: 35, barcode: "8991001010" },
  { id: "p-11", name: "Lychee Tea Refreshment", category_id: "cat-2", category_name: "Non-Coffee & Mocktail", price: 20000, stock: 70, barcode: "8991001011" },

  // MAKANAN UTAMA
  { id: "p-12", name: "Rice Bowl Ayam Sambal Matah", category_id: "cat-3", category_name: "Makanan Utama", price: 28000, stock: 35, barcode: "8991001012" },
  { id: "p-13", name: "Rice Bowl Beef Slice Teriyaki", category_id: "cat-3", category_name: "Makanan Utama", price: 33000, stock: 30, barcode: "8991001013" },
  { id: "p-14", name: "Rice Bowl Chicken Katsu Curry", category_id: "cat-3", category_name: "Makanan Utama", price: 30000, stock: 25, barcode: "8991001014" },
  { id: "p-15", name: "Nasi Goreng Saray Special", category_id: "cat-3", category_name: "Makanan Utama", price: 27000, stock: 40, barcode: "8991001015" },
  { id: "p-16", name: "Spaghetti Carbonara Creamy", category_id: "cat-3", category_name: "Makanan Utama", price: 32000, stock: 25, barcode: "8991001016" },

  // PASTRY & SNACK
  { id: "p-17", name: "Croissant Almond Saray", category_id: "cat-4", category_name: "Pastry & Snack", price: 27000, stock: 20, barcode: "8991001017" },
  { id: "p-18", name: "Pain Au Chocolat", category_id: "cat-4", category_name: "Pastry & Snack", price: 25000, stock: 22, barcode: "8991001018" },
  { id: "p-19", name: "French Fries Shoestring", category_id: "cat-4", category_name: "Pastry & Snack", price: 20000, stock: 50, barcode: "8991001019" },
  { id: "p-20", name: "Tahu Cabe Garam Saray", category_id: "cat-4", category_name: "Pastry & Snack", price: 20000, stock: 45, barcode: "8991001020" },
  { id: "p-21", name: "Mix Platter (Fries, Sausage, Nugget)", category_id: "cat-4", category_name: "Pastry & Snack", price: 30000, stock: 30, barcode: "8991001021" },
  { id: "p-22", name: "Cireng Bumbu Rujak", category_id: "cat-4", category_name: "Pastry & Snack", price: 18000, stock: 40, barcode: "8991001022" },
];

export const INITIAL_INGREDIENTS: IngredientItem[] = [
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
  { id: "ing-18", name: "Es Batu Kristal Tube", unit: "gram", stock: 15000, min_stock: 3000, cost_per_unit: 4, category: "kemasan" },
];

export const INITIAL_RECIPES: ProductRecipe[] = [
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
    modifierConfig: {
      spicyRules: { mildPercent: 40, mediumPercent: 100, extraSpicyPercent: 160 },
    },
  },
  {
    product_name: "Saray Signature Palm Sugar",
    selling_price: 22000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 130, unit: "ml" },
      { ingredient_id: "ing-3", ingredient_name: "Gula Aren Cair", quantity: 25, unit: "ml" },
      { ingredient_id: "ing-18", ingredient_name: "Es Batu Kristal", quantity: 120, unit: "gram" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
    modifierConfig: {
      sugarRules: { normalPercent: 100, lessPercent: 50, noPercent: 0, extraPercent: 150 },
      iceRules: { normalPercent: 100, lessMilkCompensationPercent: 10, noMilkCompensationPercent: 20, extraIcePercent: 130 },
    },
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
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 150, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Spanish Latte",
    selling_price: 25000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 130, unit: "ml" },
      { ingredient_id: "ing-3", ingredient_name: "Gula Aren / Condensed Milk", quantity: 25, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Salted Caramel Macchiato",
    selling_price: 27000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 130, unit: "ml" },
      { ingredient_id: "ing-4", ingredient_name: "Sirup Karamel Monin", quantity: 25, unit: "ml" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "Manual Brew V60 (Arabica Kaliurang)",
    selling_price: 26000,
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 15, unit: "gram" },
      { ingredient_id: "ing-8", ingredient_name: "Cup Panas 8oz / Server", quantity: 1, unit: "pcs" },
    ],
  },
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
    product_name: "Rice Bowl Ayam Sambal Matah",
    selling_price: 28000,
    ingredients: [
      { ingredient_id: "ing-11", ingredient_name: "Beras Wangi Organik", quantity: 1, unit: "porsi" },
      { ingredient_id: "ing-9", ingredient_name: "Daging Ayam Fillet", quantity: 120, unit: "gram" },
      { ingredient_id: "ing-13", ingredient_name: "Minyak Goreng Sawit", quantity: 15, unit: "ml" },
    ],
  },
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

// Helper menentukan lokasi file master data secara absolut & kebal direktori eksekusi (kompatibel Vercel Serverless)
function getMasterStorePath(): string {
  // Jika berjalan di lingkungan Vercel serverless / AWS Lambda (Read-Only root)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "growkas_master_store.json");
  }

  const current = process.cwd();
  const baseDir = current.endsWith("growkas") ? current : path.join(current, "growkas");
  const dataDir = path.join(baseDir, "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {}
  }
  return path.join(dataDir, "growkas_master_store.json");
}

let inMemoryCache: MasterStoreData | null = null;

export function loadMasterStore(): MasterStoreData {
  // 1. Coba baca dari storePath (bisa di data/ atau /tmp) agar data selalu mutakhir antar-request
  const storePath = getMasterStorePath();
  try {
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.ingredients)) {
        inMemoryCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Notice reading from storePath:", err);
  }

  if (inMemoryCache) {
    return inMemoryCache;
  }

  // 2. Jika di Vercel dan file /tmp belum ada, coba baca seed data dari project bundle
  const bundledPaths = [
    path.join(process.cwd(), "growkas", "data", "growkas_master_store.json"),
    path.join(process.cwd(), "data", "growkas_master_store.json"),
  ];
  for (const bPath of bundledPaths) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ bPath)) {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ bPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.ingredients)) {
          inMemoryCache = parsed;
          // Tulis salinan ke /tmp untuk mutasi berikutnya di Vercel
          saveMasterStore(parsed);
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Fallback default jika file belum pernah dibuat sama sekali
  const initial: MasterStoreData = {
    products: INITIAL_PRODUCTS,
    categories: INITIAL_CATEGORIES,
    ingredients: INITIAL_INGREDIENTS,
    recipes: INITIAL_RECIPES,
    deductionLogs: [],
    tableOrders: [],
    activeShift: {
      id: "shift-01",
      cashier_name: "Kasir Saray Yogyakarta",
      branch_name: "Saray Coffee & Space (Yogyakarta)",
      start_time: new Date().toISOString(),
      initial_cash: 200000,
      cash_sales: 0,
      qris_sales: 0,
      debit_sales: 0,
      total_sales: 0,
      transaction_count: 0,
      expected_cash: 200000,
      status: "open",
    },
    shiftHistory: [],
    transactions: [],
  };

  saveMasterStore(initial);
  inMemoryCache = initial;
  return initial;
}

export function saveMasterStore(store: MasterStoreData) {
  inMemoryCache = store;
  try {
    const storePath = getMasterStorePath();
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("Storage write notice (in-memory active):", err);
  }
}

/**
 * Mengosongkan data transaksi, antrean pesanan KDS, log pemotongan bahan HPP,
 * dan secara opsional mereset stok seluruh bahan baku ke nol untuk pengujian bersih dari awal.
 */
export function resetMasterDatabaseToCleanState(options?: { resetIngredientsToZero?: boolean }): MasterStoreData {
  const store = loadMasterStore();
  store.transactions = [];
  store.tableOrders = [];
  store.deductionLogs = [];
  store.shiftHistory = [];
  store.activeShift = {
    id: "shift-" + Date.now(),
    cashier_name: "Kasir Saray Yogyakarta",
    branch_name: "Saray Coffee & Space (Yogyakarta)",
    start_time: new Date().toISOString(),
    initial_cash: 200000,
    cash_sales: 0,
    qris_sales: 0,
    debit_sales: 0,
    total_sales: 0,
    transaction_count: 0,
    expected_cash: 200000,
    status: "open",
  };

  if (options?.resetIngredientsToZero) {
    store.ingredients.forEach((ing) => {
      ing.stock = 0;
    });
  }

  saveMasterStore(store);
  return store;
}
