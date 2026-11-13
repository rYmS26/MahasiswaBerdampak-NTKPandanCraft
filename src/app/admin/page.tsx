import { redirect } from "next/navigation";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const metadata = {
  title: "Dashboard Admin | Ciamis Pandan Craft",
  description: "Manajemen Produk, Validasi Pesanan, dan Laporan Penjualan Ciamis Pandan Craft",
};

export default async function AdminPage() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    redirect("/admin/login");
  }

  return <AdminDashboardClient />;
}
