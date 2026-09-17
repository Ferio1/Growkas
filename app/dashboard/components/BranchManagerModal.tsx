"use client";
// app/dashboard/components/BranchManagerModal.tsx — Form 1-Click Pengisian Cabang Mandiri untuk Pembeli SaaS Growkas

import { useState } from "react";
import { addBranch, BranchItem } from "@/app/actions/branchActions";

interface BranchManagerModalProps {
  onClose: () => void;
  onBranchAdded: (branch: BranchItem) => void;
}

export default function BranchManagerModal({ onClose, onBranchAdded }: BranchManagerModalProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [targetRevenue, setTargetRevenue] = useState("10000000");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", color: "#F5F0E8", fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "#161616", border: "1px solid rgba(212,101,28,0.4)", borderRadius: "18px", width: "100%", maxWidth: "440px", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#D4651C", fontWeight: "bold", textTransform: "uppercase" }}>SaaS White-Label Onboarding</span>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "900", margin: "2px 0 0" }}>+ Tambah Outlet / Cabang Baru</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#F5F0E8", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
              Nama Outlet / Cabang Anda *
            </label>
            <input
              type="text"
              placeholder="Contoh: Kopi Kenangan Kebayoran / Resto Saray"
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
              placeholder="Contoh: Jl. Radio Dalam No. 12"
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
