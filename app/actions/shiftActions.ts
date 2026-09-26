"use server";

import {
  CashierShift,
  loadMasterStore,
  saveMasterStore,
} from "./storeManager";

export type { CashierShift };

// 1. Dapatkan Status Shift Aktif (Persisten)
export async function getActiveShift(): Promise<{ success: boolean; shift: CashierShift | null }> {
  const store = loadMasterStore();
  return { success: true, shift: store.activeShift };
}

// 2. Buka Shift Baru (Input Modal Awal Laci)
export async function openShift(
  cashierName: string,
  initialCash: number,
  branchName = "7co (Yogyakarta)"
): Promise<{ success: boolean; shift: CashierShift }> {
  const store = loadMasterStore();
  const newShift: CashierShift = {
    id: "shift-" + Date.now(),
    cashier_name: cashierName,
    branch_name: branchName,
    start_time: new Date().toISOString(),
    initial_cash: initialCash,
    cash_sales: 0,
    qris_sales: 0,
    debit_sales: 0,
    total_sales: 0,
    transaction_count: 0,
    expected_cash: initialCash,
    status: "open",
  };

  store.activeShift = newShift;
  saveMasterStore(store);
  return { success: true, shift: newShift };
}

// 3. Catat Penjualan ke Shift yang Sedang Berjalan
export async function recordSaleToActiveShift(
  paymentMethod: "cash" | "qris" | "debit",
  amount: number
) {
  const store = loadMasterStore();

  if (!store.activeShift || store.activeShift.status !== "open") {
    // Jika belum ada shift terbuka, buka shift default
    store.activeShift = {
      id: "shift-" + Date.now(),
      cashier_name: "Kasir Bertugas",
      branch_name: "7co (Yogyakarta)",
      start_time: new Date().toISOString(),
      initial_cash: 0,
      cash_sales: 0,
      qris_sales: 0,
      debit_sales: 0,
      total_sales: 0,
      transaction_count: 0,
      expected_cash: 0,
      status: "open",
    };
  }

  store.activeShift.transaction_count += 1;
  store.activeShift.total_sales += amount;

  if (paymentMethod === "cash") {
    store.activeShift.cash_sales += amount;
    store.activeShift.expected_cash += amount;
  } else if (paymentMethod === "qris") {
    store.activeShift.qris_sales += amount;
  } else if (paymentMethod === "debit") {
    store.activeShift.debit_sales += amount;
  }

  saveMasterStore(store);
  return { success: true, shift: store.activeShift };
}

// 4. Tutup Shift Kasir (Closing POS & Rekonsiliasi Kas Laci)
export async function closeShift(
  actualCash: number,
  notes?: string
): Promise<{ success: boolean; closedShift: CashierShift }> {
  const store = loadMasterStore();
  if (!store.activeShift) {
    throw new Error("Tidak ada shift aktif yang sedang berjalan");
  }

  const discrepancy = actualCash - store.activeShift.expected_cash;

  store.activeShift.end_time = new Date().toISOString();
  store.activeShift.actual_cash = actualCash;
  store.activeShift.discrepancy = discrepancy;
  store.activeShift.status = "closed";
  store.activeShift.notes = notes || "";

  const finished = { ...store.activeShift };
  store.shiftHistory.unshift(finished);
  store.activeShift = null;

  saveMasterStore(store);
  return { success: true, closedShift: finished };
}

// 5. Riwayat Shift Terakhir
export async function getShiftHistory() {
  const store = loadMasterStore();
  return { success: true, history: store.shiftHistory || [] };
}
