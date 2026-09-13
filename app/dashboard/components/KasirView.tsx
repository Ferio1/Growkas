"use client";
// app/dashboard/components/KasirView.tsx — Tampilan POS khusus Kasir

import { useState } from "react";
import { ProductItem, CategoryItem, CartItem, saveTransaction, TransactionPayload } from "@/app/actions/posActions";
import ReceiptModal from "./ReceiptModal";

interface KasirViewProps {
  initialProducts: ProductItem[];
  initialCategories: CategoryItem[];
  userSession: any;
}

export default function KasirView({ initialProducts, initialCategories, userSession }: KasirViewProps) {
  const [products] = useState<ProductItem[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "debit">("cash");
  const [paidAmountInput, setPaidAmountInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [completedTransaction, setCompletedTransaction] = useState<TransactionPayload | null>(null);

  // Helper untuk menentukan kelompok kategori setiap produk secara presisi
  const getProductGroup = (p: ProductItem): "kopi" | "nonkopi" | "makanan" | "snack" => {
    const name = (p.name || "").toLowerCase();
    const catName = (p.category_name || "").toLowerCase();
    const catId = (p.category_id || "").toLowerCase();

    if (
      catId === "cat-1" ||
      catName.includes("kopi") ||
      catName.includes("espresso") ||
      name.includes("kopi") ||
      name.includes("latte") ||
      name.includes("americano") ||
      name.includes("espresso") ||
      name.includes("macchiato") ||
      name.includes("brew") ||
      name.includes("v60")
    ) {
      return "kopi";
    }

    if (
      catId === "cat-2" ||
      catName.includes("non-coffee") ||
      catName.includes("mocktail") ||
      catName.includes("minuman") ||
      name.includes("matcha") ||
      name.includes("chocolate") ||
      name.includes("tea") ||
      name.includes("mocktail") ||
      name.includes("es teh")
    ) {
      return "nonkopi";
    }

    if (
      catId === "cat-3" ||
      catName.includes("makanan utama") ||
      catName.includes("makanan") ||
      name.includes("rice") ||
      name.includes("nasi") ||
      name.includes("spaghetti") ||
      name.includes("curry") ||
      name.includes("katsu")
    ) {
      return "makanan";
    }

    return "snack";
  };

  const filteredProducts = products.filter((p) => {
    const group = getProductGroup(p);
    const matchCategory = selectedCategory === "all" || group === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      q === "" ||
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));
    return matchCategory && matchSearch;
  });

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, note: "" }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateNote = (productId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, note } : item))
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalAmount = subtotal;

  const paidAmount = Number(paidAmountInput) || 0;
  const changeAmount = Math.max(0, paidAmount - totalAmount);

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setPaidAmountInput(totalAmount.toString());
    setIsPaymentModalOpen(true);
  };

  const handleCompleteTransaction = async () => {
    if (paymentMethod === "cash" && paidAmount < totalAmount) {
      alert("Jumlah uang tunai kurang dari total pembayaran!");
      return;
    }

    setIsSubmitting(true);

    const invoiceNum = "INV-" + Math.floor(100000 + Math.random() * 900000);
    const cashierName = userSession?.user?.name || "Kasir Shift 1";
    const branchName = "Saray Coffee & Space (Yogyakarta)";

    const payload: TransactionPayload = {
      invoice_number: invoiceNum,
      cashier_name: cashierName,
      branch_name: branchName,
      payment_method: paymentMethod,
      total_amount: totalAmount,
      paid_amount: paymentMethod === "cash" ? paidAmount : totalAmount,
      change_amount: paymentMethod === "cash" ? changeAmount : 0,
      items: cart.map((c) => ({
        product_id: c.product.id,
        product_name: c.product.name,
        price: c.product.price,
        quantity: c.quantity,
        subtotal: c.product.price * c.quantity,
      })),
    };

    await saveTransaction(payload);

    setIsSubmitting(false);
    setIsPaymentModalOpen(false);
    setCompletedTransaction(payload);
    clearCart();
  };

  const CATEGORY_TABS = [
    { id: "all", label: "Semua Menu", icon: "🌐" },
    { id: "kopi", label: "Kopi & Espresso", icon: "☕" },
    { id: "nonkopi", label: "Non-Coffee & Mocktail", icon: "🍹" },
    { id: "makanan", label: "Makanan Utama", icon: "🍱" },
    { id: "snack", label: "Pastry & Snack", icon: "🥐" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px", width: "100%", maxWidth: "100%" }}>
      
      {/* KATALOG PRODUK (KIRI) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
        
        {/* ROW 1: SEARCH BAR FULL-WIDTH */}
        <div style={{ position: "relative", width: "100%" }}>
          <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", opacity: 0.6 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari menu kopi, makanan, snack, atau scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 46px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#F5F0E8",
              fontSize: "0.92rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "rgba(245,240,232,0.5)", fontSize: "0.85rem", cursor: "pointer",
              }}
            >
              ✕ Hapus
            </button>
          )}
        </div>

        {/* ROW 2: KATEGORI TAB PILLS */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid " + (isActive ? "#D4651C" : "rgba(255,255,255,0.1)"),
                  background: isActive ? "rgba(212,101,28,0.2)" : "rgba(255,255,255,0.03)",
                  color: isActive ? "#D4651C" : "#F5F0E8",
                  fontWeight: isActive ? "700" : "500",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ROW 3: GRID PRODUK */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
          gap: "14px",
          maxHeight: "calc(100vh - 240px)",
          overflowY: "auto",
          paddingRight: "4px",
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0", color: "rgba(245,240,232,0.4)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔍</div>
              <p style={{ fontSize: "0.9rem", fontWeight: "600" }}>Menu tidak ditemukan</p>
              <p style={{ fontSize: "0.78rem", opacity: 0.7 }}>Coba kata kunci pencarian atau kategori lain.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const inCart = cart.find((c) => c.product.id === product.id);
              const group = getProductGroup(product);
              const icon = group === "kopi" ? "☕" : group === "nonkopi" ? "🍹" : group === "makanan" ? "🍱" : "🥐";

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: inCart ? "2px solid #D4651C" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                  }}
                >
                  {inCart && (
                    <span style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "#D4651C",
                      color: "#FFF",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {inCart.quantity}
                    </span>
                  )}

                  <div>
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "rgba(212,101,28,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      marginBottom: "10px",
                    }}>
                      {icon}
                    </div>
                    <h3 style={{ fontSize: "0.88rem", fontWeight: "700", marginBottom: "4px", color: "#F5F0E8", lineHeight: "1.3" }}>
                      {product.name}
                    </h3>
                    <div style={{ fontSize: "0.72rem", color: "rgba(245,240,232,0.4)", marginBottom: "10px" }}>
                      Stok: {product.stock}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "800", color: "#D4651C", fontSize: "0.88rem" }}>
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                    <button style={{
                      padding: "5px 10px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.08)",
                      border: "none",
                      color: "#F5F0E8",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                    }}>
                      + Tambah
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TIKET PESANAN / KERANJANG (KANAN) */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        maxHeight: "calc(100vh - 130px)",
        boxSizing: "border-box",
      }}>
        
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0 }}>Pesanan Aktif</h2>
            {cart.length > 0 && (
              <button onClick={clearCart} style={{ background: "none", border: "none", color: "#f87171", fontSize: "0.78rem", cursor: "pointer", fontWeight: "600" }}>
                Hapus Semua
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0", color: "rgba(245,240,232,0.4)" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>🛒</div>
              <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>Belum ada item dipilih.</p>
              <p style={{ fontSize: "0.72rem", opacity: 0.7 }}>Klik produk di sebelah kiri untuk menambah ke pesanan.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", paddingRight: "4px", flex: 1 }}>
              {cart.map((item) => (
                <div key={item.product.id} style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", fontSize: "0.85rem", marginBottom: "6px" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>{item.product.name}</span>
                    <span style={{ color: "#D4651C" }}>Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Catatan (cth: tanpa gula)"
                      value={item.note || ""}
                      onChange={(e) => updateNote(item.product.id, e.target.value)}
                      style={{
                        background: "none",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(245,240,232,0.6)",
                        fontSize: "0.72rem",
                        width: "130px",
                        outline: "none",
                      }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "6px" }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} style={{ background: "none", border: "none", color: "#F5F0E8", fontSize: "0.9rem", cursor: "pointer" }}>-</button>
                      <span style={{ fontSize: "0.8rem", fontWeight: "bold", width: "18px", textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} style={{ background: "none", border: "none", color: "#F5F0E8", fontSize: "0.9rem", cursor: "pointer" }}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem", color: "rgba(245,240,232,0.6)" }}>
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", fontSize: "1.05rem", fontWeight: "800", color: "#F5F0E8" }}>
            <span>Total Pembayaran</span>
            <span style={{ color: "#D4651C" }}>Rp {totalAmount.toLocaleString("id-ID")}</span>
          </div>

          <button
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              background: cart.length > 0 ? "#D4651C" : "rgba(255,255,255,0.05)",
              color: cart.length > 0 ? "#FFF" : "rgba(245,240,232,0.3)",
              border: "none",
              fontWeight: "800",
              fontSize: "0.9rem",
              cursor: cart.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            Bayar Sekarang →
          </button>
        </div>

      </div>

      {/* MODAL PEMBAYARAN */}
      {isPaymentModalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
        }}>
          <div style={{
            background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", width: "100%", maxWidth: "440px", padding: "24px", color: "#F5F0E8",
          }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "16px" }}>Memproses Pembayaran</h2>

            <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(212,101,28,0.1)", border: "1px solid rgba(212,101,28,0.3)", marginBottom: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "rgba(245,240,232,0.7)" }}>TOTAL TAGIHAN</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#D4651C" }}>Rp {totalAmount.toLocaleString("id-ID")}</div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "8px", color: "rgba(245,240,232,0.6)" }}>
                Metode Pembayaran
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                {(["cash", "qris", "debit"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid " + (paymentMethod === m ? "#D4651C" : "rgba(255,255,255,0.1)"),
                      background: paymentMethod === m ? "rgba(212,101,28,0.2)" : "rgba(255,255,255,0.03)",
                      color: paymentMethod === m ? "#D4651C" : "#F5F0E8",
                      fontWeight: "700",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      textTransform: "uppercase",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "8px", color: "rgba(245,240,232,0.6)" }}>
                  Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F5F0E8", fontSize: "1.1rem", fontWeight: "bold", outline: "none", marginBottom: "10px",
                  }}
                />

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  {[totalAmount, 20000, 50000, 100000].map((amt, i) => (
                    <button
                      key={i}
                      onClick={() => setPaidAmountInput(amt.toString())}
                      style={{
                        padding: "6px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.08)", border: "none", color: "#F5F0E8", fontSize: "0.78rem", cursor: "pointer",
                      }}
                    >
                      {amt === totalAmount ? "Uang Pas" : `Rp ${(amt / 1000).toLocaleString()}k`}
                    </button>
                  ))}
                </div>

                <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", color: "rgba(245,240,232,0.7)" }}>Kembalian</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#4ade80" }}>
                    Rp {changeAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isSubmitting}
                style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", color: "#F5F0E8", border: "none", fontWeight: "600", cursor: "pointer" }}
              >
                Batal
              </button>
              <button
                onClick={handleCompleteTransaction}
                disabled={isSubmitting}
                style={{ padding: "12px", borderRadius: "8px", background: "#D4651C", color: "#FFF", border: "none", fontWeight: "800", cursor: "pointer" }}
              >
                {isSubmitting ? "Menyimpan..." : "Selesaikan ➔"}
              </button>
            </div>
          </div>
        </div>
      )}

      {completedTransaction && (
        <ReceiptModal
          transaction={completedTransaction}
          onClose={() => setCompletedTransaction(null)}
        />
      )}

    </div>
  );
}
