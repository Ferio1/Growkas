"use client";
// app/order/page.tsx — Halaman Pemesanan Mandiri HP Pelanggan (Customer Self-Service & QRIS Payment)

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GrowkasLogo from "@/app/components/GrowkasLogo";
import { getProductsAndCategories, ProductItem, CartItem, saveTransaction } from "@/app/actions/posActions";
import { createTableOrder } from "@/app/actions/orderActions";

function OrderPageContent() {
  const searchParams = useSearchParams();
  const tableNum = searchParams.get("table") || "01";
  const branchName = searchParams.get("branch") || "Saray Coffee & Space (Yogyakarta)";

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cash">("qris");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState("");

  // Customizer Modal State
  const [customizerProduct, setCustomizerProduct] = useState<ProductItem | null>(null);
  const [iceLevel, setIceLevel] = useState<"Normal Ice" | "Less Ice" | "No Ice">("Normal Ice");
  const [sugarLevel, setSugarLevel] = useState<"Normal Sugar" | "Less Sugar" | "No Sugar">("Normal Sugar");
  const [extraShot, setExtraShot] = useState(false);
  const [extraSyrup, setExtraSyrup] = useState(false);
  const [customNote, setCustomNote] = useState("");

  useEffect(() => {
    async function loadData() {
      const res = await getProductsAndCategories();
      if (res.products) setProducts(res.products);
    }
    loadData();
  }, []);

  const openCustomizer = (product: ProductItem) => {
    setCustomizerProduct(product);
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
      orderType: "Dine In" as const,
      tableNumber: `Meja ${tableNum}`,
      iceLevel,
      sugarLevel,
      addOns,
      addOnPrice,
      customNote,
    };

    setCart((prev) => [
      ...prev,
      { product: customizerProduct, quantity: 1, note: customNote, modifiers: modifierObj },
    ]);

    setCustomizerProduct(null);
  };

  const getItemPrice = (item: CartItem) => item.product.price + (item.modifiers?.addOnPrice || 0);

  const subtotal = cart.reduce((acc, item) => acc + getItemPrice(item) * item.quantity, 0);

  const formatModifiersSummary = (item: CartItem) => {
    const parts: string[] = [];
    if (item.modifiers?.iceLevel) parts.push(item.modifiers.iceLevel);
    if (item.modifiers?.sugarLevel) parts.push(item.modifiers.sugarLevel);
    if (item.modifiers?.addOns && item.modifiers.addOns.length > 0) parts.push(item.modifiers.addOns.join(", "));
    if (item.note) parts.push(`Note: ${item.note}`);
    return parts.join(" • ");
  };

  const handlePayOnline = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const invoiceNum = "ORD-" + Math.floor(100000 + Math.random() * 900000);

    const payload = {
      invoice_number: invoiceNum,
      cashier_name: "Self-Order QR Meja " + tableNum,
      branch_name: branchName,
      payment_method: (paymentMethod === "qris" ? "qris" : "cash") as any,
      total_amount: subtotal,
      paid_amount: subtotal,
      change_amount: 0,
      items: cart.map((c) => ({
        product_id: c.product.id,
        product_name: c.product.name,
        price: getItemPrice(c),
        quantity: c.quantity,
        subtotal: getItemPrice(c) * c.quantity,
        modifiers_summary: `Meja ${tableNum} • ` + formatModifiersSummary(c),
      })),
    };

    const orderPayload = {
      invoice_number: invoiceNum,
      table_number: `Meja ${tableNum}`,
      branch_name: branchName,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "qris" ? ("paid" as const) : ("unpaid" as const),
      status: "pending" as const,
      total_amount: subtotal,
      items: cart.map((c) => ({
        product_name: c.product.name,
        price: getItemPrice(c),
        quantity: c.quantity,
        subtotal: getItemPrice(c) * c.quantity,
        modifiers_summary: formatModifiersSummary(c),
      })),
    };

    await createTableOrder(orderPayload);
    await saveTransaction(payload);

    setIsSubmitting(false);
    setIsCheckoutOpen(false);
    setCompletedInvoice(invoiceNum);
    setIsOrderComplete(true);
    setCart([]);
  };

  const CATEGORY_TABS = [
    { id: "all", label: "Semua", icon: "🌐" },
    { id: "kopi", label: "Kopi", icon: "☕" },
    { id: "nonkopi", label: "Non-Coffee", icon: "🍹" },
    { id: "makanan", label: "Makanan", icon: "🍱" },
    { id: "snack", label: "Snack", icon: "🥐" },
  ];

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = q === "" || p.name.toLowerCase().includes(q);
    return matchSearch;
  });

  return (
    <div style={{ background: "#0A0A0A", color: "#F5F0E8", minHeight: "100vh", fontFamily: "system-ui, sans-serif", paddingBottom: "100px" }}>
      
      {/* HEADER BAR (MOBILE OPTIMIZED) */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,10,0.92)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <GrowkasLogo size={32} />

        <div style={{ background: "rgba(212,101,28,0.2)", border: "1px solid #D4651C", padding: "4px 12px", borderRadius: "100px", color: "#FFF", fontSize: "0.82rem", fontWeight: "bold" }}>
          🪑 Meja {tableNum}
        </div>
      </header>

      {/* BANNER NAMA OUTLET */}
      <div style={{ background: "linear-gradient(135deg, rgba(212,101,28,0.3) 0%, rgba(0,0,0,0.4) 100%)", padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: "0.72rem", color: "#D4651C", fontWeight: "bold", textTransform: "uppercase" }}>Pemesanan Mandiri Cafe</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "900", margin: "2px 0 0" }}>{branchName}</h1>
      </div>

      <div style={{ padding: "16px" }}>
        
        {/* SEARCH BAR */}
        <div style={{ marginBottom: "14px" }}>
          <input
            type="text"
            placeholder="Cari kopi, minuman, atau makanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#F5F0E8", fontSize: "0.88rem", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* KATEGORI PILLS */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px" }}>
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedCategory(t.id)}
              style={{
                padding: "8px 14px", borderRadius: "8px",
                background: selectedCategory === t.id ? "#D4651C" : "rgba(255,255,255,0.05)",
                color: selectedCategory === t.id ? "#FFF" : "rgba(245,240,232,0.7)",
                border: "none", fontSize: "0.8rem", fontWeight: "700", whiteSpace: "nowrap", cursor: "pointer",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* LIST KATALOG PRODUK MOBILE */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => openCustomizer(p)}
              style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", minHeight: "150px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "0.85rem", fontWeight: "700", margin: "0 0 6px", lineHeight: "1.3" }}>{p.name}</h3>
                <div style={{ fontSize: "0.72rem", color: "rgba(245,240,232,0.5)" }}>Stok: {p.stock}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#D4651C" }}>Rp {p.price.toLocaleString("id-ID")}</span>
                <span style={{ background: "#D4651C", color: "#FFF", borderRadius: "6px", padding: "3px 8px", fontSize: "0.72rem", fontWeight: "bold" }}>+ Pesan</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STICKY BOTTOM CART BAR */}
      {cart.length > 0 && (
        <div style={{
          position: "fixed", bottom: "16px", left: "16px", right: "16px", zIndex: 200,
          background: "#D4651C", borderRadius: "14px", padding: "14px 18px", color: "#FFF",
          display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 30px rgba(212,101,28,0.5)", cursor: "pointer",
        }} onClick={() => setIsCheckoutOpen(true)}>
          <div>
            <div style={{ fontSize: "0.75rem", opacity: 0.9, fontWeight: "bold" }}>{cart.length} Pesanan (Meja {tableNum})</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "900" }}>Rp {subtotal.toLocaleString("id-ID")}</div>
          </div>
          <button style={{ background: "#FFF", color: "#D4651C", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: "900", fontSize: "0.85rem" }}>
            Lihat Pesanan ➔
          </button>
        </div>
      )}

      {/* MODAL F&B CUSTOMIZER */}
      {customizerProduct && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#161616", borderTop: "2px solid #D4651C", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", width: "100%", maxWidth: "500px", padding: "20px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>{customizerProduct.name}</h3>
              <span style={{ color: "#D4651C", fontWeight: "800", fontSize: "1rem" }}>Rp {customizerProduct.price.toLocaleString("id-ID")}</span>
            </div>

            {/* Opsi Level Es */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "rgba(245,240,232,0.6)", textTransform: "uppercase" }}>Level Es</label>
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                {(["Normal Ice", "Less Ice", "No Ice"] as const).map((l) => (
                  <button key={l} onClick={() => setIceLevel(l)} style={{ flex: 1, padding: "6px", borderRadius: "6px", border: "1px solid " + (iceLevel === l ? "#D4651C" : "rgba(255,255,255,0.1)"), background: iceLevel === l ? "rgba(212,101,28,0.2)" : "transparent", color: iceLevel === l ? "#D4651C" : "#FFF", fontSize: "0.78rem" }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Opsi Level Gula */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "rgba(245,240,232,0.6)", textTransform: "uppercase" }}>Level Gula</label>
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                {(["Normal Sugar", "Less Sugar", "No Sugar"] as const).map((s) => (
                  <button key={s} onClick={() => setSugarLevel(s)} style={{ flex: 1, padding: "6px", borderRadius: "6px", border: "1px solid " + (sugarLevel === s ? "#D4651C" : "rgba(255,255,255,0.1)"), background: sugarLevel === s ? "rgba(212,101,28,0.2)" : "transparent", color: sugarLevel === s ? "#D4651C" : "#FFF", fontSize: "0.78rem" }}>{s}</button>
                ))}
              </div>
            </div>

            {/* Add-Ons */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "rgba(245,240,232,0.6)", textTransform: "uppercase" }}>Tambahan Add-On</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={extraShot} onChange={(e) => setExtraShot(e.target.checked)} /> Extra Shot (+Rp 4.000)
                </label>
                <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={extraSyrup} onChange={(e) => setExtraSyrup(e.target.checked)} /> Extra Syrup (+Rp 3.000)
                </label>
              </div>
            </div>

            <button onClick={handleSaveCustomizer} style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#D4651C", color: "#FFF", border: "none", fontWeight: "800", fontSize: "0.9rem" }}>
              + Tambahkan Pesanan
            </button>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT & SIMULATOR QRIS */}
      {isCheckoutOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", width: "100%", maxWidth: "420px", padding: "20px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "12px" }}>Pembayaran Pesanan Meja {tableNum}</h3>

            <div style={{ background: "rgba(212,101,28,0.1)", padding: "12px", borderRadius: "10px", textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "0.75rem", color: "rgba(245,240,232,0.7)" }}>TOTAL TAGIHAN</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "#D4651C" }}>Rp {subtotal.toLocaleString("id-ID")}</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "rgba(245,240,232,0.6)", textTransform: "uppercase" }}>Metode Pembayaran</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
                <button onClick={() => setPaymentMethod("qris")} style={{ padding: "10px", borderRadius: "8px", border: "1px solid " + (paymentMethod === "qris" ? "#D4651C" : "rgba(255,255,255,0.1)"), background: paymentMethod === "qris" ? "rgba(212,101,28,0.2)" : "transparent", color: paymentMethod === "qris" ? "#D4651C" : "#FFF", fontWeight: "bold", fontSize: "0.82rem" }}>
                  📲 QRIS / E-Wallet
                </button>
                <button onClick={() => setPaymentMethod("cash")} style={{ padding: "10px", borderRadius: "8px", border: "1px solid " + (paymentMethod === "cash" ? "#D4651C" : "rgba(255,255,255,0.1)"), background: paymentMethod === "cash" ? "rgba(212,101,28,0.2)" : "transparent", color: paymentMethod === "cash" ? "#D4651C" : "#FFF", fontWeight: "bold", fontSize: "0.82rem" }}>
                  💵 Bayar di Kasir
                </button>
              </div>
            </div>

            {paymentMethod === "qris" && (
              <div style={{ background: "#FFF", color: "#111", padding: "14px", borderRadius: "12px", textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontWeight: "800", fontSize: "0.85rem", marginBottom: "4px" }}>Scan QRIS Pembayaran</div>
                <div style={{ fontSize: "0.72rem", color: "#666", marginBottom: "8px" }}>Gopay, OVO, Dana, ShopeePay, BCA</div>
                <svg width="110" height="110" viewBox="0 0 100 100" fill="none" style={{ margin: "0 auto", display: "block" }}>
                  <rect x="5" y="5" width="30" height="30" rx="4" fill="#111" />
                  <rect x="10" y="10" width="20" height="20" rx="2" fill="#FFF" />
                  <rect x="15" y="15" width="10" height="10" fill="#D4651C" />
                  <rect x="65" y="5" width="30" height="30" rx="4" fill="#111" />
                  <rect x="70" y="10" width="20" height="20" rx="2" fill="#FFF" />
                  <rect x="75" y="15" width="10" height="10" fill="#D4651C" />
                  <rect x="5" y="65" width="30" height="30" rx="4" fill="#111" />
                  <rect x="10" y="70" width="20" height="20" rx="2" fill="#FFF" />
                  <rect x="15" y="75" width="10" height="10" fill="#D4651C" />
                  <rect x="40" y="40" width="20" height="20" fill="#D4651C" rx="4" />
                </svg>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button onClick={() => setIsCheckoutOpen(false)} style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", color: "#FFF", border: "none" }}>Batal</button>
              <button onClick={handlePayOnline} disabled={isSubmitting} style={{ padding: "10px", borderRadius: "8px", background: "#D4651C", color: "#FFF", border: "none", fontWeight: "bold" }}>
                {isSubmitting ? "Memproses..." : "Konfirmasi Pembayaran ➔"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUKSES BERHASIL ORDER */}
      {isOrderComplete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎉</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#4ade80", marginBottom: "6px" }}>Pesanan Diterima!</h2>
          <p style={{ color: "rgba(245,240,232,0.7)", fontSize: "0.88rem", marginBottom: "20px" }}>
            No. Invoice: <strong>{completedInvoice}</strong><br />
            Pesanan Meja <strong>{tableNum}</strong> sedang disiapkan oleh barista &amp; dapur.
          </p>
          <button onClick={() => setIsOrderComplete(false)} style={{ padding: "12px 24px", borderRadius: "10px", background: "#D4651C", color: "#FFF", border: "none", fontWeight: "bold" }}>
            Pesan Menu Lain ➔
          </button>
        </div>
      )}

    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, color: '#F5F0E8' }}>Loading menu...</div>}>
      <OrderPageContent />
    </Suspense>
  );
}
