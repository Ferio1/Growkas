"use client";
// app/dashboard/components/ReceiptModal.tsx — Struk Belanja Kasir Digital/Cetak

import { TransactionPayload } from "@/app/actions/posActions";

interface ReceiptModalProps {
  transaction: TransactionPayload;
  onClose: () => void;
}

export default function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0, 0, 0, 0.8)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "#FFFFFF",
        color: "#111111",
        width: "100%",
        maxWidth: "380px",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        fontFamily: "monospace, system-ui",
      }}>
        
        {/* Header Struk */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "900", letterSpacing: "1px", margin: "0 0 4px" }}>
            GROWKAS
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#666", margin: "0 0 4px" }}>
            {transaction.branch_name}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#888", margin: 0 }}>
            No: {transaction.invoice_number}
          </p>
        </div>

        <div style={{ borderBottom: "1px dashed #CCC", margin: "12px 0" }} />

        {/* Info Transaksi */}
        <div style={{ fontSize: "0.75rem", color: "#555", marginBottom: "12px" }}>
          <div>Kasir: <strong>{transaction.cashier_name}</strong></div>
          <div>Metode: <strong>{transaction.payment_method.toUpperCase()}</strong></div>
          <div>Waktu: {new Date().toLocaleString("id-ID")}</div>
        </div>

        <div style={{ borderBottom: "1px dashed #CCC", margin: "12px 0" }} />

        {/* Items List */}
        <div style={{ fontSize: "0.82rem", marginBottom: "12px" }}>
          {transaction.items.map((item, idx) => (
            <div key={idx} style={{ marginBottom: "8px" }}>
              <div style={{ fontWeight: "bold" }}>{item.product_name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#555", fontSize: "0.78rem" }}>
                <span>{item.quantity} x Rp {item.price.toLocaleString("id-ID")}</span>
                <span style={{ fontWeight: "600", color: "#111" }}>
                  Rp {item.subtotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderBottom: "1px dashed #CCC", margin: "12px 0" }} />

        {/* Total Rincian */}
        <div style={{ fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "1.05rem" }}>
            <span>TOTAL</span>
            <span style={{ color: "#D4651C" }}>Rp {transaction.total_amount.toLocaleString("id-ID")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#555" }}>
            <span>Bayar</span>
            <span>Rp {transaction.paid_amount.toLocaleString("id-ID")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#555" }}>
            <span>Kembali</span>
            <span>Rp {transaction.change_amount.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div style={{ borderBottom: "1px dashed #CCC", margin: "16px 0" }} />

        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#777", marginBottom: "20px" }}>
          Terima kasih telah berbelanja!<br />
          Sistem Kasir F&B Growkas
        </div>

        {/* Action Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button
            onClick={handlePrint}
            style={{
              padding: "10px",
              background: "#111",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            🖨️ Cetak
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px",
              background: "#D4651C",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
