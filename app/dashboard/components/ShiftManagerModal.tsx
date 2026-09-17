"use client";
// app/dashboard/components/ShiftManagerModal.tsx — Manajemen Shift Kasir & Rekonsiliasi Kas Laci (Closing POS)

import { useState } from "react";
import { CashierShift, openShift, closeShift } from "@/app/actions/shiftActions";

interface ShiftManagerModalProps {
  currentShift: CashierShift | null;
  cashierName: string;
  onShiftUpdated: (shift: CashierShift | null) => void;
  onClose: () => void;
}

export default function ShiftManagerModal({
  currentShift,
  cashierName,
  onShiftUpdated,
  onClose,
}: ShiftManagerModalProps) {
  // Mode: jika ada shift -> "close_view", jika tidak ada -> "open_view"
  const isShiftActive = currentShift && currentShift.status === "open";

  // State Buka Shift
  const [initialCashInput, setInitialCashInput] = useState<string>("200000");

  // State Tutup Shift
  const [actualCashInput, setActualCashInput] = useState<string>(
    currentShift ? currentShift.expected_cash.toString() : "0"
  );
  const [shiftNotes, setShiftNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosedSlipPreview, setIsClosedSlipPreview] = useState(false);
  const [finalClosedShift, setFinalClosedShift] = useState<CashierShift | null>(null);

  // Perhitungan Selisih Kas
  const parsedActualCash = Number(actualCashInput) || 0;
  const expectedCash = currentShift ? currentShift.expected_cash : 0;
  const discrepancy = parsedActualCash - expectedCash;

  const handleOpenShift = async () => {
    setIsSubmitting(true);
    const amount = Number(initialCashInput) || 0;
    const res = await openShift(cashierName, amount);
    setIsSubmitting(false);
    if (res.success) {
      onShiftUpdated(res.shift);
    }
  };

  const handleCloseShift = async () => {
    setIsSubmitting(true);
    const res = await closeShift(parsedActualCash, shiftNotes);
    setIsSubmitting(false);
    if (res.success) {
      setFinalClosedShift(res.closedShift);
      setIsClosedSlipPreview(true);
      onShiftUpdated(null);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}>
      {/* Print Style untuk Slip Shift Closing */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #shift-closing-slip, #shift-closing-slip * {
              visibility: visible;
            }
            #shift-closing-slip {
              position: absolute;
              left: 0;
              top: 0;
              width: 58mm !important;
              margin: 0 !important;
              padding: 3mm !important;
              background: #FFF !important;
              color: #000 !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: 58mm auto;
              margin: 0;
            }
          }
        `
      }} />

      <div style={{
        background: "#18181B",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "460px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
      }}>
        {/* Header Modal */}
        <div className="no-print" style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#D4651C", fontWeight: "bold" }}>KASIR SHIFT CONTROL</div>
            <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#FFF" }}>
              {isClosedSlipPreview ? "Slip Penutupan Shift (Closing)" : isShiftActive ? "Tutup Shift Kasir (Closing POS)" : "Buka Shift Kasir Baru"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#888", fontSize: "1.2rem", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* CONTENT BODY */}
        <div style={{ padding: "20px", maxHeight: "75vh", overflowY: "auto" }}>
          {isClosedSlipPreview && finalClosedShift ? (
            /* SLIP CLOSING SHIFT PREVIEW (THERMAL 58MM) */
            <div>
              <div id="shift-closing-slip" style={{
                background: "#FFF",
                color: "#000",
                padding: "16px",
                borderRadius: "8px",
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "0.8rem",
                lineHeight: "1.4",
                marginBottom: "16px",
              }}>
                <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "8px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "1rem", fontWeight: "bold" }}>*** SLIP CLOSING KASIR ***</div>
                  <div>{finalClosedShift.branch_name}</div>
                  <div>Kasir: {finalClosedShift.cashier_name}</div>
                  <div style={{ fontSize: "0.7rem", color: "#555" }}>
                    Buka: {new Date(finalClosedShift.start_time).toLocaleTimeString("id-ID")} • Tutup: {new Date().toLocaleTimeString("id-ID")}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Modal Awal Kas:</span>
                  <span>Rp {finalClosedShift.initial_cash.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Penjualan Tunai:</span>
                  <span>+ Rp {finalClosedShift.cash_sales.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Penjualan QRIS:</span>
                  <span>Rp {finalClosedShift.qris_sales.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Transaksi:</span>
                  <span>{finalClosedShift.transaction_count} struk</span>
                </div>

                <div style={{ borderBottom: "1px dashed #000", margin: "8px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                  <span>TOTAL OMZET:</span>
                  <span>Rp {finalClosedShift.total_sales.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Uang Kas Sistem:</span>
                  <span>Rp {finalClosedShift.expected_cash.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                  <span>Uang Fisik Dihitung:</span>
                  <span>Rp {(finalClosedShift.actual_cash || 0).toLocaleString("id-ID")}</span>
                </div>

                <div style={{
                  marginTop: "8px",
                  padding: "6px",
                  textAlign: "center",
                  fontWeight: "bold",
                  background: (finalClosedShift.discrepancy || 0) === 0 ? "#E6F4EA" : "#FCE8E6",
                  color: (finalClosedShift.discrepancy || 0) === 0 ? "#137333" : "#C5221F",
                }}>
                  {(finalClosedShift.discrepancy || 0) === 0
                    ? "STATUS: KAS SEIMBANG (BALANCE)"
                    : (finalClosedShift.discrepancy || 0) > 0
                    ? `STATUS: KAS LEBIH (+Rp ${finalClosedShift.discrepancy?.toLocaleString("id-ID")})`
                    : `STATUS: KAS KURANG (Rp ${finalClosedShift.discrepancy?.toLocaleString("id-ID")})`}
                </div>
              </div>

              <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  onClick={handlePrintSlip}
                  style={{
                    padding: "10px",
                    background: "#D4651C",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  🖨️ Cetak Slip Closing
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: "10px",
                    background: "rgba(255,255,255,0.1)",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : isShiftActive ? (
            /* TUTUP SHIFT / CLOSING POS FORM */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Ringkasan Penjualan Shift Berjalan */}
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "0.85rem",
              }}>
                <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "8px" }}>
                  Dimulai: {new Date(currentShift.start_time).toLocaleString("id-ID")}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "rgba(245,240,232,0.7)" }}>Modal Awal Laci:</span>
                  <span style={{ fontWeight: "700" }}>Rp {currentShift.initial_cash.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "rgba(245,240,232,0.7)" }}>Penjualan Masuk Tunai:</span>
                  <span style={{ fontWeight: "700", color: "#4ADE80" }}>+ Rp {currentShift.cash_sales.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "rgba(245,240,232,0.7)" }}>Penjualan Masuk QRIS:</span>
                  <span style={{ fontWeight: "700", color: "#60A5FA" }}>Rp {currentShift.qris_sales.toLocaleString("id-ID")}</span>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                  <span style={{ fontWeight: "800" }}>Uang Kas Sistem di Laci:</span>
                  <span style={{ fontWeight: "900", color: "#D4651C" }}>
                    Rp {expectedCash.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Input Uang Fisik Kasir */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", marginBottom: "6px", color: "#FFF" }}>
                  Hitungan Uang Tunai Fisik di Laci (Rp):
                </label>
                <input
                  type="number"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    background: "#0A0A0A",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#FFF",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Status Rekonsiliasi Real-Time */}
              <div style={{
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: "700",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: discrepancy === 0 ? "rgba(74,222,128,0.12)" : discrepancy > 0 ? "rgba(96,165,250,0.12)" : "rgba(239,68,68,0.12)",
                border: "1px solid " + (discrepancy === 0 ? "rgba(74,222,128,0.3)" : discrepancy > 0 ? "rgba(96,165,250,0.3)" : "rgba(239,68,68,0.3)"),
                color: discrepancy === 0 ? "#4ADE80" : discrepancy > 0 ? "#60A5FA" : "#EF4444",
              }}>
                <span>
                  {discrepancy === 0 ? "✅ Kas Sesuai (Seimbang)" : discrepancy > 0 ? "🔵 Kas Lebih Fisik" : "⚠️ Kas Kurang Fisik"}
                </span>
                <span>
                  {discrepancy === 0 ? "Rp 0" : (discrepancy > 0 ? `+Rp ${discrepancy.toLocaleString("id-ID")}` : `Rp ${discrepancy.toLocaleString("id-ID")}`)}
                </span>
              </div>

              {/* Catatan Shift */}
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", color: "#888", marginBottom: "4px" }}>
                  Catatan Closing Kasir:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kas seimbang, receh aman"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "#0A0A0A",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#FFF",
                    fontSize: "0.85rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Action Button Tutup Shift */}
              <button
                onClick={handleCloseShift}
                disabled={isSubmitting}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#EF4444",
                  color: "#FFF",
                  border: "none",
                  fontWeight: "800",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                {isSubmitting ? "Menutup Shift..." : "🔒 Tutup Shift & Kunci Pembukuan"}
              </button>
            </div>
          ) : (
            /* BUKA SHIFT BARU FORM */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "0.85rem", color: "rgba(245,240,232,0.7)", margin: 0 }}>
                Saat ini belum ada shift kasir yang aktif. Masukkan modal uang tunai awal yang ditaruh di dalam laci kasir (*cash drawer*).
              </p>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", marginBottom: "6px", color: "#FFF" }}>
                  Modal Kas Awal di Laci (Rp):
                </label>
                <input
                  type="number"
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    background: "#0A0A0A",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#FFF",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                onClick={handleOpenShift}
                disabled={isSubmitting}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#D4651C",
                  color: "#FFF",
                  border: "none",
                  fontWeight: "800",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                {isSubmitting ? "Membuka Shift..." : "🔓 Buka Shift Kasir Sekarang"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
