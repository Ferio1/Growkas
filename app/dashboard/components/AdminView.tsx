"use client";
// app/dashboard/components/AdminView.tsx — Dashboard Konsolidasi Multi-Cabang khusus Admin/Owner

import { useState } from "react";
import { addProduct } from "@/app/actions/posActions";

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
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [addProductSuccessMsg, setAddProductSuccessMsg] = useState("");

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) return;

    setIsSavingProduct(true);
    setAddProductSuccessMsg("");

    const res = await addProduct({
      name: newProductName,
      price: Number(newProductPrice),
      stock: Number(newProductStock) || 0,
    });

    setIsSavingProduct(false);

    if (res.success) {
      setAddProductSuccessMsg("Produk berhasil ditambahkan ke database Supabase!");
      setNewProductName("");
      setNewProductPrice("");
      setNewProductStock("");
      setTimeout(() => {
        setIsAddProductModalOpen(false);
        setAddProductSuccessMsg("");
      }, 1500);
    } else {
      alert("Gagal menambah produk: " + res.error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      
      {/* Header & Quick Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "900", margin: "0 0 6px" }}>
            Dashboard Konsolidasi Multi-Cabang
          </h1>
          <p style={{ color: "rgba(245,240,232,0.5)", fontSize: "0.88rem", margin: 0 }}>
            Ringkasan omzet terpusat dan perbandingan kinerja antar outlet F&amp;B secara real-time.
          </p>
        </div>

        <button
          onClick={() => setIsAddProductModalOpen(true)}
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            background: "#D4651C",
            color: "#FFF",
            border: "none",
            fontWeight: "800",
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>+</span> Tambah Produk Baru
        </button>
      </div>

      {/* Filter Branch Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
        {["all", "Jakarta Pusat", "Bandung", "Surabaya"].map((branch) => (
          <button
            key={branch}
            onClick={() => setSelectedBranch(branch)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              background: selectedBranch === branch ? "rgba(212,101,28,0.2)" : "transparent",
              border: "1px solid " + (selectedBranch === branch ? "#D4651C" : "transparent"),
              color: selectedBranch === branch ? "#D4651C" : "rgba(245,240,232,0.6)",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            {branch === "all" ? "🌐 Semua Outlet (Konsolidasi)" : `🏪 Cabang ${branch}`}
          </button>
        ))}
      </div>

      {/* KPI SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
          <div style={{ fontSize: "0.8rem", color: "rgba(245,240,232,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
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
          <div style={{ fontSize: "0.8rem", color: "rgba(245,240,232,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
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
          <div style={{ fontSize: "0.8rem", color: "rgba(245,240,232,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
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
          <div style={{ fontSize: "0.8rem", color: "rgba(245,240,232,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
            Outlet Beroperasi
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#F5F0E8", marginBottom: "6px" }}>
            {analytics.activeBranches} Cabang
          </div>
          <div style={{ fontSize: "0.78rem", color: "#4ade80" }}>
            ● 100% Online &amp; Tersinkronisasi
          </div>
        </div>
      </div>

      {/* PERBANDINGAN PERFORMA CABANG */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
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
              { name: "Kopi Kenangan Mantan", category: "Minuman", sold: 84, revenue: 1512000 },
              { name: "Roti Tawar Bandung", category: "Makanan", sold: 62, revenue: 930000 },
              { name: "Es Teh Manis Jumbo", category: "Minuman", sold: 58, revenue: 406000 },
              { name: "Croissant Keju Lumut", category: "Makanan", sold: 41, revenue: 902000 },
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

      {/* MODAL TAMBAH PRODUK BARU */}
      {isAddProductModalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
        }}>
          <div style={{
            background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", width: "100%", maxWidth: "420px", padding: "24px", color: "#F5F0E8",
          }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "16px" }}>Tambah Produk Baru</h2>

            {addProductSuccessMsg && (
              <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: "0.85rem", marginBottom: "16px" }}>
                ✓ {addProductSuccessMsg}
              </div>
            )}

            <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "6px", color: "rgba(245,240,232,0.6)" }}>
                  Nama Produk / Menu
                </label>
                <input
                  type="text"
                  placeholder="Cth: Kopi Susu Aren"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "6px", color: "rgba(245,240,232,0.6)" }}>
                  Harga Jual (Rp)
                </label>
                <input
                  type="number"
                  placeholder="18000"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "6px", color: "rgba(245,240,232,0.6)" }}>
                  Stok Awal
                </label>
                <input
                  type="number"
                  placeholder="50"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  disabled={isSavingProduct}
                  style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", color: "#F5F0E8", border: "none", fontWeight: "600", cursor: "pointer" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  style={{ padding: "10px", borderRadius: "8px", background: "#D4651C", color: "#FFF", border: "none", fontWeight: "800", cursor: "pointer" }}
                >
                  {isSavingProduct ? "Simpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
