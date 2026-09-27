"use server";

import { createAdminClient } from "../../lib/supabase/admin";
import { deductRawIngredientsForItems } from "./ingredientActions";
import { recordSaleToActiveShift } from "./shiftActions";
import {
  TableOrder,
  TableOrderItem,
  loadMasterStore,
  saveMasterStore,
} from "./storeManager";
import { assertAuthenticated, assertRole } from "@/lib/authGuard";

export type { TableOrder, TableOrderItem };

// 1. Ambil Seluruh Pesanan Meja dari public.table_orders join table_order_items
export async function getTableOrders(): Promise<{ success: boolean; orders: TableOrder[] }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("table_orders")
      .select(`
        id,
        invoice_number,
        table_number,
        branch_name,
        payment_method,
        payment_status,
        status,
        total_amount,
        created_at,
        table_order_items (
          product_name,
          quantity,
          price,
          subtotal,
          modifiers_summary
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data && data.length >= 0) {
      const orders: TableOrder[] = data.map((o: any) => ({
        id: o.id,
        invoice_number: o.invoice_number,
        table_number: o.table_number,
        branch_name: o.branch_name,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        status: o.status,
        total_amount: Number(o.total_amount || 0),
        created_at: o.created_at,
        items: (o.table_order_items || []).map((it: any) => ({
          product_name: it.product_name,
          quantity: Number(it.quantity || 1),
          price: Number(it.price || 0),
          subtotal: Number(it.subtotal || 0),
          modifiers_summary: it.modifiers_summary || undefined,
        })),
      }));

      // Keep in-memory store in sync
      const store = loadMasterStore();
      store.tableOrders = orders;
      saveMasterStore(store);
      return { success: true, orders };
    }
  } catch (err) {
    console.warn("Supabase getTableOrders notice (using in-memory fallback):", err);
  }

  const store = loadMasterStore();
  return { success: true, orders: store.tableOrders || [] };
}

// 2. Buat Pesanan Baru dari Customer Mobile (/order) atau Kasir POS
export async function createTableOrder(
  orderData: Omit<TableOrder, "id" | "created_at">,
  options?: { skipShiftAndStockDeduction?: boolean }
): Promise<{ success: boolean; order: TableOrder }> {
  // Keamanan Transaksi QR Self-Order & POS:
  // Jika pemanggil mengklaim source: "kasir_pos" atau mencoba payment_status: "paid",
  // verifikasi bahwa pemanggil memiliki sesi autentikasi yang sah (kasir/admin).
  // Jika tidak terautentikasi (pengguna anonim / QR mobile), paksa payment_status = "unpaid" dan source = "customer_qr".
  let isCustomerQr = orderData.source === "customer_qr" || !orderData.source;
  let source = orderData.source || "customer_qr";
  let paymentStatus: "paid" | "unpaid" = orderData.payment_status || "unpaid";

  if (orderData.source === "kasir_pos" || orderData.payment_status === "paid") {
    try {
      await assertAuthenticated();
    } catch {
      isCustomerQr = true;
      source = "customer_qr";
      paymentStatus = "unpaid";
    }
  }

  if (isCustomerQr) {
    paymentStatus = "unpaid";
  }

  const store = loadMasterStore();
  const newOrder: TableOrder = {
    ...orderData,
    source,
    payment_status: paymentStatus,
    id: "ord-" + Date.now(),
    created_at: new Date().toISOString(),
  };

  store.tableOrders.unshift(newOrder);

  // Jika bukan dari Kasir POS (yang sudah memotong stok & mencatat shift mandiri), proses otomatis
  if (!options?.skipShiftAndStockDeduction) {
    // Potong stok bahan baku mentah otomatis
    await deductRawIngredientsForItems(newOrder.items, newOrder.invoice_number);

    // Jika pembayaran lunas (misal transaksi kasir pos), otomatis masukkan ke pembukuan shift kasir
    if (newOrder.payment_status === "paid") {
      await recordSaleToActiveShift(newOrder.payment_method, newOrder.total_amount);
    }
  }

  saveMasterStore(store);

  // Simpan ke Supabase PostgreSQL tables: public.table_orders & public.table_order_items
  try {
    const supabase = createAdminClient();

    // 1. Insert header ke table_orders
    await supabase.from("table_orders").insert({
      id: newOrder.id,
      invoice_number: newOrder.invoice_number,
      table_number: newOrder.table_number,
      branch_name: newOrder.branch_name,
      payment_method: newOrder.payment_method,
      payment_status: newOrder.payment_status,
      status: newOrder.status,
      total_amount: newOrder.total_amount,
      created_at: newOrder.created_at,
    });

    // 2. Insert detail items ke table_order_items
    if (newOrder.items && newOrder.items.length > 0) {
      const orderItems = newOrder.items.map((it) => ({
        order_id: newOrder.id,
        product_name: it.product_name,
        price: it.price,
        quantity: it.quantity,
        subtotal: it.subtotal,
        modifiers_summary: it.modifiers_summary || null,
      }));
      await supabase.from("table_order_items").insert(orderItems);
    }

    // 3. Simpan juga transaksi ke tabel transactions jika pembayaran sudah lunas dan belum disimpan oleh kasir POS
    if (newOrder.payment_status === "paid" && !options?.skipShiftAndStockDeduction) {
      await supabase.from("transactions").insert({
        invoice_number: newOrder.invoice_number,
        total_amount: newOrder.total_amount,
        payment_method: newOrder.payment_method,
        paid_amount: newOrder.total_amount,
        change_amount: 0,
        cashier_name: newOrder.source === "kasir_pos" ? "Kasir POS (Counter)" : `Self-Order ${newOrder.table_number}`,
        status: newOrder.status,
      });
    }
  } catch (e) {
    console.warn("Supabase createTableOrder notice (in-memory fallback active):", e);
  }

  return { success: true, order: newOrder };
}

// 3. Update Status Alur Pesanan di public.table_orders (Pending -> Processing -> Ready -> Completed)
export async function updateTableOrderStatus(
  orderId: string,
  newStatus: "pending" | "processing" | "ready" | "completed" | "cancelled"
): Promise<{ success: boolean; order?: TableOrder }> {
  await assertRole(["admin", "kasir"]);
  let wasUnpaid = false;
  let orderTotal = 0;

  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("table_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (existing) {
      wasUnpaid = existing.payment_status === "unpaid";
      orderTotal = Number(existing.total_amount || 0);

      const updates: any = { status: newStatus };
      if (newStatus === "completed" && wasUnpaid) {
        updates.payment_status = "paid";
      }

      await supabase
        .from("table_orders")
        .update(updates)
        .eq("id", orderId);

      if (newStatus === "completed" && wasUnpaid) {
        await recordSaleToActiveShift("cash", orderTotal);
      }
    }
  } catch (err) {
    console.warn("Supabase updateTableOrderStatus notice (in-memory fallback active):", err);
  }

  const store = loadMasterStore();
  const ord = store.tableOrders.find((o) => o.id === orderId);
  if (!ord) {
    return { success: false };
  }

  ord.status = newStatus;

  // Jika bayar kasir baru diselesaikan di kasir
  if (newStatus === "completed" && ord.payment_status === "unpaid") {
    ord.payment_status = "paid";
    await recordSaleToActiveShift("cash", ord.total_amount);
  }

  saveMasterStore(store);
  return { success: true, order: ord };
}

// 4. Hapus Pesanan Spesifik dari Antrean KDS (public.table_orders cascade)
export async function deleteTableOrder(orderId: string): Promise<{ success: boolean }> {
  await assertRole(["admin"]);

  try {
    const supabase = createAdminClient();
    await supabase.from("table_orders").delete().eq("id", orderId);
  } catch (err) {
    console.warn("Supabase deleteTableOrder notice (in-memory fallback active):", err);
  }

  const store = loadMasterStore();
  store.tableOrders = store.tableOrders.filter((o) => o.id !== orderId);
  saveMasterStore(store);
  return { success: true };
}

// 5. Bersihkan Seluruh Antrean KDS (public.table_orders)
export async function clearAllTableOrders(): Promise<{ success: boolean }> {
  await assertRole(["admin"]);

  try {
    const supabase = createAdminClient();
    await supabase.from("table_orders").delete().neq("id", "");
  } catch (err) {
    console.warn("Supabase clearAllTableOrders notice (in-memory fallback active):", err);
  }

  const store = loadMasterStore();
  store.tableOrders = [];
  saveMasterStore(store);
  return { success: true };
}
