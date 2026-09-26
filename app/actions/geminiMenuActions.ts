"use server";
// app/actions/geminiMenuActions.ts — Google AI Studio (Gemini 2.0 Flash / 1.5 Pro) Vision Menu Scanner

import { ExtractedMenuItem } from "./aiMenuActions";

interface GeminiVisionResult {
  success: boolean;
  model?: string;
  items?: ExtractedMenuItem[];
  rawText?: string;
  error?: string;
}

export async function extractMenuWithGeminiVision(
  base64Image: string,
  customApiKey?: string,
  modelName: string = "gemini-3.8-flash"
): Promise<GeminiVisionResult> {
  const apiKey = (customApiKey?.trim() || process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    return {
      success: false,
      error: "Google AI Studio API Key belum terkonfigurasi pada server.",
    };
  }

  // Pisahkan Header Data URL dan Base64 murni
  let mimeType = "image/jpeg";
  let cleanBase64 = base64Image;

  if (base64Image.includes(";base64,")) {
    const parts = base64Image.split(";base64,");
    const mimeMatch = parts[0].match(/:(.*?)$/);
    if (mimeMatch) mimeType = mimeMatch[1];
    cleanBase64 = parts[1];
  }

  const prompt = `Anda adalah sistem AI Vision Multimodal tercanggih untuk restoran, kafe, dan F&B modern.
Analisis foto daftar menu, papan menu, atau brosur fisik yang diberikan.

TUGAS UTAMA:
Ekstrak SEMUA item menu makanan, minuman, dan camilan yang tertera di dalam foto dengan presisi 100%.

ATURAN EKSTRAKSI:
1. Nama Produk: Ambil nama menu asli secara lengkap (perhatikan tata letak 2 kolom, 3 kolom, atau tabel).
2. Harga: Konversikan ke angka integer Rupiah bersih. Contoh:
   - "25k" -> 25000
   - "32.000" -> 32000
   - "18,-" -> 18000
   - "45" (jika konteks ribuan) -> 45000
3. Kategori: Kelompokkan ke salah satu dari:
   - "Kopi & Espresso"
   - "Non-Coffee & Mocktail"
   - "Makanan Utama"
   - "Pastry & Snack"
4. Abaikan informasi non-menu seperti: nama resto di header, password Wi-Fi, jam buka, alamat, atau akun Instagram.
5. Format Respons: WAJIB mengembalikan HANYA JSON array murni:
[
  {
    "name": "Nama Menu Lengkap",
    "price": 25000,
    "category": "Kategori",
    "description": "Deskripsi singkat jika ada"
  }
]`;

  try {
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.1,
      },
    };

    // Urutan model cadangan jika model mengalami 503 (high demand) atau 404
    const candidateModels = [
      modelName,
      "gemini-flash-latest",
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
    ].filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx);

    let lastError = "";
    let data: any = null;
    let successfulModel = modelName;

    for (const currentModel of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          data = await response.json();
          successfulModel = currentModel;
          break;
        } else {
          const errJson = await response.json().catch(() => null);
          const errMsg = errJson?.error?.message || response.statusText;
          lastError = `Google AI Studio (${currentModel}) Error ${response.status}: ${errMsg}`;
          // Jika gagal (503 high demand, 429 rate limit, atau 404 deprecated), coba model berikutnya
          continue;
        }
      } catch (callErr: any) {
        lastError = callErr.message || String(callErr);
      }
    }

    if (!data) {
      return {
        success: false,
        error: lastError || "Tidak dapat memproses foto dengan Google Gemini models.",
      };
    }

    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return {
        success: false,
        error: "Google Gemini tidak menghasilkan teks ekstraksi dari foto ini.",
      };
    }

    // Bersihkan kemungkinan backtick jika ada
    let cleanJson = candidateText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
    }

    let parsedItems: Array<{ name: string; price: number; category: string; description?: string }> = [];
    try {
      parsedItems = JSON.parse(cleanJson);
    } catch {
      // Jika respons berupa object dengan key items
      const obj = JSON.parse(cleanJson);
      if (Array.isArray(obj.items)) {
        parsedItems = obj.items;
      } else if (Array.isArray(obj.menu)) {
        parsedItems = obj.menu;
      } else {
        throw new Error("Format JSON tidak valid");
      }
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return {
        success: false,
        error: "Tidak ada menu yang berhasil dikenali dalam foto ini.",
      };
    }

    const extractedItems: ExtractedMenuItem[] = parsedItems.map((item, index) => ({
      id: `gemini-${Date.now()}-${index}`,
      name: String(item.name || "").trim(),
      price: Number(item.price) || 20000,
      category: String(item.category || "Kopi & Espresso").trim(),
      stock: 50,
      selected: true,
    }));

    return {
      success: true,
      model: modelName,
      items: extractedItems,
      rawText: candidateText,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal memproses AI Vision: ${err.message || "Periksa koneksi internet atau API Key Anda"}`,
    };
  }
}
