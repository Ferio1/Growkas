"use client";
// app/dashboard/components/RecipeModifierEditorModal.tsx — Form Konfigurasi Resep Menu & Takaran Modifier (Sugar, Ice, Add-ons)

import { useState } from "react";
import {
  ProductRecipe,
  RecipeRequirement,
  IngredientItem,
  saveRecipeConfiguration,
} from "@/app/actions/ingredientActions";

interface RecipeModifierEditorModalProps {
  recipe: ProductRecipe;
  allIngredients: IngredientItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecipeModifierEditorModal({
  recipe,
  allIngredients,
  onClose,
  onSuccess,
}: RecipeModifierEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"ingredients" | "modifiers">("ingredients");

  const [sellingPrice, setSellingPrice] = useState<number>(recipe.selling_price || 20000);
  const [ingredients, setIngredients] = useState<RecipeRequirement[]>(
    recipe.ingredients && recipe.ingredients.length > 0
      ? [...recipe.ingredients]
      : [
          { ingredient_id: "ing-1", ingredient_name: "Biji Kopi Arabica", quantity: 18, unit: "gram" },
          { ingredient_id: "ing-2", ingredient_name: "Fresh Milk UHT", quantity: 130, unit: "ml" },
          { ingredient_id: "ing-3", ingredient_name: "Gula Aren Cair", quantity: 25, unit: "ml" },
          { ingredient_id: "ing-18", ingredient_name: "Es Batu Kristal", quantity: 120, unit: "gram" },
          { ingredient_id: "ing-7", ingredient_name: "Cup Dingin 16oz", quantity: 1, unit: "pcs" },
        ]
  );

  // Aturan Level Gula
  const [normalSugarPercent, setNormalSugarPercent] = useState<number>(
    recipe.modifierConfig?.sugarRules?.normalPercent ?? 100
  );
  const [lessSugarPercent, setLessSugarPercent] = useState<number>(
    recipe.modifierConfig?.sugarRules?.lessPercent ?? 50
  );
  const [noSugarPercent, setNoSugarPercent] = useState<number>(
    recipe.modifierConfig?.sugarRules?.noPercent ?? 0
  );
  const [extraSugarPercent, setExtraSugarPercent] = useState<number>(
    recipe.modifierConfig?.sugarRules?.extraPercent ?? 150
  );

  // Aturan Level Es
  const [normalIcePercent, setNormalIcePercent] = useState<number>(
    recipe.modifierConfig?.iceRules?.normalPercent ?? 100
  );
  const [lessMilkCompensation, setLessMilkCompensation] = useState<number>(
    recipe.modifierConfig?.iceRules?.lessMilkCompensationPercent ?? 10
  );
  const [noMilkCompensation, setNoMilkCompensation] = useState<number>(
    recipe.modifierConfig?.iceRules?.noMilkCompensationPercent ?? 20
  );
  const [extraIcePercent, setExtraIcePercent] = useState<number>(
    recipe.modifierConfig?.iceRules?.extraIcePercent ?? 130
  );

  // Aturan Level Pedas
  const [mildPercent, setMildPercent] = useState<number>(
    recipe.modifierConfig?.spicyRules?.mildPercent ?? 40
  );
  const [extraSpicyPercent, setExtraSpicyPercent] = useState<number>(
    recipe.modifierConfig?.spicyRules?.extraSpicyPercent ?? 160
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper tambah bahan baru ke resep
  const handleAddIngredientRow = () => {
    if (allIngredients.length === 0) return;
    const first = allIngredients[0];
    setIngredients((prev) => [
      ...prev,
      {
        ingredient_id: first.id,
        ingredient_name: first.name,
        quantity: first.unit === "gram" ? 20 : first.unit === "ml" ? 50 : 1,
        unit: first.unit,
      },
    ]);
  };

  // Helper ubah bahan pada baris tertentu
  const handleIngredientChange = (idx: number, field: "ingredient_id" | "quantity", val: any) => {
    setIngredients((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        if (field === "ingredient_id") {
          const selected = allIngredients.find((ing) => ing.id === val);
          return {
            ...row,
            ingredient_id: val,
            ingredient_name: selected ? selected.name : row.ingredient_name,
            unit: selected ? selected.unit : row.unit,
          };
        } else {
          return {
            ...row,
            quantity: Math.max(0, Number(val) || 0),
          };
        }
      })
    );
  };

  // Helper hapus bahan dari resep
  const handleRemoveIngredientRow = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  // Hitung perkiraan Total HPP Standar
  const estimatedHpp = ingredients.reduce((sum, item) => {
    const found = allIngredients.find((i) => i.id === item.ingredient_id);
    const costPerUnit = found ? found.cost_per_unit : 0;
    return sum + item.quantity * costPerUnit;
  }, 0);

  const profitNominal = sellingPrice - estimatedHpp;
  const profitMarginPercent = sellingPrice > 0 ? Math.round((profitNominal / sellingPrice) * 100) : 0;

  // Submit Simpan
  const handleSave = async () => {
    setErrorMsg(null);
    setSaveSuccessMsg(null);

    if (ingredients.length === 0) {
      setErrorMsg("Resep harus memiliki minimal 1 bahan baku.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ProductRecipe = {
        product_name: recipe.product_name,
        selling_price: Number(sellingPrice) || recipe.selling_price,
        ingredients,
        modifierConfig: {
          sugarRules: {
            normalPercent: Number(normalSugarPercent) || 100,
            lessPercent: Number(lessSugarPercent) || 50,
            noPercent: Number(noSugarPercent) || 0,
            extraPercent: Number(extraSugarPercent) || 150,
          },
          iceRules: {
            normalPercent: Number(normalIcePercent) || 100,
            lessMilkCompensationPercent: Number(lessMilkCompensation) || 10,
            noMilkCompensationPercent: Number(noMilkCompensation) || 20,
            extraIcePercent: Number(extraIcePercent) || 130,
          },
          spicyRules: {
            mildPercent: Number(mildPercent) || 40,
            mediumPercent: 100,
            extraSpicyPercent: Number(extraSpicyPercent) || 160,
          },
        },
      };

      const res = await saveRecipeConfiguration(payload);
      if (res.success) {
        setSaveSuccessMsg("Resep & takaran modifier berhasil disimpan!");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setErrorMsg("Gagal menyimpan konfigurasi resep.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem saat menyimpan resep.");
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
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(10px)",
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
          borderRadius: "20px",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85)",
          color: "#F5F0E8",
          fontFamily: "system-ui, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.72rem", color: "#D4651C", fontWeight: "800", textTransform: "uppercase" }}>
              💡 Bill of Materials &amp; Modifier Customizer
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "900", margin: "2px 0 0" }}>
              Atur Resep &amp; Takaran Modifier: {recipe.product_name}
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

        {/* TAB TOGGLE BUTTONS */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(0, 0, 0, 0.2)",
            padding: "0 24px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("ingredients")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "ingredients" ? "3px solid #D4651C" : "3px solid transparent",
              color: activeTab === "ingredients" ? "#FFF" : "#888",
              fontSize: "0.85rem",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>📋</span> Resep Komposisi Normal ({ingredients.length} Bahan)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("modifiers")}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "modifiers" ? "3px solid #D4651C" : "3px solid transparent",
              color: activeTab === "modifiers" ? "#FFF" : "#888",
              fontSize: "0.85rem",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⚡</span> Aturan Takaran Modifier (Sugar &amp; Ice)
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
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

          {saveSuccessMsg && (
            <div
              style={{
                background: "rgba(74, 222, 128, 0.15)",
                border: "1px solid rgba(74, 222, 128, 0.4)",
                color: "#4ADE80",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "0.82rem",
                fontWeight: "700",
                marginBottom: "16px",
              }}
            >
              ✓ {saveSuccessMsg}
            </div>
          )}

          {/* TAB 1: RESEP KOMPOSISI NORMAL */}
          {activeTab === "ingredients" && (
            <div>
              {/* HARGA JUAL & RINGKASAN MARGIN */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#888", fontWeight: "700" }}>HARGA JUAL (RP)</div>
                  <input
                    type="number"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      color: "#FFF",
                      fontSize: "1.15rem",
                      fontWeight: "900",
                      outline: "none",
                      marginTop: "2px",
                    }}
                  />
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#888", fontWeight: "700" }}>ESTIMASI HPP STANDAR</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#EF4444", marginTop: "2px" }}>
                    Rp {estimatedHpp.toLocaleString("id-ID")}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#888", fontWeight: "700" }}>LABA KOTOR PER PORSI</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#4ADE80", marginTop: "2px" }}>
                    + Rp {profitNominal.toLocaleString("id-ID")} ({profitMarginPercent}%)
                  </div>
                </div>
              </div>

              {/* TABEL KOMPOSISI RESEP */}
              <div style={{ border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", overflow: "hidden", marginBottom: "14px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#AAA" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>Bahan Mentah</th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>Takaran Standar</th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>Satuan</th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>Biaya Bahan</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((row, idx) => {
                      const matched = allIngredients.find((i) => i.id === row.ingredient_id);
                      const cost = matched ? row.quantity * matched.cost_per_unit : 0;
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <td style={{ padding: "8px 12px" }}>
                            <select
                              value={row.ingredient_id}
                              onChange={(e) => handleIngredientChange(idx, "ingredient_id", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                background: "#222",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                color: "#FFF",
                                fontSize: "0.82rem",
                                outline: "none",
                              }}
                            >
                              {allIngredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} ({ing.unit})
                                </option>
                              ))}
                            </select>
                          </td>

                          <td style={{ padding: "8px 12px" }}>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={row.quantity}
                              onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                              style={{
                                width: "80px",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "#FFF",
                                fontSize: "0.82rem",
                                outline: "none",
                              }}
                            />
                          </td>

                          <td style={{ padding: "8px 12px", color: "#AAA" }}>{row.unit}</td>

                          <td style={{ padding: "8px 12px", color: "#EF4444", fontWeight: "700" }}>
                            Rp {cost.toLocaleString("id-ID")}
                          </td>

                          <td style={{ padding: "8px 12px", textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredientRow(idx)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                background: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#EF4444",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              🗑️ Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleAddIngredientRow}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "rgba(212, 101, 28, 0.15)",
                  border: "1px solid rgba(212, 101, 28, 0.35)",
                  color: "#D4651C",
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>➕</span> Tambah Bahan ke Resep
              </button>
            </div>
          )}

          {/* TAB 2: ATURAN TAKARAN MODIFIER (SUGAR, ICE & SPICY) */}
          {activeTab === "modifiers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* ATURAN LEVEL GULA */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🍯</span>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: "800", margin: 0, color: "#F59E0B" }}>
                      Aturan Takaran Gula &amp; Sirup (*Sugar Level*)
                    </h3>
                    <div style={{ fontSize: "0.74rem", color: "#888" }}>
                      Diterapkan pada bahan berkategori sirup/gula (Gula Aren Cair, Sirup Karamel, Simple Syrup, dll).
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "#AAA", fontWeight: "700", marginBottom: "4px" }}>
                      Normal Sugar (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={normalSugarPercent}
                      onChange={(e) => setNormalSugarPercent(Number(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#FFF",
                        fontSize: "0.85rem",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#888" }}>Standar resep (100%)</span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "#AAA", fontWeight: "700", marginBottom: "4px" }}>
                      Less Sugar (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lessSugarPercent}
                      onChange={(e) => setLessSugarPercent(Number(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#FBBF24",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#888" }}>Default: 50% takaran</span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "#AAA", fontWeight: "700", marginBottom: "4px" }}>
                      No Sugar (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={noSugarPercent}
                      onChange={(e) => setNoSugarPercent(Number(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#EF4444",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#888" }}>Default: 0% (Tanpa Gula)</span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "#AAA", fontWeight: "700", marginBottom: "4px" }}>
                      Extra Sugar / Tambah (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={extraSugarPercent}
                      onChange={(e) => setExtraSugarPercent(Number(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#4ADE80",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#888" }}>Default: 150% (+50% Ekstra)</span>
                  </div>
                </div>
              </div>

              {/* ATURAN LEVEL ES & KOMPENSASI SUSU */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🧊</span>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: "800", margin: 0, color: "#38BDF8" }}>
                      Aturan Takaran Es Batu &amp; Kompensasi Susu (*Ice Level*)
                    </h3>
                    <div style={{ fontSize: "0.74rem", color: "#888" }}>
                      Diterapkan pada takaran Es Batu Kristal &amp; penyesuaian volume susu/liquid base.
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "#AAA", fontWeight: "700", marginBottom: "4px" }}>
                      Normal Ice (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={normalIcePercent}
                      onChange={(e) => setNormalIcePercent(Number(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#FFF",
                        fontSize: "0.85rem",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#888" }}>Takaran es standar (100%)</span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "#AAA", fontWeight: "700", marginBottom: "4px" }}>
                      Less Ice (Kompensasi Susu %)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lessMilkCompensation}
                      onChange={(e) => setLessMilkCompensation(Number(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#38BDF8",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#888" }}>Es 50%, susu +10%</span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "#AAA", fontWeight: "700", marginBottom: "4px" }}>
                      No Ice (Kompensasi Susu %)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={noMilkCompensation}
                      onChange={(e) => setNoMilkCompensation(Number(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#38BDF8",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#888" }}>Es 0%, susu +20%</span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "#AAA", fontWeight: "700", marginBottom: "4px" }}>
                      Tambah Ice / Extra Ice (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={extraIcePercent}
                      onChange={(e) => setExtraIcePercent(Number(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#38BDF8",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#888" }}>Es ekstra (+30% Es)</span>
                  </div>
                </div>
              </div>

              {/* ATURAN LEVEL PEDAS (JIKA MAKANAN) */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🌶️</span>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: "800", margin: 0, color: "#EF4444" }}>
                      Aturan Level Pedas (*Spicy Level*)
                    </h3>
                    <div style={{ fontSize: "0.74rem", color: "#888" }}>
                      Diterapkan pada bahan rempah, cabai, atau sambal masakan.
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "#AAA", fontWeight: "700", marginBottom: "4px" }}>
                      Tidak Pedas (Bumbu Non-Cabai %)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mildPercent}
                      onChange={(e) => setMildPercent(Number(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#FFF",
                        fontSize: "0.85rem",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#888" }}>Default 40% (cabai ditiadakan)</span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "#AAA", fontWeight: "700", marginBottom: "4px" }}>
                      Pedas Mantap / Extra Pedas (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={extraSpicyPercent}
                      onChange={(e) => setExtraSpicyPercent(Number(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#EF4444",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#888" }}>Default 160% (+60% Rempah Cabai)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ fontSize: "0.78rem", color: "#888" }}>
            Total {ingredients.length} bahan baku resep
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
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
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                background: "#D4651C",
                border: "none",
                color: "#FFF",
                fontSize: "0.85rem",
                fontWeight: "800",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Menyimpan Resep..." : "💾 Simpan Konfigurasi Resep"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
