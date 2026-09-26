// app/reset-password/page.tsx — Halaman Reset Password Supabase Auth (Server Component)

import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Pembaruan Kata Sandi — Growkas",
  description: "Form reset dan pembaruan kata sandi resmi Growkas POS.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
