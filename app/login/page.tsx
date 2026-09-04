// app/login/page.tsx — Halaman Login (Server Component)
// Server component: aman, tidak expose secrets ke client.
// Mengecek apakah user sudah login; jika ya, redirect ke dashboard.

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";
import type { Metadata } from "next";

// ----------------------------------------------------------------
// METADATA untuk halaman login
// ----------------------------------------------------------------
export const metadata: Metadata = {
  title: "Masuk",
  description: "Login ke Growkas — sistem kasir F&B untuk kafe dan restoran.",
};

// ----------------------------------------------------------------
// LOGIN PAGE (Server Component)
// ----------------------------------------------------------------
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  // Cek session di server — tidak perlu round-trip ke client
  const session = await auth();

  // Jika sudah login, langsung ke dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  // Ambil error param dari URL (misal: ?error=OAuthAccountNotLinked)
  const params = await searchParams;
  const errorCode = params?.error;
  const callbackUrl = params?.callbackUrl ?? "/dashboard";

  // Map kode error NextAuth ke pesan yang ramah pengguna
  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked:
      "Akun Google ini sudah terdaftar dengan metode login lain.",
    OAuthCallbackError: "Terjadi kesalahan saat login dengan Google. Coba lagi.",
    SessionRequired: "Silakan masuk untuk mengakses halaman ini.",
    AccessDenied: "Akses ditolak. Hubungi admin untuk mendapatkan akses.",
    Configuration: "Konfigurasi server bermasalah. Hubungi administrator.",
    Default: "Terjadi kesalahan. Silakan coba lagi.",
  };

  const errorMessage = errorCode
    ? (errorMessages[errorCode] ?? errorMessages.Default)
    : null;

  return (
    <LoginClient
      errorMessage={errorMessage}
      callbackUrl={callbackUrl}
    />
  );
}
