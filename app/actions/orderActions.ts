"use server";

import { createClient } from "@/lib/supabase/server";
import { deductRawIngredientsForItems } from "./ingredientActions";
import { recordSaleToActiveShift } from "./shiftActions";

export interface TableOrderItem {
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  modifiers_summary?: string;
}

export interface TableOrder {
  id: string;
  invoice_number: string;
  table_number: string;
  branch_name: string;
  payment_method: "qris" | "cash" | "debit";
  payment_status: "paid" | "unpaid";
  status: "pending" | "processing" | "ready" | "completed" | "cancelled";
  total_amount: number;
  created_at: string;
  items: TableOrderItem[];
  source?: "customer_qr" | "kasir_pos";
}

// In-Memory Live Table Orders Store (Bersih Tanpa Pesanan Dummy Fiktif)
let LIVE_TABLE_ORDERS: TableOrder[] = [];

// 1. Ambil Seluruh Pesanan Meja (KDS & Kasir View)
export async function getTableOrders(): Promise<{ success: boolean; orders: TableOrder[] }> {
  try {
    const supabase = await createClient();
    const { data: dbOrders } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    // Jika ada data di DB, kita bisa menyelaraskan status
    return { success: true, orders: LIVE_TABLE_ORDERS };
  } catch {
    return { success: true, orders: LIVE_TABLE_ORDERS };
  }
}

// 2. Buat Pesanan Baru dari Customer Mobile (/order) atau Kasir POS
export async function createTableOrder(
  orderData: Omit<TableOrder, "id" | "created_at">,
  options?: { skipShiftAndStockDeduction?: boolean }
): Promise<{ success: boolean; order: TableOrder }> {
  const newOrder: TableOrder = {
    ...orderData,
    id: "ord-" + Date.now(),
    created_at: new Date().toISOString(),
  };

  LIVE_TABLE_ORDERS.unshift(newOrder);

  // Jika bukan dari Kasir POS (yang sudah memotong stok & mencatat shift mandiri), proses otomatis
  if (!options?.skipShiftAndStockDeduction) {
    // Potong stok bahan baku mentah otomatis
    await deductRawIngredientsForItems(newOrder.items);

    // Jika pembayaran QRIS lunas, otomatis masukkan ke pembukuan shift kasir
    if (newOrder.payment_status === "paid") {
      await recordSaleToActiveShift(newOrder.payment_method, newOrder.total_amount);
    }
  }

  // Simpan ke Supabase jika tersedia
  try {
    const supabase = await createClient();
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
  const ord = LIVE_TABLE_ORDERS.find((o) => o.id === orderId);
  if (!ord) {
    return { success: false };
  }

  ord.status = newStatus;

  // Jika bayar kasir baru diselesaikan di kasir
  if (newStatus === "completed" && ord.payment_status === "unpaid") {
    ord.payment_status = "paid";
    await recordSaleToActiveShift("cash", ord.total_amount);
  }

  return { success: true, order: ord };
}

// 4. Hapus Pesanan Spesifik dari Antrean KDS
export async function deleteTableOrder(orderId: string): Promise<{ success: boolean }> {
  LIVE_TABLE_ORDERS = LIVE_TABLE_ORDERS.filter((o) => o.id !== orderId);
  return { success: true };
}

// 5. Bersihkan Seluruh Antrean KDS (Reset Antrean)
export async function clearAllTableOrders(): Promise<{ success: boolean }> {
  LIVE_TABLE_ORDERS = [];
  return { success: true };
}
