// app/page.tsx — Root page: redirect ke /login
// Middleware akan handle redirect jika belum auth,
// tapi ini sebagai fallback redirect eksplisit.

import { redirect } from "next/navigation";

export default function RootPage() {
  // Jika sudah login → dashboard
  // Jika belum → middleware handle ke /login
  redirect("/login");
}
