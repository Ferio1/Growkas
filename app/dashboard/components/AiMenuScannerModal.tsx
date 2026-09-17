"use client";
// app/dashboard/components/AiMenuScannerModal.tsx — Modal AI Scan Foto Buku Menu & Batch Import ke Supabase

import { useState } from "react";
import { extractMenuFromImage, parseMenuText, batchAddProducts, ExtractedMenuItem } from "@/app/actions/aiMenuActions";

interface AiMenuScannerModalProps {
  onClose: () => void;
  onProductsImported: () => void;
}

export default function AiMenuScannerModal({ onClose, onProductsImported }: AiMenuScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"ai_scan" | "manual">("ai_scan");
  
  // State AI Scanner
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [rawTextInput, setRawTextInput] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedMenuItem[]>([]);
  const [scanMessage, setScanMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState("");

  // Handler Upload Foto Asli User dari HP / PC
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      setUploadedImagePreview(base64Data);
      
      setIsScanning(true);
      setScanMessage("");

      // Panggil AI Vision Server Action dengan Base64 foto asli!
      const res = await extractMenuFromImage(base64Data);

      setTimeout(() => {
        setIsScanning(false);
        if (res.success && res.items) {
          setExtractedItems(res.items);
          setScanMessage(`✨ AI Vision membaca foto "${file.name}" & mengekstrak ${res.items.length} produk menu!`);
        }
      }, 500);
    };
    reader.readAsDataURL(file);
  };

  // Handler Salin-Tempel Teks Menu (Instant AI Text Parser)
  const handleParseText = async (textValue: string) => {
    setRawTextInput(textValue);
    if (!textValue.trim()) return;

    setIsScanning(true);
    const parsed = await parseMenuText(textValue);
    setIsScanning(false);

    if (parsed.length > 0) {
      setExtractedItems(parsed);
      setScanMessage(`✨ AI mengekstrak ${parsed.length} menu dari teks daftar harga!`);
    }
  };

  // Handler Jalankan Preset Sampel
  const handleRunPreset = async (presetKey: string) => {
    setIsScanning(true);
    setUploadedImagePreview(null);
    const res = await extractMenuFromImage(undefined, presetKey);

    setTimeout(() => {
      setIsScanning(false);
      if (res.success && res.items) {
        setExtractedItems(res.items);
        setScanMessage(res.message || "Berhasil memuat sampel menu!");
      }
    }, 400);
  };

  // Handler Tambah Baris Menu Kosong
  const handleAddNewRow = () => {
    const newItem: ExtractedMenuItem = {
      id: `manual-new-${Date.now()}`,
      name: "Produk Baru",
      price: 15000,
      category: "Umum",
      stock: 50,
      selected: true,
    };
    setExtractedItems((prev) => [...prev, newItem]);
  };

  // Handler Checkbox Toggle
  const handleToggleItem = (id: string) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Handler Edit Nilai Item
  const handleItemChange = (id: string, field: keyof ExtractedMenuItem, value: any) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Handler Import Semua Produk Pilihan ke Database
  const handleImportAll = async () => {
    const selected = extractedItems.filter((i) => i.selected);
    if (selected.length === 0) {
      alert("Pilih minimal 1 produk untuk diimpor!");
      return;
    }

    setIsImporting(true);
    const res = await batchAddProducts(extractedItems);
    setIsImporting(false);

    if (res.success) {
      setImportSuccessMsg(res.message || "Produk berhasil ditambahkan!");
      setTimeout(() => {
        onProductsImported();
        onClose();
      }, 1500);
    } else {
      alert("Gagal mengimpor produk: " + res.error);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", color: "#F5F0E8", fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "#161616", border: "1px solid rgba(212,101,28,0.4)", borderRadius: "18px", width: "100%", maxWidth: "720px", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
      }}>
        
        {/* Header Modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#D4651C", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
              ✨ Growkas AI Vision &amp; OCR Menu Extractor
            </span>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "900", margin: "2px 0 0" }}>
              Tambah &amp; Import Produk Menu Resto
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#F5F0E8", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => setActiveTab("ai_scan")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              background: activeTab === "ai_scan" ? "#D4651C" : "rgba(255,255,255,0.05)",
              color: activeTab === "ai_scan" ? "#FFF" : "rgba(245,240,232,0.6)",
              border: "none",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>📸</span> Scan Foto Menu (AI OCR &amp; Vision)
          </button>
          
          <button
            onClick={() => setActiveTab("manual")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              background: activeTab === "manual" ? "#D4651C" : "rgba(255,255,255,0.05)",
              color: activeTab === "manual" ? "#FFF" : "rgba(245,240,232,0.6)",
              border: "none",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>✍️</span> Input Manual 1 Per 1
          </button>
        </div>

        {/* TAB 1: AI VISION SCANNER */}
        {activeTab === "ai_scan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Box Upload Foto & Thumbnail Preview */}
            <div style={{
              border: "2px dashed rgba(212,101,28,0.5)",
              borderRadius: "14px",
              padding: "20px",
              textAlign: "center",
              background: "rgba(212,101,28,0.04)",
            }}>
              {uploadedImagePreview ? (
                <div style={{ marginBottom: "14px", textAlign: "center" }}>
                  <img
                    src={uploadedImagePreview}
                    alt="Foto Menu Resto"
                    style={{ maxHeight: "160px", borderRadius: "10px", border: "1px solid #D4651C", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
                  />
                  <div style={{ fontSize: "0.75rem", color: "#4ade80", fontWeight: "bold", marginTop: "4px" }}>
                    ✓ Foto Menu Terbaca oleh AI Vision
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "2rem", marginBottom: "6px" }}>📸</div>
              )}

              <h3 style={{ fontSize: "1rem", fontWeight: "800", margin: "0 0 4px" }}>
                Upload Foto Buku / Papan Menu Asli Resto Anda
              </h3>
              <p style={{ fontSize: "0.8rem", color: "rgba(245,240,232,0.6)", margin: "0 0 14px" }}>
                Pilih foto daftar makanan/minuman dari HP atau PC Anda. AI akan membaca nama produk &amp; harga secara otomatis.
              </p>

              {/* Tombol Unggah Foto Asli dari Perangkat */}
              <label style={{
                display: "inline-block",
                padding: "11px 22px",
                borderRadius: "10px",
                background: "#D4651C",
                color: "#FFF",
                fontWeight: "900",
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(212,101,28,0.4)",
                marginBottom: "14px",
              }}>
                📷 Pilih / Ambil Foto Menu dari Perangkat Anda
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  style={{ display: "none" }}
                />
              </label>

              {/* Option 2: Salin-Tempel Teks Menu (Instant AI Text Parser) */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", marginTop: "4px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#D4651C", textAlign: "left", marginBottom: "6px" }}>
                  📝 ATAU Salin-Tempel Teks Menu / Daftar Harga Anda (AI Auto-Parse):
                </div>
                <textarea
                  rows={3}
                  value={rawTextInput}
                  onChange={(e) => handleParseText(e.target.value)}
                  placeholder={`Contoh tempel teks:\nEs Kopi Susu Aren - 18000\nNasi Goreng Special - 28000\nEs Teh Manis - 6000`}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#F5F0E8", fontSize: "0.82rem", outline: "none", boxSizing: "border-box", fontFamily: "monospace",
                  }}
                />
              </div>

              {/* Sample Preset Selector */}
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginTop: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "rgba(245,240,232,0.5)", alignSelf: "center" }}>Preset Sampel:</span>
                <button
                  type="button"
                  onClick={() => handleRunPreset("cafe")}
                  style={{
                    padding: "6px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#F5F0E8", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
                  }}
                >
                  ☕ Sampel Menu Kafe
                </button>
                <button
                  type="button"
                  onClick={() => handleRunPreset("resto")}
                  style={{
                    padding: "6px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#F5F0E8", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
                  }}
                >
                  🍜 Sampel Makanan Utama
                </button>
              </div>

            </div>

            {/* Scanning Status */}
            {isScanning && (
              <div style={{ textAlign: "center", padding: "14px", color: "#D4651C", fontWeight: "800", fontSize: "0.9rem" }}>
                🔄 AI Vision sedang membaca foto &amp; menyusun daftar menu...
              </div>
            )}

            {/* Success Message */}
            {scanMessage && !isScanning && (
              <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: "0.85rem", fontWeight: "700" }}>
                {scanMessage}
              </div>
            )}

            {/* Tabel Preview & Edit Hasil Ekstraksi AI */}
            {extractedItems.length > 0 && !isScanning && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: "800", margin: 0 }}>
                    Hasil Ekstraksi AI ({extractedItems.filter((i) => i.selected).length} Produk Dipilih):
                  </h4>
                  
                  <button
                    type="button"
                    onClick={handleAddNewRow}
                    style={{
                      padding: "4px 10px", borderRadius: "6px", background: "rgba(212,101,28,0.2)", border: "1px solid #D4651C", color: "#D4651C", fontSize: "0.75rem", fontWeight: "bold", cursor: "pointer",
                    }}
                  >
                    + Tambah Baris Manual
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto", paddingRight: "4px" }}>
                  {extractedItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "30px 2.2fr 1.2fr 1fr 60px",
                        gap: "8px",
                        alignItems: "center",
                        background: item.selected ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
                        border: "1px solid " + (item.selected ? "rgba(212,101,28,0.3)" : "rgba(255,255,255,0.06)"),
                        padding: "8px 12px",
                        borderRadius: "8px",
                        opacity: item.selected ? 1 : 0.5,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(item.id)}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      />

                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                        placeholder="Nama Produk"
                        style={{
                          background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", padding: "6px 8px", borderRadius: "6px", fontSize: "0.82rem", outline: "none",
                        }}
                      />

                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
                        placeholder="Kategori"
                        style={{
                          background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", padding: "6px 8px", borderRadius: "6px", fontSize: "0.82rem", outline: "none",
                        }}
                      />

                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, "price", Number(e.target.value))}
                        placeholder="Harga (Rp)"
                        style={{
                          background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#D4651C", padding: "6px 8px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "bold", outline: "none",
                        }}
                      />

                      <input
                        type="number"
                        value={item.stock}
                        onChange={(e) => handleItemChange(item.id, "stock", Number(e.target.value))}
                        placeholder="Stok"
                        style={{
                          background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", padding: "6px 8px", borderRadius: "6px", fontSize: "0.82rem", outline: "none",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {importSuccessMsg && (
                  <div style={{ marginTop: "12px", padding: "10px", borderRadius: "8px", background: "rgba(74,222,128,0.2)", color: "#4ade80", fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>
                    ✓ {importSuccessMsg}
                  </div>
                )}

                {/* Tombol Simpan Semua Batch */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isImporting}
                    style={{ padding: "10px 18px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", color: "#F5F0E8", border: "none", fontWeight: "600", cursor: "pointer" }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleImportAll}
                    disabled={isImporting}
                    style={{
                      padding: "10px 22px", borderRadius: "8px", background: "#D4651C", color: "#FFF", border: "none", fontWeight: "900", cursor: "pointer", boxShadow: "0 4px 14px rgba(212,101,28,0.4)",
                    }}
                  >
                    {isImporting ? "Mengimpor ke Supabase..." : `🚀 Simpan ${extractedItems.filter((i) => i.selected).length} Produk ke Database ➔`}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: MANUAL SINGLE INPUT FORM */}
        {activeTab === "manual" && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.elements.namedItem("name") as HTMLInputElement).value;
            const price = Number((form.elements.namedItem("price") as HTMLInputElement).value);
            const stock = Number((form.elements.namedItem("stock") as HTMLInputElement).value) || 50;

            if (name && price) {
              await batchAddProducts([{ id: "m-1", name, price, category: "Umum", stock, selected: true }]);
              onProductsImported();
              onClose();
            }
          }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "6px", color: "rgba(245,240,232,0.6)" }}>
                Nama Produk / Menu
              </label>
              <input
                name="name"
                type="text"
                placeholder="Cth: Kopi Susu Aren"
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "6px", color: "rgba(245,240,232,0.6)" }}>
                Harga Jual (Rp)
              </label>
              <input
                name="price"
                type="number"
                placeholder="18000"
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "6px", color: "rgba(245,240,232,0.6)" }}>
                Stok Awal
              </label>
              <input
                name="stock"
                type="number"
                placeholder="50"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", color: "#F5F0E8", border: "none", fontWeight: "600", cursor: "pointer" }}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{ padding: "10px", borderRadius: "8px", background: "#D4651C", color: "#FFF", border: "none", fontWeight: "800", cursor: "pointer" }}
              >
                Simpan Produk
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
