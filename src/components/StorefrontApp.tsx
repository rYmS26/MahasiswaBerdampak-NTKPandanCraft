"use client";

import dynamic from "next/dynamic";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2 } from "lucide-react";
import { BundlesSection } from "@/components/BundlesSection";
import { CatalogSection } from "@/components/CatalogSection";
import { CategoryCircles } from "@/components/CategoryCircles";
import { FloatingCartBar } from "@/components/FloatingCartBar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { Navbar } from "@/components/Navbar";
import { TestimonialsAndFaq } from "@/components/TestimonialsAndFaq";
import { StoreSettingsProvider } from "@/components/StoreSettingsContext";
import { getProductAvailableStock, getProductUnitPrice } from "@/lib/format";
import type {
  CartItem,
  CategoryItem,
  CustomerDetails,
  ProductItem,
  StoreSettings,
} from "@/types/catalog";

const ProductDetailModal = dynamic(
  () =>
    import("@/components/ProductDetailModal").then(
      (mod) => mod.ProductDetailModal,
    ),
  { ssr: false },
);

const CartDrawer = dynamic(
  () => import("@/components/CartDrawer").then((mod) => mod.CartDrawer),
  { ssr: false },
);

const STORAGE_CART_KEY = "ntk_pandan_cart_v2";
const STORAGE_CUSTOMER_KEY = "ntk_pandan_customer_v2";

interface ToastEntry {
  id: number;
  message: string;
}

interface StorefrontAppProps {
  categories: CategoryItem[];
  products: ProductItem[];
  bundles: ProductItem[];
  settings?: StoreSettings;
}

function getCartKey(slug: string, variant: string, note: string): string {
  return `${slug}__${variant}__${note}`;
}

export function StorefrontApp({
  categories,
  products,
  bundles,
  settings,
}: StorefrontAppProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogExpanded, setCatalogExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    address: "",
    note: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    null,
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const productMap = useMemo(() => {
    const map = new Map<string, ProductItem>();
    [...products, ...bundles].forEach((item) => map.set(item.slug, item));
    return map;
  }, [products, bundles]);

  // Hydrate persisted cart & customer form once on mount
  useEffect(() => {
    try {
      const rawCart = localStorage.getItem(STORAGE_CART_KEY);
      if (rawCart) {
        const parsed = JSON.parse(rawCart) as CartItem[];
        if (Array.isArray(parsed)) {
          setCart(
            parsed.filter(
              (entry) =>
                entry &&
                productMap.has(entry.slug) &&
                Number.isInteger(entry.qty) &&
                entry.qty > 0,
            ),
          );
        }
      }
      const rawCustomer = localStorage.getItem(STORAGE_CUSTOMER_KEY);
      if (rawCustomer) {
        const parsedCust = JSON.parse(rawCustomer) as Partial<CustomerDetails>;
        setCustomer({
          name: parsedCust.name ?? "",
          address: parsedCust.address ?? "",
          note: parsedCust.note ?? "",
        });
      }
    } catch {
      // Ignore invalid localStorage state
    } finally {
      setHydrated(true);
    }
  }, [productMap]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_CUSTOMER_KEY, JSON.stringify(customer));
    } catch {
      // Ignore storage quota errors
    }
  }, [customer, hydrated]);

  // Lock body scroll when modal or drawer is open & close on Escape
  useEffect(() => {
    const isOverlayOpen = Boolean(selectedProduct) || cartOpen;
    document.body.classList.toggle("overflow-hidden", isOverlayOpen);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (selectedProduct) setSelectedProduct(null);
      else if (cartOpen) setCartOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedProduct, cartOpen]);

  // Passive scrollspy
  useEffect(() => {
    const ids = [
      "beranda",
      "kategori",
      "katalog",
      "penawaran",
      "testimoni",
      "informasi",
    ];

    function handleScroll() {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 115) {
          current = id;
        }
      }
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 8
      ) {
        current = ids[ids.length - 1];
      }
      setActiveSection(current);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const showToast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const { totalQty, totalPrice, cartQtyBySlug } = useMemo(() => {
    let qty = 0;
    let price = 0;
    const bySlug = new Map<string, number>();

    for (const entry of cart) {
      const item = productMap.get(entry.slug);
      if (!item) continue;
      const unitPrice = getProductUnitPrice(item, entry.variant);
      qty += entry.qty;
      price += unitPrice * entry.qty;
      bySlug.set(entry.slug, (bySlug.get(entry.slug) ?? 0) + entry.qty);
    }

    return { totalQty: qty, totalPrice: price, cartQtyBySlug: bySlug };
  }, [cart, productMap]);

  const handleAddToCart = useCallback(
    (
      product: ProductItem,
      qty: number,
      variant: string,
      note: string,
      openCartAfter: boolean,
    ) => {
      const availableStock = getProductAvailableStock(product, variant);
      if (availableStock <= 0) {
        showToast(`Maaf, stok untuk ${product.name} sedang habis.`);
        return;
      }

      const targetKey = getCartKey(product.slug, variant, note);
      let capped = false;

      setCart((prev) => {
        const currentVariantQty = prev
          .filter(
            (c) =>
              c.slug === product.slug &&
              (c.variant || "").toLowerCase() === (variant || "").toLowerCase(),
          )
          .reduce((sum, c) => sum + c.qty, 0);

        const remainingAllowed = Math.max(0, availableStock - currentVariantQty);
        if (remainingAllowed <= 0) {
          capped = true;
          return prev;
        }

        const addQty = Math.min(qty, remainingAllowed);
        if (addQty < qty) {
          capped = true;
        }

        const idx = prev.findIndex(
          (c) => getCartKey(c.slug, c.variant, c.note) === targetKey,
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], qty: updated[idx].qty + addQty };
          return updated;
        }
        return [...prev, { slug: product.slug, qty: addQty, variant, note }];
      });

      const variantSuffix = variant ? ` (${variant})` : "";
      if (capped) {
        showToast(
          `Maksimal pembelian ${product.name}${variantSuffix} adalah ${availableStock} pcs (sesuai sisa stok)`,
        );
      } else {
        showToast(`${product.name}${variantSuffix} ditambahkan ke keranjang`);
      }

      setSelectedProduct(null);
      if (openCartAfter) {
        setCartOpen(true);
      }
    },
    [showToast],
  );

  const handleQuickAdd = useCallback(
    (product: ProductItem) => {
      const firstInStockVariant =
        product.variantPrices?.find((vp) => (vp.stock ?? product.stock) > 0)?.label ||
        (product.variants.length > 0 ? product.variants[0] : "");
      handleAddToCart(product, 1, firstInStockVariant, "", false);
    },
    [handleAddToCart],
  );

  const handleUpdateQty = useCallback(
    (index: number, delta: number) => {
      setCart((prev) => {
        const target = prev[index];
        if (!target) return prev;
        const product = productMap.get(target.slug);
        const maxStock = product
          ? getProductAvailableStock(product, target.variant)
          : 999;

        const nextQty = target.qty + delta;
        if (nextQty <= 0) {
          return prev.filter((_, i) => i !== index);
        }
        if (delta > 0 && nextQty > maxStock) {
          showToast(`Maksimal pembelian sesuai sisa stok (${maxStock} pcs)`);
          return prev.map((item, i) =>
            i === index ? { ...item, qty: Math.max(1, maxStock) } : item,
          );
        }
        return prev.map((item, i) =>
          i === index ? { ...item, qty: nextQty } : item,
        );
      });
    },
    [productMap, showToast],
  );

  const handleUpdateVariant = useCallback(
    (index: number, newVariant: string) => {
      setCart((prev) => {
        const current = prev[index];
        if (!current) return prev;
        const product = productMap.get(current.slug);
        const maxStock = product
          ? getProductAvailableStock(product, newVariant)
          : 999;

        const clampedQty = Math.min(current.qty, Math.max(1, maxStock));
        const updatedItem = { ...current, variant: newVariant, qty: clampedQty };
        const targetKey = getCartKey(
          updatedItem.slug,
          updatedItem.variant,
          updatedItem.note,
        );
        const dupIdx = prev.findIndex(
          (c, i) =>
            i !== index && getCartKey(c.slug, c.variant, c.note) === targetKey,
        );

        if (dupIdx !== -1) {
          return prev
            .map((item, i) =>
              i === dupIdx
                ? {
                    ...item,
                    qty: Math.min(maxStock, item.qty + updatedItem.qty),
                  }
                : item,
            )
            .filter((_, i) => i !== index);
        }

        return prev.map((item, i) => (i === index ? updatedItem : item));
      });
    },
    [productMap],
  );

  const handleRemoveItem = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSelectCategory = useCallback(
    (slug: string, scrollToCatalog = false) => {
      startTransition(() => {
        setActiveCategory(slug);
      });
      if (scrollToCatalog) {
        document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [],
  );

  const handleResetFilters = useCallback(() => {
    startTransition(() => {
      setSearchQuery("");
      setActiveCategory("all");
    });
  }, []);

  const handleFocusSearch = useCallback(() => {
    document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => searchInputRef.current?.focus(), 350);
  }, []);

  return (
    <StoreSettingsProvider settings={settings}>
      <Navbar
        totalQty={totalQty}
        activeSection={activeSection}
        onOpenCart={() => setCartOpen(true)}
        onFocusSearch={handleFocusSearch}
      />

      <main>
        <HeroSection />

        <CategoryCircles
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          onResetFilters={handleResetFilters}
        />

        <CatalogSection
          categories={categories}
          products={products}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          catalogExpanded={catalogExpanded}
          cartQtyBySlug={cartQtyBySlug}
          searchInputRef={searchInputRef}
          onSelectCategory={(slug) => handleSelectCategory(slug, false)}
          onSearchChange={(val) =>
            startTransition(() => {
              setSearchQuery(val);
            })
          }
          onToggleExpand={() => {
            setCatalogExpanded((prev) => {
              if (prev) {
                document
                  .getElementById("katalog")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
              return !prev;
            });
          }}
          onResetFilters={handleResetFilters}
          onOpenProduct={setSelectedProduct}
          onQuickAdd={handleQuickAdd}
        />

        <BundlesSection
          bundles={bundles}
          onOpenProduct={setSelectedProduct}
          onQuickAdd={handleQuickAdd}
        />

        <TestimonialsAndFaq />
      </main>

      <Footer />

      <FloatingCartBar
        cart={cart}
        productMap={productMap}
        totalQty={totalQty}
        totalPrice={totalPrice}
        hidden={cartOpen}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-xs sm:text-sm font-medium shadow-lg border border-white/10"
          >
            <CheckCircle2 className="w-4 h-4 text-whatsapp flex-shrink-0" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {selectedProduct ? (
        <ProductDetailModal
          product={selectedProduct}
          cart={cart}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddToCart}
        />
      ) : null}

      <CartDrawer
        open={cartOpen}
        cart={cart}
        productMap={productMap}
        customer={customer}
        totalQty={totalQty}
        totalPrice={totalPrice}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onUpdateVariant={handleUpdateVariant}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
        onCustomerChange={setCustomer}
        onShowToast={showToast}
      />
    </StoreSettingsProvider>
  );
}
