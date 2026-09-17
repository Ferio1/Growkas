"use client";
// app/dashboard/components/KitchenTicketModal.tsx — Cetak Tiket Dapur (Kitchen Order Ticket / KOT) Thermal 58mm & 80mm

import { useState } from "react";
import { TableOrder } from "@/app/actions/orderActions";

interface KitchenTicketModalProps {
  order: TableOrder;
  onClose: () => void;
}

export default function KitchenTicketModal({ order, onClose }: KitchenTicketModalProps) {
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("58mm");

  const handlePrint = () => {
    window.print();
  };

  const maxWidthPx = paperWidth === "58mm" ? "290px" : "380px";

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
      {/* Print CSS Stylesheet */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #kitchen-ticket-print-area, #kitchen-ticket-print-area * {
              visibility: visible;
            }
            #kitchen-ticket-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: ${paperWidth === "58mm" ? "54mm" : "76mm"} !important;
              margin: 0 !important;
              padding: 4mm !important;
              box-shadow: none !important;
              border: none !important;
              background: #FFF !important;
              color: #000 !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: ${paperWidth === "58mm" ? "58mm auto" : "80mm auto"};
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
        maxWidth: "440px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
      }}>
        {/* Top Control Bar (Non-Printable) */}
        <div className="no-print" style={{
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#D4651C", fontWeight: "bold" }}>THERMAL PRINT PREVIEW</div>
            <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#FFF" }}>Tiket Dapur / KOT</div>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setPaperWidth("58mm")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: "700",
                background: paperWidth === "58mm" ? "#D4651C" : "rgba(255,255,255,0.08)",
                color: "#FFF",
                border: "none",
                cursor: "pointer",
              }}
            >
              58mm
            </button>
            <button
              onClick={() => setPaperWidth("80mm")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: "700",
                background: paperWidth === "80mm" ? "#D4651C" : "rgba(255,255,255,0.08)",
                color: "#FFF",
                border: "none",
                cursor: "pointer",
              }}
            >
              80mm
            </button>
          </div>
        </div>

        {/* Paper Container */}
        <div style={{ padding: "20px", display: "flex", justifyContent: "center", background: "#0D0D0E" }}>
          <div id="kitchen-ticket-print-area" style={{
            background: "#FFFFFF",
            color: "#000000",
            width: "100%",
            maxWidth: maxWidthPx,
            padding: "18px 16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            fontFamily: "'Courier New', Courier, monospace",
            lineHeight: "1.3",
            boxSizing: "border-box",
          }}>
            {/* Header Ticket */}
            <div style={{ textAlign: "center", borderBottom: "2px dashed #000", paddingBottom: "10px", marginBottom: "10px" }}>
              <div style={{ fontSize: "1rem", fontWeight: "900", letterSpacing: "1px" }}>*** TIKET DAPUR (KOT) ***</div>
              <div style={{ fontSize: "0.75rem", margin: "2px 0" }}>{order.branch_name}</div>
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "900",
                margin: "8px 0",
                background: "#000",
                color: "#FFF",
                padding: "4px 8px",
                borderRadius: "4px",
                display: "inline-block",
              }}>
                {order.table_number.toUpperCase()}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#333" }}>
                No: {order.invoice_number} | {new Date(order.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
              </div>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: "12px" }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: "10px", borderBottom: "1px dotted #888", paddingBottom: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: "900" }}>
                      {item.quantity}x {item.product_name}
                    </span>
                  </div>
                  {item.modifiers_summary && (
                    <div style={{ fontSize: "0.8rem", color: "#222", fontWeight: "bold", marginTop: "2px", paddingLeft: "10px" }}>
                      ↳ {item.modifiers_summary}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Notes / Special Instructions */}
            <div style={{ borderTop: "2px dashed #000", paddingTop: "8px", textAlign: "center", fontSize: "0.75rem" }}>
              <div>Metode: <strong>{order.payment_method.toUpperCase()} ({order.payment_status.toUpperCase()})</strong></div>
              <div style={{ marginTop: "4px", fontStyle: "italic" }}>
                *** SEGERA DISAJIKAN KE MEJA ***
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Non-Printable) */}
        <div className="no-print" style={{
          padding: "14px 18px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          background: "rgba(255,255,255,0.02)",
        }}>
          <button
            onClick={handlePrint}
            style={{
              padding: "10px",
              background: "#D4651C",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>🖨️</span> Cetak Tiket ({paperWidth})
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px",
              background: "rgba(255,255,255,0.1)",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "0.88rem",
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
