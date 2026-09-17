"use client";
// app/dashboard/components/QRCodeGenerator.tsx — Generator & Cetak Stiker QR Code Meja Mandiri Admin (Standard Scan Ready)

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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
    // Dynamic origin or fallback to Vercel production URL
    const baseUrl = typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://growkas.vercel.app";
    return `${baseUrl}/order?table=${tableStr}&branch=${encodeURIComponent(activeBranch.name)}`;
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#D4651C", fontWeight: "bold", textTransform: "uppercase" }}>
              Standard Android &amp; iOS Camera Scan Ready
            </span>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "900", margin: "2px 0 0" }}>
              🖨️ Generator &amp; Cetak Stiker QR Code Meja Mandiri
            </h2>
          </div>

          <button
            onClick={handlePrintAll}
            style={{
              padding: "12px 22px",
              borderRadius: "10px",
              background: "#D4651C",
              color: "#FFF",
              border: "none",
              fontWeight: "900",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 16px rgba(212,101,28,0.5)",
            }}
          >
            <span>🖨️</span> Cetak Semua Stiker QR Meja
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
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
              Jumlah Meja yang Ingin Dibuat (1 - 50)
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

      {/* AREA UTAMA STIKER QR CODE (UNTUK TAMPILAN MONITOR & CETAK KERTAS A4) */}
      <div className="printable-qr-container">
        <div className="printable-qr-grid">
          {Array.from({ length: tableCount }).map((_, idx) => {
            const num = idx + 1;
            const tableStr = num < 10 ? `Meja 0${num}` : `Meja ${num}`;
            const orderUrl = getTableUrl(num);

            return (
              <div key={num} className="qr-sticker-card">
                {/* Brand Header */}
                <div style={{ marginBottom: "8px" }}>
                  <GrowkasLogo size={26} showText={true} textColor="#111" subtextColor="#D4651C" />
                  <div style={{ fontSize: "0.7rem", color: "#555", fontWeight: "700", marginTop: "3px" }}>
                    📍 {activeBranch.name}
                  </div>
                </div>

                {/* Standard 2D QR Code SVG (Scannable oleh iOS / Android Camera) */}
                <div style={{
                  background: "#FFFFFF",
                  padding: "12px",
                  borderRadius: "14px",
                  border: "2px solid rgba(212,101,28,0.2)",
                  display: "inline-block",
                  margin: "6px 0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}>
                  <QRCodeSVG
                    value={orderUrl}
                    size={140}
                    level="H"
                    includeMargin={true}
                    fgColor="#111111"
                    bgColor="#FFFFFF"
                  />
                </div>

                {/* Big Table Number Badge */}
                <div style={{
                  background: "#D4651C",
                  color: "#FFFFFF",
                  fontWeight: "900",
                  fontSize: "1.05rem",
                  padding: "5px 18px",
                  borderRadius: "100px",
                  letterSpacing: "1px",
                  margin: "6px 0",
                  display: "inline-block",
                  boxShadow: "0 2px 8px rgba(212,101,28,0.4)",
                }}>
                  {tableStr}
                </div>

                <div style={{ fontSize: "0.68rem", color: "#444", fontWeight: "700", marginTop: "4px" }}>
                  📱 Scan QR Code untuk Pesan &amp; Bayar
                </div>

                {/* Quick Copy Link Button (Hanya di layar monitor) */}
                <button
                  className="no-print"
                  onClick={() => handleCopyLink(num)}
                  style={{
                    marginTop: "8px",
                    fontSize: "0.68rem",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: copiedIndex === num ? "#4ade80" : "rgba(0,0,0,0.06)",
                    color: copiedIndex === num ? "#000" : "#555",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {copiedIndex === num ? "✓ Link Tersalin!" : "📋 Salin Link HP"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* STYLE CSS KHUSUS PRINT MEDIA QUERY (BERSIH & RAPI UNTUK STIKER KERTAS A4) */}
      <style jsx global>{`
        /* Tampilan Layar Web Monitor */
        .printable-qr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }

        .qr-sticker-card {
          background: #FFFFFF;
          color: #111111;
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          border: 2px solid #D4651C;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* PERATURAN KHUSUS CETAK PRINTER (@media print) */
        @media print {
          /* 1. Sembunyikan elemen navigasi, sidebar, header top bar, dan elemen non-cetak */
          aside,
          header,
          nav,
          .no-print,
          button,
          select,
          input,
          [class*="sidebar"],
          [class*="Header"] {
            display: none !important;
          }

          /* 2. Reset Background halaman cetak menjadi Putih Bersih */
          html, body, main {
            background: #FFFFFF !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          /* 3. Format Kontainer Stiker Grid di Kertas */
          .printable-qr-container {
            display: block !important;
            width: 100% !important;
            padding: 5mm !important;
            box-sizing: border-box !important;
          }

          .printable-qr-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12mm !important;
            width: 100% !important;
          }

          .qr-sticker-card {
            border: 2px dashed #D4651C !important;
            border-radius: 16px !important;
            padding: 16px !important;
            box-shadow: none !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

    </div>
  );
}
