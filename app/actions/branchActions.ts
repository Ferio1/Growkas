"use server";

import { createClient } from "@/lib/supabase/server";
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
    // 1. Coba baca dari master store persisten (filesystem + /tmp Vercel)
    const storeBranches = getStoreBranches();
    if (storeBranches && storeBranches.length > 0) {
      return { success: true, branches: storeBranches };
    }

    // 2. Coba Supabase jika ada table branches
    try {
      const supabase = await createClient();
      const { data: branchesData } = await supabase.from("branches").select("*");
      if (branchesData && branchesData.length > 0) {
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
    } catch {}

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

    // Simpan ke Master Store persisten
    const saved = addStoreBranch(newBranch);

    // Coba simpan ke Supabase jika tabelnya ada
    try {
      const supabase = await createClient();
      await supabase.from("branches").insert({
        name: newBranch.name,
        city: newBranch.city,
        address: newBranch.address,
        target_revenue: newBranch.target_revenue,
      });
    } catch {}

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
      const supabase = await createClient();
      await supabase.from("branches").delete().eq("id", branchId);
    } catch {}

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
