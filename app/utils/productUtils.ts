// app/utils/productUtils.ts — Klasifikasi Pintar Produk F&B vs Retail & Penyesuaian Customizer

import { ProductItem, CartItemModifier } from "@/app/actions/posActions";

export type ProductType = "coffee" | "beverage" | "food" | "snack" | "retail";

/**
 * Mendeteksi jenis produk F&B secara cerdas berdasarkan nama dan kategori produk
 */
export function getProductType(p: ProductItem): ProductType {
  const name = (p.name || "").toLowerCase();
  const cat = (p.category_name || "").toLowerCase();
  const id = (p.category_id || "").toLowerCase();

  // 1. Retail / Sembako / Barang Non-F&B (Minyak Goreng, Sabun, Beras, Detergen, dsb.)
  if (
    name.includes("minyak") ||
    name.includes("goreng 1l") ||
    name.includes("goreng 2l") ||
    name.includes("sabun") ||
    name.includes("shampoo") ||
    name.includes("detergen") ||
    name.includes("beras 5kg") ||
    name.includes("indomie") ||
    cat.includes("retail") ||
    cat.includes("sembako") ||
    cat.includes("grocery")
  ) {
    return "retail";
  }

  // 2. Kopi & Espresso
  if (
    id === "cat-1" ||
    cat.includes("kopi") ||
    cat.includes("espresso") ||
    cat.includes("coffee") ||
    name.includes("kopi") ||
    name.includes("coffee") ||
    name.includes("espresso") ||
    name.includes("latte") ||
    name.includes("cappuccino") ||
    name.includes("kapucino") ||
    name.includes("americano") ||
    name.includes("macchiato") ||
    name.includes("cold brew") ||
    name.includes("v60") ||
    name.includes("ice blend") ||
    name.includes("frappe")
  ) {
    return "coffee";
  }

  // 3. Minuman Non-Coffee & Mocktail
  if (
    id === "cat-2" ||
    cat.includes("non-coffee") ||
    cat.includes("minuman") ||
    cat.includes("mocktail") ||
    name.includes("matcha") ||
    name.includes("chocolate") ||
    name.includes("cokelat") ||
    name.includes("tea") ||
    name.includes("teh") ||
    name.includes("mocktail") ||
    name.includes("juice") ||
    name.includes("jus") ||
    name.includes("boba") ||
    name.includes("susu") ||
    name.includes("shake") ||
    name.includes("smoothie") ||
    name.includes("lemonade") ||
    name.includes("squash")
  ) {
    return "beverage";
  }

  // 4. Makanan Utama (Heavy Food)
  if (
    id === "cat-3" ||
    cat.includes("makanan") ||
    cat.includes("food") ||
    name.includes("nasi") ||
    name.includes("rice") ||
    name.includes("ayam") ||
    name.includes("chicken") ||
    name.includes("beef") ||
    name.includes("daging") ||
    name.includes("spaghetti") ||
    name.includes("pasta") ||
    name.includes("curry") ||
    name.includes("katsu") ||
    name.includes("mie ") ||
    name.includes("kwetiau") ||
    name.includes("burger")
  ) {
    return "food";
  }

  // 5. Pastry, Bakery & Snack (Camilan)
  if (
    id === "cat-4" ||
    cat.includes("snack") ||
    cat.includes("pastry") ||
    cat.includes("bakery") ||
    name.includes("croissant") ||
    name.includes("roti") ||
    name.includes("bread") ||
    name.includes("toast") ||
    name.includes("fries") ||
    name.includes("kentang") ||
    name.includes("cireng") ||
    name.includes("tahu") ||
    name.includes("platter") ||
    name.includes("waffle") ||
    name.includes("pancake") ||
    name.includes("cake") ||
    name.includes("pisang") ||
    name.includes("singkong")
  ) {
    return "snack";
  }

  // Default fallback
  return "food";
}

/**
 * Format ringkasan modifier pesanan sesuai tipe produk
 */
export function formatItemModifiersSummary(modifiers?: CartItemModifier, note?: string): string {
  if (!modifiers) return note ? `Note: ${note}` : "";

  const parts: string[] = [];

  // Tipe Pesanan
  if (modifiers.orderType) {
    parts.push(modifiers.orderType === "Dine In" ? `Dine In (${modifiers.tableNumber || "Meja"})` : "Takeaway");
  }

  // Khusus Minuman
  if (modifiers.iceLevel) parts.push(modifiers.iceLevel);
  if (modifiers.sugarLevel) parts.push(modifiers.sugarLevel);

  // Khusus Makanan
  if (modifiers.spicyLevel) parts.push(`Pedas: ${modifiers.spicyLevel}`);

  // Khusus Snack
  if (modifiers.warmOption) parts.push(modifiers.warmOption);

  // Add-Ons
  if (modifiers.addOns && modifiers.addOns.length > 0) {
    parts.push(modifiers.addOns.join(", "));
  }

  // Catatan Khusus
  const finalNote = modifiers.customNote || note;
  if (finalNote) {
    parts.push(`Note: ${finalNote}`);
  }

  return parts.join(" • ");
}
