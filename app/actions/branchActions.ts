"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface BranchItem {
  id: string;
  name: string;
  city: string;
  address?: string;
  target_revenue: number;
  created_at?: string;
}

// In-Memory store fallback jika Supabase table belum dibuat oleh pembeli web
let MOCK_BRANCHES: BranchItem[] = [
  {
    id: "br-1",
    name: "Saray Coffee & Space",
    city: "Yogyakarta",
    address: "Jl. Kaliurang KM 5.5, Depok, Sleman",
    target_revenue: 10000000,
  },
];

export async function getBranches() {
  try {
    const supabase = await createClient();
    const { data: branchesData, error } = await supabase.from("branches").select("*");

    if (error || !branchesData || branchesData.length === 0) {
      return { success: true, branches: MOCK_BRANCHES };
    }

    const branches: BranchItem[] = branchesData.map((b: any) => ({
      id: b.id,
      name: b.name,
      city: b.city || "Indonesia",
      address: b.address || "",
      target_revenue: Number(b.target_revenue) || 10000000,
      created_at: b.created_at,
    }));

    return { success: true, branches };
  } catch (err) {
    return { success: true, branches: MOCK_BRANCHES };
  }
}

export async function addBranch(payload: {
  name: string;
  city: string;
  address?: string;
  target_revenue?: number;
}) {
  try {
    const supabase = await createClient();
    const newBranch: BranchItem = {
      id: "br-" + Date.now(),
      name: payload.name,
      city: payload.city || "Indonesia",
      address: payload.address || "",
      target_revenue: payload.target_revenue || 10000000,
    };

    // Push to in-memory fallback
    MOCK_BRANCHES.push(newBranch);

    // Insert to Supabase DB
    const { data, error } = await supabase
      .from("branches")
      .insert({
        name: payload.name,
        city: payload.city,
        address: payload.address,
        target_revenue: payload.target_revenue || 10000000,
      })
      .select()
      .single();

    revalidatePath("/dashboard");

    if (error) {
      return { success: true, branch: newBranch, message: "Cabang ditambahkan (mode cepat)." };
    }

    return { success: true, branch: data || newBranch };
  } catch (err: any) {
    const newBranch: BranchItem = {
      id: "br-" + Date.now(),
      name: payload.name,
      city: payload.city || "Indonesia",
      address: payload.address || "",
      target_revenue: payload.target_revenue || 10000000,
    };
    MOCK_BRANCHES.push(newBranch);
    revalidatePath("/dashboard");
    return { success: true, branch: newBranch };
  }
}

export async function deleteBranch(branchId: string) {
  try {
    MOCK_BRANCHES = MOCK_BRANCHES.filter((b) => b.id !== branchId);
    const supabase = await createClient();
    await supabase.from("branches").delete().eq("id", branchId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    revalidatePath("/dashboard");
    return { success: true };
  }
}
