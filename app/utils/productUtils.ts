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

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  // Coffee & Espresso
  "saray signature palm sugar": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80&auto=format",
  "americano / long black": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80&auto=format",
  "caffe latte": "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&q=80&auto=format",
  "spanish latte": "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80&auto=format",
  "salted caramel macchiato": "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&q=80&auto=format",
  "manual brew v60 (arabica kaliurang)": "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80&auto=format",

  // Non-Coffee & Mocktail
  "signature matcha latte": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80&auto=format",
  "artisanal chocolate ice/hot": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80&auto=format",
  "berry blossom mocktail": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80&auto=format",
  "mango passion mocktail": "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&q=80&auto=format",
  "lychee tea refreshment": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80&auto=format",

  // Makanan Utama
  "rice bowl ayam sambal matah": "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80&auto=format",
  "rice bowl beef slice teriyaki": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80&auto=format",
  "rice bowl chicken katsu curry": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80&auto=format",
  "nasi goreng saray special": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80&auto=format",
  "spaghetti carbonara creamy": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80&auto=format",

  // Pastry & Snack
  "croissant almond saray": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80&auto=format",
  "pain au chocolat": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80&auto=format",
  "french fries shoestring": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80&auto=format",
  "tahu cabe garam saray": "https://images.unsplash.com/photo-1546069901-d72d2cdd5478?w=400&q=80&auto=format",
  "mix platter (fries, sausage, nugget)": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&auto=format",
  "cireng bumbu rujak": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80&auto=format",
};

export function getProductImageUrl(p: ProductItem): string {
  if (p.image_url) return p.image_url;
  const name = (p.name || "").trim().toLowerCase();
  if (PRODUCT_IMAGE_MAP[name]) return PRODUCT_IMAGE_MAP[name];

  for (const [key, url] of Object.entries(PRODUCT_IMAGE_MAP)) {
    if (name.includes(key) || key.includes(name)) return url;
  }

  const pType = getProductType(p);
  if (pType === "coffee") return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80&auto=format";
  if (pType === "beverage") return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80&auto=format";
  if (pType === "food") return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80&auto=format";
  if (pType === "snack") return "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80&auto=format";
  return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80&auto=format";
}
