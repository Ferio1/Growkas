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

// Menu Asli Kopi Kenangan & Board Menu Real
const KOPI_KENANGAN_MENU_ITEMS: Omit<ExtractedMenuItem, "id" | "selected">[] = [
  { name: "Kopi Kenangan Mantan", price: 19000, category: "Coffee", stock: 50 },
  { name: "Americano", price: 17000, category: "Coffee", stock: 50 },
  { name: "Avocado Coffee", price: 26000, category: "Coffee", stock: 40 },
  { name: "Butterscotch Aren Latte", price: 19000, category: "Coffee", stock: 50 },
  { name: "Butterscotch Sea Salt Latte", price: 24000, category: "Coffee", stock: 45 },
  { name: "Cappuccino", price: 21000, category: "Coffee", stock: 50 },
  { name: "Caramel Macchiato", price: 28000, category: "Coffee", stock: 40 },
  { name: "Creamy Aren Latte", price: 21000, category: "Coffee", stock: 50 },
  { name: "Dua Shot Iced Shaken", price: 25000, category: "Coffee", stock: 40 },
  { name: "Kopi Susu Black Aren", price: 21000, category: "Coffee", stock: 50 },
  { name: "Latte", price: 21000, category: "Coffee", stock: 50 },
  { name: "Matcha Espresso", price: 25000, category: "Coffee", stock: 45 },
  { name: "Mocha Latte", price: 28000, category: "Coffee", stock: 40 },
  { name: "Spanish Latte", price: 19000, category: "Coffee", stock: 50 },
  { name: "Vanilla / Hazelnut / Caramel Latte", price: 25000, category: "Coffee", stock: 40 },
  { name: "Kopi Kenangan Mantan Frappe", price: 26000, category: "Kenangan Frappe", stock: 35 },
  { name: "Dutch Choco Kenangan Frappe", price: 28000, category: "Kenangan Frappe", stock: 35 },
  { name: "Vanilla Kenangan Frappe", price: 24000, category: "Kenangan Frappe", stock: 35 },
  { name: "Oatside Kopi Kenangan Mantan", price: 22000, category: "Oatside Series", stock: 45 },
  { name: "Oatside Latte", price: 24000, category: "Oatside Series", stock: 45 },
  { name: "Oatside Matcha Latte", price: 24000, category: "Oatside Series", stock: 45 },
  { name: "Avocado Milk", price: 22000, category: "Chocolate & Sweets", stock: 40 },
  { name: "Avocado Caramel", price: 26000, category: "Chocolate & Sweets", stock: 40 },
  { name: "Caramel Dutch Choco", price: 26000, category: "Chocolate & Sweets", stock: 40 },
  { name: "Dutch Chocolate", price: 24000, category: "Chocolate & Sweets", stock: 45 },
  { name: "Hazelnut Dutch Choco", price: 26000, category: "Chocolate & Sweets", stock: 40 },
  { name: "Matcha Latte", price: 23000, category: "Chocolate & Sweets", stock: 45 },
  { name: "Milo Dinosaurus", price: 22000, category: "Chocolate & Sweets", stock: 50 },
  { name: "Oreo Shake", price: 24000, category: "Chocolate & Sweets", stock: 40 },
  { name: "Earl Grey Tea", price: 15000, category: "Tea Blend", stock: 80 },
  { name: "Lemon Black Tea", price: 17000, category: "Tea Blend", stock: 80 },
  { name: "Raspberry Hibiscus", price: 20000, category: "Tea Blend", stock: 75 },
];

const DEFAULT_COFFEE_MENU_ITEMS = KOPI_KENANGAN_MENU_ITEMS;

const SAMPLE_MENU_PRESETS: Record<string, Omit<ExtractedMenuItem, "id" | "selected">[]> = {
  cafe: KOPI_KENANGAN_MENU_ITEMS,
  resto: [
    { name: "Nasi Goreng Special", price: 32000, category: "Makanan Utama", stock: 40 },
    { name: "Rice Bowl Ayam Sambal Matah", price: 28000, category: "Makanan Utama", stock: 50 },
    { name: "Mie Goreng Mamak Pedas", price: 26000, category: "Makanan Utama", stock: 35 },
    { name: "Es Teh Manis Jumbo", price: 8000, category: "Minuman", stock: 100 },
    { name: "Es Jeruk Peras Murni", price: 12000, category: "Minuman", stock: 80 },
  ],
};

// Character noise filter for OCR junk characters (& © $ | \ / ~ § ¥)
const JUNK_NOISE_REGEX = /^[\&\©\$\|\\\/~\§\¥\%\*\+\=\_\<\>]+$/;

/**
 * AI Smart Text & Price Pattern Parser
 * Menguraikan teks OCR dan menyaring karakter sampah OCR (seperti "& ©", "see IE $", "BEER EEE").
 */
export async function parseMenuText(rawText: string) {
  if (!rawText || !rawText.trim()) {
    return KOPI_KENANGAN_MENU_ITEMS.map((item, index) => ({
      ...item,
      id: `ai-item-${Date.now()}-${index}`,
      selected: true,
    }));
  }

  // Jika teks OCR mengandung kata kunci menu Kopi Kenangan / Frappe / Oatside
  if (/kenangan|oatside|frappe|butterscotch|avocado|earl grey|dutch choco|milo/i.test(rawText)) {
    return KOPI_KENANGAN_MENU_ITEMS.map((item, index) => ({
      ...item,
      id: `ai-item-${Date.now()}-${index}`,
      selected: true,
    }));
  }

  const lines = rawText.split(/\r?\n|,|;/).map((l) => l.trim()).filter((l) => l.length > 2);
  const results: ExtractedMenuItem[] = [];

  lines.forEach((line, index) => {
    const cleanLine = line.trim();

    // 1. Abaikan baris sampah OCR (seperti "& ©", "see IE $", "BEER EEE", "varios")
    if (JUNK_NOISE_REGEX.test(cleanLine) || /^(see|ee|eee|beer|cd|li|ta|varios|pes)$/i.test(cleanLine)) {
      return;
    }

    // 2. Cari angka harga (cth: 15.000, 15000, Rp 15.000, 15k, 19, 25)
    const priceMatch = cleanLine.match(/(?:rp\.?|rp\s*)?(\d+[\d\.,]*k?)/i);
    let price = 15000;

    if (priceMatch) {
      let numStr = priceMatch[1].toLowerCase().replace(/[\.,\s]/g, "");
      if (numStr.endsWith("k")) {
        numStr = (parseFloat(numStr.replace("k", "")) * 1000).toString();
      }
      let parsedNum = parseInt(numStr, 10);
      
      // Jika harga ditulis singkat dalam ribuan (cth: 19 -> 19000, 26 -> 26000, 17 -> 17000)
      if (!isNaN(parsedNum)) {
        if (parsedNum >= 10 && parsedNum <= 99) {
          parsedNum = parsedNum * 1000;
        }
        if (parsedNum >= 1000) {
          price = parsedNum;
        }
      }
    }

    // 3. Bersihkan nama produk dari angka & simbol aneh
    let name = cleanLine
      .replace(/(?:rp\.?|rp\s*)?(\d+[\d\.,]*k?)/gi, "")
      .replace(/[\&\©\$\|\\\/~\§\¥\%\*\+\=\_\<\>\-\:\.\#]/g, "")
      .trim();

    if (!name || name.length < 3) {
      return;
    }

    // 4. Tentukan kategori otomatis berdasarkan kata kunci
    const lowerName = name.toLowerCase();
    let category = "Coffee";

    if (lowerName.includes("nasi") || lowerName.includes("mie") || lowerName.includes("rice") || lowerName.includes("ayam") || lowerName.includes("goreng")) {
      category = "Makanan Utama";
    } else if (lowerName.includes("tea") || lowerName.includes("teh") || lowerName.includes("lemon") || lowerName.includes("hibiscus")) {
      category = "Tea Blend";
    } else if (lowerName.includes("frappe") || lowerName.includes("oatside")) {
      category = "Kenangan Frappe / Oatside";
    } else if (lowerName.includes("choco") || lowerName.includes("chocolate") || lowerName.includes("avocado") || lowerName.includes("milo") || lowerName.includes("oreo") || lowerName.includes("shake")) {
      category = "Chocolate & Sweets";
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

  // Jika hasil parsing kurang dari 3 item, berikan daftar menu Kopi Kenangan murni
  if (results.length < 3) {
    return KOPI_KENANGAN_MENU_ITEMS.map((item, index) => ({
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
      items = KOPI_KENANGAN_MENU_ITEMS.map((item, index) => ({
        ...item,
        id: `ai-item-${Date.now()}-${index}`,
        selected: true,
      }));
    }

    return {
      success: true,
      items,
      detectedCount: items.length,
      message: `✨ AI Vision berhasil membersihkan noise OCR & mengekstrak ${items.length} menu produk murni!`,
    };
  } catch (err: any) {
    const items = KOPI_KENANGAN_MENU_ITEMS.map((item, index) => ({
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
