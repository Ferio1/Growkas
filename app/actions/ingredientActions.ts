"use server";

import {
  IngredientItem,
  RecipeRequirement,
  ProductRecipe,
  ModifierConfig,
  DeductionLog,
  loadMasterStore,
  saveMasterStore,
  resetMasterDatabaseToCleanState,
} from "./storeManager";
import { assertRole } from "@/lib/authGuard";

export type { IngredientItem, RecipeRequirement, ProductRecipe, ModifierConfig, DeductionLog };

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
        item_cost: itemCost,
        subtotal_cost: itemCost,
        current_stock: ing.stock,
        min_stock: ing.min_stock ?? 0,
        is_low_stock: (ing.stock ?? 0) <= (ing.min_stock ?? 0),
      });
    }
  }

  const profitMargin = recipe.selling_price - totalCost;
  const profitPercent = recipe.selling_price > 0 ? Math.round((profitMargin / recipe.selling_price) * 100) : 0;

  return {
    product_name: recipe.product_name,
    selling_price: recipe.selling_price,
    branch_id: recipe.branch_id || (recipe.product_name.toLowerCase().includes("7co") ? "br-5" : "br-1"),
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

// 3. Tambah / Restok Bahan Baku Cepat (+50 / +1000)
export async function restockIngredient(ingredientId: string, additionalStock: number) {
  await assertRole(["admin", "kasir"]);
  const store = loadMasterStore();
  const ing = store.ingredients.find((i) => i.id === ingredientId);
  if (ing) {
    ing.stock += additionalStock;
    saveMasterStore(store);
    return { success: true, updatedIngredient: ing };
  }
  return { success: false, error: "Bahan baku tidak ditemukan" };
}

// 4. Tambah Bahan Baku Baru Secara Manual
export async function addNewIngredient(data: {
  name: string;
  unit: "gram" | "ml" | "pcs" | "porsi";
  stock: number;
  min_stock: number;
  cost_per_unit: number;
  category: "kopi" | "susu_dairy" | "sirup_gula" | "kemasan" | "makanan";
}) {
  await assertRole(["admin"]);
  const store = loadMasterStore();
  const newId = "ing-" + (store.ingredients.length + 1) + "-" + Date.now().toString().slice(-4);
  const newIng: IngredientItem = {
    id: newId,
    name: data.name.trim(),
    unit: data.unit,
    stock: Math.max(0, Number(data.stock) || 0),
    min_stock: Math.max(0, Number(data.min_stock) || 0),
    cost_per_unit: Math.max(0, Number(data.cost_per_unit) || 0),
    category: data.category,
  };
  store.ingredients.push(newIng);
  saveMasterStore(store);
  return { success: true, ingredient: newIng };
}

// 5. Update / Set Stok Fisik Bahan Baku Manual (Stock Opname)
export async function updateIngredientStockManual(
  ingredientId: string,
  newStock: number,
  minStock?: number,
  costPerUnit?: number
) {
  await assertRole(["admin"]);
  const store = loadMasterStore();
  const ing = store.ingredients.find((i) => i.id === ingredientId);
  if (!ing) {
    return { success: false, error: "Bahan baku tidak ditemukan" };
  }
  ing.stock = Math.max(0, Number(newStock) || 0);
  if (minStock !== undefined && !isNaN(Number(minStock))) ing.min_stock = Math.max(0, Number(minStock));
  if (costPerUnit !== undefined && !isNaN(Number(costPerUnit))) ing.cost_per_unit = Math.max(0, Number(costPerUnit));
  saveMasterStore(store);
  return { success: true, updatedIngredient: ing };
}

// 6. Simpan / Update Konfigurasi Resep Menu & Takaran Modifier (BOM Manager)
export async function saveRecipeConfiguration(recipeData: ProductRecipe) {
  const store = loadMasterStore();
  const existingIdx = store.recipes.findIndex(
    (r) => r.product_name.toLowerCase().trim() === recipeData.product_name.toLowerCase().trim()
  );
  if (existingIdx >= 0) {
    store.recipes[existingIdx] = recipeData;
  } else {
    store.recipes.push(recipeData);
  }
  saveMasterStore(store);
  return { success: true, recipe: recipeData };
}

// 7. Reset Seluruh Database Bersih (Kosongkan riwayat order, shift, dan opsi reset stok ke nol)
export async function resetDatabaseCleanAction(options?: { resetIngredientsToZero?: boolean }) {
  await assertRole(["admin"]);
  const cleanStore = resetMasterDatabaseToCleanState(options);
  return { success: true, store: cleanStore };
}

/**
 * Kalkulasi Cerdas Penyesuaian Takaran Bahan Berdasarkan Kustomisasi / Modifier Pelanggan
 * Menggunakan aturan persentase yang disetel pada resep menu (modifierConfig) atau fallback dinamis.
 */
function calculateModifierAdjustment(
  ing: IngredientItem,
  baseQty: number,
  modifiersSummary?: string,
  modifierConfig?: ModifierConfig
): { adjustedQty: number; modifierNote?: string } {
  if (!modifiersSummary) {
    return { adjustedQty: baseQty };
  }

  const mod = modifiersSummary.toLowerCase();
  const ingName = ing.name.toLowerCase();
  const ingCat = ing.category.toLowerCase();
  let multiplier = 1.0;
  let extra = 0;
  const notes: string[] = [];

  // A. LEVEL GULA & SIRUP
  if (ingCat === "sirup_gula" || ingName.includes("gula") || ingName.includes("syrup") || ingName.includes("sirup")) {
    const sugarCfg = modifierConfig?.sugarRules;
    if (mod.includes("no sugar") || mod.includes("0% sugar") || mod.includes("tanpa gula") || mod.includes("sugar: none") || mod.includes("0%")) {
      const pct = sugarCfg?.noPercent !== undefined ? sugarCfg.noPercent : 0;
      multiplier = pct / 100;
      notes.push(`No Sugar (${pct}%)`);
    } else if (mod.includes("less sugar") || mod.includes("50% sugar") || mod.includes("sedikit gula") || mod.includes("50%")) {
      const pct = sugarCfg?.lessPercent !== undefined ? sugarCfg.lessPercent : 50;
      multiplier = pct / 100;
      notes.push(`Less Sugar (${pct}%)`);
    } else if (mod.includes("extra sugar") || mod.includes("150% sugar") || mod.includes("lebih manis") || mod.includes("tambah sugar") || mod.includes("150%")) {
      const pct = sugarCfg?.extraPercent !== undefined ? sugarCfg.extraPercent : 150;
      multiplier = pct / 100;
      notes.push(`Extra Sugar (${pct}%)`);
    }
  }

  // B. LEVEL ES (Kompensasi Cairan Susu & Takaran Es Batu)
  const iceCfg = modifierConfig?.iceRules;

  // 1. Kompensasi Susu / Cairan
  if (ingCat === "susu_dairy" || ingName.includes("milk") || ingName.includes("susu")) {
    if (mod.includes("no ice") || mod.includes("tanpa es")) {
      const comp = iceCfg?.noMilkCompensationPercent !== undefined ? iceCfg.noMilkCompensationPercent : 20;
      multiplier = 1 + comp / 100;
      notes.push(`No Ice (+${comp}% Susu)`);
    } else if (mod.includes("less ice") || mod.includes("sedikit es")) {
      const comp = iceCfg?.lessMilkCompensationPercent !== undefined ? iceCfg.lessMilkCompensationPercent : 10;
      multiplier = 1 + comp / 100;
      notes.push(`Less Ice (+${comp}% Susu)`);
    }
  }

  // 2. Takaran Es Batu Mentah
  if (ingName.includes("es batu") || ingName.includes("ice")) {
    if (mod.includes("no ice") || mod.includes("tanpa es")) {
      multiplier = 0;
      notes.push("No Ice (0g Es Batu)");
    } else if (mod.includes("less ice") || mod.includes("sedikit es")) {
      multiplier = 0.5;
      notes.push("Less Ice (-50% Es Batu)");
    } else if (mod.includes("tambah ice") || mod.includes("extra ice") || mod.includes("banyak es")) {
      const extraIce = iceCfg?.extraIcePercent !== undefined ? iceCfg.extraIcePercent : 130;
      multiplier = extraIce / 100;
      notes.push(`Tambah Ice (${extraIce}% Es Batu)`);
    }
  }

  // C. LEVEL PEDAS (Bumbu Cabai & Rempah)
  if (ingName.includes("rempah") || ingName.includes("bumbu") || ingName.includes("sambal") || ingName.includes("cabai") || ingName.includes("cabe")) {
    const spicyCfg = modifierConfig?.spicyRules;
    if (mod.includes("tidak pedas") || mod.includes("tidak pedes") || mod.includes("level 0")) {
      const mildPct = spicyCfg?.mildPercent !== undefined ? spicyCfg.mildPercent : 40;
      multiplier = mildPct / 100;
      notes.push(`Tidak Pedas (${mildPct}% Bumbu)`);
    } else if (mod.includes("pedas mantap") || mod.includes("extra pedas") || (mod.includes("pedas:") && mod.includes("mantap"))) {
      const spicyPct = spicyCfg?.extraSpicyPercent !== undefined ? spicyCfg.extraSpicyPercent : 160;
      multiplier = spicyPct / 100;
      notes.push(`Pedas Mantap (${spicyPct}% Rempah)`);
    }
  }

  // D. ADD-ONS TERKAIT BAHAN SPESIFIK
  // Extra Shot (+18g Biji Kopi)
  if (mod.includes("extra shot") && (ingCat === "kopi" || ingName.includes("biji kopi") || ingName.includes("arabica") || ingName.includes("espresso"))) {
    extra += 18;
    notes.push("+18g Extra Shot Kopi");
  }

  // Extra Syrup (+20ml Sirup)
  if (mod.includes("extra syrup") && (ingCat === "sirup_gula" || ingName.includes("karamel") || ingName.includes("sirup"))) {
    extra += 20;
    notes.push("+20ml Extra Syrup");
  }

  // Telur Ceplok (+1 pcs Telur)
  if ((mod.includes("telur ceplok") || mod.includes("extra telur") || mod.includes("tambah telur")) && ingName.includes("telur")) {
    extra += 1;
    notes.push("+1 Telur Ceplok");
  }

  // Ekstra Sambal (+20g Sambal/Bumbu)
  if (mod.includes("ekstra sambal") && (ingName.includes("rempah") || ingName.includes("bumbu") || ingName.includes("sambal"))) {
    extra += 20;
    notes.push("+20g Ekstra Sambal");
  }

  const finalQty = Math.max(0, Math.round((baseQty * multiplier + extra) * 10) / 10);
  return {
    adjustedQty: finalQty,
    modifierNote: notes.length > 0 ? notes.join(" • ") : undefined,
  };
}

// 8. Pemotongan Otomatis Bahan Baku saat Transaksi Berhasil (Real-Time Deduction Engine with Modifier Awareness)
export async function deductRawIngredientsForItems(
  items: { product_name: string; quantity: number; modifiers_summary?: string }[],
  invoiceNumber?: string
) {
  const store = loadMasterStore();
  const allDeductions: Array<{
    ingredient_name: string;
    amount: number;
    unit: string;
    remaining: number;
    is_low_stock: boolean;
    modifier_note?: string;
  }> = [];

  for (const item of items) {
    const recipe = resolveRecipe(item.product_name, 25000, store.recipes);
    const handledIngredientIds = new Set<string>();

    for (const req of recipe.ingredients) {
      const ing = store.ingredients.find((i) => i.id === req.ingredient_id);
      if (ing) {
        handledIngredientIds.add(ing.id);

        const { adjustedQty, modifierNote } = calculateModifierAdjustment(
          ing,
          req.quantity,
          item.modifiers_summary,
          recipe.modifierConfig
        );

        const amountToDeduct = Math.round(adjustedQty * item.quantity * 10) / 10;
        if (amountToDeduct > 0) {
          ing.stock = Math.max(0, Math.round((ing.stock - amountToDeduct) * 10) / 10);

          allDeductions.push({
            ingredient_name: ing.name,
            amount: amountToDeduct,
            unit: ing.unit,
            remaining: ing.stock,
            is_low_stock: ing.stock <= ing.min_stock,
            modifier_note: modifierNote,
          });
        }
      }
    }

    // Periksa jika ada Add-on yang bahannya belum termasuk di resep dasar
    const mod = (item.modifiers_summary || "").toLowerCase();

    // 1. Add-on Extra Shot Kopi pada menu yang belum memotong biji kopi
    if (mod.includes("extra shot")) {
      const coffeeIng = store.ingredients.find((i) => i.id === "ing-1" || i.category === "kopi");
      if (coffeeIng && !handledIngredientIds.has(coffeeIng.id)) {
        handledIngredientIds.add(coffeeIng.id);
        const amountToDeduct = 18 * item.quantity;
        coffeeIng.stock = Math.max(0, Math.round((coffeeIng.stock - amountToDeduct) * 10) / 10);
        allDeductions.push({
          ingredient_name: coffeeIng.name,
          amount: amountToDeduct,
          unit: coffeeIng.unit,
          remaining: coffeeIng.stock,
          is_low_stock: coffeeIng.stock <= coffeeIng.min_stock,
          modifier_note: "+18g Extra Shot Kopi",
        });
      }
    }

    // 2. Add-on Telur Ceplok pada menu tanpa telur
    if (mod.includes("telur ceplok") || mod.includes("extra telur")) {
      const eggIng = store.ingredients.find((i) => i.id === "ing-12" || i.name.toLowerCase().includes("telur"));
      if (eggIng && !handledIngredientIds.has(eggIng.id)) {
        handledIngredientIds.add(eggIng.id);
        const amountToDeduct = 1 * item.quantity;
        eggIng.stock = Math.max(0, eggIng.stock - amountToDeduct);
        allDeductions.push({
          ingredient_name: eggIng.name,
          amount: amountToDeduct,
          unit: eggIng.unit,
          remaining: eggIng.stock,
          is_low_stock: eggIng.stock <= eggIng.min_stock,
          modifier_note: "+1 Telur Ceplok",
        });
      }
    }

    // 3. Add-on Extra Syrup pada menu tanpa sirup
    if (mod.includes("extra syrup")) {
      const syrupIng = store.ingredients.find((i) => i.id === "ing-4" || i.id === "ing-3" || i.category === "sirup_gula");
      if (syrupIng && !handledIngredientIds.has(syrupIng.id)) {
        handledIngredientIds.add(syrupIng.id);
        const amountToDeduct = 20 * item.quantity;
        syrupIng.stock = Math.max(0, Math.round((syrupIng.stock - amountToDeduct) * 10) / 10);
        allDeductions.push({
          ingredient_name: syrupIng.name,
          amount: amountToDeduct,
          unit: syrupIng.unit,
          remaining: syrupIng.stock,
          is_low_stock: syrupIng.stock <= syrupIng.min_stock,
          modifier_note: "+20ml Extra Syrup",
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
      modifiers_summary: items.map((i) => i.modifiers_summary).filter(Boolean).join(" | "),
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
