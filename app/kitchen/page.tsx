"use client";
// app/kitchen/page.tsx — Layar Khusus Dapur / Barista Kitchen Display System (Tablet/Monitor Mode)

import { useState, useEffect } from "react";
import GrowkasLogo from "@/app/components/GrowkasLogo";
import Link from "next/link";
import { TableOrder, getTableOrders, updateTableOrderStatus } from "@/app/actions/orderActions";
import KitchenTicketModal from "@/app/dashboard/components/KitchenTicketModal";
import { playKitchenChime } from "@/app/dashboard/components/KitchenDisplayModal";

export default function KitchenPage() {
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "processing" | "ready">("all");
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<TableOrder | null>(null);
  const [prevCount, setPrevCount] = useState<number>(0);

  const loadOrders = async () => {
    const res = await getTableOrders();
    if (res.orders) {
      setOrders(res.orders);
      const activeCount = res.orders.filter((o) => o.status === "pending" || o.status === "processing").length;
      if (activeCount > prevCount && prevCount !== 0) {
        playKitchenChime();
      }
      setPrevCount(activeCount);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 4000);
    return () => clearInterval(interval);
  }, [prevCount]);

  const handleStatusUpdate = async (orderId: string, nextStatus: "pending" | "processing" | "ready" | "completed") => {
    const res = await updateTableOrderStatus(orderId, nextStatus);
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
    <div style={{ background: "#09090B", color: "#F4F4F5", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      
      {/* KITCHEN TOP BAR */}
      <header style={{
        background: "rgba(18,18,20,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <GrowkasLogo size={34} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>🍳</span>
              <h1 style={{ fontSize: "1.25rem", fontWeight: "900", margin: 0 }}>
                KDS — Layar Dapur &amp; Barista
              </h1>
              <span style={{
                background: "#D4651C",
                color: "#FFF",
                fontSize: "0.75rem",
                fontWeight: "bold",
                padding: "2px 10px",
                borderRadius: "20px",
              }}>
                {orders.filter((o) => o.status === "pending" || o.status === "processing").length} Pesanan Aktif
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#888" }}>
              Saray Coffee &amp; Space • Auto-Refresh (4s)
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={playKitchenChime}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              color: "#FFF",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            🔔 Tes Bel
          </button>
          <Link
            href="/dashboard"
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              background: "rgba(212,101,28,0.15)",
              color: "#D4651C",
              border: "1px solid rgba(212,101,28,0.3)",
              fontSize: "0.82rem",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            ← Kembali ke POS
          </Link>
        </div>
      </header>

      {/* FILTER BUTTONS */}
      <div style={{ padding: "14px 24px", display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { id: "all", label: "Semua Aktif" },
          { id: "pending", label: "🔥 Baru / Menunggu" },
          { id: "processing", label: "🍳 Sedang Dimasak" },
          { id: "ready", label: "✅ Siap Diantar" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "800",
              background: activeFilter === tab.id ? "#D4651C" : "rgba(255,255,255,0.04)",
              color: activeFilter === tab.id ? "#FFF" : "#AAA",
              border: "none",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CARDS CONTAINER */}
      <main style={{ padding: "24px" }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#666" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "12px" }}>☕</div>
            <h2 style={{ color: "#FFF", fontSize: "1.3rem", fontWeight: "800" }}>Semua Meja Terlayani</h2>
            <p style={{ fontSize: "0.9rem" }}>Belum ada antrean baru dari QR Code meja.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}>
            {filteredOrders.map((ord) => {
              const isPending = ord.status === "pending";
              const isProcessing = ord.status === "processing";
              const isReady = ord.status === "ready";

              const borderColor = isPending ? "#EF4444" : isProcessing ? "#F59E0B" : "#10B981";

              return (
                <div
                  key={ord.id}
                  style={{
                    background: "#18181B",
                    border: `2px solid ${borderColor}`,
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                >
                  <div>
                    {/* Header Card */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <span style={{
                          background: "#FFF",
                          color: "#000",
                          fontWeight: "900",
                          fontSize: "1.35rem",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          display: "inline-block",
                        }}>
                          {ord.table_number.toUpperCase()}
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "6px" }}>
                          #{ord.invoice_number}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          fontSize: "0.85rem",
                          fontWeight: "900",
                          color: borderColor,
                          background: "rgba(255,255,255,0.05)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                        }}>
                          ⏱️ {getElapsedTime(ord.created_at)}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#AAA", marginTop: "4px" }}>
                          {ord.payment_status === "paid" ? "✅ LUNAS QRIS" : "⚠️ TUNAI KASIR"}
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{
                      borderTop: "1px dashed rgba(255,255,255,0.12)",
                      borderBottom: "1px dashed rgba(255,255,255,0.12)",
                      padding: "14px 0",
                      margin: "12px 0",
                    }}>
                      {ord.items.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: "10px" }}>
                          <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#FFF" }}>
                            {item.quantity}x {item.product_name}
                          </div>
                          {item.modifiers_summary && (
                            <div style={{ fontSize: "0.82rem", color: "#F59E0B", fontWeight: "bold", paddingLeft: "10px", marginTop: "2px" }}>
                              ↳ {item.modifiers_summary}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
                    <button
                      onClick={() => setSelectedTicketOrder(ord)}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.08)",
                        color: "#FFF",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      🖨️ Cetak Tiket
                    </button>

                    {isPending && (
                      <button
                        onClick={() => handleStatusUpdate(ord.id, "processing")}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: "#F59E0B",
                          color: "#000",
                          border: "none",
                          fontWeight: "900",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        🍳 Masak
                      </button>
                    )}

                    {isProcessing && (
                      <button
                        onClick={() => handleStatusUpdate(ord.id, "ready")}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: "#10B981",
                          color: "#FFF",
                          border: "none",
                          fontWeight: "900",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        🔔 Siap Antar
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleStatusUpdate(ord.id, "completed")}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: "#3B82F6",
                          color: "#FFF",
                          border: "none",
                          fontWeight: "900",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        ✅ Selesai
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* KOT PRINT MODAL */}
      {selectedTicketOrder && (
        <KitchenTicketModal
          order={selectedTicketOrder}
          onClose={() => setSelectedTicketOrder(null)}
        />
      )}
    </div>
  );
}
