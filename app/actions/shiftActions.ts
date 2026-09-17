"use server";

export interface CashierShift {
  id: string;
  cashier_name: string;
  branch_name: string;
  start_time: string;
  end_time?: string;
  initial_cash: number; // Modal Kas Awal di Laci (Cash Float)
  cash_sales: number;   // Penjualan Tunai
  qris_sales: number;   // Penjualan QRIS
  debit_sales: number;  // Penjualan Debit/EDC
  total_sales: number;  // Total Omzet selama shift
  transaction_count: number;
  expected_cash: number; // Kas Tunai yang seharusnya di laci = initial_cash + cash_sales
  actual_cash?: number;  // Uang fisik yang dihitung kasir saat tutup shift
  discrepancy?: number;  // Selisih = actual_cash - expected_cash (0 = Balance)
  status: "open" | "closed";
  notes?: string;
}

// In-Memory Active Shift State (dapat disinkronkan ke tabel `cashier_shifts` di Supabase)
let ACTIVE_SHIFT: CashierShift | null = {
  id: "shift-01",
  cashier_name: "Kasir Saray Yogyakarta",
  branch_name: "Saray Coffee & Space (Yogyakarta)",
  start_time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // Dibuka 3 jam lalu
  initial_cash: 200000, // Rp 200.000 modal awal
  cash_sales: 320000,
  qris_sales: 450000,
  debit_sales: 0,
  total_sales: 770000,
  transaction_count: 14,
  expected_cash: 520000, // 200.000 + 320.000
  status: "open",
};

let SHIFT_HISTORY: CashierShift[] = [];

// 1. Dapatkan Status Shift Aktif
export async function getActiveShift(): Promise<{ success: boolean; shift: CashierShift | null }> {
  return { success: true, shift: ACTIVE_SHIFT };
}

// 2. Buka Shift Baru (Input Modal Awal Laci)
export async function openShift(
  cashierName: string,
  initialCash: number,
  branchName = "Saray Coffee & Space (Yogyakarta)"
): Promise<{ success: boolean; shift: CashierShift }> {
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

  ACTIVE_SHIFT = newShift;
  return { success: true, shift: newShift };
}

// 3. Catat Penjualan ke Shift yang Sedang Berjalan
export async function recordSaleToActiveShift(
  paymentMethod: "cash" | "qris" | "debit",
  amount: number
) {
  if (!ACTIVE_SHIFT || ACTIVE_SHIFT.status !== "open") {
    // Jika belum ada shift terbuka, buka shift darurat
    ACTIVE_SHIFT = {
      id: "shift-" + Date.now(),
      cashier_name: "Kasir Bertugas",
      branch_name: "Saray Coffee & Space (Yogyakarta)",
      start_time: new Date().toISOString(),
      initial_cash: 200000,
      cash_sales: 0,
      qris_sales: 0,
      debit_sales: 0,
      total_sales: 0,
      transaction_count: 0,
      expected_cash: 200000,
      status: "open",
    };
  }

  ACTIVE_SHIFT.transaction_count += 1;
  ACTIVE_SHIFT.total_sales += amount;

  if (paymentMethod === "cash") {
    ACTIVE_SHIFT.cash_sales += amount;
    ACTIVE_SHIFT.expected_cash += amount;
  } else if (paymentMethod === "qris") {
    ACTIVE_SHIFT.qris_sales += amount;
  } else if (paymentMethod === "debit") {
    ACTIVE_SHIFT.debit_sales += amount;
  }

  return { success: true, shift: ACTIVE_SHIFT };
}

// 4. Tutup Shift Kasir (Closing POS & Rekonsiliasi Kas Laci)
export async function closeShift(
  actualCash: number,
  notes?: string
): Promise<{ success: boolean; closedShift: CashierShift }> {
  if (!ACTIVE_SHIFT) {
    throw new Error("Tidak ada shift aktif yang sedang berjalan");
  }

  const discrepancy = actualCash - ACTIVE_SHIFT.expected_cash;

  ACTIVE_SHIFT.end_time = new Date().toISOString();
  ACTIVE_SHIFT.actual_cash = actualCash;
  ACTIVE_SHIFT.discrepancy = discrepancy;
  ACTIVE_SHIFT.status = "closed";
  ACTIVE_SHIFT.notes = notes || "";

  const finished = { ...ACTIVE_SHIFT };
  SHIFT_HISTORY.unshift(finished);
  ACTIVE_SHIFT = null;

  return { success: true, closedShift: finished };
}

// 5. Riwayat Shift Terakhir
export async function getShiftHistory() {
  return { success: true, history: SHIFT_HISTORY };
}
