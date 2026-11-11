import { formatRupiah } from "@/lib/format";
import type { CartItem, CustomerDetails, ProductItem } from "@/types/catalog";

function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generateOrderReceiptBlob(params: {
  orderCode: string;
  items: CartItem[];
  productMap: Map<string, ProductItem>;
  customer: CustomerDetails;
}): Promise<Blob> {
  const { orderCode, items, productMap, customer } = params;

  const width = 760;
  const rowHeight = 104;
  const headerHeight = 130;
  const customerHeight = customer.note.trim() ? 124 : 96;
  const footerHeight = 128;
  const height =
    headerHeight + items.length * rowHeight + customerHeight + footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context tidak tersedia");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#14261c";
  ctx.fillRect(0, 0, width, headerHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 25px Inter, system-ui, sans-serif";
  ctx.fillText("NTK PANDAN CRAFT — RINGKASAN PESANAN", 36, 52);

  ctx.fillStyle = "#cbd5c0";
  ctx.font = "15px Inter, system-ui, sans-serif";
  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  ctx.fillText(
    `Kode: ${orderCode}  •  ${dateStr}  •  WA: +62 857-9377-3875`,
    36,
    88,
  );

  const loadedThumbs = await Promise.all(
    items.map((entry) => {
      const product = productMap.get(entry.slug);
      return product ? loadImageSafe(product.imagePath) : Promise.resolve(null);
    }),
  );

  let y = headerHeight + 18;
  let totalQty = 0;
  let totalPrice = 0;

  items.forEach((entry, idx) => {
    const product = productMap.get(entry.slug);
    if (!product) return;

    totalQty += entry.qty;
    const subtotal = product.price * entry.qty;
    totalPrice += subtotal;

    ctx.fillStyle = "#faf8f4";
    ctx.fillRect(28, y, width - 56, rowHeight - 12);
    ctx.strokeStyle = "#e6e1d5";
    ctx.lineWidth = 1;
    ctx.strokeRect(28, y, width - 56, rowHeight - 12);

    const thumb = loadedThumbs[idx];
    if (thumb) {
      ctx.drawImage(thumb, 42, y + 10, 72, 72);
    } else {
      ctx.fillStyle = "#e6e1d5";
      ctx.fillRect(42, y + 10, 72, 72);
    }

    const variantText = entry.variant ? ` (${entry.variant})` : "";
    ctx.fillStyle = "#14261c";
    ctx.font = "bold 18px Inter, system-ui, sans-serif";
    ctx.fillText(`${idx + 1}. ${product.name}${variantText}`, 130, y + 36);

    ctx.fillStyle = "#5a655e";
    ctx.font = "15px Inter, system-ui, sans-serif";
    ctx.fillText(
      `${entry.qty} pcs × ${formatRupiah(product.price)}`,
      130,
      y + 64,
    );

    const subStr = formatRupiah(subtotal);
    ctx.fillStyle = "#5d7332";
    ctx.font = "bold 19px Inter, system-ui, sans-serif";
    const subWidth = ctx.measureText(subStr).width;
    ctx.fillText(subStr, width - 48 - subWidth, y + 52);

    y += rowHeight;
  });

  y += 10;
  ctx.fillStyle = "#14261c";
  ctx.font = "bold 16px Inter, system-ui, sans-serif";
  ctx.fillText("Data Pemesan:", 36, y + 22);
  ctx.fillStyle = "#425248";
  ctx.font = "15px Inter, system-ui, sans-serif";
  ctx.fillText(`Nama: ${customer.name.trim()}`, 36, y + 48);
  ctx.fillText(`Alamat: ${customer.address.trim().slice(0, 68)}`, 36, y + 72);
  if (customer.note.trim()) {
    ctx.fillText(`Catatan: ${customer.note.trim().slice(0, 68)}`, 36, y + 96);
  }

  const totalY = height - footerHeight + 12;
  ctx.fillStyle = "#eef2e5";
  ctx.fillRect(28, totalY, width - 56, 86);
  ctx.fillStyle = "#14261c";
  ctx.font = "bold 18px Inter, system-ui, sans-serif";
  ctx.fillText(`Total Barang: ${totalQty} pcs`, 48, totalY + 36);
  ctx.fillText("Total Pembayaran:", 48, totalY + 66);

  const totalStr = formatRupiah(totalPrice);
  ctx.fillStyle = "#5d7332";
  ctx.font = "bold 28px Inter, system-ui, sans-serif";
  const totalWidth = ctx.measureText(totalStr).width;
  ctx.fillText(totalStr, width - 48 - totalWidth, totalY + 58);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Gagal membuat gambar struk"));
      },
      "image/png",
    );
  });
}
