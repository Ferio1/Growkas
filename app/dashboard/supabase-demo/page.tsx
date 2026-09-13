// app/dashboard/supabase-demo/page.tsx — Test Koneksi Supabase
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Supabase Connection Demo — Growkas",
};

export default async function SupabaseDemoPage() {
  let products = [];
  let errorMsg = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("products").select("*").limit(10);
    if (error) {
      errorMsg = error.message;
    } else {
      products = data || [];
    }
  } catch (err: any) {
    errorMsg = err.message || "Gagal menghubungi Supabase";
  }

  return (
    <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto", color: "#F5F0E8", fontFamily: "system-ui, sans-serif" }}>
      <Link href="/dashboard" style={{ color: "#D4651C", textDecoration: "none", marginBottom: "20px", display: "inline-block" }}>
        ← Kembali ke Dashboard
      </Link>
      
      <h1 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>Status Koneksi Supabase</h1>
      <p style={{ color: "rgba(245,240,232,0.6)", marginBottom: "24px" }}>
        Project URL: <code>{process.env.NEXT_PUBLIC_SUPABASE_URL || "Belum di-set"}</code>
      </p>

      {errorMsg ? (
        <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171" }}>
          <strong>⚠️ Perhatian:</strong> {errorMsg}
          <div style={{ marginTop: "8px", fontSize: "0.88rem", color: "rgba(245,240,232,0.8)" }}>
            Pastikan Anda sudah mengisi <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di <code>.env.local</code> dan mengeksekusi tabel di Supabase SQL Editor (<code>supabase/schema.sql</code>).
          </div>
        </div>
      ) : (
        <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ fontSize: "1.2rem", color: "#4ade80", marginBottom: "16px" }}>✓ Terhubung ke Supabase</h2>
          <h3 style={{ fontSize: "1rem", marginBottom: "12px" }}>Daftar Produk ({products.length}):</h3>
          {products.length === 0 ? (
            <p style={{ color: "rgba(245,240,232,0.5)" }}>Belum ada data produk di tabel <code>products</code>.</p>
          ) : (
            <ul style={{ paddingLeft: "20px" }}>
              {products.map((item: any) => (
                <li key={item.id} style={{ marginBottom: "8px" }}>
                  <strong>{item.name}</strong> — Rp {Number(item.price).toLocaleString("id-ID")} (Stok: {item.stock})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
