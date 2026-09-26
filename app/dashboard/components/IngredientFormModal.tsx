"use client";
// app/dashboard/components/IngredientFormModal.tsx — Form Input Manual Stok & Tambah Bahan Baku Baru

import { useState } from "react";
import { IngredientItem, addNewIngredient, updateIngredientStockManual } from "@/app/actions/ingredientActions";

interface IngredientFormModalProps {
  ingredientToEdit?: IngredientItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function IngredientFormModal({
  ingredientToEdit,
  onClose,
  onSuccess,
}: IngredientFormModalProps) {
  const isEditing = !!ingredientToEdit;

  const [name, setName] = useState(ingredientToEdit?.name || "");
  const [category, setCategory] = useState<"kopi" | "susu_dairy" | "sirup_gula" | "kemasan" | "makanan">(
    ingredientToEdit?.category || "kopi"
  );
  const [unit, setUnit] = useState<"gram" | "ml" | "pcs" | "porsi">(
    ingredientToEdit?.unit || "gram"
  );
  const [stock, setStock] = useState<string>(
    ingredientToEdit ? ingredientToEdit.stock.toString() : "0"
  );
  const [minStock, setMinStock] = useState<string>(
    ingredientToEdit ? ingredientToEdit.min_stock.toString() : "100"
  );
  const [costPerUnit, setCostPerUnit] = useState<string>(
    ingredientToEdit ? ingredientToEdit.cost_per_unit.toString() : "100"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const stockNum = Number(stock);
    const minStockNum = Number(minStock);
    const costNum = Number(costPerUnit);

    if (isNaN(stockNum) || stockNum < 0) {
      setErrorMsg("Jumlah stok harus berupa angka positif atau nol.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && ingredientToEdit) {
        // Mode Update Stok Manual
        const res = await updateIngredientStockManual(
          ingredientToEdit.id,
          stockNum,
          minStockNum,
          costNum
        );
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.error || "Gagal memperbarui stok bahan.");
        }
      } else {
        // Mode Tambah Bahan Baku Baru
        if (!name.trim()) {
          setErrorMsg("Nama bahan baku wajib diisi.");
          setIsSubmitting(false);
          return;
        }

        const res = await addNewIngredient({
          name: name.trim(),
          category,
          unit,
          stock: stockNum,
          min_stock: minStockNum,
          cost_per_unit: costNum,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg("Gagal menambahkan bahan baku baru.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem saat menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#161616",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "540px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          color: "#F5F0E8",
          fontFamily: "system-ui, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.72rem", color: "#D4651C", fontWeight: "800", textTransform: "uppercase" }}>
              📦 Master Inventaris Bahan Baku
            </div>
            <h2 style={{ fontSize: "1.18rem", fontWeight: "900", margin: "2px 0 0" }}>
              {isEditing ? `✏️ Set Stok Manual: ${ingredientToEdit.name}` : "➕ Input Bahan Baku Baru"}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#FFF",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            ✕
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 22px" }}>
          {errorMsg && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#EF4444",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "0.82rem",
                fontWeight: "700",
                marginBottom: "16px",
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {/* NAMA BAHAN BAKU */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.78rem", color: "#BBB", fontWeight: "700", marginBottom: "6px" }}>
              Nama Bahan Baku Mentah *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Biji Kopi Arabica, Es Batu Kristal, Gula Aren Cair"
              disabled={isEditing}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                background: isEditing ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: isEditing ? "#AAA" : "#FFF",
                fontSize: "0.88rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* KATEGORI & SATUAN */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "#BBB", fontWeight: "700", marginBottom: "6px" }}>
                Kategori Bahan
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                disabled={isEditing}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#222",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#FFF",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="kopi">☕ Kopi &amp; Espresso</option>
                <option value="susu_dairy">🥛 Susu &amp; Dairy</option>
                <option value="sirup_gula">🍯 Sirup &amp; Gula</option>
                <option value="kemasan">🧊 Kemasan &amp; Es Batu</option>
                <option value="makanan">🍲 Bahan Makanan</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "#BBB", fontWeight: "700", marginBottom: "6px" }}>
                Satuan Ukuran
              </label>
              <select
                value={unit}
                onChange={(e: any) => setUnit(e.target.value)}
                disabled={isEditing}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#222",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#FFF",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="gram">gram (gr)</option>
                <option value="ml">mililiter (ml)</option>
                <option value="pcs">pieces (pcs)</option>
                <option value="porsi">porsi</option>
              </select>
            </div>
          </div>

          {/* STOK FISIK SAAT INI (ANGKA UTAMA) */}
          <div
            style={{
              background: "rgba(212, 101, 28, 0.08)",
              border: "1px solid rgba(212, 101, 28, 0.3)",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "0.82rem", color: "#F97316", fontWeight: "800" }}>
                {isEditing ? "📊 Input Stok Fisik Terkini (Stock Opname) *" : "📊 Stok Fisik Awal Tersedia *"}
              </label>
              <span style={{ fontSize: "0.75rem", color: "#AAA" }}>Satuan: <strong>{unit}</strong></span>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#1E1E1E",
                border: "1px solid #D4651C",
                color: "#4ADE80",
                fontSize: "1.2rem",
                fontWeight: "900",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: "0.72rem", color: "#AAA", marginTop: "6px" }}>
              {isEditing
                ? "💡 Angka ini akan menjadi stok fisik dasar yang berkurang otomatis saat menu terjual di Kasir / QR Meja."
                : "💡 Masukkan jumlah stok fisik yang saat ini ada di gudang / barista bar."}
            </div>
          </div>

          {/* BATAS MINIMUM & HARGA BELI PER SATUAN */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "#BBB", fontWeight: "700", marginBottom: "6px" }}>
                Batas Min. Stok (Bel)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="100"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#FFF",
                  fontSize: "0.88rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: "0.68rem", color: "#888" }}>Pemicu bel audio stok menipis</span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "#BBB", fontWeight: "700", marginBottom: "6px" }}>
                Harga Beli / Satuan (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                placeholder="100"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#FFF",
                  fontSize: "0.88rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: "0.68rem", color: "#888" }}>Digunakan menghitung HPP</span>
            </div>
          </div>

          {/* TOMBOL AKSI */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 16px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                color: "#FFF",
                fontSize: "0.82rem",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                background: "#D4651C",
                border: "none",
                color: "#FFF",
                fontSize: "0.85rem",
                fontWeight: "800",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Menyimpan..." : isEditing ? "💾 Simpan Stok Fisik" : "➕ Tambah Bahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
