import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ciamis Pandan Craft — Katalog Digital Kerajinan Pandan",
  description:
    "Katalog digital kerajinan anyaman daun pandan handmade dari Ciamis. Pilih produk favorit, atur jumlah di keranjang, dan pesan otomatis via WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white font-sans text-forest antialiased">{children}</body>
    </html>
  );
}
