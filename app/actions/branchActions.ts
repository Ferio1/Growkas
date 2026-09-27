"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/authGuard";
import {
  BranchItem,
  getStoreBranches,
  addStoreBranch,
  deleteStoreBranch,
} from "./storeManager";

export type { BranchItem };

export async function getBranches(): Promise<{ success: boolean; branches: BranchItem[] }> {
  try {
    // 1. Coba Supabase table public.branches
    try {
      const supabase = createAdminClient();
      const { data: branchesData, error } = await supabase.from("branches").select("*");
      if (!error && branchesData && branchesData.length > 0) {
        const branches: BranchItem[] = branchesData.map((b: any) => ({
          id: b.id,
          name: b.name,
          city: b.city || "Indonesia",
          address: b.address || "",
          target_revenue: Number(b.target_revenue) || 10000000,
          created_at: b.created_at,
        }));
        return { success: true, branches };
      }
    } catch (err) {
      console.warn("Supabase getBranches notice (in-memory fallback active):", err);
    }

    // 2. Fallback ke in-memory master store
    const storeBranches = getStoreBranches();
    return { success: true, branches: storeBranches };
  } catch (err) {
    return { success: false, branches: [] };
  }
}

export async function addBranch(payload: {
  name: string;
  city: string;
  address?: string;
  target_revenue?: number;
}): Promise<{ success: boolean; branch?: BranchItem; message?: string }> {
  await assertRole(["admin"]);
  try {
    const newBranch: BranchItem = {
      id: "br-" + Date.now(),
      name: payload.name.trim(),
      city: (payload.city || "Indonesia").trim(),
      address: payload.address?.trim() || "",
      target_revenue: Number(payload.target_revenue) || 10000000,
      created_at: new Date().toISOString(),
    };

    // Simpan ke in-memory master store
    const saved = addStoreBranch(newBranch);

    // Coba simpan ke Supabase jika tabelnya ada
    try {
      const supabase = createAdminClient();
      await supabase.from("branches").insert({
        name: newBranch.name,
        city: newBranch.city,
        address: newBranch.address,
        target_revenue: newBranch.target_revenue,
      });
    } catch (err) {
      console.warn("Supabase addBranch notice (in-memory fallback active):", err);
    }

    revalidatePath("/dashboard");
    return { success: true, branch: saved };
  } catch (err: any) {
    return { success: false, message: err?.message || "Gagal menambah cabang" };
  }
}

export async function deleteBranch(branchId: string): Promise<{ success: boolean }> {
  await assertRole(["admin"]);
  try {
    deleteStoreBranch(branchId);

    try {
      const supabase = createAdminClient();
      await supabase.from("branches").delete().eq("id", branchId);
    } catch (err) {
      console.warn("Supabase deleteBranch notice (in-memory fallback active):", err);
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
