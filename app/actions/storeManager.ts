// growkas/app/actions/storeManager.ts — Master Store Manager & In-Memory Fallback
// REFACTORED: Eliminated ephemeral /tmp file persistence.
// Primary persistence is handled by Supabase PostgreSQL relational tables.
// In-memory cache is maintained as a fast, resilient fallback during offline tests or disconnections.

export interface ProductItem {
  id: string;
  name: string;
  category_id?: string;
  category_name?: string;
  price: number;
  stock: number;
  barcode?: string;
  image_url?: string;
  branch_id?: string; // "br-1" (Saray) | "br-5" (7co) | "all"
  branch_name?: string;
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
  branch_id?: string; // "br-1" (Saray) | "br-5" (7co) | "all"
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

export interface BranchItem {
  id: string;
  name: string;
  city: string;
  address?: string;
  target_revenue: number;
  created_at?: string;
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
  branches?: BranchItem[];
}

export const INITIAL_BRANCHES: BranchItem[] = [
  {
    id: "br-5",
    name: "7co",
    city: "Yogyakarta",
    address: "Jl. Palagan Tentara Pelajar",
    target_revenue: 10000000,
  },
];

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: "cat-1", name: "Kopi & Espresso" },
  { id: "cat-2", name: "Non-Coffee & Mocktail" },
  { id: "cat-3", name: "Makanan Utama" },
  { id: "cat-4", name: "Pastry & Snack" },
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  // --- OUTLET UTAMA & FOKUS TUNGGAL: 7co (YOGYAKARTA) SPECIALTY MENU ---
  // KOPI & ESPRESSO 7co
  { id: "p-701", name: "7co Signature Caramel Macchiato", category_id: "cat-1", category_name: "Kopi & Espresso", price: 28000, stock: 55, barcode: "8997001001", branch_id: "br-5", branch_name: "7co" },
  { id: "p-702", name: "7co Kopi Susu Creamy Brown Sugar", category_id: "cat-1", category_name: "Kopi & Espresso", price: 23000, stock: 70, barcode: "8997001002", branch_id: "br-5", branch_name: "7co" },
  { id: "p-703", name: "7co Sea Salt Latte", category_id: "cat-1", category_name: "Kopi & Espresso", price: 26000, stock: 45, barcode: "8997001003", branch_id: "br-5", branch_name: "7co" },
  { id: "p-704", name: "7co Espresso Double Shot", category_id: "cat-1", category_name: "Kopi & Espresso", price: 18000, stock: 60, barcode: "8997001004", branch_id: "br-5", branch_name: "7co" },
  { id: "p-705", name: "7co Vanilla Cold Brew", category_id: "cat-1", category_name: "Kopi & Espresso", price: 25000, stock: 40, barcode: "8997001005", branch_id: "br-5", branch_name: "7co" },

  // NON-COFFEE 7co
  { id: "p-706", name: "7co Roasted Hokkaido Milk Tea", category_id: "cat-2", category_name: "Non-Coffee & Mocktail", price: 24000, stock: 50, barcode: "8997001006", branch_id: "br-5", branch_name: "7co" },
  { id: "p-707", name: "7co Sparkling Yuzu Mint Mocktail", category_id: "cat-2", category_name: "Non-Coffee & Mocktail", price: 27000, stock: 40, barcode: "8997001007", branch_id: "br-5", branch_name: "7co" },
  { id: "p-708", name: "7co Dark Cocoa Belgian Ice", category_id: "cat-2", category_name: "Non-Coffee & Mocktail", price: 25000, stock: 45, barcode: "8997001008", branch_id: "br-5", branch_name: "7co" },
  { id: "p-709", name: "7co Peach Blossom Iced Tea", category_id: "cat-2", category_name: "Non-Coffee & Mocktail", price: 21000, stock: 65, barcode: "8997001009", branch_id: "br-5", branch_name: "7co" },

  // MAKANAN UTAMA 7co (BURGERS & BOWLS)
  { id: "p-710", name: "7co Smash Beef Burger Deluxe", category_id: "cat-3", category_name: "Makanan Utama", price: 36000, stock: 30, barcode: "8997001010", branch_id: "br-5", branch_name: "7co" },
  { id: "p-711", name: "7co Crispy Chicken Mentai Rice", category_id: "cat-3", category_name: "Makanan Utama", price: 32000, stock: 35, barcode: "8997001011", branch_id: "br-5", branch_name: "7co" },
  { id: "p-712", name: "7co Beef Bulgogi Rice Bowl", category_id: "cat-3", category_name: "Makanan Utama", price: 34000, stock: 30, barcode: "8997001012", branch_id: "br-5", branch_name: "7co" },
  { id: "p-713", name: "7co Aglio Olio Smoked Beef", category_id: "cat-3", category_name: "Makanan Utama", price: 30000, stock: 25, barcode: "8997001013", branch_id: "br-5", branch_name: "7co" },

  // PASTRY & CROFFLE 7co
  { id: "p-714", name: "7co Croffle Brown Sugar & Ice Cream", category_id: "cat-4", category_name: "Pastry & Snack", price: 26000, stock: 35, barcode: "8997001014", branch_id: "br-5", branch_name: "7co" },
  { id: "p-715", name: "7co Cinnamon Roll Glaze", category_id: "cat-4", category_name: "Pastry & Snack", price: 24000, stock: 30, barcode: "8997001015", branch_id: "br-5", branch_name: "7co" },
  { id: "p-716", name: "7co Truffle Cheese Fries", category_id: "cat-4", category_name: "Pastry & Snack", price: 25000, stock: 45, barcode: "8997001016", branch_id: "br-5", branch_name: "7co" },
  { id: "p-717", name: "7co Mozzarella Sticks with Marinara", category_id: "cat-4", category_name: "Pastry & Snack", price: 26000, stock: 35, barcode: "8997001017", branch_id: "br-5", branch_name: "7co" },
];

export const INITIAL_INGREDIENTS: IngredientItem[] = [
  { id: "ing-1", name: "Biji Kopi Arabica Kaliurang", unit: "gram", stock: 0, min_stock: 1000, cost_per_unit: 200, category: "kopi" },
  { id: "ing-2", name: "Fresh Milk UHT Full Cream", unit: "ml", stock: 0, min_stock: 3000, cost_per_unit: 20, category: "susu_dairy" },
  { id: "ing-3", name: "Gula Aren Cair Organik", unit: "ml", stock: 0, min_stock: 800, cost_per_unit: 35, category: "sirup_gula" },
  { id: "ing-4", name: "Sirup Karamel Monin", unit: "ml", stock: 0, min_stock: 500, cost_per_unit: 60, category: "sirup_gula" },
  { id: "ing-5", name: "Bubuk Matcha Kyoto Premium", unit: "gram", stock: 0, min_stock: 300, cost_per_unit: 300, category: "kopi" },
  { id: "ing-6", name: "Bubuk Cokelat Artisanal", unit: "gram", stock: 0, min_stock: 500, cost_per_unit: 250, category: "kopi" },
  { id: "ing-7", name: "Cup Dingin 16oz + Strawless Lid", unit: "pcs", stock: 0, min_stock: 100, cost_per_unit: 650, category: "kemasan" },
  { id: "ing-8", name: "Cup Panas 8oz + Paper Lid", unit: "pcs", stock: 0, min_stock: 50, cost_per_unit: 750, category: "kemasan" },
  { id: "ing-9", name: "Daging Ayam Fillet Marinasi", unit: "gram", stock: 0, min_stock: 800, cost_per_unit: 65, category: "makanan" },
  { id: "ing-10", name: "Daging Sapi Slice Shortplate", unit: "gram", stock: 0, min_stock: 600, cost_per_unit: 130, category: "makanan" },
  { id: "ing-11", name: "Beras Wangi Organik (Nasi Matang)", unit: "porsi", stock: 0, min_stock: 15, cost_per_unit: 2500, category: "makanan" },
  { id: "ing-12", name: "Telur Ayam Negeri Fresh", unit: "pcs", stock: 0, min_stock: 20, cost_per_unit: 2000, category: "makanan" },
  { id: "ing-13", name: "Minyak Goreng Sawit", unit: "ml", stock: 0, min_stock: 1000, cost_per_unit: 18, category: "makanan" },
  { id: "ing-14", name: "Bumbu Rempah Nasi Goreng Saray", unit: "gram", stock: 0, min_stock: 500, cost_per_unit: 40, category: "makanan" },
  { id: "ing-15", name: "Kecap Manis & Saus Gurih", unit: "ml", stock: 0, min_stock: 500, cost_per_unit: 25, category: "makanan" },
  { id: "ing-16", name: "Kentang Beku Shoestring Cut", unit: "gram", stock: 0, min_stock: 1000, cost_per_unit: 45, category: "makanan" },
  { id: "ing-17", name: "Pasta Spaghetti Kering", unit: "gram", stock: 0, min_stock: 500, cost_per_unit: 35, category: "makanan" },
  { id: "ing-18", name: "Es Batu Kristal Tube", unit: "gram", stock: 0, min_stock: 3000, cost_per_unit: 4, category: "kemasan" },
];

export const INITIAL_RECIPES: ProductRecipe[] = [
  // --- OUTLET UTAMA & FOKUS TUNGGAL: 7co (YOGYAKARTA) SPECIALTY RECIPES ---
  {
    product_name: "7co Signature Caramel Macchiato",
    selling_price: 28000,
    branch_id: "br-5",
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 130, unit: "ml" },
      { ingredient_id: "ing-4", ingredient_name: "Sirup Karamel Monin", quantity: 25, unit: "ml" },
      { ingredient_id: "ing-18", ingredient_name: "Es Batu Kristal", quantity: 120, unit: "gram" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
    modifierConfig: {
      sugarRules: { normalPercent: 100, lessPercent: 50, noPercent: 0, extraPercent: 150 },
      iceRules: { normalPercent: 100, lessMilkCompensationPercent: 10, noMilkCompensationPercent: 20, extraIcePercent: 130 },
    },
  },
  {
    product_name: "7co Kopi Susu Creamy Brown Sugar",
    selling_price: 23000,
    branch_id: "br-5",
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 140, unit: "ml" },
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
    product_name: "7co Sea Salt Latte",
    selling_price: 26000,
    branch_id: "br-5",
    ingredients: [
      { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 140, unit: "ml" },
      { ingredient_id: "ing-18", ingredient_name: "Es Batu Kristal", quantity: 110, unit: "gram" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "7co Dark Cocoa Belgian Ice",
    selling_price: 25000,
    branch_id: "br-5",
    ingredients: [
      { ingredient_id: "ing-6", ingredient_name: "Bubuk Cokelat Artisanal", quantity: 25, unit: "gram" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 140, unit: "ml" },
      { ingredient_id: "ing-3", ingredient_name: "Gula Aren Cair", quantity: 15, unit: "ml" },
      { ingredient_id: "ing-18", ingredient_name: "Es Batu Kristal", quantity: 120, unit: "gram" },
      { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
    ],
  },
  {
    product_name: "7co Smash Beef Burger Deluxe",
    selling_price: 36000,
    branch_id: "br-5",
    ingredients: [
      { ingredient_id: "ing-10", ingredient_name: "Daging Sapi Slice Shortplate", quantity: 100, unit: "gram" },
      { ingredient_id: "ing-12", ingredient_name: "Telur Ayam Negeri Fresh", quantity: 1, unit: "pcs" },
      { ingredient_id: "ing-13", ingredient_name: "Minyak Goreng Sawit", quantity: 15, unit: "ml" },
      { ingredient_id: "ing-15", ingredient_name: "Kecap Manis & Saus Gurih", quantity: 15, unit: "ml" },
    ],
  },
  {
    product_name: "7co Truffle Cheese Fries",
    selling_price: 25000,
    branch_id: "br-5",
    ingredients: [
      { ingredient_id: "ing-16", ingredient_name: "Kentang Beku Shoestring Cut", quantity: 180, unit: "gram" },
      { ingredient_id: "ing-13", ingredient_name: "Minyak Goreng Sawit", quantity: 30, unit: "ml" },
    ],
  },
  {
    product_name: "7co Croffle Brown Sugar & Ice Cream",
    selling_price: 26000,
    branch_id: "br-5",
    ingredients: [
      { ingredient_id: "ing-3", ingredient_name: "Gula Aren Cair Organik", quantity: 20, unit: "ml" },
      { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT Full Cream", quantity: 30, unit: "ml" },
    ],
  },
];

export function ensureMultiBranchIntegrity(store: MasterStoreData): boolean {
  let changed = false;

  // 1. Pastikan cabang fokus murni ke 1 outlet utama: 7co (Yogyakarta)
  if (!store.branches || store.branches.length === 0) {
    store.branches = INITIAL_BRANCHES.map((b) => ({ ...b }));
    changed = true;
  } else {
    const only7co = store.branches.filter((b) => b.id === "br-5" || b.name.toLowerCase().includes("7co"));
    if (only7co.length > 0) {
      if (store.branches.length !== 1 || store.branches[0].id !== "br-5") {
        store.branches = [{ ...INITIAL_BRANCHES[0] }];
        changed = true;
      }
    } else {
      store.branches = INITIAL_BRANCHES.map((b) => ({ ...b }));
      changed = true;
    }
  }

  // 2. Pastikan katalog produk fokus murni pada menu 7co
  const only7coProducts = (store.products || []).filter((p) => p.branch_id === "br-5" || p.name.toLowerCase().includes("7co"));
  if (only7coProducts.length !== store.products.length || only7coProducts.length === 0) {
    store.products = INITIAL_PRODUCTS.map((p) => ({ ...p }));
    changed = true;
  }

  // 3. Pastikan resep BOM fokus murni pada menu 7co
  const only7coRecipes = (store.recipes || []).filter((r) => r.branch_id === "br-5" || r.product_name.toLowerCase().includes("7co"));
  if (only7coRecipes.length !== store.recipes.length || only7coRecipes.length === 0) {
    store.recipes = INITIAL_RECIPES.map((r) => ({ ...r }));
    changed = true;
  }

  // 4. Pastikan activeShift menggunakan cabang 7co
  if (store.activeShift && (!store.activeShift.branch_name || store.activeShift.branch_name.includes("Saray"))) {
    store.activeShift.branch_name = "7co (Yogyakarta)";
    store.activeShift.cashier_name = "Kasir 7co Yogyakarta";
    changed = true;
  }

  return changed;
}

// In-memory store instance — holds state when offline or during test suites
function createInitialStore(): MasterStoreData {
  return {
    products: INITIAL_PRODUCTS.map((p) => ({ ...p })),
    categories: INITIAL_CATEGORIES.map((c) => ({ ...c })),
    ingredients: INITIAL_INGREDIENTS.map((i) => ({ ...i })),
    recipes: INITIAL_RECIPES.map((r) => ({ ...r })),
    deductionLogs: [],
    tableOrders: [],
    activeShift: null,
    shiftHistory: [],
    transactions: [],
    branches: INITIAL_BRANCHES.map((b) => ({ ...b })),
  };
}

let inMemoryCache: MasterStoreData | null = null;

/**
 * Loads the in-memory master store fallback.
 * Eliminates file system /tmp read operations for serverless resilience.
 */
export function loadMasterStore(): MasterStoreData {
  if (!inMemoryCache) {
    inMemoryCache = createInitialStore();
  }
  ensureMultiBranchIntegrity(inMemoryCache);
  return inMemoryCache;
}

/**
 * Saves changes to the in-memory master store.
 * Eliminates file system /tmp write operations.
 */
export function saveMasterStore(store: MasterStoreData) {
  inMemoryCache = store;
}

/**
 * Deduplikasi daftar cabang agar tidak ada nama & kota yang kembar ganda.
 */
export function deduplicateBranches(branches: BranchItem[]): BranchItem[] {
  const seen = new Set<string>();
  const result: BranchItem[] = [];
  for (const b of branches) {
    const key = `${b.name.trim().toLowerCase()}__${b.city.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(b);
    }
  }
  return result;
}

/**
 * Mengambil daftar cabang tersimpan dari master store secara persisten.
 */
export function getStoreBranches(): BranchItem[] {
  const store = loadMasterStore();
  if (!store.branches || store.branches.length === 0) {
    store.branches = INITIAL_BRANCHES.map((b) => ({ ...b }));
    saveMasterStore(store);
  } else {
    const deduped = deduplicateBranches(store.branches);
    if (deduped.length !== store.branches.length) {
      store.branches = deduped;
      saveMasterStore(store);
    }
  }
  return store.branches;
}

/**
 * Menambahkan atau memperbarui cabang di master store secara persisten.
 */
export function addStoreBranch(newBranch: BranchItem): BranchItem {
  const store = loadMasterStore();
  if (!store.branches || store.branches.length === 0) {
    store.branches = INITIAL_BRANCHES.map((b) => ({ ...b }));
  }
  const existingIdx = store.branches.findIndex(
    (b) =>
      b.name.trim().toLowerCase() === newBranch.name.trim().toLowerCase() &&
      b.city.trim().toLowerCase() === newBranch.city.trim().toLowerCase()
  );

  if (existingIdx >= 0) {
    store.branches[existingIdx] = {
      ...store.branches[existingIdx],
      ...newBranch,
      id: store.branches[existingIdx].id,
    };
    saveMasterStore(store);
    return store.branches[existingIdx];
  }

  store.branches.push(newBranch);
  saveMasterStore(store);
  return newBranch;
}

/**
 * Menghapus cabang dari master store secara persisten.
 */
export function deleteStoreBranch(branchId: string): boolean {
  const store = loadMasterStore();
  if (!store.branches) return false;
  store.branches = store.branches.filter((b) => b.id !== branchId);
  saveMasterStore(store);
  return true;
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
  store.activeShift = null;

  store.ingredients.forEach((ing) => {
    ing.stock = 0;
  });

  saveMasterStore(store);
  return store;
}
