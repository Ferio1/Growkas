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
  payment_method: "qris" | "cash";
  payment_status: "paid" | "unpaid";
  status: "pending" | "processing" | "ready" | "completed" | "cancelled";
  total_amount: number;
  created_at: string;
  items: TableOrderItem[];
}

// In-Memory Live Table Orders Store
let LIVE_TABLE_ORDERS: TableOrder[] = [
  {
    id: "ord-101",
    invoice_number: "ORD-942810",
    table_number: "Meja 04",
    branch_name: "Saray Coffee & Space (Yogyakarta)",
    payment_method: "qris",
    payment_status: "paid",
    status: "pending", // Pesanan Masuk (Baru)
    total_amount: 51000,
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 menit lalu
    items: [
      {
        product_name: "Saray Signature Palm Sugar",
        quantity: 1,
        price: 26000,
        subtotal: 26000,
        modifiers_summary: "Less Ice • Normal Sugar • Extra Shot (+Rp 4.000)",
      },
      {
        product_name: "Signature Matcha Latte",
        quantity: 1,
        price: 25000,
        subtotal: 25000,
        modifiers_summary: "Normal Ice • Less Sugar",
      },
    ],
  },
  {
    id: "ord-102",
    invoice_number: "ORD-651923",
    table_number: "Meja 02",
    branch_name: "Saray Coffee & Space (Yogyakarta)",
    payment_method: "cash",
    payment_status: "unpaid",
    status: "processing", // Sedang Dimasak
    total_amount: 56000,
    created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(), // 9 menit lalu
    items: [
      {
        product_name: "Rice Bowl Ayam Sambal Matah",
        quantity: 2,
        price: 28000,
        subtotal: 56000,
        modifiers_summary: "Pedas Sedang • Sambal Pisah",
      },
    ],
  },
];

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

// 2. Buat Pesanan Baru dari Customer Mobile (/order)
export async function createTableOrder(orderData: Omit<TableOrder, "id" | "created_at">): Promise<{ success: boolean; order: TableOrder }> {
  const newOrder: TableOrder = {
    ...orderData,
    id: "ord-" + Date.now(),
    created_at: new Date().toISOString(),
  };

  LIVE_TABLE_ORDERS.unshift(newOrder);

  // Potong stok bahan baku mentah otomatis
  await deductRawIngredientsForItems(newOrder.items);

  // Jika pembayaran QRIS lunas, otomatis masukkan ke pembukuan shift kasir
  if (newOrder.payment_status === "paid") {
    await recordSaleToActiveShift(newOrder.payment_method, newOrder.total_amount);
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
      cashier_name: `Self-Order ${newOrder.table_number}`,
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
