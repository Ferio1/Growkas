// app/dashboard/page.tsx — Halaman Dashboard Utama Growkas (Server Component)

import { auth } from "@/auth";
import { getProductsAndCategories, getDashboardAnalytics } from "@/app/actions/posActions";
import DashboardClient from "./components/DashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Growkas",
  description: "Sistem Kasir F&B & Konsolidasi Laporan Multi-Cabang Growkas",
};

export default async function DashboardPage() {
  const session = await auth().catch(() => null);
  const userRole = (session?.user as any)?.role || "kasir";

  const { products, categories } = await getProductsAndCategories();
  const analytics = await getDashboardAnalytics();

  return (
    <DashboardClient
      initialProducts={products}
      initialCategories={categories}
      initialAnalytics={analytics}
      userSession={session}
      userRole={userRole === "admin" ? "admin" : "kasir"}
    />
  );
}
