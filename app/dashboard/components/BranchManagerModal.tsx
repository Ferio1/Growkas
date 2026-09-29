"use client";
// app/dashboard/components/BranchManagerModal.tsx — Form 1-Click Pengisian Cabang Mandiri untuk Pembeli SaaS Growkas

import { useState } from "react";
import { addBranch, BranchItem } from "@/app/actions/branchActions";

interface BranchManagerModalProps {
  branches?: BranchItem[];
  onClose: () => void;
  onBranchAdded: (branch: BranchItem) => void;
  onBranchDeleted?: (branchId: string) => void;
}

export default function BranchManagerModal({
  branches = [],
  onClose,
  onBranchAdded,
  onBranchDeleted,
}: BranchManagerModalProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [targetRevenue, setTargetRevenue] = useState("10000000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nama cabang/outlet wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    const res = await addBranch({
      name,
      city: city || "Indonesia",
      address,
      target_revenue: Number(targetRevenue) || 10000000,
    });

    if (res.branch) {
      onBranchAdded(res.branch);
      onClose();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (b: BranchItem) => {
    if (branches.length <= 1) {
      alert(`Outlet "${b.name}" adalah satu-satunya outlet yang tersisa dan tidak dapat dihapus.`);
      return;
    }
    if (confirm(`Yakin ingin menghapus outlet "${b.name} (${b.city})"?`)) {
      setDeletingId(b.id);
      if (onBranchDeleted) {
        onBranchDeleted(b.id);
      }
      setDeletingId(null);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", color: "#F5F0E8", fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "#161616", border: "1px solid rgba(212,101,28,0.4)", borderRadius: "18px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#D4651C", fontWeight: "bold", textTransform: "uppercase" }}>SaaS White-Label Multi-Outlet</span>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "900", margin: "2px 0 0" }}>🏪 Manajemen &amp; Tambah Cabang</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#F5F0E8", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>

        {/* DAFTAR CABANG AKTIF TERDAFTAR */}
        {branches && branches.length > 0 && (
          <div style={{ marginBottom: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#D4651C", textTransform: "uppercase", marginBottom: "10px" }}>
              📋 Daftar Outlet Terdaftar ({branches.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
              {branches.map((b) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.82rem" }}>
                  <div>
                    <strong style={{ color: "#F5F0E8" }}>📍 {b.name}</strong>
                    <span style={{ color: "rgba(245,240,232,0.5)", marginLeft: "6px" }}>({b.city})</span>
                  </div>
                  {b.id === "br-1" ? (
                    <span style={{ fontSize: "0.7rem", color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 8px", borderRadius: "6px", fontWeight: "bold" }}>
                      Pusat
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={deletingId === b.id}
                      onClick={() => handleDelete(b)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "5px",
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#EF4444",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      {deletingId === b.id ? "Menghapus..." : "🗑️ Hapus"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#F5F0E8", marginBottom: "12px" }}>
            ➕ Form Daftarkan Outlet Baru
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
              Nama Outlet / Cabang Anda *
            </label>
            <input
              type="text"
              placeholder="Contoh: Outlet Surabaya Barat / Resto Saray"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#F5F0E8", fontSize: "0.88rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
              Kota / Wilayah
            </label>
            <input
              type="text"
              placeholder="Contoh: Jakarta Selatan / Yogyakarta / Surabaya"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#F5F0E8", fontSize: "0.88rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
              Alamat Lengkap (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Jl. Kaliurang KM 9"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#F5F0E8", fontSize: "0.88rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
              Target Penjualan Bulanan (Rp)
            </label>
            <input
              type="number"
              value={targetRevenue}
              onChange={(e) => setTargetRevenue(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#F5F0E8", fontSize: "0.88rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", color: "#F5F0E8", border: "none", fontWeight: "600", cursor: "pointer" }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: "10px", borderRadius: "8px", background: "#D4651C", color: "#FFF", border: "none", fontWeight: "800", cursor: "pointer" }}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Outlet ➔"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
