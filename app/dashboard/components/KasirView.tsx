"use client";
// app/dashboard/components/KasirView.tsx — Tampilan POS khusus Kasir (Layout Non-Cutoff & Big Search)

import { useState } from "react";
import { ProductItem, CategoryItem, CartItem, saveTransaction, TransactionPayload } from "@/app/actions/posActions";
import ReceiptModal from "./ReceiptModal";

interface KasirViewProps {
  initialProducts: ProductItem[];
  initialCategories: CategoryItem[];
  userSession: any;
}

export default function KasirView({ initialProducts, userSession }: KasirViewProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "debit">("cash");
  const [paidAmountInput, setPaidAmountInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [completedTransaction, setCompletedTransaction] = useState<TransactionPayload | null>(null);

  // Klasifikasi Kategori Produk F&B yang Presisi
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

  // Customizer Modal State
  const [customizerProduct, setCustomizerProduct] = useState<ProductItem | null>(null);
  const [customizerCartIndex, setCustomizerCartIndex] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<"Dine In" | "Takeaway">("Dine In");
  const [tableNumber, setTableNumber] = useState("Meja 01");
  const [iceLevel, setIceLevel] = useState<"Normal Ice" | "Less Ice" | "No Ice">("Normal Ice");
  const [sugarLevel, setSugarLevel] = useState<"Normal Sugar" | "Less Sugar" | "No Sugar">("Normal Sugar");
  const [extraShot, setExtraShot] = useState(false);
  const [extraSyrup, setExtraSyrup] = useState(false);
  const [customNote, setCustomNote] = useState("");

  const openCustomizer = (product: ProductItem, existingCartIdx?: number) => {
    setCustomizerProduct(product);
    if (existingCartIdx !== undefined && existingCartIdx !== null) {
      setCustomizerCartIndex(existingCartIdx);
      const existing = cart[existingCartIdx];
      if (existing?.modifiers) {
        setOrderType(existing.modifiers.orderType || "Dine In");
        setTableNumber(existing.modifiers.tableNumber || "Meja 01");
        setIceLevel(existing.modifiers.iceLevel || "Normal Ice");
        setSugarLevel(existing.modifiers.sugarLevel || "Normal Sugar");
        setExtraShot(existing.modifiers.addOns?.includes("Extra Shot (+Rp 4.000)") || false);
        setExtraSyrup(existing.modifiers.addOns?.includes("Extra Syrup (+Rp 3.000)") || false);
        setCustomNote(existing.modifiers.customNote || existing.note || "");
        return;
      }
    }
    // Default values
    setCustomizerCartIndex(null);
    setOrderType("Dine In");
    setTableNumber("Meja 01");
    setIceLevel("Normal Ice");
    setSugarLevel("Normal Sugar");
    setExtraShot(false);
    setExtraSyrup(false);
    setCustomNote("");
  };

  const handleSaveCustomizer = () => {
    if (!customizerProduct) return;

    const addOns: string[] = [];
    let addOnPrice = 0;

    if (extraShot) {
      addOns.push("Extra Shot (+Rp 4.000)");
      addOnPrice += 4000;
    }
    if (extraSyrup) {
      addOns.push("Extra Syrup (+Rp 3.000)");
      addOnPrice += 3000;
    }

    const modifierObj = {
      orderType,
      tableNumber: orderType === "Dine In" ? tableNumber : undefined,
      iceLevel,
      sugarLevel,
      addOns,
      addOnPrice,
      customNote,
    };

    setCart((prev) => {
      if (customizerCartIndex !== null && prev[customizerCartIndex]) {
        // Edit existing cart item
        const updated = [...prev];
        updated[customizerCartIndex] = {
          ...updated[customizerCartIndex],
          modifiers: modifierObj,
          note: customNote,
        };
        return updated;
      }

      // Add new cart item with modifiers
      return [...prev, { product: customizerProduct, quantity: 1, note: customNote, modifiers: modifierObj }];
    });

    setCustomizerProduct(null);
    setCustomizerCartIndex(null);
  };

  const addToCart = (product: ProductItem) => {
    openCustomizer(product);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, idx) => {
          if (idx === index) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  const getItemPrice = (item: CartItem) => {
    const base = item.product.price;
    const addOn = item.modifiers?.addOnPrice || 0;
    return base + addOn;
  };

  const subtotal = cart.reduce((acc, item) => acc + getItemPrice(item) * item.quantity, 0);
  const totalAmount = subtotal;

  const paidAmount = Number(paidAmountInput) || 0;
  const changeAmount = Math.max(0, paidAmount - totalAmount);

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setPaidAmountInput(totalAmount.toString());
    setIsPaymentModalOpen(true);
  };

  const formatModifiersSummary = (item: CartItem) => {
    const parts: string[] = [];
    if (item.modifiers?.orderType) {
      parts.push(item.modifiers.orderType === "Dine In" ? `Dine In (${item.modifiers.tableNumber || "Meja 01"})` : "Takeaway");
    }
    if (item.modifiers?.iceLevel) parts.push(item.modifiers.iceLevel);
    if (item.modifiers?.sugarLevel) parts.push(item.modifiers.sugarLevel);
    if (item.modifiers?.addOns && item.modifiers.addOns.length > 0) {
      parts.push(item.modifiers.addOns.join(", "));
    }
    if (item.note || item.modifiers?.customNote) {
      parts.push(`Note: ${item.note || item.modifiers?.customNote}`);
    }
    return parts.join(" • ");
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
        price: getItemPrice(c),
        quantity: c.quantity,
        subtotal: getItemPrice(c) * c.quantity,
        modifiers_summary: formatModifiersSummary(c),
      })),
    };

    await saveTransaction(payload);

    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const itemBought = payload.items.find(
          (it) => it.product_id === p.id || it.product_name.toLowerCase() === p.name.toLowerCase()
        );
        if (itemBought) {
          return { ...p, stock: Math.max(0, p.stock - itemBought.quantity) };
        }
        return p;
      })
    );

    setIsSubmitting(false);
    setIsPaymentModalOpen(false);
    setCompletedTransaction(payload);
    clearCart();
  };

  // Kategori Bersih Khusus F&B (Tanpa Sembako/Makanan Umum)
  const CATEGORY_TABS = [
    { id: "all", label: "Semua Menu", icon: "🌐" },
    { id: "kopi", label: "Kopi & Espresso", icon: "☕" },
    { id: "nonkopi", label: "Non-Coffee & Mocktail", icon: "🍹" },
    { id: "makanan", label: "Makanan Utama", icon: "🍱" },
    { id: "snack", label: "Pastry & Snack", icon: "🥐" },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 340px",
      gap: "18px",
      width: "100%",
      maxWidth: "100%",
      height: "calc(100vh - 100px)",
      boxSizing: "border-box",
      overflow: "hidden",
    }}>
      
      {/* KATALOG PRODUK (KIRI) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: 0, height: "100%", overflow: "hidden" }}>
        
        {/* BARIS 1: SEARCH BAR PROMINEN & BESAR (FULL-WIDTH) */}
        <div style={{ position: "relative", width: "100%", flexShrink: 0 }}>
          <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", fontSize: "1.2rem", opacity: 0.7 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari menu kopi, makanan, snack, atau scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 44px 14px 50px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(212,101,28,0.4)",
              color: "#F5F0E8",
              fontSize: "0.95rem",
              fontWeight: "500",
              outline: "none",
              boxSizing: "border-box",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.1)", border: "none", color: "#F5F0E8", fontSize: "0.8rem",
                padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold",
              }}
            >
              ✕ Hapus
            </button>
          )}
        </div>

        {/* BARIS 2: KATEGORI TAB PILLS BERSIH */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", flexShrink: 0, paddingBottom: "2px" }}>
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1px solid " + (isActive ? "#D4651C" : "rgba(255,255,255,0.1)"),
                  background: isActive ? "rgba(212,101,28,0.25)" : "rgba(255,255,255,0.03)",
                  color: isActive ? "#D4651C" : "rgba(245,240,232,0.8)",
                  fontWeight: isActive ? "700" : "500",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            );
          })}
        </div>

        {/* BARIS 3: GRID PRODUK (AUTO-SCROLL) */}
        <div style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))",
          gap: "12px",
          overflowY: "auto",
          paddingRight: "4px",
          alignContent: "start",
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0", color: "rgba(245,240,232,0.4)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔍</div>
              <p style={{ fontSize: "0.9rem", fontWeight: "600" }}>Menu tidak ditemukan</p>
              <p style={{ fontSize: "0.78rem", opacity: 0.7 }}>Coba kata kunci pencarian atau pilih kategori lain di atas.</p>
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
                    background: inCart ? "rgba(212,101,28,0.08)" : "rgba(255,255,255,0.03)",
                    border: inCart ? "2px solid #D4651C" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                    minHeight: "190px",
                    boxSizing: "border-box",
                    boxShadow: inCart ? "0 4px 16px rgba(212,101,28,0.2)" : "none",
                  }}
                >
                  {inCart && (
                    <span style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
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
                      boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                    }}>
                      {inCart.quantity}
                    </span>
                  )}

                  <div>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(212,101,28,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                      marginBottom: "10px",
                    }}>
                      {icon}
                    </div>

                    <h3 style={{
                      fontSize: "0.88rem",
                      fontWeight: "700",
                      lineHeight: "1.3",
                      color: "#F5F0E8",
                      marginBottom: "4px",
                      height: "2.6em",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {product.name}
                    </h3>

                    <div style={{ fontSize: "0.74rem", color: "rgba(245,240,232,0.45)", marginBottom: "8px" }}>
                      Stok: {product.stock}
                    </div>
                  </div>

                  <div style={{
                    marginTop: "auto",
                    paddingTop: "10px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "6px",
                  }}>
                    <span style={{ fontWeight: "800", color: "#D4651C", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                    <button style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: inCart ? "#D4651C" : "rgba(255,255,255,0.08)",
                      color: inCart ? "#FFF" : "#F5F0E8",
                      border: "none",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}>
                      {inCart ? "+1" : "+ Tambah"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TIKET PESANAN / KERANJANG (KANAN - TIDAK KEPOTONG) */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}>
        
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0 }}>Pesanan Aktif</h2>
            {cart.length > 0 && (
              <button onClick={clearCart} style={{ background: "none", border: "none", color: "#f87171", fontSize: "0.78rem", cursor: "pointer", fontWeight: "600" }}>
                Hapus Semua
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(245,240,232,0.4)" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>🛒</div>
              <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>Belum ada item dipilih.</p>
              <p style={{ fontSize: "0.72rem", opacity: 0.7 }}>Klik produk di sebelah kiri untuk menambah ke pesanan.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", paddingRight: "4px", flex: 1 }}>
              {cart.map((item, idx) => {
                const itemPrice = getItemPrice(item);
                const modSummary = formatModifiersSummary(item);

                return (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{item.product.name}</span>
                      <span style={{ color: "#D4651C" }}>Rp {(itemPrice * item.quantity).toLocaleString("id-ID")}</span>
                    </div>

                    {modSummary && (
                      <div style={{ fontSize: "0.72rem", color: "#D4651C", opacity: 0.9, marginBottom: "6px", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        ⚡ {modSummary}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        onClick={() => openCustomizer(item.product, idx)}
                        style={{
                          background: "rgba(212,101,28,0.15)",
                          border: "1px solid rgba(212,101,28,0.3)",
                          color: "#D4651C",
                          fontSize: "0.7rem",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        ⚙️ Custom / Note
                      </button>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "6px" }}>
                        <button onClick={() => updateQuantity(idx, -1)} style={{ background: "none", border: "none", color: "#F5F0E8", fontSize: "0.9rem", cursor: "pointer" }}>-</button>
                        <span style={{ fontSize: "0.8rem", fontWeight: "bold", width: "18px", textAlign: "center" }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(idx, 1)} style={{ background: "none", border: "none", color: "#F5F0E8", fontSize: "0.9rem", cursor: "pointer" }}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "12px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem", color: "rgba(245,240,232,0.6)" }}>
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "1.05rem", fontWeight: "800", color: "#F5F0E8" }}>
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
                  {[totalAmount, ...[10000, 20000, 50000, 100000].filter((amt) => amt > totalAmount)].map((amt, i) => (
                    <button
                      key={i}
                      onClick={() => setPaidAmountInput(amt.toString())}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: amt === Number(paidAmountInput) ? "rgba(212,101,28,0.25)" : "rgba(255,255,255,0.08)",
                        border: "1px solid " + (amt === Number(paidAmountInput) ? "#D4651C" : "transparent"),
                        color: "#F5F0E8",
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      {amt === totalAmount ? "Uang Pas" : `Rp ${(amt / 1000).toLocaleString("id-ID")}k`}
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

      {/* MODAL F&B CUSTOMIZER */}
      {customizerProduct && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
        }}>
          <div style={{
            background: "#161616", border: "1px solid rgba(212,101,28,0.4)", borderRadius: "18px", width: "100%", maxWidth: "460px", padding: "24px", color: "#F5F0E8", boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          }}>
            {/* Header Product */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#D4651C", textTransform: "uppercase", fontWeight: "bold" }}>Kustomisasi Pesanan F&B</span>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "900", margin: "2px 0 0" }}>{customizerProduct.name}</h2>
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: "900", color: "#D4651C" }}>
                Rp {(customizerProduct.price + (extraShot ? 4000 : 0) + (extraSyrup ? 3000 : 0)).toLocaleString("id-ID")}
              </span>
            </div>

            {/* OPSI 1: TIPE PESANAN & MEJA */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
                Tipe Pesanan
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["Dine In", "Takeaway"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    style={{
                      flex: 1, padding: "8px", borderRadius: "8px",
                      border: "1px solid " + (orderType === t ? "#D4651C" : "rgba(255,255,255,0.1)"),
                      background: orderType === t ? "rgba(212,101,28,0.25)" : "rgba(255,255,255,0.03)",
                      color: orderType === t ? "#D4651C" : "#F5F0E8", fontWeight: "700", fontSize: "0.82rem", cursor: "pointer",
                    }}
                  >
                    {t === "Dine In" ? "🪑 Dine In" : "🛍️ Takeaway"}
                  </button>
                ))}
              </div>
              {orderType === "Dine In" && (
                <div style={{ marginTop: "8px" }}>
                  <input
                    type="text"
                    placeholder="Nomor Meja (cth: Meja 04)"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#F5F0E8", fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              )}
            </div>

            {/* OPSI 2: LEVEL ES */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
                Level Es (Ice Level)
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["Normal Ice", "Less Ice", "No Ice"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setIceLevel(l)}
                    style={{
                      flex: 1, padding: "6px", borderRadius: "6px",
                      border: "1px solid " + (iceLevel === l ? "#D4651C" : "rgba(255,255,255,0.1)"),
                      background: iceLevel === l ? "rgba(212,101,28,0.2)" : "rgba(255,255,255,0.03)",
                      color: iceLevel === l ? "#D4651C" : "#F5F0E8", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* OPSI 3: LEVEL GULA */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
                Level Gula (Sugar Level)
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["Normal Sugar", "Less Sugar", "No Sugar"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSugarLevel(s)}
                    style={{
                      flex: 1, padding: "6px", borderRadius: "6px",
                      border: "1px solid " + (sugarLevel === s ? "#D4651C" : "rgba(255,255,255,0.1)"),
                      background: sugarLevel === s ? "rgba(212,101,28,0.2)" : "rgba(255,255,255,0.03)",
                      color: sugarLevel === s ? "#D4651C" : "#F5F0E8", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* OPSI 4: EKSTRA ADD-ON */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
                Tambahan / Add-On
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={extraShot} onChange={(e) => setExtraShot(e.target.checked)} />
                  <span>☕ Extra Shot Espresso (+Rp 4.000)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={extraSyrup} onChange={(e) => setExtraSyrup(e.target.checked)} />
                  <span>🧪 Extra Flavor Syrup (+Rp 3.000)</span>
                </label>
              </div>
            </div>

            {/* OPSI 5: CATATAN DAPUR */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
                Catatan Khusus Pesanan
              </label>
              <input
                type="text"
                placeholder="Catatan khusus (cth: pisah es, sedotan 2)..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Tombol Aksi Modal */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                onClick={() => setCustomizerProduct(null)}
                style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", color: "#F5F0E8", border: "none", fontWeight: "600", cursor: "pointer" }}
              >
                Batal
              </button>
              <button
                onClick={handleSaveCustomizer}
                style={{ padding: "10px", borderRadius: "8px", background: "#D4651C", color: "#FFF", border: "none", fontWeight: "800", cursor: "pointer" }}
              >
                Simpan Pesanan ➔
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
