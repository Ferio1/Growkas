"use client";
// app/dashboard/components/KitchenDisplayModal.tsx — Kitchen Display System (KDS) & Pesanan Meja Masuk Real-Time

import { useState, useEffect } from "react";
import { TableOrder, getTableOrders, updateTableOrderStatus } from "@/app/actions/orderActions";
import KitchenTicketModal from "./KitchenTicketModal";

interface KitchenDisplayModalProps {
  onClose: () => void;
  onOrderCountChanged?: (count: number) => void;
}

// Helper: Web Audio API Bell Chime Synthesizer
export function playKitchenChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // 1st Tone (880Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.6);

    // 2nd Tone (1318Hz - E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.85);
  } catch (e) {
    console.warn("Audio chime disabled or blocked by browser:", e);
  }
}

export default function KitchenDisplayModal({ onClose, onOrderCountChanged }: KitchenDisplayModalProps) {
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "processing" | "ready" | "completed">("all");
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<TableOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Load orders
  const loadOrders = async () => {
    const res = await getTableOrders();
    if (res.orders) {
      setOrders(res.orders);
      const pendingCount = res.orders.filter((o) => o.status === "pending" || o.status === "processing").length;
      if (onOrderCountChanged) onOrderCountChanged(pendingCount);
    }
  };

  useEffect(() => {
    loadOrders();
    // Polling interval 5 detik untuk cek pesanan masuk dari HP pelanggan
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId: string, nextStatus: "pending" | "processing" | "ready" | "completed") => {
    setIsUpdating(orderId);
    const res = await updateTableOrderStatus(orderId, nextStatus);
    setIsUpdating(null);
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "all") return o.status !== "completed";
    return o.status === activeFilter;
  });

  const getElapsedTime = (createdTime: string) => {
    const diffMin = Math.max(1, Math.floor((Date.now() - new Date(createdTime).getTime()) / 60000));
    return `${diffMin} mnt lalu`;
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9998,
      background: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: "#121214",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "18px",
        width: "100%",
        maxWidth: "960px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
      }}>
        {/* HEADER BAR */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.02)",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>🍳</span>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "900", margin: 0, color: "#FFF" }}>
                Kitchen Display System (KDS) &amp; Pesanan Meja
              </h2>
              <span style={{
                background: "#D4651C",
                color: "#FFF",
                fontSize: "0.72rem",
                fontWeight: "900",
                padding: "2px 8px",
                borderRadius: "12px",
              }}>
                {orders.filter((o) => o.status === "pending" || o.status === "processing").length} Aktif
              </span>
            </div>
            <p style={{ color: "rgba(245,240,232,0.5)", fontSize: "0.78rem", margin: "2px 0 0" }}>
              Pesanan langsung dari scan QR customer di meja. Dilengkapi auto-sync &amp; cetak tiket dapur.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={playKitchenChime}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.06)",
                color: "#DDD",
                border: "1px solid rgba(255,255,255,0.15)",
                fontSize: "0.8rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🔔</span> Tes Bunyi Bel
            </button>
            <button
              onClick={onClose}
              style={{ background: "transparent", border: "none", color: "#888", fontSize: "1.3rem", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* FILTER TABS */}
        <div style={{
          padding: "10px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
        }}>
          {[
            { id: "all", label: "Semua Aktif" },
            { id: "pending", label: "Menunggu / Baru" },
            { id: "processing", label: "Sedang Dimasak" },
            { id: "ready", label: "Siap Diantar" },
            { id: "completed", label: "Riwayat Selesai" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: "700",
                background: activeFilter === tab.id ? "#D4651C" : "rgba(255,255,255,0.04)",
                color: activeFilter === tab.id ? "#FFF" : "rgba(245,240,232,0.7)",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ORDERS GRID */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>✅</div>
              <div style={{ fontWeight: "700", color: "#AAA" }}>Tidak ada pesanan aktif</div>
              <div style={{ fontSize: "0.8rem" }}>Semua antrean meja telah tersajikan atau belum ada pesanan baru.</div>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}>
              {filteredOrders.map((ord) => {
                const isPending = ord.status === "pending";
                const isProcessing = ord.status === "processing";
                const isReady = ord.status === "ready";

                const cardBorder = isPending
                  ? "2px solid #EF4444"
                  : isProcessing
                  ? "2px solid #F59E0B"
                  : "2px solid #10B981";

                return (
                  <div
                    key={ord.id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: cardBorder,
                      borderRadius: "14px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Top Row: Table & Timer */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div>
                          <span style={{
                            background: "#FFF",
                            color: "#000",
                            fontWeight: "900",
                            fontSize: "1.1rem",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            display: "inline-block",
                          }}>
                            {ord.table_number.toUpperCase()}
                          </span>
                          <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "4px" }}>
                            #{ord.invoice_number}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            color: isPending ? "#EF4444" : isProcessing ? "#F59E0B" : "#10B981",
                            background: "rgba(255,255,255,0.05)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}>
                            ⏱️ {getElapsedTime(ord.created_at)}
                          </span>
                          <div style={{ fontSize: "0.7rem", color: "#AAA", marginTop: "4px" }}>
                            {ord.payment_method.toUpperCase()} • {ord.payment_status === "paid" ? "✅ LUNAS" : "⚠️ BAYAR KASIR"}
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div style={{
                        borderTop: "1px dashed rgba(255,255,255,0.1)",
                        borderBottom: "1px dashed rgba(255,255,255,0.1)",
                        padding: "10px 0",
                        margin: "10px 0",
                        fontSize: "0.85rem",
                      }}>
                        {ord.items.map((item, idx) => (
                          <div key={idx} style={{ marginBottom: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                              <span>{item.quantity}x {item.product_name}</span>
                              <span style={{ color: "#DDD" }}>Rp {item.subtotal.toLocaleString("id-ID")}</span>
                            </div>
                            {item.modifiers_summary && (
                              <div style={{ fontSize: "0.72rem", color: "#F59E0B", paddingLeft: "8px" }}>
                                ↳ {item.modifiers_summary}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                        <button
                          onClick={() => setSelectedTicketOrder(ord)}
                          style={{
                            padding: "8px",
                            borderRadius: "8px",
                            background: "rgba(255,255,255,0.08)",
                            color: "#FFF",
                            border: "none",
                            fontWeight: "700",
                            fontSize: "0.78rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          <span>🖨️</span> Tiket KOT
                        </button>

                        {isPending && (
                          <button
                            onClick={() => handleStatusUpdate(ord.id, "processing")}
                            disabled={isUpdating === ord.id}
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              background: "#F59E0B",
                              color: "#000",
                              border: "none",
                              fontWeight: "800",
                              fontSize: "0.78rem",
                              cursor: "pointer",
                            }}
                          >
                            🍳 Masak
                          </button>
                        )}

                        {isProcessing && (
                          <button
                            onClick={() => handleStatusUpdate(ord.id, "ready")}
                            disabled={isUpdating === ord.id}
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              background: "#10B981",
                              color: "#FFF",
                              border: "none",
                              fontWeight: "800",
                              fontSize: "0.78rem",
                              cursor: "pointer",
                            }}
                          >
                            🔔 Siap Antar
                          </button>
                        )}

                        {isReady && (
                          <button
                            onClick={() => handleStatusUpdate(ord.id, "completed")}
                            disabled={isUpdating === ord.id}
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              background: "#3B82F6",
                              color: "#FFF",
                              border: "none",
                              fontWeight: "800",
                              fontSize: "0.78rem",
                              cursor: "pointer",
                            }}
                          >
                            ✅ Selesai
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TIKET DAPUR PRINT MODAL */}
      {selectedTicketOrder && (
        <KitchenTicketModal
          order={selectedTicketOrder}
          onClose={() => setSelectedTicketOrder(null)}
        />
      )}
    </div>
  );
}
