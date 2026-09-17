// app/layout.tsx — Root Layout
// Ini adalah layout paling atas yang membungkus semua halaman.
// Hanya render sekali; children diganti sesuai route aktif.

import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

// ----------------------------------------------------------------
// METADATA — SEO & Open Graph
// ----------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    default: "GROWKAS — Sistem Kasir F&B",
    template: "%s | GROWKAS",
  },
  description:
    "Growkas adalah sistem kasir digital untuk usaha F&B — mencatat transaksi, mengelola pesanan, dan menghasilkan laporan penjualan harian.",
  keywords: ["kasir", "POS", "F&B", "restoran", "kafe", "laporan penjualan"],
  authors: [{ name: "Growkas Team" }],
  robots: "noindex, nofollow", // Jangan index halaman internal POS
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GROWKAS POS",
  },
  openGraph: {
    title: "GROWKAS — Sistem Kasir F&B",
    description: "Sistem kasir digital untuk kafe dan restoran.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

// ----------------------------------------------------------------
// ROOT LAYOUT COMPONENT
// ----------------------------------------------------------------
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Google Fonts: Clash Display (display) + General Sans (body) */}
        {/* Menggunakan CDN fonts.bunny.net (privacy-friendly, GDPR compliant) */}
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          href="https://fonts.bunny.net/css?family=cabinet-grotesk:400,500,700,800,900|instrument-serif:400i"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
