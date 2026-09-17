"use client";
// app/dashboard/components/KasirView.tsx — Tampilan POS khusus Kasir (Layout Non-Cutoff & Big Search)

import { useState, useEffect } from "react";
import { ProductItem, CategoryItem, CartItem, saveTransaction, TransactionPayload } from "@/app/actions/posActions";
import ReceiptModal from "./ReceiptModal";
import KitchenDisplayModal, { playKitchenChime } from "./KitchenDisplayModal";
import ShiftManagerModal from "./ShiftManagerModal";
import { getActiveShift, recordSaleToActiveShift, CashierShift } from "@/app/actions/shiftActions";
import { getTableOrders, createTableOrder } from "@/app/actions/orderActions";
import { deductRawIngredientsForItems } from "@/app/actions/ingredientActions";
import { getProductType, formatItemModifiersSummary } from "@/app/utils/productUtils";
import Link from "next/link";

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

  // KDS (Kitchen Display System) State
  const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
  const [pendingTableOrdersCount, setPendingTableOrdersCount] = useState(0);

  // Real-time Toast Notification State
  const [toastNotification, setToastNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Shift Kasir State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<CashierShift | null>(null);

  // Mobile POS Cart Sheet State
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    async function initShiftAndOrders() {
      const shiftRes = await getActiveShift();
      if (shiftRes.shift) setActiveShift(shiftRes.shift);

      const ordRes = await getTableOrders();
      if (ordRes.orders) {
        const count = ordRes.orders.filter((o) => o.status === "pending" || o.status === "processing").length;
        setPendingTableOrdersCount(count);
      }
    }
    initShiftAndOrders();

    // Polling setiap 5 detik untuk order masuk dari HP pelanggan & sinkronisasi KDS
    const interval = setInterval(async () => {
      const ordRes = await getTableOrders();
      if (ordRes.orders) {
        const activeOrders = ordRes.orders.filter((o) => o.status === "pending" || o.status === "processing");
        const count = activeOrders.length;
        setPendingTableOrdersCount((prev) => {
          if (count > prev && prev !== 0) {
            playKitchenChime();
            const latest = activeOrders[0];
            setToastNotification({
              show: true,
              title: "🔔 Pesanan Baru Masuk Antrean Dapur!",
              message: latest
                ? `${latest.table_number} (${latest.source === "kasir_pos" ? "Kasir POS" : "QR Pelanggan"}) • Total: Rp ${latest.total_amount.toLocaleString("id-ID")}`
                : "Ada pesanan baru masuk ke antrean KDS.",
            });
            setTimeout(() => setToastNotification(null), 5000);
          }
          return count;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      q === "" ||
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));
    if (!matchSearch) return false;

    const pType = getProductType(p);
    if (selectedCategory === "all") return pType !== "retail";
    if (selectedCategory === "kopi") return pType === "coffee";
    if (selectedCategory === "nonkopi") return pType === "beverage";
    if (selectedCategory === "makanan") return pType === "food";
    if (selectedCategory === "snack") return pType === "snack";
    if (selectedCategory === "retail") return pType === "retail";

    return true;
  });

  // Customizer Modal State
  const [customizerProduct, setCustomizerProduct] = useState<ProductItem | null>(null);
  const [customizerCartIndex, setCustomizerCartIndex] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<"Dine In" | "Takeaway">("Dine In");
  const [tableNumber, setTableNumber] = useState("Meja 01");

  // Drink Modifiers
  const [iceLevel, setIceLevel] = useState<"Normal Ice" | "Less Ice" | "No Ice">("Normal Ice");
  const [sugarLevel, setSugarLevel] = useState<"Normal Sugar" | "Less Sugar" | "No Sugar">("Normal Sugar");
  const [extraShot, setExtraShot] = useState(false);
  const [extraSyrup, setExtraSyrup] = useState(false);

  // Food Modifiers
  const [spicyLevel, setSpicyLevel] = useState<"Tidak Pedas" | "Sedang" | "Pedas Mantap">("Sedang");
  const [extraEgg, setExtraEgg] = useState(false);
  const [extraSambal, setExtraSambal] = useState(false);

  // Snack / Pastry Modifiers
  const [warmOption, setWarmOption] = useState<"Hangat / Toasted" | "Normal">("Hangat / Toasted");
  const [extraCheese, setExtraCheese] = useState(false);

  const [customNote, setCustomNote] = useState("");

  const openCustomizer = (product: ProductItem, existingCartIdx?: number) => {
    const type = getProductType(product);

    // JIKA BARANG RETAIL / SEMBAKO (cth: Minyak Goreng, Sabun, Beras):
    // Langsung tambahkan ke keranjang kasir tanpa modal es/gula
    if (type === "retail") {
      setCart((prev) => [
        ...prev,
        {
          product,
          quantity: 1,
          note: "",
          modifiers: {
            orderType,
            tableNumber: orderType === "Dine In" ? tableNumber : undefined,
          },
        },
      ]);
      return;
    }

    setCustomizerProduct(product);
    if (existingCartIdx !== undefined && existingCartIdx !== null) {
      setCustomizerCartIndex(existingCartIdx);
      const existing = cart[existingCartIdx];
      if (existing?.modifiers) {
        setOrderType(existing.modifiers.orderType || "Dine In");
        setTableNumber(existing.modifiers.tableNumber || "Meja 01");
        setIceLevel(existing.modifiers.iceLevel || "Normal Ice");
        setSugarLevel(existing.modifiers.sugarLevel || "Normal Sugar");
        setSpicyLevel(existing.modifiers.spicyLevel || "Sedang");
        setWarmOption(existing.modifiers.warmOption || "Hangat / Toasted");
        setExtraShot(existing.modifiers.addOns?.includes("Extra Shot (+Rp 4.000)") || false);
        setExtraSyrup(existing.modifiers.addOns?.includes("Extra Syrup (+Rp 3.000)") || false);
        setExtraEgg(existing.modifiers.addOns?.includes("Telur Ceplok (+Rp 4.000)") || false);
        setExtraSambal(existing.modifiers.addOns?.includes("Ekstra Sambal (+Rp 3.000)") || false);
        setExtraCheese(existing.modifiers.addOns?.includes("Ekstra Topping (+Rp 3.000)") || false);
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
    setSpicyLevel("Sedang");
    setWarmOption("Hangat / Toasted");
    setExtraShot(false);
    setExtraSyrup(false);
    setExtraEgg(false);
    setExtraSambal(false);
    setExtraCheese(false);
    setCustomNote("");
  };

  const handleSaveCustomizer = () => {
    if (!customizerProduct) return;

    const type = getProductType(customizerProduct);
    const addOns: string[] = [];
    let addOnPrice = 0;

    if (type === "coffee" || type === "beverage") {
      if (extraShot) {
        addOns.push("Extra Shot (+Rp 4.000)");
        addOnPrice += 4000;
      }
      if (extraSyrup) {
        addOns.push("Extra Syrup (+Rp 3.000)");
        addOnPrice += 3000;
      }
    } else if (type === "food") {
      if (extraEgg) {
        addOns.push("Telur Ceplok (+Rp 4.000)");
        addOnPrice += 4000;
      }
      if (extraSambal) {
        addOns.push("Ekstra Sambal (+Rp 3.000)");
        addOnPrice += 3000;
      }
    } else if (type === "snack") {
      if (extraCheese) {
        addOns.push("Ekstra Topping (+Rp 3.000)");
        addOnPrice += 3000;
      }
    }

    const modifierObj = {
      orderType,
      tableNumber: orderType === "Dine In" ? tableNumber : undefined,
      iceLevel: (type === "coffee" || type === "beverage") ? iceLevel : undefined,
      sugarLevel: (type === "coffee" || type === "beverage") ? sugarLevel : undefined,
      spicyLevel: type === "food" ? spicyLevel : undefined,
      warmOption: type === "snack" ? warmOption : undefined,
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
    return formatItemModifiersSummary(item.modifiers, item.note);
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

    // Dapatkan target nomor meja dan tipe pesanan untuk antrean Dapur (KDS)
    const firstTable = cart.find((c) => c.modifiers?.tableNumber)?.modifiers?.tableNumber;
    const firstOrderType = cart.find((c) => c.modifiers?.orderType)?.modifiers?.orderType || orderType;
    const targetTableNumber = firstOrderType === "Takeaway" 
      ? "Takeaway (Kasir)" 
      : (firstTable || tableNumber || "Meja 01");

    // Otomatis teruskan pesanan kasir ke antrean Kitchen Display System (KDS)
    await createTableOrder(
      {
        invoice_number: invoiceNum,
        table_number: targetTableNumber,
        branch_name: branchName,
        payment_method: paymentMethod,
        payment_status: "paid",
        status: "pending",
        total_amount: totalAmount,
        source: "kasir_pos",
        items: payload.items.map((it) => ({
          product_name: it.product_name,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal,
          modifiers_summary: it.modifiers_summary,
        })),
      },
      { skipShiftAndStockDeduction: true }
    );

    // Mainkan lonceng Web Audio API
    playKitchenChime();

    // Naikkan badge counter KDS seketika
    setPendingTableOrdersCount((prev) => prev + 1);

    // Tampilkan Toast Notifikasi
    setToastNotification({
      show: true,
      title: "🔔 Pesanan Masuk Antrean Dapur (KDS)!",
      message: `${targetTableNumber} • ${invoiceNum} • Total: Rp ${totalAmount.toLocaleString("id-ID")}`,
    });
    setTimeout(() => setToastNotification(null), 5000);

    // Otomatis potong stok bahan baku mentah
    await deductRawIngredientsForItems(payload.items);

    // Otomatis catat ke shift kasir yang sedang aktif
    const shiftRes = await recordSaleToActiveShift(payload.payment_method, payload.total_amount);
    if (shiftRes.shift) {
      setActiveShift(shiftRes.shift);
    }

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

  // Kategori Bersih Khusus F&B & Retail
  const CATEGORY_TABS = [
    { id: "all", label: "Semua Menu F&B", icon: "🌐" },
    { id: "kopi", label: "Kopi & Espresso", icon: "☕" },
    { id: "nonkopi", label: "Non-Coffee & Mocktail", icon: "🍹" },
    { id: "makanan", label: "Makanan Utama", icon: "🍱" },
    { id: "snack", label: "Pastry & Snack", icon: "🥐" },
    { id: "retail", label: "Retail / Lainnya", icon: "🛒" },
  ];

  const renderCartContent = (isMobileSheet: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* Header Tiket */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0
        }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0 }}>
            Pesanan Aktif {isMobileSheet && cart.length > 0 && `(${cart.reduce((s, c) => s + c.quantity, 0)})`}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {cart.length > 0 && (
              <button onClick={clearCart} style={{ background: "none", border: "none", color: "#f87171", fontSize: "0.78rem", cursor: "pointer", fontWeight: "600" }}>
                Hapus Semua
              </button>
            )}
            {isMobileSheet && (
              <button
                onClick={() => setIsMobileCartOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  color: "#F5F0E8",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* QUICK DINE IN / TAKEAWAY & TABLE SELECTOR */}
        <div style={{
          display: "flex",
          gap: "6px",
          marginBottom: "8px",
          background: "rgba(255,255,255,0.03)",
          padding: "4px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={() => setOrderType("Dine In")}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: "6px",
              border: "none",
              background: orderType === "Dine In" ? "#D4651C" : "transparent",
              color: orderType === "Dine In" ? "#FFF" : "rgba(245,240,232,0.6)",
              fontSize: "0.75rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            🪑 Dine In
          </button>
          <button
            type="button"
            onClick={() => setOrderType("Takeaway")}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: "6px",
              border: "none",
              background: orderType === "Takeaway" ? "#D4651C" : "transparent",
              color: orderType === "Takeaway" ? "#FFF" : "rgba(245,240,232,0.6)",
              fontSize: "0.75rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            🛍️ Takeaway
          </button>
        </div>

        {orderType === "Dine In" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
            <span style={{ fontSize: "0.75rem", color: "rgba(245,240,232,0.6)", fontWeight: "600" }}>No. Meja:</span>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              style={{
                flex: 1,
                padding: "5px 8px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#F5F0E8",
                fontSize: "0.78rem",
                fontWeight: "bold",
                outline: "none",
              }}
            >
              {["Meja 01", "Meja 02", "Meja 03", "Meja 04", "Meja 05", "Meja 06", "Meja 07", "Meja 08", "Meja 09", "Meja 10", "Bar Counter"].map((tbl) => (
                <option key={tbl} value={tbl} style={{ background: "#181818", color: "#FFF" }}>
                  {tbl}
                </option>
              ))}
            </select>
          </div>
        )}

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(245,240,232,0.4)" }}>
            <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>🛒</div>
            <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>Belum ada item dipilih.</p>
            <p style={{ fontSize: "0.72rem", opacity: 0.7 }}>Klik produk untuk menambah ke pesanan.</p>
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
          onClick={() => {
            if (isMobileSheet) setIsMobileCartOpen(false);
            handleOpenPayment();
          }}
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
  );

  return (
    <div className="growkas-pos-grid" style={{
      display: "grid",
      gap: "18px",
      width: "100%",
      maxWidth: "100%",
      height: "calc(100vh - 84px)",
      boxSizing: "border-box",
      overflow: "hidden",
      position: "relative",
    }}>
      
      {/* KATALOG PRODUK (KIRI) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: 0, height: "100%", overflow: "hidden" }}>
        
        {/* BARIS 0: TOP OPERATIONAL TOOLBAR (KDS ORDERS & SHIFT CONTROL) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setIsKitchenModalOpen(true)}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                background: pendingTableOrdersCount > 0 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                border: "1px solid " + (pendingTableOrdersCount > 0 ? "#EF4444" : "rgba(255,255,255,0.12)"),
                color: pendingTableOrdersCount > 0 ? "#EF4444" : "#FFF",
                fontSize: "0.82rem",
                fontWeight: "800",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>🍳</span> Pesanan Meja (KDS)
              {pendingTableOrdersCount > 0 && (
                <span style={{
                  background: "#EF4444",
                  color: "#FFF",
                  fontSize: "0.72rem",
                  fontWeight: "900",
                  padding: "2px 7px",
                  borderRadius: "10px",
                }}>
                  {pendingTableOrdersCount} BARU
                </span>
              )}
            </button>

            <Link
              href="/kitchen"
              target="_blank"
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                background: "rgba(212,101,28,0.12)",
                border: "1px solid rgba(212,101,28,0.3)",
                color: "#D4651C",
                fontSize: "0.8rem",
                fontWeight: "700",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>📺</span> Buka Layar Dapur ↗
            </Link>
          </div>

          <button
            onClick={() => setIsShiftModalOpen(true)}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              background: activeShift ? "rgba(74,222,128,0.12)" : "rgba(245,158,11,0.12)",
              border: "1px solid " + (activeShift ? "rgba(74,222,128,0.4)" : "rgba(245,158,11,0.4)"),
              color: activeShift ? "#4ADE80" : "#F59E0B",
              fontSize: "0.82rem",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: activeShift ? "#4ADE80" : "#F59E0B",
              display: "inline-block",
            }} />
            <span>
              {activeShift
                ? `Shift Aktif (${activeShift.cashier_name} • Kas: Rp ${activeShift.expected_cash.toLocaleString("id-ID")})`
                : "Buka Shift Kasir"}
            </span>
          </button>
        </div>

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
          gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))",
          gap: "12px",
          overflowY: "auto",
          paddingRight: "4px",
          paddingBottom: "80px",
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

      {/* TIKET PESANAN / KERANJANG (KANAN - DESKTOP ONLY >= 1024px) */}
      <div className="growkas-pos-desktop-cart" style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "16px",
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}>
        {renderCartContent(false)}
      </div>

      {/* FLOATING STICKY BOTTOM CART BAR KHUSUS MOBILE & TABLET (< 1024px) */}
      {cart.length > 0 && (
        <div
          className="growkas-pos-mobile-cart-bar safe-area-bottom animate-slide-up"
          onClick={() => setIsMobileCartOpen(true)}
          style={{
            position: "fixed",
            bottom: "16px",
            left: "14px",
            right: "14px",
            zIndex: 80,
            background: "linear-gradient(135deg, #D4651C 0%, #B85214 100%)",
            borderRadius: "14px",
            padding: "12px 16px",
            color: "#FFF",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 30px rgba(212,101,28,0.5)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              background: "rgba(0,0,0,0.25)",
              borderRadius: "8px",
              padding: "6px 10px",
              fontWeight: "900",
              fontSize: "0.85rem",
            }}>
              🛒 {cart.reduce((s, c) => s + c.quantity, 0)} Item
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", opacity: 0.85, fontWeight: "600" }}>
                {orderType === "Dine In" ? `🪑 ${tableNumber}` : "🛍️ Takeaway"}
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: "900" }}>
                Rp {totalAmount.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          <button
            style={{
              background: "#FFF",
              color: "#D4651C",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              fontWeight: "900",
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Lihat Pesanan ➔
          </button>
        </div>
      )}

      {/* OFF-CANVAS SLIDE-UP BOTTOM SHEET CART MODAL KHUSUS MOBILE & TABLET (< 1024px) */}
      {isMobileCartOpen && (
        <div
          onClick={() => setIsMobileCartOpen(false)}
          className="animate-fade-in"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 950,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-slide-up safe-area-bottom"
            style={{
              background: "#141414",
              borderTop: "1px solid rgba(255,255,255,0.15)",
              borderTopLeftRadius: "20px",
              borderTopRightRadius: "20px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              padding: "16px 16px 20px",
              boxSizing: "border-box",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ width: "40px", height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", margin: "0 auto 12px" }} />
            {renderCartContent(true)}
          </div>
        </div>
      )}

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

            {/* OPSI KHUSUS MINUMAN (KOPI / NON-COFFEE) */}
            {(getProductType(customizerProduct) === "coffee" || getProductType(customizerProduct) === "beverage") && (
              <>
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

                {/* OPSI 4: EKSTRA ADD-ON MINUMAN */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
                    Tambahan Add-On Minuman
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
              </>
            )}

            {/* OPSI KHUSUS MAKANAN UTAMA (FOOD) */}
            {getProductType(customizerProduct) === "food" && (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
                    Level Kepedasan
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["Tidak Pedas", "Sedang", "Pedas Mantap"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSpicyLevel(lvl)}
                        style={{
                          flex: 1, padding: "6px", borderRadius: "6px",
                          border: "1px solid " + (spicyLevel === lvl ? "#D4651C" : "rgba(255,255,255,0.1)"),
                          background: spicyLevel === lvl ? "rgba(212,101,28,0.2)" : "rgba(255,255,255,0.03)",
                          color: spicyLevel === lvl ? "#D4651C" : "#F5F0E8", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer",
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
                    Tambahan Lauk / Topping
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", cursor: "pointer" }}>
                      <input type="checkbox" checked={extraEgg} onChange={(e) => setExtraEgg(e.target.checked)} />
                      <span>🍳 Telur Ceplok (+Rp 4.000)</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", cursor: "pointer" }}>
                      <input type="checkbox" checked={extraSambal} onChange={(e) => setExtraSambal(e.target.checked)} />
                      <span>🌶️ Ekstra Sambal (+Rp 3.000)</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* OPSI KHUSUS SNACK / PASTRY / ROTI */}
            {getProductType(customizerProduct) === "snack" && (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
                    Pilihan Penyajian
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["Hangat / Toasted", "Normal"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setWarmOption(opt)}
                        style={{
                          flex: 1, padding: "6px", borderRadius: "6px",
                          border: "1px solid " + (warmOption === opt ? "#D4651C" : "rgba(255,255,255,0.1)"),
                          background: warmOption === opt ? "rgba(212,101,28,0.2)" : "rgba(255,255,255,0.03)",
                          color: warmOption === opt ? "#D4651C" : "#F5F0E8", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer",
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", display: "block", marginBottom: "6px" }}>
                    Tambahan
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", cursor: "pointer" }}>
                      <input type="checkbox" checked={extraCheese} onChange={(e) => setExtraCheese(e.target.checked)} />
                      <span>🧀 Ekstra Keju / Topping (+Rp 3.000)</span>
                    </label>
                  </div>
                </div>
              </>
            )}

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

      {/* MODAL KDS & PESANAN MEJA MASUK */}
      {isKitchenModalOpen && (
        <KitchenDisplayModal
          onClose={() => setIsKitchenModalOpen(false)}
          onOrderCountChanged={setPendingTableOrdersCount}
        />
      )}

      {/* MODAL MANAJEMEN SHIFT KASIR */}
      {isShiftModalOpen && (
        <ShiftManagerModal
          currentShift={activeShift}
          cashierName={userSession?.user?.name || "Kasir Saray"}
          onShiftUpdated={setActiveShift}
          onClose={() => setIsShiftModalOpen(false)}
        />
      )}

      {/* TOAST NOTIFIKASI REAL-TIME */}
      {toastNotification && toastNotification.show && (
        <div
          onClick={() => setToastNotification(null)}
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
            background: "linear-gradient(135deg, #1C1917 0%, #292524 100%)",
            border: "1.5px solid #D4651C",
            boxShadow: "0 10px 30px rgba(212, 101, 28, 0.4)",
            borderRadius: "14px",
            padding: "12px 22px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ fontSize: "1.6rem" }}>🔔</span>
          <div>
            <div style={{ fontWeight: "800", fontSize: "0.92rem", color: "#F5F0E8" }}>
              {toastNotification.title}
            </div>
            <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.85)" }}>
              {toastNotification.message}
            </div>
          </div>
          <span style={{ marginLeft: "10px", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>✕</span>
        </div>
      )}

    </div>
  );
}
