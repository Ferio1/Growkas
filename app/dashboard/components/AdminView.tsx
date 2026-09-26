"use client";
// app/dashboard/components/AdminView.tsx — Dashboard Konsolidasi Multi-Cabang & SaaS Management khusus Admin/Owner

import { useState, useEffect } from "react";
import { getBranches, addBranch, deleteBranch, BranchItem } from "@/app/actions/branchActions";
import {
  getIngredientsAndCOGS,
  restockIngredient,
  IngredientItem,
  DeductionLog,
  resetDatabaseCleanAction,
} from "@/app/actions/ingredientActions";
import BranchManagerModal from "./BranchManagerModal";
import QRCodeGenerator from "./QRCodeGenerator";
import AiMenuScannerModal from "./AiMenuScannerModal";
import HppDetailModal, { HppRecipeData } from "./HppDetailModal";
import IngredientFormModal from "./IngredientFormModal";
import RecipeModifierEditorModal from "./RecipeModifierEditorModal";
import { playLowStockWarningTone } from "@/app/utils/audioUtils";

interface AdminViewProps {
  initialAnalytics: {
    totalRevenue: number;
    totalCount: number;
    avgOrderValue: number;
    activeBranches: number;
    branchPerformance: Array<{ name: string; revenue: number; count: number; growth: string }>;
  };
  branches?: BranchItem[];
  selectedBranchId?: string;
  onSelectBranch?: (branchId: string) => void;
  onBranchesUpdated?: (branches: BranchItem[]) => void;
}

export default function AdminView({
  initialAnalytics,
  branches: propBranches,
  selectedBranchId = "all",
  onSelectBranch,
  onBranchesUpdated,
}: AdminViewProps) {
  const [analytics] = useState(initialAnalytics);
  const [activeTab, setActiveTab] = useState<"analytics" | "qrcode" | "ingredients">("analytics");
  const [internalBranchFilter, setInternalBranchFilter] = useState<string>("all");

  const currentBranchFilter = selectedBranchId !== undefined ? selectedBranchId : internalBranchFilter;

  const handleSelectBranch = (id: string) => {
    if (onSelectBranch) {
      onSelectBranch(id);
    }
    setInternalBranchFilter(id);
  };

  // Ingredients & COGS state
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [recipesAnalysis, setRecipesAnalysis] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<IngredientItem[]>([]);
  const [recentDeductions, setRecentDeductions] = useState<DeductionLog[]>([]);
  const [selectedHppRecipe, setSelectedHppRecipe] = useState<HppRecipeData | null>(null);
  
  // Modals state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [ingredientToEdit, setIngredientToEdit] = useState<IngredientItem | null>(null);
  const [selectedRecipeForModifier, setSelectedRecipeForModifier] = useState<any | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetZeroIngredients, setResetZeroIngredients] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState<string | null>(null);

  // Modal Konfirmasi Hapus Cabang
  const [branchToDelete, setBranchToDelete] = useState<BranchItem | null>(null);
  const [isDeletingBranch, setIsDeletingBranch] = useState(false);

  // Dynamic Branches State
  const [localBranches, setLocalBranches] = useState<BranchItem[]>([]);
  const branches = propBranches && propBranches.length > 0 ? propBranches : localBranches;

  const loadIngredients = async () => {
    const res = await getIngredientsAndCOGS();
    if (res.success) {
      setIngredients(res.ingredients);
      setRecipesAnalysis(res.recipesAnalysis);
      setLowStockAlerts(res.lowStockAlerts);
      if (res.recentDeductions) {
        setRecentDeductions(res.recentDeductions);
      }
    }
  };

  const handleExecuteResetDatabase = async () => {
    setIsResetting(true);
    try {
      const res = await resetDatabaseCleanAction({ resetIngredientsToZero: resetZeroIngredients });
      if (res.success) {
        await loadIngredients();
        setIsResetConfirmOpen(false);
        setResetSuccessToast(
          resetZeroIngredients
            ? "Database bersih berhasil direset! Seluruh stok bahan baku kini bernilai 0 siap diinput manual."
            : "Database bersih berhasil direset! Riwayat order & transaksi telah dikosongkan."
        );
        setTimeout(() => setResetSuccessToast(null), 4500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    async function loadBranches() {
      const res = await getBranches();
      if (res.branches && res.branches.length > 0) {
        setLocalBranches(res.branches);
        if (onBranchesUpdated) {
          onBranchesUpdated(res.branches);
        }
      }
    }
    loadBranches();
    loadIngredients();

    // Auto-polling setiap 3 detik untuk pembaruan instan pengurangan stok bahan baku dari pesanan Kasir POS / QR Meja
    const interval = setInterval(() => {
      loadIngredients();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRestock = async (id: string, amount: number) => {
    const res = await restockIngredient(id, amount);
    if (res.success) {
      await loadIngredients();
    }
  };

  const handleBranchAdded = (newBranch: BranchItem) => {
    setLocalBranches((prev) => {
      const updated = [...prev.filter((b) => b.id !== newBranch.id), newBranch];
      if (onBranchesUpdated) {
        onBranchesUpdated(updated);
      }
      return updated;
    });
  };

  const handleBranchDeleted = async (branchId: string) => {
    const res = await deleteBranch(branchId);
    if (res.success) {
      setLocalBranches((prev) => {
        const updated = prev.filter((b) => b.id !== branchId);
        if (onBranchesUpdated) {
          onBranchesUpdated(updated);
        }
        return updated;
      });
      if (currentBranchFilter === branchId) {
        handleSelectBranch("all");
      }
    }
  };

  const confirmDeleteBranch = async () => {
    if (!branchToDelete) return;
    if (branchToDelete.id === "br-1") {
      alert("Outlet utama pusat (Saray Coffee & Space) tidak dapat dihapus.");
      setBranchToDelete(null);
      return;
    }
    setIsDeletingBranch(true);
    try {
      await handleBranchDeleted(branchToDelete.id);
      setResetSuccessToast(`Outlet "${branchToDelete.name} (${branchToDelete.city})" berhasil dihapus.`);
      setTimeout(() => setResetSuccessToast(null), 4000);
      setBranchToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingBranch(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* HEADER & QUICK ACTIONS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span style={{ fontSize: "0.72rem", color: "#D4651C", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
            Growkas All-in-One White-Label SaaS
          </span>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "900", margin: "2px 0 4px" }}>
            Dashboard Konsolidasi &amp; Admin Panel
          </h1>
          <p style={{ color: "rgba(245,240,232,0.5)", fontSize: "0.85rem", margin: 0 }}>
            Ringkasan omzet terpusat, manajemen outlet mandiri, dan pencetakan QR Code Meja.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setIsAddBranchModalOpen(true)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: "rgba(212,101,28,0.15)",
              color: "#D4651C",
              border: "1px solid rgba(212,101,28,0.4)",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🏪</span> + Tambah Outlet Baru
          </button>

          <button
            onClick={() => setIsAddProductModalOpen(true)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: "#D4651C",
              color: "#FFF",
              border: "none",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 14px rgba(212,101,28,0.4)",
            }}
          >
            <span>✨</span> + Scan &amp; Tambah Produk (AI)
          </button>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS (ANALYTICS VS QR CODE GENERATOR) */}
      <div style={{
        display: "flex", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px",
      }}>
        <button
          onClick={() => setActiveTab("analytics")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: activeTab === "analytics" ? "rgba(212,101,28,0.2)" : "transparent",
            border: "1px solid " + (activeTab === "analytics" ? "#D4651C" : "transparent"),
            color: activeTab === "analytics" ? "#D4651C" : "rgba(245,240,232,0.6)",
            fontWeight: "800",
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>📊</span> Performa Omzet &amp; Analytics
        </button>

        <button
          onClick={() => setActiveTab("qrcode")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: activeTab === "qrcode" ? "rgba(212,101,28,0.2)" : "transparent",
            border: "1px solid " + (activeTab === "qrcode" ? "#D4651C" : "transparent"),
            color: activeTab === "qrcode" ? "#D4651C" : "rgba(245,240,232,0.6)",
            fontWeight: "800",
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>📱</span> Generator Stiker QR Code Meja
        </button>

        <button
          onClick={() => setActiveTab("ingredients")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: activeTab === "ingredients" ? "rgba(212,101,28,0.2)" : "transparent",
            border: "1px solid " + (activeTab === "ingredients" ? "#D4651C" : "transparent"),
            color: activeTab === "ingredients" ? "#D4651C" : "rgba(245,240,232,0.6)",
            fontWeight: "800",
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>☕</span> Bahan Baku &amp; HPP (COGS)
          {lowStockAlerts.length > 0 && (
            <span style={{
              background: "#EF4444",
              color: "#FFF",
              fontSize: "0.7rem",
              fontWeight: "900",
              padding: "2px 6px",
              borderRadius: "10px",
            }}>
              {lowStockAlerts.length} Menipis
            </span>
          )}
        </button>
      </div>

      {/* KONTEN TAB 1: PERFORMA OMZET & ANALYTICS */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Filter Branch Tabs */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", alignItems: "center" }}>
            <button
              onClick={() => handleSelectBranch("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                background: currentBranchFilter === "all" ? "rgba(212,101,28,0.2)" : "rgba(255,255,255,0.03)",
                border: "1px solid " + (currentBranchFilter === "all" ? "#D4651C" : "rgba(255,255,255,0.06)"),
                color: currentBranchFilter === "all" ? "#D4651C" : "rgba(245,240,232,0.5)",
                fontWeight: "700",
                fontSize: "0.82rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              🌐 Semua Outlet ({branches.length})
            </button>
            {branches.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: currentBranchFilter === b.id ? "rgba(212,101,28,0.2)" : "rgba(255,255,255,0.03)",
                  border: "1px solid " + (currentBranchFilter === b.id ? "#D4651C" : "rgba(255,255,255,0.06)"),
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => handleSelectBranch(b.id)}
                  style={{
                    padding: "6px 12px",
                    background: "transparent",
                    border: "none",
                    color: currentBranchFilter === b.id ? "#D4651C" : "rgba(245,240,232,0.5)",
                    fontWeight: "700",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  🏪 {b.name} ({b.city})
                </button>
                {branches.length > 1 && b.id !== "br-5" && (
                  <button
                    type="button"
                    title={`Hapus cabang ${b.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setBranchToDelete(b);
                    }}
                    style={{
                      padding: "6px 8px",
                      background: "transparent",
                      border: "none",
                      borderLeft: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(239,68,68,0.7)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(239,68,68,0.7)")}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}

            {/* Tombol Hapus Cepat Cabang Aktif Terpilih */}
            {branches.length > 1 && currentBranchFilter !== "all" && currentBranchFilter !== "br-5" && (
              (() => {
                const curB = branches.find((b) => b.id === currentBranchFilter);
                if (!curB) return null;
                return (
                  <button
                    onClick={() => setBranchToDelete(curB)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "rgba(239,68,68,0.15)",
                      border: "1px solid rgba(239,68,68,0.4)",
                      color: "#EF4444",
                      fontWeight: "700",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      whiteSpace: "nowrap",
                      marginLeft: "4px",
                    }}
                  >
                    <span>🗑️</span> Hapus Outlet Ini
                  </button>
                );
              })()
            )}
          </div>

          {/* KPI SUMMARY CARDS */}
          {(() => {
            const activeBranchObj = branches.find((b) => b.id === currentBranchFilter);
            const activeBranchPerf = activeBranchObj
              ? analytics.branchPerformance.find(
                  (bp) =>
                    bp.name.toLowerCase().includes(activeBranchObj.name.toLowerCase()) ||
                    bp.name.toLowerCase().includes(activeBranchObj.city.toLowerCase())
                )
              : null;

            const displayedRevenue = currentBranchFilter === "all"
              ? analytics.totalRevenue
              : activeBranchPerf?.revenue || Math.round(analytics.totalRevenue / Math.max(branches.length, 1));

            const displayedCount = currentBranchFilter === "all"
              ? analytics.totalCount
              : activeBranchPerf?.count || Math.max(1, Math.round(analytics.totalCount / Math.max(branches.length, 1)));

            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                    {currentBranchFilter === "all" ? "Total Omzet Gabungan" : `Omzet — ${activeBranchObj?.name}`}
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#D4651C", marginBottom: "6px" }}>
                    Rp {displayedRevenue.toLocaleString("id-ID")}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#4ade80" }}>
                    {currentBranchFilter === "all"
                      ? "▲ +12% dibanding minggu lalu"
                      : `Target Bulanan: Rp ${(activeBranchObj?.target_revenue || 10000000).toLocaleString("id-ID")}`}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                    {currentBranchFilter === "all" ? "Total Transaksi" : `Transaksi — ${activeBranchObj?.name}`}
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#F5F0E8", marginBottom: "6px" }}>
                    {displayedCount} transaksi
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)" }}>
                    {currentBranchFilter === "all" ? "Rata-rata 41 transaksi / hari" : "Tersinkron operasional kasir"}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                    Rata-rata Order Value
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#F5F0E8", marginBottom: "6px" }}>
                    Rp {analytics.avgOrderValue.toLocaleString("id-ID")}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)" }}>
                    Per transaksi belanja
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                    Outlet Terdaftar
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#F5F0E8", marginBottom: "6px" }}>
                    {branches.length} Cabang
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#4ade80" }}>
                    ● Tersinkron Real-time
                  </div>
                </div>
              </div>
            );
          })()}

          {/* PERBANDINGAN PERFORMA CABANG */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", width: "100%", boxSizing: "border-box" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "4px" }}>
                Perbandingan Kinerja Antar Cabang (Benchmarking)
              </h2>
              <p style={{ color: "rgba(245,240,232,0.5)", fontSize: "0.82rem", marginBottom: "20px" }}>
                Peringkat dan persentase kontribusi omzet masing-masing outlet terhadap total omzet gabungan.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {analytics.branchPerformance.map((b, idx) => {
                  const percentage = Math.round((b.revenue / analytics.totalRevenue) * 100);
                  const matchedBranch = branches.find(
                    (br) =>
                      b.name.toLowerCase().includes(br.name.toLowerCase()) ||
                      b.name.toLowerCase().includes(br.city.toLowerCase())
                  );
                  return (
                    <div key={b.name} style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{
                            background: idx === 0 ? "#D4651C" : "rgba(255,255,255,0.1)",
                            color: "#FFF", fontWeight: "bold", width: "24px", height: "24px", borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem",
                          }}>
                            #{idx + 1}
                          </span>
                          <strong style={{ fontSize: "0.95rem" }}>{b.name}</strong>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontWeight: "800", color: "#D4651C" }}>
                              Rp {b.revenue.toLocaleString("id-ID")}
                            </span>
                            <span style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", marginLeft: "8px" }}>
                              ({b.count} transaksi)
                            </span>
                          </div>
                          {matchedBranch && branches.length > 1 && matchedBranch.id !== "br-5" && (
                            <button
                              type="button"
                              title={`Hapus cabang ${matchedBranch.name}`}
                              onClick={() => setBranchToDelete(matchedBranch)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                background: "rgba(239,68,68,0.15)",
                                border: "1px solid rgba(239,68,68,0.3)",
                                color: "#EF4444",
                                fontSize: "0.72rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <span>🗑️</span> Hapus
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${percentage}%`, height: "100%", background: "#D4651C", borderRadius: "4px", transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>
                  Produk Terlaris
                </h2>
                <span style={{
                  fontSize: "0.72rem",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background: (currentBranchFilter === "br-5" || branches.find((b) => b.id === currentBranchFilter)?.name.toLowerCase().includes("7co"))
                    ? "rgba(168,85,247,0.2)"
                    : "rgba(212,101,28,0.2)",
                  color: (currentBranchFilter === "br-5" || branches.find((b) => b.id === currentBranchFilter)?.name.toLowerCase().includes("7co"))
                    ? "#C084FC"
                    : "#D4651C",
                  fontWeight: "700",
                }}>
                  {(currentBranchFilter === "br-5" || branches.find((b) => b.id === currentBranchFilter)?.name.toLowerCase().includes("7co"))
                    ? "⚡ Outlet 7co"
                    : currentBranchFilter === "all"
                    ? "🌐 Konsolidasi"
                    : "☕ Saray Coffee"}
                </span>
              </div>
              <p style={{ color: "rgba(245,240,232,0.5)", fontSize: "0.82rem", marginBottom: "20px" }}>
                {(currentBranchFilter === "br-5" || branches.find((b) => b.id === currentBranchFilter)?.name.toLowerCase().includes("7co"))
                  ? "Menu specialty dengan volume penjualan tertinggi di outlet 7co (Yogyakarta)."
                  : currentBranchFilter === "all"
                  ? "Menu dengan volume penjualan tertinggi di seluruh cabang."
                  : "Menu dengan volume penjualan tertinggi di Saray Coffee & Space (Yogyakarta)."}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {((currentBranchFilter === "br-5" || branches.find((b) => b.id === currentBranchFilter)?.name.toLowerCase().includes("7co"))
                  ? [
                      { name: "7co Signature Caramel Macchiato", category: "Kopi & Espresso", sold: 112, revenue: 3136000 },
                      { name: "7co Smash Beef Burger Deluxe", category: "Makanan Utama", sold: 85, revenue: 3060000 },
                      { name: "7co Kopi Susu Creamy Brown Sugar", category: "Kopi & Espresso", sold: 78, revenue: 1794000 },
                      { name: "7co Croffle Brown Sugar & Ice Cream", category: "Pastry & Snack", sold: 64, revenue: 1664000 },
                    ]
                  : [
                      { name: "Saray Signature Palm Sugar", category: "Kopi & Espresso", sold: 128, revenue: 2816000 },
                      { name: "Rice Bowl Ayam Sambal Matah", category: "Makanan Utama", sold: 94, revenue: 2632000 },
                      { name: "Signature Matcha Latte", category: "Non-Coffee & Mocktail", sold: 76, revenue: 1900000 },
                      { name: "Croissant Almond Saray", category: "Pastry & Snack", sold: 62, revenue: 1674000 },
                    ]
                ).map((p, idx) => (
                  <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: "700" }}>{idx + 1}. {p.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(245,240,232,0.4)" }}>{p.category} • {p.sold} terjual</div>
                    </div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#D4651C" }}>
                      Rp {p.revenue.toLocaleString("id-ID")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* KONTEN TAB 2: GENERATOR STIKER QR CODE MEJA */}
      {activeTab === "qrcode" && (
        <QRCodeGenerator branches={branches} />
      )}

      {/* KONTEN TAB 3: BAHAN BAKU & HPP (COGS / RECIPE MANAGEMENT) */}
      {activeTab === "ingredients" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* ALERT BANNER JIKA ADA BAHAN MENIPIS */}
          {lowStockAlerts.length > 0 && (
            <div style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.5rem" }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: "800", color: "#EF4444", fontSize: "0.95rem" }}>
                    Peringatan: {lowStockAlerts.length} Bahan Baku Menipis di Bawah Batas Minimum!
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(245,240,232,0.7)" }}>
                    {lowStockAlerts.map((i) => `${i.name} (${i.stock} ${i.unit})`).join(", ")}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => playLowStockWarningTone()}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "rgba(239,68,68,0.25)",
                  border: "1px solid #EF4444",
                  color: "#FFF",
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <span>🔔</span> Bunyikan Bel Stok
              </button>
            </div>
          )}

          {/* SUMMARY METRICS ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "0.75rem", color: "#AAA", textTransform: "uppercase", fontWeight: "bold" }}>Total Master Bahan</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "#FFF", marginTop: "4px" }}>
                {ingredients.length} Jenis
              </div>
              <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>Kopi, Susu, Sirup, Makanan, Kemasan</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "0.75rem", color: "#AAA", textTransform: "uppercase", fontWeight: "bold" }}>Stok Perlu Restok</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "900", color: lowStockAlerts.length > 0 ? "#EF4444" : "#4ADE80", marginTop: "4px" }}>
                {lowStockAlerts.length} Bahan
              </div>
              <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>
                {lowStockAlerts.length > 0 ? "Segera lakukan pembelian bahan" : "Seluruh stok di atas batas minimum"}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "0.75rem", color: "#AAA", textTransform: "uppercase", fontWeight: "bold" }}>Rata-Rata Margin Menu</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "#D4651C", marginTop: "4px" }}>
                {recipesAnalysis.length > 0
                  ? Math.round(recipesAnalysis.reduce((acc, r) => acc + r.profit_percent, 0) / recipesAnalysis.length)
                  : 0}%
              </div>
              <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>Persentase laba kotor di atas HPP</div>
            </div>
          </div>

          {/* WIDGET LOG PEMAKAIAN BAHAN BAKU REAL-TIME */}
          <div style={{
            background: "linear-gradient(135deg, rgba(212,101,28,0.08) 0%, rgba(26,26,26,0.95) 100%)",
            border: "1px solid rgba(212,101,28,0.3)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0, color: "#FFF" }}>
                    ⚡ Log Pemakaian &amp; Pengurangan Bahan Baku Real-Time
                  </h3>
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: "800",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: "rgba(74,222,128,0.15)",
                    color: "#4ADE80",
                    border: "1px solid rgba(74,222,128,0.3)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ADE80" }}></span>
                    Auto-Sync (3s)
                  </span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#AAA", margin: "4px 0 0" }}>
                  Audit trail otomatis: Setiap transaksi dari Kasir POS atau QR Meja langsung memotong stok bahan mentah (HPP Bill of Materials).
                </p>
              </div>
            </div>

            {recentDeductions.length === 0 ? (
              <div style={{
                padding: "24px",
                textAlign: "center",
                background: "rgba(0,0,0,0.2)",
                borderRadius: "12px",
                border: "1px dashed rgba(255,255,255,0.1)",
                color: "#888",
                fontSize: "0.82rem"
              }}>
                📦 Belum ada transaksi baru yang memotong bahan baku. Lakukan order di Kasir POS atau QR Meja untuk melihat pemakaian bahan otomatis.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recentDeductions.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    style={{
                      background: "rgba(0,0,0,0.35)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          fontFamily: "monospace",
                          fontWeight: "800",
                          fontSize: "0.75rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "rgba(212,101,28,0.2)",
                          color: "#D4651C",
                          border: "1px solid rgba(212,101,28,0.4)"
                        }}>
                          {log.invoice_number ? `#${log.invoice_number.replace("#", "")}` : "#ORDER"}
                        </span>
                        <span style={{ fontWeight: "800", color: "#FFF", fontSize: "0.9rem" }}>
                          {log.product_name}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#888" }}>
                        🕒 {log.timestamp}
                      </span>
                    </div>

                    {log.modifiers_summary && (
                      <div style={{ fontSize: "0.74rem", color: "#F97316", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ background: "rgba(249,115,22,0.15)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(249,115,22,0.3)", fontWeight: "800" }}>
                          🎯 Modifikasi:
                        </span>
                        <span style={{ color: "rgba(245,240,232,0.85)" }}>{log.modifiers_summary}</span>
                      </div>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                      {log.deductions.map((d, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: "0.74rem",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: d.remaining <= 0
                              ? "rgba(239,68,68,0.2)"
                              : d.is_low_stock
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(255,255,255,0.05)",
                            border: d.remaining <= 0
                              ? "1px solid rgba(239,68,68,0.4)"
                              : d.is_low_stock
                              ? "1px solid rgba(245,158,11,0.3)"
                              : "1px solid rgba(255,255,255,0.08)",
                            color: d.remaining <= 0
                              ? "#FF6B6B"
                              : d.is_low_stock
                              ? "#FBBF24"
                              : "#DDD",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap"
                          }}
                        >
                          <span style={{ fontWeight: "800", color: "#EF4444" }}>
                            -{d.amount.toLocaleString("id-ID")} {d.unit}
                          </span>
                          <span>{d.ingredient_name}</span>
                          {d.modifier_note && (
                            <span style={{
                              background: "rgba(212,101,28,0.25)",
                              color: "#F97316",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontSize: "0.68rem",
                              fontWeight: "800",
                              border: "1px solid rgba(212,101,28,0.4)"
                            }}>
                              ⚡ {d.modifier_note}
                            </span>
                          )}
                          <span style={{ color: "#AAA", fontSize: "0.7rem" }}>
                            (Sisa: {d.remaining.toLocaleString("id-ID")} {d.unit}
                            {d.remaining <= 0 ? " 🔴 HABIS" : d.is_low_stock ? " ⚠️ MENIPIS" : ""})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TABEL 1: MASTER INVENTARIS BAHAN BAKU */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>
                  📦 Master Inventaris Bahan Baku Mentah
                </h3>
                <p style={{ fontSize: "0.78rem", color: "#888", margin: "2px 0 0" }}>
                  Stok otomatis berkurang secara real-time setiap kali menu F&amp;B terjual di kasir atau via QR Meja.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIngredientToEdit(null);
                    setIsIngredientModalOpen(true);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "#D4651C",
                    border: "none",
                    color: "#FFF",
                    fontSize: "0.82rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>➕</span> Input Bahan Baku Baru
                </button>

                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#FF6B6B",
                    fontSize: "0.82rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🗑️</span> Reset Database Bersih
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#AAA" }}>
                    <th style={{ padding: "10px 12px" }}>Bahan Baku</th>
                    <th style={{ padding: "10px 12px" }}>Kategori</th>
                    <th style={{ padding: "10px 12px" }}>Stok Fisik</th>
                    <th style={{ padding: "10px 12px" }}>Min. Stok</th>
                    <th style={{ padding: "10px 12px" }}>Harga Beli / Satuan</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Aksi Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing) => {
                    const isOut = ing.stock <= 0;
                    const isLow = ing.stock <= ing.min_stock;
                    return (
                      <tr key={ing.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "12px", fontWeight: "700", color: "#FFF" }}>{ing.name}</td>
                        <td style={{ padding: "12px", color: "#AAA" }}>{ing.category.toUpperCase()}</td>
                        <td style={{ padding: "12px", fontWeight: "800", color: isOut ? "#EF4444" : isLow ? "#F59E0B" : "#4ADE80" }}>
                          {ing.stock.toLocaleString("id-ID")} {ing.unit}
                        </td>
                        <td style={{ padding: "12px", color: "#888" }}>{ing.min_stock.toLocaleString("id-ID")} {ing.unit}</td>
                        <td style={{ padding: "12px" }}>Rp {ing.cost_per_unit.toLocaleString("id-ID")} / {ing.unit}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            fontSize: "0.72rem",
                            fontWeight: "800",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: isOut ? "rgba(239,68,68,0.25)" : isLow ? "rgba(245,158,11,0.2)" : "rgba(74,222,128,0.15)",
                            color: isOut ? "#FF4D4D" : isLow ? "#F59E0B" : "#4ADE80",
                            border: isOut ? "1px solid rgba(239,68,68,0.4)" : isLow ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(74,222,128,0.3)",
                          }}>
                            {isOut ? "🔴 STOK HABIS" : isLow ? "⚠️ Menipis" : "✅ Aman"}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setIngredientToEdit(ing);
                                setIsIngredientModalOpen(true);
                              }}
                              title="Set / Edit Stok Fisik Manual"
                              style={{
                                padding: "5px 10px",
                                borderRadius: "6px",
                                background: "rgba(255, 255, 255, 0.08)",
                                color: "#FFF",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span>✏️</span> Set Stok
                            </button>
                            <button
                              onClick={() => handleRestock(ing.id, ing.unit === "pcs" || ing.unit === "porsi" ? 50 : 1000)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "6px",
                                background: "rgba(212,101,28,0.15)",
                                color: "#D4651C",
                                border: "1px solid rgba(212,101,28,0.3)",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              + {ing.unit === "pcs" || ing.unit === "porsi" ? "50 " + ing.unit : "1.000 " + ing.unit}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL 2: ANALISIS HPP RESEP MENU (BILL OF MATERIALS) */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>
                  💡 Analisis Resep Menu &amp; HPP (Harga Pokok Penjualan)
                </h3>
                <p style={{ fontSize: "0.78rem", color: "#888", margin: "2px 0 0" }}>
                  Dihitung dari total biaya bahan baku mentah per porsi untuk mengetahui margin profit bersih pemilik usaha.
                </p>
              </div>
              <span style={{
                fontSize: "0.76rem",
                padding: "4px 10px",
                borderRadius: "6px",
                background: (currentBranchFilter === "br-5" || branches.find((b) => b.id === currentBranchFilter)?.name.toLowerCase().includes("7co"))
                  ? "rgba(168,85,247,0.2)"
                  : "rgba(212,101,28,0.2)",
                color: (currentBranchFilter === "br-5" || branches.find((b) => b.id === currentBranchFilter)?.name.toLowerCase().includes("7co"))
                  ? "#C084FC"
                  : "#FB923C",
                fontWeight: "700",
                border: (currentBranchFilter === "br-5" || branches.find((b) => b.id === currentBranchFilter)?.name.toLowerCase().includes("7co"))
                  ? "1px solid rgba(168,85,247,0.4)"
                  : "1px solid rgba(212,101,28,0.4)"
              }}>
                {(currentBranchFilter === "br-5" || branches.find((b) => b.id === currentBranchFilter)?.name.toLowerCase().includes("7co"))
                  ? "⚡ Filter: Resep Menu 7co"
                  : currentBranchFilter === "all"
                  ? "🌐 Filter: Semua Resep Cabang"
                  : "☕ Filter: Resep Saray Coffee"}
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#AAA" }}>
                    <th style={{ padding: "10px 12px" }}>Nama Menu</th>
                    <th style={{ padding: "10px 12px" }}>Harga Jual</th>
                    <th style={{ padding: "10px 12px" }}>Komposisi Resep Bahan Baku</th>
                    <th style={{ padding: "10px 12px" }}>Total HPP</th>
                    <th style={{ padding: "10px 12px" }}>Margin Bersih</th>
                    <th style={{ padding: "10px 12px" }}>Profit %</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Aksi Rincian</th>
                  </tr>
                </thead>
                <tbody>
                  {recipesAnalysis
                    .filter((item) => {
                      if (!currentBranchFilter || currentBranchFilter === "all") return true;
                      const is7coFilter = currentBranchFilter === "br-5" || branches.find((b) => b.id === currentBranchFilter)?.name.toLowerCase().includes("7co");
                      const itemIs7co = item.branch_id === "br-5" || item.product_name.toLowerCase().includes("7co");
                      return is7coFilter ? itemIs7co : !itemIs7co;
                    })
                    .map((item, idx) => {
                      const is7coRecipe = item.branch_id === "br-5" || item.product_name.toLowerCase().includes("7co");
                      return (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px", fontWeight: "800", color: "#FFF" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{item.product_name}</span>
                          <span style={{
                            fontSize: "0.68rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "800",
                            background: is7coRecipe ? "rgba(168,85,247,0.2)" : "rgba(212,101,28,0.2)",
                            color: is7coRecipe ? "#C084FC" : "#FB923C",
                            border: is7coRecipe ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(212,101,28,0.4)",
                          }}>
                            {is7coRecipe ? "⚡ 7co" : "☕ Saray"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px", fontWeight: "700" }}>Rp {item.selling_price.toLocaleString("id-ID")}</td>
                      <td style={{ padding: "12px", fontSize: "0.78rem", color: "#AAA" }}>
                        {item.ingredients.map((ing: any) => `${ing.ingredient_name} (${ing.quantity} ${ing.unit})`).join(" • ")}
                      </td>
                      <td style={{ padding: "12px", fontWeight: "800", color: "#EF4444" }}>
                        Rp {item.total_cogs.toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: "12px", fontWeight: "800", color: "#4ADE80" }}>
                        + Rp {item.profit_margin.toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          fontSize: "0.75rem",
                          fontWeight: "900",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: item.profit_percent >= 60 ? "rgba(74,222,128,0.15)" : "rgba(212,101,28,0.15)",
                          color: item.profit_percent >= 60 ? "#4ADE80" : "#D4651C",
                        }}>
                          {item.profit_percent}%
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedRecipeForModifier(item)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: "rgba(56, 189, 248, 0.15)",
                              border: "1px solid rgba(56, 189, 248, 0.35)",
                              color: "#38BDF8",
                              fontSize: "0.78rem",
                              fontWeight: "800",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>⚙️</span> Atur Resep &amp; Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedHppRecipe(item)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: "rgba(212,101,28,0.15)",
                              border: "1px solid rgba(212,101,28,0.35)",
                              color: "#D4651C",
                              fontSize: "0.78rem",
                              fontWeight: "800",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>🔍</span> Pop-up HPP
                          </button>
                        </div>
                      </td>
                    </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS CABANG */}
      {branchToDelete && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", color: "#F5F0E8", fontFamily: "system-ui, sans-serif"
        }}>
          <div style={{
            background: "#1C1917", border: "1.5px solid #EF4444", borderRadius: "18px", width: "100%", maxWidth: "440px", padding: "24px", boxShadow: "0 25px 60px rgba(239, 68, 68, 0.25)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "2rem" }}>🗑️</span>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "900", margin: 0, color: "#EF4444" }}>Hapus Cabang / Outlet?</h3>
                <p style={{ fontSize: "0.82rem", color: "rgba(245,240,232,0.6)", margin: "2px 0 0" }}>Tindakan ini akan menghapus cabang secara permanen dari sistem.</p>
              </div>
            </div>

            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#F5F0E8", marginBottom: "4px" }}>
                🏪 {branchToDelete.name} ({branchToDelete.city})
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.6)" }}>
                Alamat: {branchToDelete.address || "Tidak dicantumkan"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setBranchToDelete(null)}
                disabled={isDeletingBranch}
                style={{ padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", color: "#F5F0E8", border: "none", fontWeight: "700", cursor: "pointer" }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteBranch}
                disabled={isDeletingBranch}
                style={{ padding: "10px", borderRadius: "10px", background: "#EF4444", color: "#FFF", border: "none", fontWeight: "800", cursor: "pointer" }}
              >
                {isDeletingBranch ? "Menghapus..." : "Ya, Hapus Cabang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH & MANAJEMEN OUTLET */}
      {isAddBranchModalOpen && (
        <BranchManagerModal
          branches={branches}
          onClose={() => setIsAddBranchModalOpen(false)}
          onBranchAdded={handleBranchAdded}
          onBranchDeleted={handleBranchDeleted}
        />
      )}

      {/* MODAL AI SCAN & TAMBAH PRODUK BARU */}
      {isAddProductModalOpen && (
        <AiMenuScannerModal
          onClose={() => setIsAddProductModalOpen(false)}
          onProductsImported={() => {
            // Optional callback
          }}
        />
      )}

      {/* MODAL POP-UP DETAIL HPP & COGS */}
      {selectedHppRecipe && (
        <HppDetailModal
          recipe={selectedHppRecipe}
          onClose={() => setSelectedHppRecipe(null)}
          onRestockUpdated={loadIngredients}
        />
      )}

      {/* MODAL INPUT & EDIT STOK BAHAN BAKU MANUAL */}
      {isIngredientModalOpen && (
        <IngredientFormModal
          ingredientToEdit={ingredientToEdit}
          onClose={() => {
            setIsIngredientModalOpen(false);
            setIngredientToEdit(null);
          }}
          onSuccess={loadIngredients}
        />
      )}

      {/* MODAL ATUR RESEP & TAKARAN MODIFIER (SUGAR, ICE, SPICY) */}
      {selectedRecipeForModifier && (
        <RecipeModifierEditorModal
          recipe={selectedRecipeForModifier}
          allIngredients={ingredients}
          onClose={() => setSelectedRecipeForModifier(null)}
          onSuccess={loadIngredients}
        />
      )}

      {/* DIALOG KONFIRMASI RESET DATABASE BERSIH */}
      {isResetConfirmOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#181818",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "18px",
              maxWidth: "480px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9)",
              color: "#FFF",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⚠️</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "900", margin: "0 0 8px", color: "#FF6B6B" }}>
              Konfirmasi Reset Database Bersih
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#BBB", lineHeight: 1.5, margin: "0 0 16px" }}>
              Tindakan ini akan mengosongkan seluruh riwayat pesanan (transactions), antrean dapur (KDS), dan log pemotongan bahan baku (#INV) ke kondisi bersih (kosongan).
            </p>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "20px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={resetZeroIngredients}
                onChange={(e) => setResetZeroIngredients(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "#D4651C" }}
              />
              <span style={{ fontSize: "0.82rem", color: "#EEE", fontWeight: "600" }}>
                Kosongkan juga seluruh stok fisik bahan baku menjadi 0 (untuk input stok fisik manual dari nol)
              </span>
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={isResetting}
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
                type="button"
                onClick={handleExecuteResetDatabase}
                disabled={isResetting}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  background: "#EF4444",
                  border: "none",
                  color: "#FFF",
                  fontSize: "0.85rem",
                  fontWeight: "800",
                  cursor: isResetting ? "not-allowed" : "pointer",
                }}
              >
                {isResetting ? "Mereset..." : "Ya, Kosongkan Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFIKASI SUKSES RESET */}
      {resetSuccessToast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "rgba(74, 222, 128, 0.95)",
            color: "#064E3B",
            padding: "14px 20px",
            borderRadius: "12px",
            fontWeight: "800",
            fontSize: "0.85rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            zIndex: 10001,
          }}
        >
          ✓ {resetSuccessToast}
        </div>
      )}

    </div>
  );
}
