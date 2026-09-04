// proxy.ts — Route Protection (Next.js 16+ convention)
// Menggantikan middleware.ts yang deprecated di Next.js 16
//
// Fungsi: Redirect user yang belum login ke /login
// Berjalan di edge runtime sebelum request masuk ke halaman.

export { auth as proxy } from "@/auth";

// Konfigurasi: tentukan route mana yang diproteksi
export const config = {
  matcher: [
    /*
     * Proteksi semua route KECUALI:
     * - _next/static, _next/image (aset Next.js)
     * - favicon.ico
     * - api/auth/*   (NextAuth — jangan diblokir!)
     * - dashboard/*  (sementara dibuka untuk demo prototipe)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|dashboard).*)",
  ],
};
