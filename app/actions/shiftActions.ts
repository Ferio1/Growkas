"use server";

import {
  CashierShift,
  loadMasterStore,
  saveMasterStore,
} from "./storeManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertRole } from "@/lib/authGuard";

export type { CashierShift };

// 1. Dapatkan Status Shift Aktif (Persisten dari Supabase / In-Memory Fallback)
export async function getActiveShift(): Promise<{ success: boolean; shift: CashierShift | null }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cashier_shifts")
      .select("*")
      .eq("status", "open")
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const shift: CashierShift = {
        id: data.id,
        cashier_name: data.cashier_name,
        branch_name: data.branch_name,
        start_time: data.start_time,
        end_time: data.end_time || undefined,
        initial_cash: Number(data.initial_cash || 0),
        cash_sales: 0,
        qris_sales: 0,
        debit_sales: 0,
        total_sales: 0,
        transaction_count: 0,
        expected_cash: Number(data.expected_cash ?? data.initial_cash ?? 0),
        actual_cash: data.actual_cash !== null && data.actual_cash !== undefined ? Number(data.actual_cash) : undefined,
        discrepancy: data.discrepancy !== null && data.discrepancy !== undefined ? Number(data.discrepancy) : undefined,
        status: data.status,
      };

      // Sync with in-memory store
      const store = loadMasterStore();
      if (store.activeShift && store.activeShift.id === shift.id) {
        // preserve running in-memory tallies if same shift
        shift.cash_sales = store.activeShift.cash_sales;
        shift.qris_sales = store.activeShift.qris_sales;
        shift.debit_sales = store.activeShift.debit_sales;
        shift.total_sales = store.activeShift.total_sales;
        shift.transaction_count = store.activeShift.transaction_count;
        shift.notes = store.activeShift.notes;
      }
      store.activeShift = shift;
      saveMasterStore(store);
      return { success: true, shift };
    } else if (!error && !data) {
      // In Supabase there is no open shift
      const store = loadMasterStore();
      store.activeShift = null;
      saveMasterStore(store);
      return { success: true, shift: null };
    }
  } catch (err) {
    console.warn("Supabase getActiveShift notice (in-memory fallback active):", err);
  }

  const store = loadMasterStore();
  return { success: true, shift: store.activeShift };
}

// 2. Buka Shift Baru (Input Modal Awal Laci & Catat ke public.cashier_shifts)
export async function openShift(
  cashierName: string,
  initialCash: number,
  branchName = "7co (Yogyakarta)"
): Promise<{ success: boolean; shift: CashierShift }> {
  await assertRole(["admin", "kasir"]);

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

  try {
    const supabase = createAdminClient();
    await supabase.from("cashier_shifts").insert({
      id: newShift.id,
      cashier_name: newShift.cashier_name,
      branch_name: newShift.branch_name,
      start_time: newShift.start_time,
      initial_cash: newShift.initial_cash,
      expected_cash: newShift.expected_cash,
      status: "open",
    });
  } catch (err) {
    console.warn("Supabase openShift notice (in-memory fallback active):", err);
  }

  store.activeShift = newShift;
  saveMasterStore(store);
  return { success: true, shift: newShift };
}

// 3. Catat Penjualan ke Shift yang Sedang Berjalan (Update expected_cash di public.cashier_shifts)
export async function recordSaleToActiveShift(
  paymentMethod: "cash" | "qris" | "debit",
  amount: number
) {
  const activeRes = await getActiveShift();
  let shift = activeRes.shift;

  if (!shift || shift.status !== "open") {
    // Jika belum ada shift terbuka, buka shift default
    const opened = await openShift("Kasir Bertugas", 0);
    shift = opened.shift;
  }

  shift.transaction_count = (shift.transaction_count || 0) + 1;
  shift.total_sales = (shift.total_sales || 0) + amount;

  if (paymentMethod === "cash") {
    shift.cash_sales = (shift.cash_sales || 0) + amount;
    shift.expected_cash = (shift.expected_cash || 0) + amount;
  } else if (paymentMethod === "qris") {
    shift.qris_sales = (shift.qris_sales || 0) + amount;
  } else if (paymentMethod === "debit") {
    shift.debit_sales = (shift.debit_sales || 0) + amount;
  }

  try {
    const supabase = createAdminClient();
    await supabase
      .from("cashier_shifts")
      .update({
        expected_cash: shift.expected_cash,
      })
      .eq("id", shift.id);
  } catch (err) {
    console.warn("Supabase recordSaleToActiveShift notice (in-memory fallback active):", err);
  }

  const store = loadMasterStore();
  store.activeShift = shift;
  saveMasterStore(store);
  return { success: true, shift };
}

// 4. Tutup Shift Kasir (Closing POS & Rekonsiliasi Kas Laci di public.cashier_shifts)
export async function closeShift(
  actualCash: number,
  notes?: string
): Promise<{ success: boolean; closedShift: CashierShift }> {
  await assertRole(["admin", "kasir"]);

  const activeRes = await getActiveShift();
  const shift = activeRes.shift;
  if (!shift) {
    throw new Error("Tidak ada shift aktif yang sedang berjalan");
  }

  const discrepancy = actualCash - shift.expected_cash;
  const endTime = new Date().toISOString();

  shift.end_time = endTime;
  shift.actual_cash = actualCash;
  shift.discrepancy = discrepancy;
  shift.status = "closed";
  shift.notes = notes || "";

  try {
    const supabase = createAdminClient();
    await supabase
      .from("cashier_shifts")
      .update({
        end_time: endTime,
        actual_cash: actualCash,
        discrepancy: discrepancy,
        status: "closed",
      })
      .eq("id", shift.id);
  } catch (err) {
    console.warn("Supabase closeShift notice (in-memory fallback active):", err);
  }

  const finished = { ...shift };
  const store = loadMasterStore();
  store.shiftHistory.unshift(finished);
  store.activeShift = null;
  saveMasterStore(store);

  return { success: true, closedShift: finished };
}

// 5. Riwayat Shift Terakhir dari public.cashier_shifts
export async function getShiftHistory() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cashier_shifts")
      .select("*")
      .order("start_time", { ascending: false })
      .limit(50);

    if (!error && data && data.length > 0) {
      const history: CashierShift[] = data.map((d: any) => ({
        id: d.id,
        cashier_name: d.cashier_name,
        branch_name: d.branch_name,
        start_time: d.start_time,
        end_time: d.end_time || undefined,
        initial_cash: Number(d.initial_cash || 0),
        cash_sales: 0,
        qris_sales: 0,
        debit_sales: 0,
        total_sales: 0,
        transaction_count: 0,
        expected_cash: Number(d.expected_cash || 0),
        actual_cash: d.actual_cash !== null && d.actual_cash !== undefined ? Number(d.actual_cash) : undefined,
        discrepancy: d.discrepancy !== null && d.discrepancy !== undefined ? Number(d.discrepancy) : undefined,
        status: d.status,
      }));
      return { success: true, history };
    }
  } catch (err) {
    console.warn("Supabase getShiftHistory notice (in-memory fallback active):", err);
  }

  const store = loadMasterStore();
  return { success: true, history: store.shiftHistory || [] };
}
