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
import { assertRole } from "@/lib/authGuard";

export type { TableOrder, TableOrderItem };

// 1. Ambil Seluruh Pesanan Meja (KDS & Kasir View) — Persisten Antar Refresh
export async function getTableOrders(): Promise<{ success: boolean; orders: TableOrder[] }> {
  const store = loadMasterStore();
  return { success: true, orders: store.tableOrders || [] };
}

// 2. Buat Pesanan Baru dari Customer Mobile (/order) atau Kasir POS
export async function createTableOrder(
  orderData: Omit<TableOrder, "id" | "created_at">,
  options?: { skipShiftAndStockDeduction?: boolean }
): Promise<{ success: boolean; order: TableOrder }> {
  const store = loadMasterStore();
  const newOrder: TableOrder = {
    ...orderData,
    id: "ord-" + Date.now(),
    created_at: new Date().toISOString(),
  };

  store.tableOrders.unshift(newOrder);

  // Jika bukan dari Kasir POS (yang sudah memotong stok & mencatat shift mandiri), proses otomatis
  if (!options?.skipShiftAndStockDeduction) {
    // Potong stok bahan baku mentah otomatis
    await deductRawIngredientsForItems(newOrder.items, newOrder.invoice_number);

    // Jika pembayaran QRIS lunas, otomatis masukkan ke pembukuan shift kasir
    if (newOrder.payment_status === "paid") {
      await recordSaleToActiveShift(newOrder.payment_method, newOrder.total_amount);
    }
  }

  saveMasterStore(store);

  // Simpan ke Supabase via Admin Client
  try {
    const supabase = createAdminClient();
    await supabase.from("transactions").insert({
      invoice_number: newOrder.invoice_number,
      total_amount: newOrder.total_amount,
      payment_method: newOrder.payment_method,
      paid_amount: newOrder.total_amount,
      change_amount: 0,
      cashier_name: newOrder.source === "kasir_pos" ? "Kasir POS (Counter)" : `Self-Order ${newOrder.table_number}`,
      status: newOrder.status,
    });
  } catch (e) {
    console.warn("DB insert fallback:", e);
  }

  return { success: true, order: newOrder };
}

// 3. Update Status Alur Pesanan (Pending -> Processing -> Ready -> Completed)
export async function updateTableOrderStatus(
  orderId: string,
  newStatus: "pending" | "processing" | "ready" | "completed" | "cancelled"
): Promise<{ success: boolean; order?: TableOrder }> {
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

// 4. Hapus Pesanan Spesifik dari Antrean KDS
export async function deleteTableOrder(orderId: string): Promise<{ success: boolean }> {
  const store = loadMasterStore();
  store.tableOrders = store.tableOrders.filter((o) => o.id !== orderId);
  saveMasterStore(store);
  return { success: true };
}

// 5. Bersihkan Seluruh Antrean KDS (Reset Antrean)
export async function clearAllTableOrders(): Promise<{ success: boolean }> {
  await assertRole(["admin"]);
  const store = loadMasterStore();
  store.tableOrders = [];
  saveMasterStore(store);
  return { success: true };
}
