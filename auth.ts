// auth.ts — Konfigurasi NextAuth.js (Auth.js v5)
// Letakkan di root project (sejajar dengan package.json)
//
// Dokumentasi: https://authjs.dev/getting-started/installation

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ----------------------------------------------------------------
  // PROVIDERS
  // Daftar provider OAuth yang digunakan.
  // Untuk tambah provider lain (GitHub, Facebook, dll), tambahkan di sini.
  // ----------------------------------------------------------------
  providers: [
    Google({
      // Ambil dari environment variable — JANGAN hardcode di sini!
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

      // Scope tambahan: profile + email (sudah default)
      // Untuk akses lebih (kalender, dll), tambahkan scope di sini
      authorization: {
        params: {
          prompt: "consent",      // Selalu minta consent (bagus untuk dev)
          access_type: "offline", // Untuk refresh token
          response_type: "code",
        },
      },
    }),
  ],

  // ----------------------------------------------------------------
  // HALAMAN KUSTOM
  // Override halaman auth default NextAuth dengan halaman kita sendiri
  // ----------------------------------------------------------------
  pages: {
    signIn: "/login",    // Redirect ke /login jika belum auth
    error: "/login",     // Redirect error ke halaman login (dengan ?error=...)
  },

  // ----------------------------------------------------------------
  // CALLBACKS
  // Transformasi data session/token setelah login berhasil
  // ----------------------------------------------------------------
  callbacks: {
    // jwt() dipanggil saat token dibuat/diperbarui
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Simpan role default ke dalam token
        // Di produksi: cek database untuk role user
        token.role = "kasir"; // default role

        // Simpan Google access token (untuk API Google jika perlu)
        token.accessToken = account.access_token;
      }
      return token;
    },

    // session() dipanggil setiap kali session diakses (client side)
    async session({ session, token }) {
      // Expose role ke session agar bisa diakses di client
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.sub;
      }
      return session;
    },

    // authorized() dipakai oleh proxy untuk cek akses route
    authorized({ auth, request }) {
      // ----------------------------------------------------------------
      // DEVELOPMENT MODE:
      // Izinkan akses ke semua halaman agar simulasi login bisa berjalan.
      // Berguna untuk demo prototipe tanpa perlu Google OAuth.
      //
      // PRODUCTION MODE (di Vercel):
      // Wajib punya session nyata (dari Google OAuth).
      // ----------------------------------------------------------------
      if (process.env.NODE_ENV === "development") {
        // Halaman /login tetap bisa diakses siapa saja
        // Halaman lain (dashboard, dll) diizinkan untuk demo
        return true;
      }

      // Production: cek session NextAuth
      return !!auth;
    },
  },

  // ----------------------------------------------------------------
  // SESSION STRATEGY
  // "jwt" = stateless, tidak butuh database untuk session
  // Ganti ke "database" jika pakai adapter (Prisma, Supabase, dll)
  // ----------------------------------------------------------------
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },

  // ----------------------------------------------------------------
  // SECRET
  // Digunakan untuk sign/encrypt JWT token
  // Wajib di-set di production!
  // ----------------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,

  // ----------------------------------------------------------------
  // DEBUG
  // Set true hanya di development untuk lihat log auth
  // ----------------------------------------------------------------
  debug: process.env.NODE_ENV === "development",
});
