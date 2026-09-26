"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "./DashboardLayout";
import KasirView from "./KasirView";
import AdminView from "./AdminView";
import { ProductItem, CategoryItem } from "@/app/actions/posActions";
import { getBranches, BranchItem } from "@/app/actions/branchActions";

interface DashboardClientProps {
  initialProducts: ProductItem[];
  initialCategories: CategoryItem[];
  initialAnalytics: any;
  userSession: any;
  userRole: "kasir" | "admin";
}

export default function DashboardClient({
  initialProducts,
  initialCategories,
  initialAnalytics,
  userSession,
  userRole,
}: DashboardClientProps) {
  const [role, setRole] = useState<"kasir" | "admin">(userRole);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");

  const loadBranches = async () => {
    const res = await getBranches();
    if (res.branches && res.branches.length > 0) {
      setBranches(res.branches);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  // Tentukan nama cabang aktif untuk POS Kasir
  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const activeBranchName = activeBranch
    ? `${activeBranch.name} (${activeBranch.city})`
    : "Saray Coffee & Space (Yogyakarta)";

  return (
    <DashboardLayout
      activeRole={role}
      onRoleChange={setRole}
      userSession={userSession}
      branches={branches}
      selectedBranchId={selectedBranchId}
      onBranchChange={setSelectedBranchId}
    >
      {role === "kasir" ? (
        <KasirView
          initialProducts={initialProducts}
          initialCategories={initialCategories}
          userSession={userSession}
          activeBranchName={activeBranchName}
          activeBranchId={activeBranch?.id || "br-1"}
        />
      ) : (
        <AdminView
          initialAnalytics={initialAnalytics}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onSelectBranch={setSelectedBranchId}
          onBranchesUpdated={(updated) => setBranches(updated)}
        />
      )}
    </DashboardLayout>
  );
}

