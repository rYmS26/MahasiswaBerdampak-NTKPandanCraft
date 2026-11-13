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
  Settings,
  Phone,
  MessageCircle,
  UploadCloud,
  ImageIcon,
} from "lucide-react";
import { formatRupiah, formatWhatsAppDisplay } from "@/lib/format";
import { compressImage, uploadProductImage } from "@/lib/image-upload";
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

type TabType = "overview" | "products" | "orders" | "reports" | "settings";

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
  const [imageInputMode, setImageInputMode] = useState<"upload" | "preset" | "url">("upload");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string>("");
  const [uploadSizeInfo, setUploadSizeInfo] = useState<string>("");
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number } | null>(null);

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

  // Settings state (Dynamic WhatsApp)
  const [sellerWhatsApp, setSellerWhatsApp] = useState("628815838516");
  const [sellerWhatsAppDisplay, setSellerWhatsAppDisplay] = useState("+62 881-5838-516");
  const [inputWhatsApp, setInputWhatsApp] = useState("628815838516");
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

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

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.ok && data.settings) {
        setSellerWhatsApp(data.settings.sellerWhatsApp);
        setSellerWhatsAppDisplay(data.settings.sellerWhatsAppDisplay);
        setInputWhatsApp(data.settings.sellerWhatsApp);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchOrders("all");
    fetchReports("all");
    fetchSettings();
  }, [fetchProducts, fetchOrders, fetchReports, fetchSettings]);

  // Tab change actions
  useEffect(() => {
    if (activeTab === "products") fetchProducts();
    if (activeTab === "orders") fetchOrders(orderStatusFilter);
    if (activeTab === "reports") fetchReports(reportPeriod);
    if (activeTab === "settings") fetchSettings();
  }, [activeTab, orderStatusFilter, reportPeriod, fetchProducts, fetchOrders, fetchReports, fetchSettings]);

  // Save Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerWhatsApp: inputWhatsApp }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal menyimpan nomor WhatsApp.");
      }
      setSellerWhatsApp(data.sellerWhatsApp);
      setSellerWhatsAppDisplay(data.sellerWhatsAppDisplay);
      setInputWhatsApp(data.sellerWhatsApp);
      showToast("Nomor WhatsApp tujuan pemesanan berhasil diperbarui!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      alert(msg);
    } finally {
      setSavingSettings(false);
    }
  }

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
    setImageInputMode("upload");
    setUploadPreviewUrl("/katalog/keranjang_bunga.png");
    setUploadSizeInfo("");
    setPreviewDimensions({ width: 1254, height: 1254 });
    setProductFormError("");
    setIsProductModalOpen(true);
  }

  function openEditProductModal(p: ProductItem) {
    if (!p.id) return;
    setEditingProductId(p.id);
    const isPreset = PRESET_IMAGES.some((img) => img.path === p.imagePath);
    setImageInputMode(isPreset ? "preset" : "upload");
    setUploadPreviewUrl(p.imagePath);
    setUploadSizeInfo("");
    setPreviewDimensions(null); // will automatically compute on load
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
      image_path: p.imagePath,
      custom_image_url: isPreset ? "" : (p.imagePath.startsWith("http") ? p.imagePath : ""),
      is_bundle: p.isBundle,
      is_active: p.isActive !== undefined ? p.isActive : true,
      sort_order: p.sortOrder,
    });
    setProductFormError("");
    setIsProductModalOpen(true);
  }

  async function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setProductFormError("");

      // 1. Client-side compression for optimal speed
      const { blob, previewUrl, width, height } = await compressImage(file, 1200, 0.85);
      setUploadPreviewUrl(previewUrl);
      setPreviewDimensions({ width, height });
      const originalMb = (file.size / (1024 * 1024)).toFixed(2);
      const compressedKb = Math.round(blob.size / 1024);
      setUploadSizeInfo(`Resolusi: ${width} × ${height} px • Ukuran asli: ${originalMb} MB ➔ Terkompresi: ${compressedKb} KB (WebP)`);

      // 2. Upload to Supabase Storage via API
      const result = await uploadProductImage(file);
      if (!result.ok || !result.url) {
        throw new Error(result.error || "Gagal mengunggah foto ke storage.");
      }

      setProductFormData((prev) => ({
        ...prev,
        image_path: result.url!,
        custom_image_url: "",
      }));

      showToast("Foto produk berhasil diunggah ke Supabase Storage!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah gambar.";
      setProductFormError(msg);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleImageDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    try {
      setUploadingImage(true);
      setProductFormError("");

      // 1. Client-side compression for optimal speed
      const { blob, previewUrl, width, height } = await compressImage(file, 1200, 0.85);
      setUploadPreviewUrl(previewUrl);
      setPreviewDimensions({ width, height });
      const originalMb = (file.size / (1024 * 1024)).toFixed(2);
      const compressedKb = Math.round(blob.size / 1024);
      setUploadSizeInfo(`Resolusi: ${width} × ${height} px • Ukuran asli: ${originalMb} MB ➔ Terkompresi: ${compressedKb} KB (WebP)`);

      // 2. Upload to Supabase Storage via API
      const result = await uploadProductImage(file);
      if (!result.ok || !result.url) {
        throw new Error(result.error || "Gagal mengunggah foto ke storage.");
      }

      setProductFormData((prev) => ({
        ...prev,
        image_path: result.url!,
        custom_image_url: "",
      }));

      showToast("Foto produk berhasil diunggah ke Supabase Storage!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah gambar.";
      setProductFormError(msg);
    } finally {
      setUploadingImage(false);
    }
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

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-forest text-white shadow-sm"
                : "text-stone-600 hover:text-forest hover:bg-stone-100"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Toko</span>
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

        {/* ================= TAB 5: PENGATURAN TOKO ================= */}
        {activeTab === "settings" && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-start gap-4 pb-6 border-b border-stone-100">
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-forest">
                    Pengaturan Nomor WhatsApp Pesanan
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Atur nomor WhatsApp resmi yang akan menerima chat pesanan otomatis, konsultasi ukuran, dan pesan struk belanja dari para pembeli.
                  </p>
                </div>
              </div>

              {loadingSettings ? (
                <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-forest" />
                  <span>Memuat pengaturan dari database...</span>
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Nomor WhatsApp Penjual / Admin *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={inputWhatsApp}
                        onChange={(e) => setInputWhatsApp(e.target.value)}
                        placeholder="Contoh: 08815838516 atau 628815838516"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-sm font-semibold text-stone-800 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest bg-stone-50/50"
                      />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                      Format fleksibel: bisa diawali angka <code className="text-stone-600 font-mono">08...</code>, <code className="text-stone-600 font-mono">+62...</code>, atau <code className="text-stone-600 font-mono">62...</code>. Sistem akan otomatis membersihkan spasi dan tanda baca.
                    </p>
                  </div>

                  {/* Real-time Preview Box */}
                  <div className="rounded-2xl border border-stone-200 bg-cream-soft p-4 space-y-3">
                    <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                      Pratinjau Tampilan &amp; Verifikasi
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-stone-200/80">
                        <span className="text-[10px] text-stone-400 block mb-0.5">Nomor Aktif di Toko:</span>
                        <span className="font-bold text-forest text-sm">{sellerWhatsAppDisplay}</span>
                        <span className="text-[10px] text-stone-500 block font-mono mt-0.5">{sellerWhatsApp}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-stone-200/80">
                        <span className="text-[10px] text-stone-400 block mb-0.5">Pratinjau Setelah Disimpan:</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {formatWhatsAppDisplay(inputWhatsApp)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-stone-500">Tautan tes kirim:</span>
                      <a
                        href={`https://wa.me/${inputWhatsApp.replace(/\D/g, "")}?text=Tes%20koneksi%20WhatsApp%20Ciamis%20Pandan%20Craft`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-whatsapp hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Uji Buka Chat WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Information banner */}
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <p className="font-bold">Diterapkan Secara Real-Time &amp; Dinamis</p>
                      <p className="text-blue-800/90 mt-0.5">
                        Ketika Anda menekan tombol <strong>Simpan Pengaturan WhatsApp</strong>, nomor akan tersimpan ke database Supabase dan secara otomatis langsung digunakan pada tombol checkout keranjang belanja, pop-up persuasif, kartu produk, dan footer sisi pembeli.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-bold shadow-md transition-all disabled:opacity-70"
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan Pengaturan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Simpan Pengaturan WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-700 uppercase tracking-wider text-xs">
                      Ukuran / Dimensi Produk (Fisik) *
                    </label>
                    <span className="text-[10px] text-stone-400">Panjang × Lebar × Tinggi</span>
                  </div>
                  <input
                    type="text"
                    value={productFormData.dimensions}
                    onChange={(e) => setProductFormData((prev) => ({ ...prev, dimensions: e.target.value }))}
                    placeholder="Contoh: 26 × 39 × 17 cm atau Tinggi 20 cm | Lingkaran 90 cm"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-forest bg-white font-medium"
                  />
                  {/* Quick format helper pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-stone-400 font-semibold uppercase">Pilihan Cepat:</span>
                    {[
                      "26 × 39 × 17 cm",
                      "32 × 47 × 18 cm",
                      "23 × 26 × 10 cm",
                      "24 × 13 × 8 cm",
                      "Tinggi 20 cm | Lingkaran 90 cm",
                      "Tinggi 105 cm | Lingkaran 30 cm",
                    ].map((dim) => (
                      <button
                        key={dim}
                        type="button"
                        onClick={() => setProductFormData((prev) => ({ ...prev, dimensions: dim }))}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 transition-colors"
                      >
                        {dim}
                      </button>
                    ))}
                  </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-700 uppercase tracking-wider text-xs">
                      Badge Khusus (Label Promosi)
                    </label>
                    <span className="text-[10px] text-stone-400">Pojok atas foto produk</span>
                  </div>
                  <input
                    type="text"
                    value={productFormData.badge}
                    onChange={(e) => setProductFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="Contoh: Terlaris / Best Seller / Pilihan Pengrajin"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-forest bg-white font-medium"
                  />
                  {/* Quick select badge pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-stone-400 font-semibold uppercase">Pilihan Cepat:</span>
                    {[
                      "Terlaris",
                      "Best Seller",
                      "Produk Pilihan",
                      "100% Bahan Alami",
                      "Edisi Terbatas",
                      "Karya Pengrajin",
                    ].map((badge) => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => setProductFormData((prev) => ({ ...prev, badge }))}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                          productFormData.badge === badge
                            ? "bg-forest text-white border-forest font-bold"
                            : "bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200"
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-700 uppercase tracking-wider text-xs">
                      Status Stok (Fleksibel)
                    </label>
                    <span className="text-[10px] text-stone-400">Bisa ketik bebas atau pilih template</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={productFormData.stock_label}
                        onChange={(e) =>
                          setProductFormData((prev) => ({ ...prev, stock_label: e.target.value }))
                        }
                        placeholder="Ketik manual (misal: Sisa 2 pcs, Ready Besok, dll)"
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-forest bg-white font-medium"
                      />
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            setProductFormData((prev) => ({ ...prev, stock_label: e.target.value }));
                          }
                        }}
                        className="px-2.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 cursor-pointer focus:outline-none focus:border-forest"
                        title="Pilih Template Status"
                      >
                        <option value="">📋 Template...</option>
                        <option value="Tersedia">Tersedia</option>
                        <option value="Tersisa 3">Tersisa 3</option>
                        <option value="Tersisa 5">Tersisa 5</option>
                        <option value="Pre-Order 2 Hari">Pre-Order 2 Hari</option>
                        <option value="Pre-Order 5 Hari">Pre-Order 5 Hari</option>
                        <option value="Habis">Habis</option>
                        <option value="Edisi Terbatas">Edisi Terbatas</option>
                      </select>
                    </div>

                    {/* Quick Pill Templates */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-stone-400 font-semibold uppercase">Pilihan Cepat:</span>
                      {[
                        { label: "Tersedia", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                        { label: "Tersisa 3", cls: "bg-amber-50 text-amber-700 border-amber-200" },
                        { label: "Pre-Order 2 Hari", cls: "bg-blue-50 text-blue-700 border-blue-200" },
                        { label: "Habis", cls: "bg-rose-50 text-rose-700 border-rose-200" },
                        { label: "Edisi Terbatas", cls: "bg-purple-50 text-purple-700 border-purple-200" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setProductFormData((prev) => ({ ...prev, stock_label: item.label }))}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                            productFormData.stock_label === item.label
                              ? "ring-2 ring-forest font-bold " + item.cls
                              : "hover:opacity-80 " + item.cls
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Selection / Upload Section */}
              <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-stone-800 text-xs uppercase tracking-wider">
                      Foto / Gambar Produk
                    </label>
                    <p className="text-[11px] text-stone-500">
                      Otomatis dikompresi (WebP) & disimpan di Supabase Storage
                    </p>
                  </div>

                  {/* Mode switch pills */}
                  <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-xl text-xs shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("upload")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                        imageInputMode === "upload"
                          ? "bg-white text-forest shadow-xs font-semibold"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("preset")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                        imageInputMode === "preset"
                          ? "bg-white text-forest shadow-xs font-semibold"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Katalog Brosur
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("url")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        imageInputMode === "url"
                          ? "bg-white text-forest shadow-xs font-semibold"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      URL Link
                    </button>
                  </div>
                </div>

                {/* TAB 1: Direct File Upload */}
                {imageInputMode === "upload" && (
                  <div className="space-y-2">
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleImageDrop}
                      className="border-2 border-dashed border-stone-300 hover:border-forest rounded-xl p-4 bg-white text-center transition-all cursor-pointer relative group"
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageFileUpload}
                        disabled={uploadingImage}
                        id="product-image-file-input"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      />

                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center py-3">
                          <Loader2 className="w-7 h-7 text-forest animate-spin mb-2" />
                          <p className="text-xs font-semibold text-stone-700">Mengompresi & Mengunggah ke Storage...</p>
                          <p className="text-[11px] text-stone-400">Harap tunggu sebentar</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-forest flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-stone-800 mb-0.5">
                            Pilih File Foto atau Tarik (Drag & Drop) ke Sini
                          </p>

                          {/* Rekomendasi Dimensi Gambar (Berapa kali Berapa) */}
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-semibold my-1.5 shadow-2xs">
                            <span>📐 Rekomendasi Ukuran:</span>
                            <span className="font-bold underline decoration-emerald-500">800 × 800 px</span>
                            <span className="text-stone-500 font-normal">(Rasio 1:1 Persegi) atau 1200 × 1200 px</span>
                          </div>

                          <p className="text-[11px] text-stone-500 mb-2">
                            Mendukung JPG, PNG, WebP • Maks. 5 MB (Otomatis dikompres &amp; hemat kuota)
                          </p>
                          <span className="inline-block text-[11px] bg-forest text-white font-semibold px-3.5 py-1.5 rounded-xl shadow-xs group-hover:bg-forest/90 transition-colors">
                            Buka File Komputer / HP
                          </span>
                        </div>
                      )}
                    </div>

                    {uploadSizeInfo && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{uploadSizeInfo}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Katalog Brosur Presets */}
                {imageInputMode === "preset" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] text-stone-500">
                        Pilih salah satu foto produk kerajinan yang sudah ada di katalog brosur:
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono">1254 × 1254 px (1:1)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 max-h-44 overflow-y-auto p-2 border border-stone-200 rounded-xl bg-white">
                      {PRESET_IMAGES.map((img) => {
                        const isSelected =
                          productFormData.image_path === img.path && !productFormData.custom_image_url;
                        return (
                          <button
                            key={img.path}
                            type="button"
                            onClick={() => {
                              setProductFormData((prev) => ({
                                ...prev,
                                image_path: img.path,
                                custom_image_url: "",
                              }));
                              setUploadPreviewUrl(img.path);
                              setUploadSizeInfo("");
                              setPreviewDimensions({ width: 1254, height: 1254 });
                            }}
                            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border text-center transition-all ${
                              isSelected
                                ? "border-forest bg-forest/5 ring-2 ring-forest"
                                : "border-stone-200 hover:border-stone-300 bg-white"
                            }`}
                          >
                            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-cream-soft">
                              <Image src={img.path} alt={img.label} fill sizes="48px" className="object-cover" />
                            </div>
                            <span className="text-[10px] text-stone-600 truncate w-full">{img.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: Custom URL */}
                {imageInputMode === "url" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-stone-600 block">
                      Masukkan link / URL gambar langsung (misal: Supabase, Unsplash, Cloudinary):
                    </label>
                    <input
                      type="text"
                      value={productFormData.custom_image_url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductFormData((prev) => ({ ...prev, custom_image_url: val }));
                        if (val) setUploadPreviewUrl(val);
                      }}
                      placeholder="https://.../gambar-anyaman.webp"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-forest bg-white"
                    />
                  </div>
                )}

                {/* PREVIEW GAMBAR TERPILIH (User-friendly Preview Card) */}
                {(() => {
                  const currentImage =
                    productFormData.custom_image_url.trim() ||
                    uploadPreviewUrl ||
                    productFormData.image_path;

                  if (!currentImage) return null;

                  const isSupabase = currentImage.includes("supabase.co/storage");
                  const isPreset = PRESET_IMAGES.some((img) => img.path === currentImage);

                  return (
                    <div className="flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-xl shadow-xs">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                        <img
                          src={currentImage}
                          alt="Preview Produk"
                          className="w-full h-full object-cover"
                          onLoad={(e) => {
                            const el = e.currentTarget;
                            if (el.naturalWidth && el.naturalHeight) {
                              setPreviewDimensions({
                                width: el.naturalWidth,
                                height: el.naturalHeight,
                              });
                            }
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/katalog/keranjang_bunga.png";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                            Preview Gambar Produk:
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                              isSupabase
                                ? "bg-emerald-100 text-emerald-800"
                                : isPreset
                                ? "bg-stone-100 text-stone-700"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isSupabase
                              ? "Supabase Storage"
                              : isPreset
                              ? "Katalog Brosur"
                              : "Link URL"}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 font-mono truncate" title={currentImage}>
                          {currentImage}
                        </p>

                        {/* DIMENSION DISPLAY: Berapa kali berapa (Resolusi Pixel Gambar) */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200 text-[11px] font-bold">
                            <span>📐 Ukuran Foto:</span>
                            <span className="text-forest font-extrabold underline decoration-forest/40">
                              {previewDimensions ? `${previewDimensions.width} × ${previewDimensions.height} px` : "1254 × 1254 px"}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500 font-medium">
                            {previewDimensions
                              ? Math.abs(previewDimensions.width / previewDimensions.height - 1) < 0.05
                                ? "• Rasio 1:1 Persegi (Ideal untuk Katalog)"
                                : previewDimensions.width > previewDimensions.height
                                ? "• Format Lanskap (Melebar)"
                                : "• Format Potret (Tinggi)"
                              : "• Rasio 1:1 Persegi (Ideal)"}
                          </span>
                        </div>

                        <p className="text-[10px] text-stone-400 mt-1">
                          Foto ini yang akan ditampilkan di card katalog pembeli
                        </p>
                      </div>
                    </div>
                  );
                })()}
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
