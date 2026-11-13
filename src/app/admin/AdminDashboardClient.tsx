"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  ExternalLink,
  Download,
  Printer,
  ChevronRight,
  Eye,
  Loader2,
  Check,
  X,
  FileSpreadsheet,
  Layers,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type {
  ProductItem,
  OrderRow,
  OrderStatus,
  SalesReportSummary,
} from "@/types/catalog";

interface DbProductRaw {
  id: number;
  slug: string;
  name: string;
  price: number;
  image_path: string;
  dimensions: string;
  variants?: string[] | null;
  badge: string;
  stock_label: string;
  rating: number | string;
  reviews_count: number;
  categories?: string[] | null;
  category_label: string;
  description: string;
  is_bundle?: boolean;
  is_active?: boolean;
  sort_order: number;
}

type TabType = "overview" | "products" | "orders" | "reports";

const PRESET_IMAGES = [
  { label: "Keranjang Bunga", path: "/katalog/keranjang_bunga.png" },
  { label: "Tas Kantor", path: "/katalog/tas_kantor.png" },
  { label: "Tempat Majalah", path: "/katalog/tempat_majalah.png" },
  { label: "Tas Belanja", path: "/katalog/tas_belanja.png" },
  { label: "Tong Sampah", path: "/katalog/tong_sampah.png" },
  { label: "Vas Bunga", path: "/katalog/vas_bunga.png" },
  { label: "Lampu Hias Model Tinggi", path: "/katalog/lampu_berdiri.png" },
  { label: "Sandal Hotel", path: "/katalog/sandal_hotel.png" },
  { label: "Lampu Hias Lengkung", path: "/katalog/lampu_hias_lengkung.png" },
  { label: "Lampu Hias", path: "/katalog/lampu_hias.png" },
  { label: "Topi Pantai", path: "/katalog/topi_pantai.png" },
  { label: "Kotak Tisu", path: "/katalog/kotak_tisu.jpeg" },
  { label: "Paket Pemula (Bundle)", path: "/recomended.png" },
  { label: "Paket Oasis (Bundle)", path: "/recomended2.png" },
];

export function AdminDashboardClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Products state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");

  // Product modal (Create / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: "",
    slug: "",
    price: 50000,
    dimensions: "",
    badge: "Terlaris",
    stock_label: "Tersedia",
    rating: 5.0,
    reviews_count: 50,
    category_label: "Dekorasi & Keranjang",
    category_slug: "popular",
    description: "",
    image_path: "/katalog/keranjang_bunga.png",
    custom_image_url: "",
    is_bundle: false,
    is_active: true,
    sort_order: 10,
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState("");

  // Orders state
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderCounts, setOrderCounts] = useState({
    all: 0,
    pending_wa: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<OrderRow | null>(null);

  // Reports state
  const [reportPeriod, setReportPeriod] = useState<"today" | "7days" | "30days" | "all">("all");
  const [reportSummary, setReportSummary] = useState<SalesReportSummary | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Global action notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.ok) {
        // Map raw DB rows to ProductItem format
        const mapped: ProductItem[] = (data.products || []).map((p: DbProductRaw) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: Number(p.price),
          imagePath: p.image_path,
          dimensions: p.dimensions,
          variants: p.variants || [],
          badge: p.badge,
          stockLabel: p.stock_label,
          rating: Number(p.rating).toFixed(1),
          reviewsCount: p.reviews_count,
          categories: p.categories || [],
          categoryLabel: p.category_label,
          description: p.description,
          isBundle: Boolean(p.is_bundle),
          isActive: p.is_active !== undefined ? Boolean(p.is_active) : true,
          sortOrder: p.sort_order,
        }));
        setProducts(mapped);
      }
    } catch {
      showToast("Gagal memuat daftar produk.");
    } finally {
      setLoadingProducts(false);
    }
  }, [showToast]);

  // Fetch Orders
  const fetchOrders = useCallback(async (status: string = orderStatusFilter) => {
    setLoadingOrders(true);
    try {
      const url = status === "all" ? "/api/admin/orders" : `/api/admin/orders?status=${status}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders || []);
        if (data.counts) {
          setOrderCounts(data.counts);
        }
      }
    } catch {
      showToast("Gagal memuat daftar pesanan.");
    } finally {
      setLoadingOrders(false);
    }
  }, [orderStatusFilter, showToast]);

  // Fetch Reports
  const fetchReports = useCallback(async (period: "today" | "7days" | "30days" | "all" = reportPeriod) => {
    setLoadingReports(true);
    try {
      const res = await fetch(`/api/admin/reports?period=${period}`);
      const data = await res.json();
      if (data.ok) {
        setReportSummary(data.summary);
      }
    } catch {
      showToast("Gagal memuat laporan penjualan.");
    } finally {
      setLoadingReports(false);
    }
  }, [reportPeriod, showToast]);

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchOrders("all");
    fetchReports("all");
  }, [fetchProducts, fetchOrders, fetchReports]);

  // Tab change actions
  useEffect(() => {
    if (activeTab === "products") fetchProducts();
    if (activeTab === "orders") fetchOrders(orderStatusFilter);
    if (activeTab === "reports") fetchReports(reportPeriod);
  }, [activeTab, orderStatusFilter, reportPeriod, fetchProducts, fetchOrders, fetchReports]);

  // Handle Logout
  async function handleLogout() {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  }

  // --- PRODUCT CRUD HANDLERS ---
  function openAddProductModal() {
    setEditingProductId(null);
    setProductFormData({
      name: "",
      slug: "",
      price: 50000,
      dimensions: "P: 25cm | L: 15cm | T: 10cm",
      badge: "Produk Pilihan",
      stock_label: "Tersedia",
      rating: 5.0,
      reviews_count: 25,
      category_label: "Dekorasi & Keranjang",
      category_slug: "popular",
      description: "Anyaman daun pandan asli khas Ciamis, rapi, alami, dan kuat.",
      image_path: "/katalog/keranjang_bunga.png",
      custom_image_url: "",
      is_bundle: false,
      is_active: true,
      sort_order: (products.length + 1),
    });
    setProductFormError("");
    setIsProductModalOpen(true);
  }

  function openEditProductModal(p: ProductItem) {
    if (!p.id) return;
    setEditingProductId(p.id);
    const isPreset = PRESET_IMAGES.some((img) => img.path === p.imagePath);
    setProductFormData({
      name: p.name,
      slug: p.slug,
      price: p.price,
      dimensions: p.dimensions,
      badge: p.badge,
      stock_label: p.stockLabel,
      rating: parseFloat(p.rating) || 5.0,
      reviews_count: p.reviewsCount,
      category_label: p.categoryLabel,
      category_slug: p.categories[0] || "popular",
      description: p.description,
      image_path: isPreset ? p.imagePath : PRESET_IMAGES[0].path,
      custom_image_url: isPreset ? "" : p.imagePath,
      is_bundle: p.isBundle,
      is_active: p.isActive !== undefined ? p.isActive : true,
      sort_order: p.sortOrder,
    });
    setProductFormError("");
    setIsProductModalOpen(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductFormError("");
    setSavingProduct(true);

    const chosenImagePath =
      productFormData.custom_image_url.trim() || productFormData.image_path;

    const payload = {
      name: productFormData.name.trim(),
      slug: productFormData.slug.trim(),
      price: productFormData.price,
      dimensions: productFormData.dimensions.trim(),
      badge: productFormData.badge.trim(),
      stock_label: productFormData.stock_label.trim(),
      rating: productFormData.rating,
      reviews_count: productFormData.reviews_count,
      category_label: productFormData.category_label.trim(),
      categories: [productFormData.category_slug],
      description: productFormData.description.trim(),
      image_path: chosenImagePath,
      is_bundle: productFormData.is_bundle,
      is_active: productFormData.is_active,
      sort_order: productFormData.sort_order,
    };

    try {
      let res: Response;
      if (editingProductId) {
        res = await fetch(`/api/admin/products/${editingProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal menyimpan produk.");
      }

      showToast(
        editingProductId ? "Produk berhasil diperbarui." : "Produk baru berhasil ditambahkan."
      );
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setProductFormError(msg);
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(p: ProductItem) {
    if (!p.id) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus produk "${p.name}"? Produk tidak akan lagi tampil di katalog pembeli.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal menghapus produk.");
      }
      showToast(`Produk "${p.name}" berhasil dihapus.`);
      fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus produk.";
      alert(msg);
    }
  }

  async function handleToggleProductActive(p: ProductItem) {
    if (!p.id) return;
    const newActiveState = !p.isActive;
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newActiveState }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      showToast(
        newActiveState
          ? `Produk "${p.name}" sekarang AKTIF di katalog.`
          : `Produk "${p.name}" dinonaktifkan (disembunyikan dari pembeli).`
      );
      fetchProducts();
    } catch {
      showToast("Gagal mengubah status aktif produk.");
    }
  }

  // --- ORDER CONFIRMATION HANDLERS ---
  async function handleUpdateOrderStatus(orderId: number, newStatus: OrderStatus) {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal mengubah status pesanan.");
      }

      const statusLabels: Record<OrderStatus, string> = {
        pending_wa: "Menunggu Konfirmasi",
        confirmed: "Dikonfirmasi (Sah)",
        completed: "Selesai",
        cancelled: "Dibatalkan / Fiktif",
      };

      showToast(`Pesanan berhasil diubah menjadi: ${statusLabels[newStatus]}`);
      fetchOrders(orderStatusFilter);
      fetchReports(reportPeriod); // Keep sales reports synced
      if (selectedOrderForDetail?.id === orderId) {
        setSelectedOrderForDetail(data.order);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui status.";
      alert(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // --- EXPORT CSV HANDLER ---
  function handleExportCsv() {
    if (!reportSummary || !reportSummary.orders.length) {
      alert("Tidak ada data transaksi terkonfirmasi untuk diekspor pada periode ini.");
      return;
    }

    const headers = [
      "Kode Pesanan",
      "Tanggal & Jam",
      "Nama Pelanggan",
      "Alamat Pengiriman",
      "Total Qty",
      "Total Pembayaran (Rp)",
      "Status",
      "Rincian Produk",
    ];

    const rows = reportSummary.orders.map((o) => {
      const itemsSummary = (o.order_items || [])
        .map((item) => `${item.product_name} (${item.qty}x @${item.unit_price})`)
        .join("; ");

      return [
        `"${o.order_code}"`,
        `"${new Date(o.created_at).toLocaleString("id-ID")}"`,
        `"${(o.customer_name || "").replace(/"/g, '""')}"`,
        `"${(o.customer_address || "").replace(/"/g, '""')}"`,
        o.total_qty,
        o.total_price,
        o.status,
        `"${itemsSummary.replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `laporan-penjualan-ciamis-pandan-craft-${reportPeriod}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("File CSV laporan penjualan berhasil diunduh.");
  }

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.slug.toLowerCase().includes(productSearch.toLowerCase());
      const matchCategory =
        productCategoryFilter === "all" ||
        p.categories.includes(productCategoryFilter) ||
        (productCategoryFilter === "bundle" && p.isBundle);
      return matchSearch && matchCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-800 flex flex-col">
      {/* Toast Notification */}
      {toastMessage ? (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl bg-forest text-white text-xs sm:text-sm font-semibold shadow-xl border border-white/20 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-whatsapp" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-stone-200 bg-cream-soft shrink-0">
              <Image
                src="/logo/logo.png"
                alt="Ciamis Pandan Craft"
                fill
                sizes="36px"
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-forest text-sm sm:text-base leading-tight">
                  Ciamis Pandan Craft
                </span>
                <span className="px-2 py-0.5 rounded-full bg-forest/10 text-forest text-[10px] font-bold uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Pusat Kontrol Produk, Validasi Pesanan &amp; Laporan Penjualan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:text-forest hover:bg-stone-50 transition-colors"
            >
              <span>Lihat Toko Publik</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-forest text-white shadow-sm"
                : "text-stone-600 hover:text-forest hover:bg-stone-100"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ringkasan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "products"
                ? "bg-forest text-white shadow-sm"
                : "text-stone-600 hover:text-forest hover:bg-stone-100"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Kelola Produk</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === "products" ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"
              }`}
            >
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "orders"
                ? "bg-forest text-white shadow-sm"
                : "text-stone-600 hover:text-forest hover:bg-stone-100"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Konfirmasi Pesanan</span>
            {orderCounts.pending_wa > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold animate-pulse">
                {orderCounts.pending_wa} Baru
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === "orders" ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"
                }`}
              >
                {orderCounts.all}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "reports"
                ? "bg-forest text-white shadow-sm"
                : "text-stone-600 hover:text-forest hover:bg-stone-100"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Laporan Penjualan</span>
          </button>
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                  <span>Omzet Terkonfirmasi</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-serif font-bold text-forest">
                  {formatRupiah(reportSummary?.totalRevenue || 0)}
                </div>
                <p className="text-[11px] text-stone-400">
                  Dari {reportSummary?.confirmedOrdersCount || 0} pesanan sah / telah divalidasi
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                  <span>Menunggu Konfirmasi</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-serif font-bold text-amber-600">
                  {orderCounts.pending_wa} Pesanan
                </div>
                <p className="text-[11px] text-stone-400">
                  Perlu diverifikasi agar mencegah data fiktif
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                  <span>Total Produk Terdaftar</span>
                  <Package className="w-4 h-4 text-olive" />
                </div>
                <div className="text-2xl font-serif font-bold text-stone-800">
                  {products.length} Produk
                </div>
                <p className="text-[11px] text-stone-400">
                  {products.filter((p) => p.isActive).length} produk aktif di katalog pembeli
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                  <span>Total Unit Terjual</span>
                  <Layers className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-serif font-bold text-stone-800">
                  {reportSummary?.totalUnitsSold || 0} Unit
                </div>
                <p className="text-[11px] text-stone-400">
                  Berdasarkan transaksi yang dikonfirmasi
                </p>
              </div>
            </div>

            {/* Action Banner for Pending Orders */}
            {orderCounts.pending_wa > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Ada {orderCounts.pending_wa} pesanan baru yang menunggu konfirmasi!
                    </h3>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      Validasi chat WhatsApp pembeli dan konfirmasi pesanan untuk memasukkannya ke pengerjaan &amp; laporan penjualan.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOrderStatusFilter("pending_wa");
                    setActiveTab("orders");
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
                >
                  Periksa Sekarang
                </button>
              </div>
            )}

            {/* Quick Actions & Top Products preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders Preview */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-forest">Pesanan Masuk Terbaru</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-semibold text-olive hover:text-olive-dark inline-flex items-center gap-1"
                  >
                    <span>Lihat Semua</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">Belum ada pesanan masuk.</p>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-forest">{order.order_code}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === "confirmed"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : order.status === "cancelled"
                                  ? "bg-stone-100 text-stone-600 line-through"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {order.status === "pending_wa"
                                ? "Menunggu WA"
                                : order.status === "confirmed"
                                ? "Dikonfirmasi"
                                : order.status === "completed"
                                ? "Selesai"
                                : "Batal/Fiktif"}
                            </span>
                          </div>
                          <p className="text-stone-600 mt-0.5">
                            {order.customer_name} • {order.total_qty} barang
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-forest">{formatRupiah(order.total_price)}</p>
                          <p className="text-[10px] text-stone-400">
                            {new Date(order.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Best Selling Products */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-forest">Produk Terlaris (Terkonfirmasi)</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("reports")}
                    className="text-xs font-semibold text-olive hover:text-olive-dark inline-flex items-center gap-1"
                  >
                    <span>Laporan Lengkap</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!reportSummary?.topProducts.length ? (
                  <p className="text-xs text-stone-400 py-6 text-center">
                    Belum ada data penjualan terkonfirmasi. Konfirmasi pesanan untuk melihat performa produk.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {reportSummary.topProducts.slice(0, 5).map((prod, idx) => (
                      <div key={prod.slug} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 text-center font-bold text-stone-400">#{idx + 1}</span>
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-cream-soft border border-stone-200 shrink-0">
                            <Image
                              src={prod.imagePath || "/katalog/keranjang_bunga.png"}
                              alt={prod.name}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-stone-800">{prod.name}</p>
                            <p className="text-[11px] text-stone-500">{prod.unitsSold} unit terjual</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-forest">{formatRupiah(prod.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: KELOLA PRODUK (CRUD) ================= */}
        {activeTab === "products" && (
          <div className="space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Cari produk / slug..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-forest"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white text-stone-700 focus:outline-none focus:border-forest"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="popular">Terlaris</option>
                  <option value="decor">Dekorasi</option>
                  <option value="box">Penyimpanan</option>
                  <option value="accessories">Tas &amp; Gaya</option>
                  <option value="lamp">Lampu Hias</option>
                  <option value="bundle">Paket Hemat</option>
                </select>
              </div>

              <button
                type="button"
                onClick={openAddProductModal}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Baru</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              {loadingProducts ? (
                <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-forest" />
                  <span>Memuat produk dari database...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-xs text-stone-400">
                  Tidak ada produk yang cocok dengan pencarian / filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Produk</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4">Harga</th>
                        <th className="py-3 px-4">Ukuran / Dimensi</th>
                        <th className="py-3 px-4">Stok</th>
                        <th className="py-3 px-4">Status Tampil</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredProducts.map((p) => (
                        <tr key={p.slug} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-cream-soft border border-stone-200 shrink-0">
                                <Image
                                  src={p.imagePath || "/katalog/keranjang_bunga.png"}
                                  alt={p.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-forest text-sm leading-snug">{p.name}</p>
                                <p className="font-mono text-[10px] text-stone-400 mt-0.5">{p.slug}</p>
                                {p.badge ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded-sm bg-sand-gold/20 text-sand-gold text-[9px] font-bold mt-1">
                                    {p.badge}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            <span>{p.categoryLabel || "Kerajinan"}</span>
                            {p.isBundle ? (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-700 text-[10px] font-bold">
                                Paket
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3 px-4 font-bold text-forest">{formatRupiah(p.price)}</td>
                          <td className="py-3 px-4 text-stone-500 max-w-[160px] truncate">{p.dimensions}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.stockLabel === "Tersedia"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : p.stockLabel.includes("Tersisa")
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {p.stockLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleProductActive(p)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                p.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200"
                              }`}
                            >
                              {p.isActive ? "● Aktif" : "○ Disembunyikan"}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditProductModal(p)}
                                title="Edit Produk"
                                className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-forest hover:bg-stone-100 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p)}
                                title="Hapus Produk"
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: KONFIRMASI PESANAN ================= */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Filter Buttons & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    orderStatusFilter === "all"
                      ? "bg-forest text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Semua ({orderCounts.all})
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("pending_wa")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    orderStatusFilter === "pending_wa"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                  }`}
                >
                  Menunggu Konfirmasi ({orderCounts.pending_wa})
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("confirmed")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    orderStatusFilter === "confirmed"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-900 hover:bg-blue-200"
                  }`}
                >
                  Dikonfirmasi ({orderCounts.confirmed})
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("completed")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    orderStatusFilter === "completed"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                  }`}
                >
                  Selesai ({orderCounts.completed})
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("cancelled")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    orderStatusFilter === "cancelled"
                      ? "bg-stone-600 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Batal / Fiktif ({orderCounts.cancelled})
                </button>
              </div>

              <div className="relative max-w-xs">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Cari kode / nama / kota..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            {/* Orders List / Cards */}
            {loadingOrders ? (
              <div className="bg-white rounded-2xl p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-forest" />
                <span>Memuat pesanan dari database...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-xs text-stone-400 border border-stone-200">
                Belum ada pesanan dengan kriteria filter ini.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const isUpdating = updatingOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4 hover:border-stone-300 transition-colors"
                    >
                      {/* Top Bar: Code, Date & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-forest bg-stone-100 px-2.5 py-1 rounded-lg">
                            {order.order_code}
                          </span>
                          <span className="text-xs text-stone-400">
                            {new Date(order.created_at).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            WIB
                          </span>
                        </div>

                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              order.status === "confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.status === "cancelled"
                                ? "bg-stone-100 text-stone-600 line-through"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                            }`}
                          >
                            {order.status === "pending_wa" && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                            {order.status === "confirmed" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            {order.status === "completed" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                            {order.status === "cancelled" && <XCircle className="w-3.5 h-3.5 text-stone-500" />}

                            <span>
                              {order.status === "pending_wa"
                                ? "Menunggu Konfirmasi WA"
                                : order.status === "confirmed"
                                ? "Dikonfirmasi (Sah)"
                                : order.status === "completed"
                                ? "Selesai"
                                : "Dibatalkan / Pesanan Fiktif"}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Middle: Customer details & Items */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Customer Information */}
                        <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                          <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                            Data Pemesan
                          </p>
                          <p className="font-bold text-forest text-sm">{order.customer_name}</p>
                          <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                            {order.customer_address}
                          </p>
                          {order.customer_note ? (
                            <p className="text-amber-800 bg-amber-50/80 p-2 rounded-lg mt-2 text-[11px] border border-amber-200">
                              <strong>Catatan:</strong> {order.customer_note}
                            </p>
                          ) : null}
                        </div>

                        {/* Order Items Breakdown */}
                        <div className="md:col-span-2 space-y-2">
                          <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                            Rincian Pembelian ({order.total_qty} Item)
                          </p>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {order.order_items?.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 p-2 rounded-xl bg-stone-50/70 border border-stone-200/60"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-cream-soft border border-stone-200 shrink-0">
                                    <Image
                                      src={item.image_path || "/katalog/keranjang_bunga.png"}
                                      alt={item.product_name}
                                      fill
                                      sizes="32px"
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-bold text-forest leading-snug">{item.product_name}</p>
                                    <p className="text-[10px] text-stone-400">
                                      {item.qty}x @{formatRupiah(item.unit_price)}
                                      {item.variant ? ` • Varian: ${item.variant}` : ""}
                                      {item.item_note ? ` • Catatan: ${item.item_note}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <span className="font-bold text-forest">{formatRupiah(item.subtotal)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-stone-100 font-bold text-sm text-forest">
                            <span>Total Pembayaran:</span>
                            <span className="text-base text-forest">{formatRupiah(order.total_price)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Bar: Action buttons for validation */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForDetail(order)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-olive hover:text-olive-dark"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Format Pesan WA</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {isUpdating ? (
                            <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Menyimpan...</span>
                            </span>
                          ) : (
                            <>
                              {order.status === "pending_wa" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Konfirmasi Pesanan</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Tolak / tandai fiktif pesanan ${order.order_code}? Pesanan tidak akan dihitung ke laporan penjualan.`)) {
                                        handleUpdateOrderStatus(order.id, "cancelled");
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Tolak / Fiktif</span>
                                  </button>
                                </>
                              )}

                              {order.status === "confirmed" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Tandai Selesai</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-medium transition-colors"
                                  >
                                    <span>Batalkan</span>
                                  </button>
                                </>
                              )}

                              {order.status === "completed" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                                  className="text-xs text-stone-400 hover:text-stone-700 underline"
                                >
                                  Kembalikan ke status Dikonfirmasi
                                </button>
                              )}

                              {order.status === "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Pulihkan &amp; Konfirmasi</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: LAPORAN PENJUALAN ================= */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Header / Period Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setReportPeriod("today")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    reportPeriod === "today"
                      ? "bg-forest text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setReportPeriod("7days")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    reportPeriod === "7days"
                      ? "bg-forest text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  7 Hari Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => setReportPeriod("30days")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    reportPeriod === "30days"
                      ? "bg-forest text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => setReportPeriod("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    reportPeriod === "all"
                      ? "bg-forest text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Semua Waktu
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Laporan</span>
                </button>
              </div>
            </div>

            {/* Validation Guarantee Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Perhitungan Penjualan Akurat &amp; Anti-Fiktif</p>
                <p className="text-emerald-800/90 mt-0.5 leading-relaxed">
                  Laporan ini secara otomatis <strong>hanya menghitung pesanan yang telah dikonfirmasi</strong> (status &quot;Dikonfirmasi&quot; dan &quot;Selesai&quot;). Pesanan yang masih pending WA atau dibatalkan karena fiktif tidak dihitung dalam pendapatan toko.
                </p>
              </div>
            </div>

            {loadingReports && (
              <div className="bg-white rounded-2xl p-4 text-center text-xs text-stone-500 flex items-center justify-center gap-2 border border-stone-200">
                <Loader2 className="w-4 h-4 animate-spin text-forest" />
                <span>Memperbarui ringkasan laporan...</span>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                <p className="text-stone-500 text-xs font-semibold">Total Omzet Bersih</p>
                <p className="text-2xl font-serif font-bold text-forest">
                  {formatRupiah(reportSummary?.totalRevenue || 0)}
                </p>
                <p className="text-[11px] text-stone-400">Pendapatan sah terkonfirmasi</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                <p className="text-stone-500 text-xs font-semibold">Jumlah Transaksi Sah</p>
                <p className="text-2xl font-serif font-bold text-stone-800">
                  {reportSummary?.confirmedOrdersCount || 0} Transaksi
                </p>
                <p className="text-[11px] text-stone-400">Pesanan berhasil diproses</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                <p className="text-stone-500 text-xs font-semibold">Total Unit Terjual</p>
                <p className="text-2xl font-serif font-bold text-stone-800">
                  {reportSummary?.totalUnitsSold || 0} Barang
                </p>
                <p className="text-[11px] text-stone-400">Produk pandan dikirim</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                <p className="text-stone-500 text-xs font-semibold">Rata-rata Nilai Pesanan (AOV)</p>
                <p className="text-2xl font-serif font-bold text-olive">
                  {formatRupiah(reportSummary?.averageOrderValue || 0)}
                </p>
                <p className="text-[11px] text-stone-400">Rerata nominal per pembeli</p>
              </div>
            </div>

            {/* Top Products Performance Table */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-forest">Peringkat Produk Terlaris</h3>
                <span className="text-xs text-stone-400">Periode: {reportPeriod}</span>
              </div>

              {!reportSummary?.topProducts.length ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  Belum ada produk yang terjual dan dikonfirmasi pada periode ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Peringkat</th>
                        <th className="py-3 px-4">Nama Produk</th>
                        <th className="py-3 px-4">Jumlah Terjual</th>
                        <th className="py-3 px-4 text-right">Total Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {reportSummary.topProducts.map((item, idx) => (
                        <tr key={item.slug} className="hover:bg-stone-50/60">
                          <td className="py-3 px-4 font-bold text-stone-400">#{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-cream-soft border border-stone-200 shrink-0">
                                <Image
                                  src={item.imagePath || "/katalog/keranjang_bunga.png"}
                                  alt={item.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                              <span className="font-bold text-forest">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-stone-700">{item.unitsSold} unit</td>
                          <td className="py-3 px-4 text-right font-bold text-forest">
                            {formatRupiah(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Confirmed Transactions Table */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-forest">Rincian Transaksi Terkonfirmasi</h3>
                <span className="text-xs text-stone-400">{reportSummary?.orders.length || 0} Transaksi</span>
              </div>

              {!reportSummary?.orders.length ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  Belum ada transaksi terkonfirmasi untuk periode ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Kode</th>
                        <th className="py-3 px-4">Waktu</th>
                        <th className="py-3 px-4">Pelanggan &amp; Kota</th>
                        <th className="py-3 px-4">Item Dibeli</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Nilai Transaksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {reportSummary.orders.map((order) => (
                        <tr key={order.id} className="hover:bg-stone-50/60">
                          <td className="py-3 px-4 font-mono font-bold text-forest">{order.order_code}</td>
                          <td className="py-3 px-4 text-stone-500">
                            {new Date(order.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-stone-800">{order.customer_name}</p>
                            <p className="text-[11px] text-stone-400 max-w-[180px] truncate">
                              {order.customer_address}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            {order.order_items?.map((it) => `${it.product_name} (${it.qty}x)`).join(", ") ||
                              `${order.total_qty} item`}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {order.status === "completed" ? "Selesai" : "Dikonfirmasi"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-forest">
                            {formatRupiah(order.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD / EDIT PRODUCT ================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-forest text-white">
              <h3 className="font-serif font-bold text-lg">
                {editingProductId ? "Ubah Data Produk" : "Tambah Produk Kerajinan Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {productFormError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800">
                  {productFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={productFormData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setProductFormData((prev) => ({
                        ...prev,
                        name,
                        slug:
                          !editingProductId && !prev.slug
                            ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
                            : prev.slug,
                      }));
                    }}
                    placeholder="Contoh: Tas Anyaman Selempang"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Slug URL (Unik)
                  </label>
                  <input
                    type="text"
                    value={productFormData.slug}
                    onChange={(e) =>
                      setProductFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))
                    }
                    placeholder="tas-anyaman-selempang"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={productFormData.price}
                    onChange={(e) =>
                      setProductFormData((prev) => ({ ...prev, price: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold text-forest focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Ukuran / Dimensi
                  </label>
                  <input
                    type="text"
                    value={productFormData.dimensions}
                    onChange={(e) => setProductFormData((prev) => ({ ...prev, dimensions: e.target.value }))}
                    placeholder="Contoh: T: 25cm | P: 30cm | L: 15cm"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Kategori
                  </label>
                  <select
                    value={productFormData.category_slug}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const labelMap: Record<string, string> = {
                        popular: "Terlaris",
                        decor: "Dekorasi Rumah",
                        box: "Wadah Penyimpanan",
                        accessories: "Tas & Aksesoris",
                        lamp: "Lampu Hias",
                        bundle: "Paket Hemat",
                      };
                      setProductFormData((prev) => ({
                        ...prev,
                        category_slug: cat,
                        category_label: labelMap[cat] || "Kerajinan Pandan",
                        is_bundle: cat === "bundle",
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-forest bg-white"
                  >
                    <option value="popular">Terlaris</option>
                    <option value="decor">Dekorasi Rumah</option>
                    <option value="box">Wadah Penyimpanan</option>
                    <option value="accessories">Tas &amp; Aksesoris</option>
                    <option value="lamp">Lampu Hias</option>
                    <option value="bundle">Paket Hemat</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Label Kategori
                  </label>
                  <input
                    type="text"
                    value={productFormData.category_label}
                    onChange={(e) =>
                      setProductFormData((prev) => ({ ...prev, category_label: e.target.value }))
                    }
                    placeholder="Dekorasi Rumah"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Badge Khusus
                  </label>
                  <input
                    type="text"
                    value={productFormData.badge}
                    onChange={(e) => setProductFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="Contoh: Best Seller / Pilihan Pengrajin"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Status Ketersediaan Stok
                  </label>
                  <select
                    value={productFormData.stock_label}
                    onChange={(e) => setProductFormData((prev) => ({ ...prev, stock_label: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-forest bg-white"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Tersisa 3">Tersisa 3</option>
                    <option value="Tersisa 5">Tersisa 5</option>
                    <option value="Pre-Order 2 Hari">Pre-Order 2 Hari</option>
                    <option value="Habis">Habis</option>
                  </select>
                </div>
              </div>

              {/* Image Selection */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Pilih Gambar Produk
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 max-h-36 overflow-y-auto p-2 border border-stone-200 rounded-xl bg-stone-50">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.path}
                      type="button"
                      onClick={() =>
                        setProductFormData((prev) => ({
                          ...prev,
                          image_path: img.path,
                          custom_image_url: "",
                        }))
                      }
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all ${
                        productFormData.image_path === img.path && !productFormData.custom_image_url
                          ? "border-forest bg-white shadow-xs ring-2 ring-forest"
                          : "border-stone-200 hover:border-stone-300 bg-white/70"
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-cream-soft">
                        <Image src={img.path} alt={img.label} fill sizes="40px" className="object-cover" />
                      </div>
                      <span className="text-[10px] text-stone-600 truncate w-full">{img.label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] text-stone-500">
                    Atau gunakan URL / path gambar kustom:
                  </label>
                  <input
                    type="text"
                    value={productFormData.custom_image_url}
                    onChange={(e) =>
                      setProductFormData((prev) => ({ ...prev, custom_image_url: e.target.value }))
                    }
                    placeholder="https://... atau /katalog/nama-file.png"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-forest mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Deskripsi Lengkap Produk
                </label>
                <textarea
                  rows={3}
                  value={productFormData.description}
                  onChange={(e) =>
                    setProductFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Ceritakan keunikan anyaman, kegunaan, dan bahan alami yang digunakan..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productFormData.is_active}
                    onChange={(e) =>
                      setProductFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-forest focus:ring-forest"
                  />
                  <span className="font-semibold text-stone-700">Tampilkan di Toko (Aktif)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productFormData.is_bundle}
                    onChange={(e) =>
                      setProductFormData((prev) => ({ ...prev, is_bundle: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-forest focus:ring-forest"
                  />
                  <span className="font-semibold text-stone-700">Format Paket Hemat</span>
                </label>

                <div>
                  <label className="block font-semibold text-stone-600 text-[11px] mb-1">
                    Nomor Urut Tampil:
                  </label>
                  <input
                    type="number"
                    value={productFormData.sort_order}
                    onChange={(e) =>
                      setProductFormData((prev) => ({
                        ...prev,
                        sort_order: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className="w-20 px-2 py-1 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-bold shadow-md disabled:opacity-70 transition-all"
                >
                  {savingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Data Produk</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ORDER WA DETAIL ================= */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-forest text-white">
              <h3 className="font-serif font-bold text-base">
                Detail Transaksi: {selectedOrderForDetail.order_code}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="space-y-1">
                <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Teks Pesan WhatsApp yang Terkirim:
                </p>
                <pre className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto text-stone-700">
                  {selectedOrderForDetail.whatsapp_message}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(selectedOrderForDetail.whatsapp_message);
                    showToast("Pesan WhatsApp berhasil disalin ke clipboard.");
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 font-semibold hover:bg-stone-50"
                >
                  Salin Teks Pesan
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="px-4 py-2 rounded-xl bg-forest text-white font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
