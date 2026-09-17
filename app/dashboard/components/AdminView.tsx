"use client";
// app/dashboard/components/AdminView.tsx — Dashboard Konsolidasi Multi-Cabang & SaaS Management khusus Admin/Owner

import { useState, useEffect } from "react";
import { getBranches, BranchItem } from "@/app/actions/branchActions";
import BranchManagerModal from "./BranchManagerModal";
import QRCodeGenerator from "./QRCodeGenerator";
import AiMenuScannerModal from "./AiMenuScannerModal";

interface AdminViewProps {
  initialAnalytics: {
    totalRevenue: number;
    totalCount: number;
    avgOrderValue: number;
    activeBranches: number;
    branchPerformance: Array<{ name: string; revenue: number; count: number; growth: string }>;
  };
}

export default function AdminView({ initialAnalytics }: AdminViewProps) {
  const [analytics] = useState(initialAnalytics);
  const [activeTab, setActiveTab] = useState<"analytics" | "qrcode">("analytics");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  
  // Modals state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);

  // Dynamic Branches State
  const [branches, setBranches] = useState<BranchItem[]>([
    { id: "br-1", name: "Saray Coffee & Space", city: "Yogyakarta", target_revenue: 10000000 },
  ]);

  useEffect(() => {
    async function loadBranches() {
      const res = await getBranches();
      if (res.branches && res.branches.length > 0) {
        setBranches(res.branches);
      }
    }
    loadBranches();
  }, []);

  const handleBranchAdded = (newBranch: BranchItem) => {
    setBranches((prev) => [...prev, newBranch]);
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
      </div>

      {/* KONTEN TAB 1: PERFORMA OMZET & ANALYTICS */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Filter Branch Tabs */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            <button
              onClick={() => setSelectedBranchFilter("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                background: selectedBranchFilter === "all" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                border: "1px solid " + (selectedBranchFilter === "all" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)"),
                color: selectedBranchFilter === "all" ? "#FFF" : "rgba(245,240,232,0.5)",
                fontWeight: "700",
                fontSize: "0.82rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              🌐 Semua Outlet ({branches.length})
            </button>
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBranchFilter(b.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  background: selectedBranchFilter === b.id ? "rgba(212,101,28,0.2)" : "rgba(255,255,255,0.03)",
                  border: "1px solid " + (selectedBranchFilter === b.id ? "#D4651C" : "rgba(255,255,255,0.06)"),
                  color: selectedBranchFilter === b.id ? "#D4651C" : "rgba(245,240,232,0.5)",
                  fontWeight: "700",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                🏪 {b.name} ({b.city})
              </button>
            ))}
          </div>

          {/* KPI SUMMARY CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                Total Omzet Gabungan
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#D4651C", marginBottom: "6px" }}>
                Rp {analytics.totalRevenue.toLocaleString("id-ID")}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#4ade80" }}>
                ▲ +12% dibanding minggu lalu
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                Total Transaksi
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#F5F0E8", marginBottom: "6px" }}>
                {analytics.totalCount} transaksi
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)" }}>
                Rata-rata 41 transaksi / hari
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

                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontWeight: "800", color: "#D4651C" }}>
                            Rp {b.revenue.toLocaleString("id-ID")}
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", marginLeft: "8px" }}>
                            ({b.count} transaksi)
                          </span>
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
              <h2 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "4px" }}>
                Produk Terlaris
              </h2>
              <p style={{ color: "rgba(245,240,232,0.5)", fontSize: "0.82rem", marginBottom: "20px" }}>
                Menu dengan volume penjualan tertinggi di seluruh cabang.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { name: "Saray Signature Palm Sugar", category: "Kopi & Espresso", sold: 128, revenue: 2816000 },
                  { name: "Rice Bowl Ayam Sambal Matah", category: "Makanan Utama", sold: 94, revenue: 2632000 },
                  { name: "Signature Matcha Latte", category: "Non-Coffee & Mocktail", sold: 76, revenue: 1900000 },
                  { name: "Croissant Almond Saray", category: "Pastry & Snack", sold: 62, revenue: 1674000 },
                ].map((p, idx) => (
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

      {/* MODAL TAMBAH OUTLET BARU */}
      {isAddBranchModalOpen && (
        <BranchManagerModal
          onClose={() => setIsAddBranchModalOpen(false)}
          onBranchAdded={handleBranchAdded}
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

    </div>
  );
}
