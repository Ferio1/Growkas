"use client";

import { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import KasirView from "./KasirView";
import AdminView from "./AdminView";
import { ProductItem, CategoryItem } from "@/app/actions/posActions";

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

  return (
    <DashboardLayout activeRole={role} onRoleChange={setRole} userSession={userSession}>
      {role === "kasir" ? (
        <KasirView
          initialProducts={initialProducts}
          initialCategories={initialCategories}
          userSession={userSession}
        />
      ) : (
        <AdminView initialAnalytics={initialAnalytics} />
      )}
    </DashboardLayout>
  );
}
