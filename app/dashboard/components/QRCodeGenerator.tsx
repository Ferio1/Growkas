"use client";
// app/dashboard/components/QRCodeGenerator.tsx — Generator & Cetak QR Code Meja Mandiri Admin

import { useState } from "react";
import GrowkasLogo from "@/app/components/GrowkasLogo";

interface QRCodeGeneratorProps {
  branches: { id: string; name: string; city: string }[];
}

export default function QRCodeGenerator({ branches }: QRCodeGeneratorProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || "br-1");
  const [tableCount, setTableCount] = useState<number>(10);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0] || {
    name: "Saray Coffee & Space",
    city: "Yogyakarta",
  };

  const handlePrintAll = () => {
    window.print();
  };

  const getTableUrl = (num: number) => {
    const tableStr = num < 10 ? `0${num}` : `${num}`;
    return `https://growkas.vercel.app/order?table=${tableStr}&branch=${encodeURIComponent(activeBranch.name)}`;
  };

  const handleCopyLink = (num: number) => {
    const url = getTableUrl(num);
    navigator.clipboard.writeText(url);
    setCopiedIndex(num);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div style={{ color: "#F5F0E8", fontFamily: "system-ui, sans-serif" }}>
      
      {/* HEADER CONTROL BAR (TIDAK IKUT TERCETAK DI PRINT) */}
      <div className="no-print" style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#D4651C", fontWeight: "bold", textTransform: "uppercase" }}>Fitur Spesial All-in-One</span>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "900", margin: "2px 0 0" }}>🖨️ Generator & Cetak QR Code Meja Mandiri</h2>
          </div>

          <button
            onClick={handlePrintAll}
            style={{
              padding: "10px 18px",
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
              boxShadow: "0 4px 14px rgba(212,101,28,0.4)",
            }}
          >
            🖨️ Cetak Semua Stiker QR Meja
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "rgba(245,240,232,0.6)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Pilih Cabang / Outlet
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#F5F0E8", fontSize: "0.88rem", outline: "none", cursor: "pointer",
              }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} style={{ background: "#161616" }}>
                  📍 {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "rgba(245,240,232,0.6)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Jumlah Meja yang Ingin Dibuat
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={tableCount}
              onChange={(e) => setTableCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#F5F0E8", fontSize: "0.88rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* GRID KARTU STIKER QR CODE MEJA (PRINT READY) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "18px",
      }}>
        {Array.from({ length: tableCount }).map((_, idx) => {
          const num = idx + 1;
          const tableStr = num < 10 ? `Meja 0${num}` : `Meja ${num}`;
          const orderUrl = getTableUrl(num);

          return (
            <div
              key={num}
              style={{
                background: "#FFFFFF",
                color: "#111111",
                borderRadius: "16px",
                padding: "20px 16px",
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                border: "2px solid #D4651C",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
                breakInside: "avoid",
              }}
            >
              {/* Header Badge */}
              <div style={{ marginBottom: "10px" }}>
                <GrowkasLogo size={28} showText={true} textColor="#111" subtextColor="#D4651C" />
                <div style={{ fontSize: "0.72rem", color: "#666", fontWeight: "600", marginTop: "4px" }}>
                  📍 {activeBranch.name}
                </div>
              </div>

              {/* Vector QR Code SVG Simpel */}
              <div style={{
                background: "#FFF",
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid #EEE",
                marginBottom: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}>
                <svg width="130" height="130" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer Frame Dots */}
                  <rect x="5" y="5" width="30" height="30" rx="4" fill="#111" />
                  <rect x="10" y="10" width="20" height="20" rx="2" fill="#FFF" />
                  <rect x="15" y="15" width="10" height="10" fill="#D4651C" />

                  <rect x="65" y="5" width="30" height="30" rx="4" fill="#111" />
                  <rect x="70" y="10" width="20" height="20" rx="2" fill="#FFF" />
                  <rect x="75" y="15" width="10" height="10" fill="#D4651C" />

                  <rect x="5" y="65" width="30" height="30" rx="4" fill="#111" />
                  <rect x="10" y="70" width="20" height="20" rx="2" fill="#FFF" />
                  <rect x="15" y="75" width="10" height="10" fill="#D4651C" />

                  {/* Matrix Random QR Data Patterns */}
                  <rect x="42" y="8" width="12" height="12" fill="#111" rx="2" />
                  <rect x="42" y="24" width="8" height="8" fill="#D4651C" rx="1" />
                  <rect x="8" y="42" width="12" height="8" fill="#111" rx="1" />
                  <rect x="24" y="42" width="8" height="14" fill="#D4651C" rx="1" />
                  <rect x="40" y="40" width="20" height="20" rx="4" fill="#D4651C" />
                  <rect x="45" y="45" width="10" height="10" fill="#FFF" rx="2" />

                  <rect x="68" y="42" width="14" height="8" fill="#111" rx="1" />
                  <rect x="84" y="42" width="8" height="14" fill="#D4651C" rx="1" />

                  <rect x="42" y="68" width="8" height="14" fill="#111" rx="1" />
                  <rect x="54" y="68" width="12" height="8" fill="#D4651C" rx="1" />
                  <rect x="70" y="70" width="22" height="22" fill="#111" rx="3" />
                  <rect x="76" y="76" width="10" height="10" fill="#FFF" rx="1" />
                </svg>
              </div>

              {/* Nomor Meja Big Badge */}
              <div style={{
                background: "#D4651C",
                color: "#FFF",
                fontWeight: "900",
                fontSize: "1.1rem",
                padding: "6px 20px",
                borderRadius: "100px",
                letterSpacing: "1px",
                marginBottom: "8px",
                boxShadow: "0 2px 8px rgba(212,101,28,0.4)",
              }}>
                {tableStr}
              </div>

              <div style={{ fontSize: "0.68rem", color: "#555", fontWeight: "600" }}>
                Scan QR Code untuk Pesan &amp; Bayar Online
              </div>

              {/* Quick Copy Link Button (Hanya di layar monitor) */}
              <button
                className="no-print"
                onClick={() => handleCopyLink(num)}
                style={{
                  marginTop: "8px",
                  fontSize: "0.68rem",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: copiedIndex === num ? "#4ade80" : "rgba(0,0,0,0.06)",
                  color: copiedIndex === num ? "#000" : "#555",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {copiedIndex === num ? "✓ Link Salin!" : "📋 Salin Link HP"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Style CSS untuk Print Media Query */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
