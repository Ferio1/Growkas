"use client";
// app/dashboard/components/HppDetailModal.tsx — Pop-up Rincian HPP, Komposisi Bahan & Audio Bel Peringatan Stok

import { useState } from "react";
import { restockIngredient } from "@/app/actions/ingredientActions";
import { playLowStockWarningTone } from "@/app/utils/audioUtils";

export interface HppIngredientDetail {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  item_cost?: number;
  subtotal_cost?: number;
  current_stock: number;
  min_stock?: number;
  is_low_stock?: boolean;
}

export interface HppRecipeData {
  product_name: string;
  selling_price: number;
  total_cogs: number;
  profit_margin: number;
  profit_percent: number;
  ingredients: HppIngredientDetail[];
}

interface HppDetailModalProps {
  recipe: HppRecipeData;
  onClose: () => void;
  onRestockUpdated?: () => void;
}

export default function HppDetailModal({ recipe, onClose, onRestockUpdated }: HppDetailModalProps) {
  const [ingredientsList, setIngredientsList] = useState<HppIngredientDetail[]>(recipe.ingredients);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockNotice, setRestockNotice] = useState<string | null>(null);

  const lowStockCount = ingredientsList.filter((i) => i.is_low_stock).length;

  // Handler Cepat Restok Bahan Baku Langsung dari Pop-up
  const handleQuickRestock = async (ingId: string, unit: string) => {
    setRestockingId(ingId);
    setRestockNotice(null);

    const addAmount = unit === "pcs" || unit === "porsi" ? 50 : 1000;
    try {
      const res = await restockIngredient(ingId, addAmount);
      if (res.success && res.updatedIngredient) {
        setIngredientsList((prev) =>
          prev.map((item) =>
            item.ingredient_id === ingId
              ? {
                  ...item,
                  current_stock: res.updatedIngredient!.stock,
                  is_low_stock: res.updatedIngredient!.stock <= res.updatedIngredient!.min_stock,
                }
              : item
          )
        );
        setRestockNotice(`Stok ${res.updatedIngredient.name} berhasil ditambah +${addAmount} ${unit}!`);
        if (onRestockUpdated) onRestockUpdated();
      }
    } catch (err) {
      console.error("Gagal restok bahan:", err);
    } finally {
      setRestockingId(null);
    }
  };

  const handleTestBell = () => {
    playLowStockWarningTone();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.8)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "16px",
      boxSizing: "border-box",
    }}>
      <div style={{
        background: "#141414",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "680px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
        color: "#F5F0E8",
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
      }}>
        {/* MODAL HEADER */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.02)",
        }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#D4651C", fontWeight: "800", textTransform: "uppercase" }}>
              💡 Bill of Materials (BOM) &amp; COGS Calculator
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "900", margin: "2px 0 0" }}>
              Rincian HPP: {recipe.product_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#F5F0E8",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "1.1rem",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          
          {/* BANNER BAHAN MENIPIS JIKA ADA */}
          {lowStockCount > 0 && (
            <div style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.4rem" }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: "800", color: "#EF4444", fontSize: "0.88rem" }}>
                    Perhatian: {lowStockCount} Bahan Baku Resep Ini Menipis!
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(245, 240, 232, 0.7)" }}>
                    Sisa stok berada di bawah batas aman. Lakukan restok agar operasional tidak terhenti.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestBell}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid #EF4444",
                  color: "#FFF",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                🔔 Uji Bel Peringatan
              </button>
            </div>
          )}

          {/* NOTIFIKASI RESTOK SUKSES */}
          {restockNotice && (
            <div style={{
              background: "rgba(74, 222, 128, 0.15)",
              border: "1px solid rgba(74, 222, 128, 0.3)",
              color: "#4ADE80",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "0.82rem",
              fontWeight: "700",
              marginBottom: "16px",
            }}>
              ✓ {restockNotice}
            </div>
          )}

          {/* FINANCIAL SUMMARY CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "12px" }}>
              <div style={{ fontSize: "0.7rem", color: "#AAA", fontWeight: "700", textTransform: "uppercase" }}>Harga Jual</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#FFF", marginTop: "4px" }}>
                Rp {(recipe.selling_price ?? 0).toLocaleString("id-ID")}
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "12px" }}>
              <div style={{ fontSize: "0.7rem", color: "#AAA", fontWeight: "700", textTransform: "uppercase" }}>Total HPP Modal</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#EF4444", marginTop: "4px" }}>
                Rp {(recipe.total_cogs ?? 0).toLocaleString("id-ID")}
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "12px" }}>
              <div style={{ fontSize: "0.7rem", color: "#AAA", fontWeight: "700", textTransform: "uppercase" }}>Laba Kotor (Margin)</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#4ADE80", marginTop: "4px" }}>
                + Rp {(recipe.profit_margin ?? 0).toLocaleString("id-ID")}
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "12px" }}>
              <div style={{ fontSize: "0.7rem", color: "#AAA", fontWeight: "700", textTransform: "uppercase" }}>Profit Margin</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "900", color: (recipe.profit_percent ?? 0) >= 60 ? "#4ADE80" : "#D4651C", marginTop: "4px" }}>
                {recipe.profit_percent ?? 0}%
              </div>
            </div>
          </div>

          {/* VISUAL RATIO BAR (HPP VS MARGIN PROFIT) */}
          <div style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "6px", fontWeight: "700" }}>
              <span style={{ color: "#EF4444" }}>Biaya Pokok Bahan: {100 - (recipe.profit_percent ?? 0)}%</span>
              <span style={{ color: "#4ADE80" }}>Margin Keuntungan: {recipe.profit_percent ?? 0}%</span>
            </div>
            <div style={{ height: "10px", width: "100%", background: "rgba(255, 255, 255, 0.1)", borderRadius: "100px", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${Math.min(100, Math.max(0, 100 - (recipe.profit_percent ?? 0)))}%`, background: "#EF4444" }} />
              <div style={{ width: `${Math.min(100, Math.max(0, recipe.profit_percent ?? 0))}%`, background: "#4ADE80" }} />
            </div>
            <div style={{ marginTop: "6px", fontSize: "0.74rem", color: "rgba(245, 240, 232, 0.6)" }}>
              {(recipe.profit_percent ?? 0) >= 60 ? (
                <span style={{ color: "#4ADE80", fontWeight: "700" }}>🟢 Status: Margin Sangat Sehat (Ideal untuk Bisnis Kafe &amp; Resto)</span>
              ) : (recipe.profit_percent ?? 0) >= 40 ? (
                <span style={{ color: "#F59E0B", fontWeight: "700" }}>🟡 Status: Margin Wajar / Standar Pasar</span>
              ) : (
                <span style={{ color: "#EF4444", fontWeight: "700" }}>🔴 Status: Peringatan Margin Tipis (Pertimbangkan naikkan harga jual atau optimasi takaran)</span>
              )}
            </div>
          </div>

          {/* BANNER PENJELASAN INTEGRASI REAL-TIME MODIFIER (LESS SUGAR / NO SUGAR / EXTRA) */}
          <div style={{
            background: "rgba(212, 101, 28, 0.08)",
            border: "1px solid rgba(212, 101, 28, 0.25)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "0.75rem",
            color: "rgba(245, 240, 232, 0.8)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <span style={{ fontSize: "1.1rem" }}>⚡</span>
            <div>
              <strong style={{ color: "#D4651C" }}>Kalkulasi Dinamis Pemotongan Bahan Real-Time:</strong> Saat pelanggan memesan dengan kustomisasi (seperti <em>Less Sugar 50%</em>, <em>No Sugar 0%</em>, <em>No Ice +20% Susu</em>, atau <em>+18g Extra Shot</em>), pengurangan stok bahan baku akan disesuaikan secara otomatis dan presisi.
            </div>
          </div>

          {/* TABEL RINCIAN KOMPOSISI BAHAN BAKU */}
          <div style={{ border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", fontWeight: "800", fontSize: "0.85rem" }}>
              📋 Rincian Gramasi &amp; Biaya Bahan Baku per Porsi
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#AAA" }}>
                  <th style={{ padding: "10px 14px" }}>Bahan Mentah</th>
                  <th style={{ padding: "10px 14px" }}>Takaran</th>
                  <th style={{ padding: "10px 14px" }}>Harga Beli</th>
                  <th style={{ padding: "10px 14px" }}>Biaya Bahan</th>
                  <th style={{ padding: "10px 14px" }}>Sisa Stok</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {ingredientsList.map((item, idx) => {
                  const calculatedItemCost = item.item_cost ?? (item as any).subtotal_cost ?? ((item.cost_per_unit || 0) * (item.quantity || 1));
                  const isItemLow = item.is_low_stock ?? (item.current_stock <= (item.min_stock ?? 0));
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)", background: isItemLow ? "rgba(239, 68, 68, 0.05)" : "transparent" }}>
                      <td style={{ padding: "10px 14px", fontWeight: "700", color: "#FFF" }}>
                        {item.ingredient_name}
                        {isItemLow && (
                          <span style={{ marginLeft: "6px", fontSize: "0.68rem", color: "#EF4444", fontWeight: "800", background: "rgba(239,68,68,0.15)", padding: "1px 6px", borderRadius: "4px" }}>
                            MENIPIS
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {item.quantity} {item.unit}
                      </td>
                      <td style={{ padding: "10px 14px", color: "rgba(245, 240, 232, 0.6)" }}>
                        Rp {(item.cost_per_unit ?? 0).toLocaleString("id-ID")}/{item.unit}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: "800", color: "#EF4444" }}>
                        Rp {calculatedItemCost.toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: "10px 14px", color: isItemLow ? "#EF4444" : "#4ADE80", fontWeight: "700" }}>
                        {(item.current_stock ?? 0).toLocaleString("id-ID")} {item.unit}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <button
                          onClick={() => handleQuickRestock(item.ingredient_id, item.unit)}
                          disabled={restockingId === item.ingredient_id}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: isItemLow ? "#D4651C" : "rgba(255, 255, 255, 0.08)",
                            border: "none",
                            color: "#FFF",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            cursor: restockingId === item.ingredient_id ? "not-allowed" : "pointer",
                          }}
                        >
                          {restockingId === item.ingredient_id ? "..." : `+${item.unit === "pcs" || item.unit === "porsi" ? "50" : "1k"}`}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.02)",
        }}>
          <button
            type="button"
            onClick={handleTestBell}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#F5F0E8",
              fontSize: "0.8rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🔔</span> Bunyikan Bel Stok
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              background: "#D4651C",
              border: "none",
              color: "#FFF",
              fontSize: "0.85rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
