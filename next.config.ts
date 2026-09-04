// next.config.ts — Konfigurasi Next.js untuk Growkas
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan gambar dari domain Google (untuk avatar user)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Avatar Google
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // Avatar GitHub (opsional)
      },
    ],
  },

  // Eksperimental: server actions sudah stabil di Next.js 14+
  // (tidak perlu flag eksplisit, tapi ini untuk dokumentasi)
  experimental: {},
};

export default nextConfig;
