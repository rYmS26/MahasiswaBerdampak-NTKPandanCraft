"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import {
  buildWhatsAppMessage,
  formatRupiah,
} from "@/lib/format";
import { generateOrderReceiptBlob } from "@/lib/receipt-canvas";
import { useStoreSettings } from "@/components/StoreSettingsContext";
import type {
  CartItem,
  CreateOrderResponse,
  CustomerDetails,
  ProductItem,
} from "@/types/catalog";

interface CartDrawerProps {
  open: boolean;
  cart: CartItem[];
  productMap: Map<string, ProductItem>;
  customer: CustomerDetails;
  totalQty: number;
  totalPrice: number;
  onClose: () => void;
  onUpdateQty: (index: number, delta: number) => void;
  onUpdateVariant: (index: number, newVariant: string) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCustomerChange: (next: CustomerDetails) => void;
  onShowToast: (msg: string) => void;
}

export function CartDrawer({
  open,
  cart,
  productMap,
  customer,
  totalQty,
  totalPrice,
  onClose,
  onUpdateQty,
  onUpdateVariant,
  onRemoveItem,
  onClearCart,
  onCustomerChange,
  onShowToast,
}: CartDrawerProps) {
  const { sellerWhatsApp, sellerWhatsAppDisplay } = useStoreSettings();
  const [step, setStep] = useState<1 | 2>(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [orderPersisted, setOrderPersisted] = useState(false);
  const [waMessage, setWaMessage] = useState("");
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [receiptHint, setReceiptHint] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setErrorMsg("");
    }
  }, [open]);

  useEffect(() => {
    if (cart.length === 0) {
      setStep(1);
    }
  }, [cart.length]);

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }
    };
  }, [receiptPreviewUrl]);

  if (!open) return null;

  async function handleProceedToCheckout() {
    if (cart.length === 0) return;

    const name = customer.name.trim();
    const address = customer.address.trim();

    if (name.length < 2 || address.length < 3) {
      setErrorMsg(
        "Mohon isi Nama Pemesan dan Alamat / Kota Pengiriman terlebih dahulu.",
      );
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    setReceiptHint("");

    const siteOrigin =
      typeof window !== "undefined" ? window.location.origin : undefined;

    let resolvedCode = "";
    let resolvedMessage = "";
    let savedToDb = false;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name,
            address,
            note: customer.note.trim(),
          },
          items: cart,
          siteOrigin,
        }),
      });

      const data = (await res.json()) as CreateOrderResponse;
      if (res.ok && data.ok) {
        resolvedCode = data.orderCode;
        resolvedMessage = data.whatsappMessage;
        savedToDb = data.persisted;
      } else {
        resolvedMessage = buildWhatsAppMessage({
          items: cart,
          productMap,
          customer: { name, address, note: customer.note.trim() },
          siteOrigin,
        });
      }
    } catch {
      resolvedMessage = buildWhatsAppMessage({
        items: cart,
        productMap,
        customer: { name, address, note: customer.note.trim() },
        siteOrigin,
      });
    }

    setOrderCode(resolvedCode);
    setOrderPersisted(savedToDb);
    setWaMessage(resolvedMessage);
    setStep(2);

    try {
      const blob = await generateOrderReceiptBlob({
        orderCode: resolvedCode || "PESANAN-WA",
        items: cart,
        productMap,
        customer: { name, address, note: customer.note.trim() },
      });
      setReceiptBlob(blob);
      setReceiptPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      setReceiptBlob(null);
      setReceiptHint(
        "Pratinjau gambar struk otomatis tidak tersedia; ringkasan teks & link foto siap dikirim ke WhatsApp.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyReceiptImage() {
    if (!receiptBlob) return;
    try {
      if (navigator.clipboard && typeof window.ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new window.ClipboardItem({ "image/png": receiptBlob }),
        ]);
        onShowToast("Struk gambar disalin! Tempel (Paste) di chat WhatsApp.");
        return;
      }
      throw new Error("Clipboard image unsupported");
    } catch {
      setReceiptHint(
        "Browser membatasi salin gambar langsung. Silakan klik 'Unduh Struk Foto' lalu lampirkan di WhatsApp.",
      );
    }
  }

  function handleDownloadReceiptImage() {
    if (!receiptBlob) return;
    const url = URL.createObjectURL(receiptBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${orderCode || "pesanan-ntk-pandancraft"}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onShowToast("Struk foto pesanan berhasil diunduh");
  }

  async function handleCopyWhatsAppText() {
    try {
      await navigator.clipboard.writeText(waMessage);
      onShowToast("Teks pesanan berhasil disalin");
    } catch {
      onShowToast("Silakan salin teks secara manual");
    }
  }

  function handleOpenWhatsApp() {
    const waUrl = `https://wa.me/${sellerWhatsApp}?text=${encodeURIComponent(
      waMessage,
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    onShowToast("Membuka WhatsApp dengan pesanan otomatis");
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Keranjang Belanja"
    >
      <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-olive" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-forest">
                {step === 1
                  ? "Keranjang Belanja"
                  : "Ringkasan & Kirim ke WhatsApp"}
              </h2>
              <p className="text-xs text-stone-500">
                {totalQty} barang • Total {formatRupiah(totalPrice)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && step === 1 ? (
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs font-semibold text-red-600 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Kosongkan
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              aria-label="Tutup keranjang"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP 1: CART ITEMS & CUSTOMER FORM */}
        {step === 1 ? (
          <div className="flex-1 flex flex-col min-h-0">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center text-stone-400 mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-forest">
                  Keranjang masih kosong
                </h3>
                <p className="text-sm text-stone-500 mt-1 max-w-xs">
                  Pilih kerajinan anyaman pandan dari katalog, lalu jumlah dan total
                  harga akan dihitung otomatis di sini.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    document
                      .getElementById("katalog")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-5 px-5 py-2.5 rounded-full bg-olive hover:bg-olive-dark text-white text-sm font-semibold transition-colors"
                >
                  Jelajahi Katalog
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                  <div className="space-y-3">
                    {cart.map((entry, idx) => {
                      const product = productMap.get(entry.slug);
                      if (!product) return null;
                      const subtotal = product.price * entry.qty;

                      return (
                        <div
                          key={`${entry.slug}-${entry.variant}-${entry.note}-${idx}`}
                          className="flex gap-3 p-3 rounded-2xl border border-stone-200/80 bg-white"
                        >
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-cream-soft flex-shrink-0 border border-stone-100">
                            <Image
                              src={product.imagePath}
                              alt={product.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-forest truncate">
                                  {product.name}
                                </h4>
                                <p className="text-xs text-stone-500 tabular-nums">
                                  {formatRupiah(product.price)} / pcs
                                </p>

                                {product.variants.length > 0 ? (
                                  <select
                                    value={entry.variant}
                                    onChange={(e) =>
                                      onUpdateVariant(idx, e.target.value)
                                    }
                                    className="mt-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-stone-200 bg-cream-soft text-forest focus:outline-none focus:border-olive"
                                  >
                                    {product.variants.map((v) => (
                                      <option key={v} value={v}>
                                        {v}
                                      </option>
                                    ))}
                                  </select>
                                ) : null}

                                {entry.note ? (
                                  <p className="text-[11px] text-olive mt-1 italic">
                                    Catatan: {entry.note}
                                  </p>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                onClick={() => onRemoveItem(idx)}
                                className="text-stone-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                aria-label={`Hapus ${product.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div className="inline-flex items-center rounded-full border border-stone-200 bg-cream-soft">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(idx, -1)}
                                  className="w-7 h-7 flex items-center justify-center text-forest hover:bg-stone-200/70 rounded-l-full"
                                  aria-label="Kurangi jumlah"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-7 text-center text-xs font-bold tabular-nums">
                                  {entry.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(idx, 1)}
                                  className="w-7 h-7 flex items-center justify-center text-forest hover:bg-stone-200/70 rounded-r-full"
                                  aria-label="Tambah jumlah"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-sm font-bold text-forest tabular-nums">
                                {formatRupiah(subtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Customer Info Form */}
                  <div className="pt-4 border-t border-stone-200 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
                      Data Pemesan (Untuk Format WhatsApp)
                    </h3>

                    <div>
                      <label
                        htmlFor="checkout-name"
                        className="block text-xs font-medium text-stone-600 mb-1"
                      >
                        Nama Pemesan <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="checkout-name"
                        type="text"
                        value={customer.name}
                        onChange={(e) => {
                          setErrorMsg("");
                          onCustomerChange({ ...customer, name: e.target.value });
                        }}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-forest focus:outline-none focus:border-olive"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-address"
                        className="block text-xs font-medium text-stone-600 mb-1"
                      >
                        Alamat / Kota Pengiriman{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="checkout-address"
                        type="text"
                        value={customer.address}
                        onChange={(e) => {
                          setErrorMsg("");
                          onCustomerChange({
                            ...customer,
                            address: e.target.value,
                          });
                        }}
                        placeholder="Contoh: Kec. Coblong, Kota Bandung, Jawa Barat"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-forest focus:outline-none focus:border-olive"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-note"
                        className="block text-xs font-medium text-stone-600 mb-1"
                      >
                        Catatan Tambahan (Opsional)
                      </label>
                      <textarea
                        id="checkout-note"
                        rows={2}
                        value={customer.note}
                        onChange={(e) =>
                          onCustomerChange({ ...customer, note: e.target.value })
                        }
                        placeholder="Contoh: Minta packing kardus tebal atau kirim minggu ini"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-forest focus:outline-none focus:border-olive"
                      />
                    </div>

                    {errorMsg ? (
                      <p className="text-xs font-medium text-red-600">{errorMsg}</p>
                    ) : null}
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-stone-200 bg-cream-soft space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">Total Jumlah Barang</span>
                    <span className="font-semibold text-forest tabular-nums">
                      {totalQty} pcs
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-forest">
                      Total Harga
                    </span>
                    <span className="text-xl font-bold text-olive tabular-nums">
                      {formatRupiah(totalPrice)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleProceedToCheckout}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-whatsapp hover:bg-whatsapp-dark disabled:opacity-70 text-white text-sm font-bold shadow-sm transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Menyimpan Pesanan &amp; Menyiapkan WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        <span>Simpan &amp; Lanjut ke WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* STEP 2: RECEIPT IMAGE + PREVIEW PESAN WHATSAPP */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-olive hover:text-olive-dark"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ubah barang / data pemesan</span>
              </button>

              {orderCode ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-olive-light border border-olive/20 text-xs text-forest">
                  <CheckCircle2 className="w-4 h-4 text-olive flex-shrink-0" />
                  <span>
                    Kode Pesanan: <strong>{orderCode}</strong>
                    {orderPersisted
                      ? " (Tercatat di database)"
                      : " (Siap kirim ke WhatsApp)"}
                  </span>
                </div>
              ) : null}

              <div className="rounded-2xl border border-stone-200 bg-cream-soft p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-forest">
                    Struk Gambar Pesanan (dengan Foto)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Opsional: salin atau unduh gambar ini untuk dilampirkan di chat WA
                  </p>
                </div>

                {receiptPreviewUrl ? (
                  <div className="rounded-xl overflow-hidden border border-stone-200 bg-white">
                    <img
                      src={receiptPreviewUrl}
                      alt="Pratinjau struk foto pesanan"
                      className="w-full h-auto block"
                    />
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!receiptBlob}
                    onClick={handleCopyReceiptImage}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-50 text-xs font-semibold text-forest transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Salin Struk Foto</span>
                  </button>
                  <button
                    type="button"
                    disabled={!receiptBlob}
                    onClick={handleDownloadReceiptImage}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-olive bg-olive-light hover:bg-olive/20 disabled:opacity-50 text-xs font-semibold text-olive transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Struk Foto</span>
                  </button>
                </div>

                {receiptHint ? (
                  <p className="text-[11px] text-stone-500">{receiptHint}</p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-forest">
                    Pesan WhatsApp Otomatis (Siap Kirim)
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppText}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-olive hover:text-olive-dark"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Teks</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-cream-soft border border-stone-200 text-xs text-forest whitespace-pre-wrap font-sans leading-relaxed max-h-60 overflow-y-auto">
                  {waMessage}
                </pre>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-stone-200 bg-cream-soft space-y-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-whatsapp hover:bg-whatsapp-dark text-white text-sm font-bold shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Buka WhatsApp &amp; Kirim Pesanan</span>
              </button>
              <p className="text-[11px] text-center text-stone-500">
                Pesan berisi produk, foto, jumlah, &amp; harga akan otomatis terisi di
                chat penjual ({sellerWhatsAppDisplay}).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
