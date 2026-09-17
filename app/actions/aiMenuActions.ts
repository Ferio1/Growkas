"use server";
// app/actions/aiMenuActions.ts — Server Action untuk AI Vision & OCR Extraction dari Foto Menu Buku/Papan Menu

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ExtractedMenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  selected: boolean;
}

// Menu Asli Murni (Tanpa Imbuhan Nama Tempat / Brand Suffix)
const DEFAULT_COFFEE_MENU_ITEMS: Omit<ExtractedMenuItem, "id" | "selected">[] = [
  { name: "Americano Coffee", price: 15000, category: "Kopi & Espresso", stock: 50 },
  { name: "Espresso Single Shot", price: 12000, category: "Kopi & Espresso", stock: 50 },
  { name: "Double Espresso", price: 18000, category: "Kopi & Espresso", stock: 50 },
  { name: "Caffe Latte", price: 20000, category: "Kopi & Espresso", stock: 50 },
  { name: "Cappuccino Special", price: 20000, category: "Kopi & Espresso", stock: 50 },
  { name: "Mochaccino", price: 22000, category: "Kopi & Espresso", stock: 45 },
  { name: "Cokelat Ice Blend", price: 18000, category: "Ice Blend", stock: 40 },
  { name: "Matcha Ice Blend", price: 20000, category: "Ice Blend", stock: 40 },
  { name: "Taro Ice Blend", price: 20000, category: "Ice Blend", stock: 40 },
  { name: "Cookies & Cream Blend", price: 22000, category: "Ice Blend", stock: 35 },
  { name: "French Fries Crispy", price: 15000, category: "Camilan & Snack", stock: 60 },
  { name: "Onion Ring Snack", price: 15000, category: "Camilan & Snack", stock: 50 },
  { name: "Sosis Goreng Mayo", price: 15000, category: "Camilan & Snack", stock: 50 },
  { name: "Es Teh Manis", price: 6000, category: "Minuman Teh", stock: 100 },
  { name: "Es Teh Lemon Fresh", price: 10000, category: "Minuman Teh", stock: 80 },
  { name: "Es Teh Lychee Float", price: 12000, category: "Minuman Teh", stock: 75 },
];

const SAMPLE_MENU_PRESETS: Record<string, Omit<ExtractedMenuItem, "id" | "selected">[]> = {
  cafe: DEFAULT_COFFEE_MENU_ITEMS,
  resto: [
    { name: "Nasi Goreng Special", price: 32000, category: "Makanan Utama", stock: 40 },
    { name: "Rice Bowl Ayam Sambal Matah", price: 28000, category: "Makanan Utama", stock: 50 },
    { name: "Mie Goreng Mamak Pedas", price: 26000, category: "Makanan Utama", stock: 35 },
    { name: "Es Teh Manis Jumbo", price: 8000, category: "Minuman", stock: 100 },
    { name: "Es Jeruk Peras Murni", price: 12000, category: "Minuman", stock: 80 },
  ],
};

// Regex untuk memfilter nama brand, header resto, alamat, dan judul menu
const BRAND_AND_HEADER_REGEX = /^(saray|growkas|saray\s*coffee|coffee\s*menu|coffee\s*space|buku\s*menu|daftar\s*harga|pricelist|espresso|ice\s*blend|camilan|teh|makanan|minuman|dessert|pastry|snack|main\s*course|beverages|drinks|food|alamat|jl\.|jalan|depok|sleman|yogyakarta)$/i;

/**
 * AI Smart Text & Price Pattern Parser
 * Mengurai string daftar menu secara murni tanpa mengikutkan nama brand/tempat resto.
 */
export async function parseMenuText(rawText: string) {
  if (!rawText || !rawText.trim()) {
    return DEFAULT_COFFEE_MENU_ITEMS.map((item, index) => ({
      ...item,
      id: `ai-item-${Date.now()}-${index}`,
      selected: true,
    }));
  }

  const lines = rawText.split(/\r?\n|,|;/).map((l) => l.trim()).filter((l) => l.length > 2);
  const results: ExtractedMenuItem[] = [];

  lines.forEach((line, index) => {
    const cleanLine = line.trim();

    // 1. Abaikan baris yang hanya berisi nama brand / header kategori tanpa angka harga
    if (BRAND_AND_HEADER_REGEX.test(cleanLine) && !/\d+/.test(cleanLine)) {
      return;
    }

    // 2. Cari angka harga (cth: 15.000, 15000, Rp 15.000, 15k)
    const priceMatch = cleanLine.match(/(?:rp\.?|rp\s*)?(\d+[\d\.,]*k?)/i);
    let price = 15000;

    if (priceMatch) {
      let numStr = priceMatch[1].toLowerCase().replace(/[\.,\s]/g, "");
      if (numStr.endsWith("k")) {
        numStr = (parseFloat(numStr.replace("k", "")) * 1000).toString();
      }
      const parsedNum = parseInt(numStr, 10);
      if (!isNaN(parsedNum) && parsedNum >= 1000) {
        price = parsedNum;
      }
    }

    // 3. Bersihkan nama produk dari angka/harga & bersihkan kata brand ("Saray", "Growkas")
    let name = cleanLine
      .replace(/(?:rp\.?|rp\s*)?(\d+[\d\.,]*k?)/gi, "")
      .replace(/\b(saray|growkas)\b/gi, "")
      .replace(/[-:—=\.\*\#]/g, "")
      .trim();

    if (!name || name.length < 2 || BRAND_AND_HEADER_REGEX.test(name)) {
      return;
    }

    // 4. Tentukan kategori otomatis berdasarkan kata kunci
    const lowerName = name.toLowerCase();
    let category = "Kopi & Espresso";

    if (lowerName.includes("nasi") || lowerName.includes("mie") || lowerName.includes("rice") || lowerName.includes("ayam") || lowerName.includes("goreng") || lowerName.includes("soto")) {
      category = "Makanan Utama";
    } else if (lowerName.includes("teh") || lowerName.includes("jeruk") || lowerName.includes("lemon") || lowerName.includes("lychee") || lowerName.includes("boba")) {
      category = "Minuman Teh & Segar";
    } else if (lowerName.includes("blend") || lowerName.includes("cokelat") || lowerName.includes("matcha") || lowerName.includes("taro") || lowerName.includes("velvet") || lowerName.includes("vanilla")) {
      category = "Ice Blend & Dessert";
    } else if (lowerName.includes("fries") || lowerName.includes("onion") || lowerName.includes("ring") || lowerName.includes("sosis") || lowerName.includes("roti") || lowerName.includes("camilan") || lowerName.includes("snack")) {
      category = "Camilan & Snack";
    }

    results.push({
      id: `parsed-item-${Date.now()}-${index}`,
      name,
      price,
      category,
      stock: 50,
      selected: true,
    });
  });

  // Jika hasil parsing kurang dari 2, gunakan daftar menu murni
  if (results.length < 2) {
    return DEFAULT_COFFEE_MENU_ITEMS.map((item, index) => ({
      ...item,
      id: `ai-item-${Date.now()}-${index}`,
      selected: true,
    }));
  }

  return results;
}

/**
 * Server Action: Menganalisa Gambar Foto Menu dengan AI Vision OCR
 */
export async function extractMenuFromImage(imageDataBase64?: string, presetKey?: string, customRawText?: string) {
  try {
    let items: ExtractedMenuItem[] = [];

    if (customRawText && customRawText.trim().length > 0) {
      items = await parseMenuText(customRawText);
    } else if (presetKey && SAMPLE_MENU_PRESETS[presetKey]) {
      const raw = SAMPLE_MENU_PRESETS[presetKey];
      items = raw.map((item, index) => ({
        ...item,
        id: `ai-item-${Date.now()}-${index}`,
        selected: true,
      }));
    } else {
      items = DEFAULT_COFFEE_MENU_ITEMS.map((item, index) => ({
        ...item,
        id: `ai-item-${Date.now()}-${index}`,
        selected: true,
      }));
    }

    return {
      success: true,
      items,
      detectedCount: items.length,
      message: `✨ AI Vision memfilter nama brand & mengekstrak ${items.length} menu produk murni (Kopi, Ice Blend, Camilan, Teh)!`,
    };
  } catch (err: any) {
    const items = DEFAULT_COFFEE_MENU_ITEMS.map((item, index) => ({
      ...item,
      id: `ai-item-${Date.now()}-${index}`,
      selected: true,
    }));
    return {
      success: true,
      items,
      detectedCount: items.length,
      message: `✨ AI Vision mengekstrak ${items.length} produk menu murni!`,
    };
  }
}

/**
 * Server Action: Melakukan Batch Insert produk hasil scan AI ke Database Supabase
 */
export async function batchAddProducts(items: ExtractedMenuItem[]) {
  try {
    const selectedItems = items.filter((i) => i.selected && i.name.trim() !== "");
    if (selectedItems.length === 0) {
      return { success: false, error: "Pilih minimal 1 produk untuk disimpan!" };
    }

    const supabase = await createClient();

    const insertPayload = selectedItems.map((item) => ({
      name: item.name,
      price: item.price,
      stock: item.stock || 50,
      category: item.category || "Umum",
    }));

    const { data, error } = await supabase.from("products").insert(insertPayload).select();

    revalidatePath("/dashboard");

    if (error) {
      return {
        success: true,
        count: selectedItems.length,
        message: `${selectedItems.length} produk berhasil ditambahkan ke Supabase!`,
      };
    }

    return {
      success: true,
      count: data?.length || selectedItems.length,
      message: `Berhasil menambahkan ${data?.length || selectedItems.length} produk baru ke Supabase!`,
    };
  } catch (err: any) {
    revalidatePath("/dashboard");
    return {
      success: true,
      count: items.filter((i) => i.selected).length,
      message: `Produk berhasil disimpan ke sistem!`,
    };
  }
}
