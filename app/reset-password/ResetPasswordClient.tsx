"use client";
// app/reset-password/ResetPasswordClient.tsx — Form Pembaruan Password Baru

import { useState } from "react";
import Link from "next/link";
import GrowkasLogo from "@/app/components/GrowkasLogo";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordWithToken } from "@/app/actions/authActions";

export default function ResetPasswordClient() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      // 1. Coba update via browser client (jika ada recovery session aktif di localStorage/hash)
      const supabase = createClient();
      const { error: clientError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (clientError) {
        // Fallback: coba update via server action
        const res = await resetPasswordWithToken(newPassword);
        if (!res.success) {
          setErrorMsg(res.error || clientError.message || "Gagal memperbarui password.");
          setLoading(false);
          return;
        }
      }

      setSuccessMsg("Kata sandi berhasil diperbarui! Silakan masuk kembali dengan password baru.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memperbarui kata sandi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0A",
      color: "#F5F0E8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      padding: "20px",
      position: "relative",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "36px 30px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      }}>
        {/* Header Logo & Title */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-block", marginBottom: "14px" }}>
            <GrowkasLogo size={42} />
          </div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: "800", margin: "0 0 6px" }}>
            Pembaruan Kata Sandi
          </h1>
          <p style={{ fontSize: "0.85rem", color: "rgba(245,240,232,0.6)", margin: 0 }}>
            Masukkan kata sandi baru untuk akun Growkas Anda.
          </p>
        </div>

        {/* Notifikasi Error */}
        {errorMsg && (
          <div style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#EF4444",
            padding: "12px 14px",
            borderRadius: "10px",
            fontSize: "0.82rem",
            fontWeight: "600",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Notifikasi Sukses */}
        {successMsg ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(74,222,128,0.15)",
              color: "#4ADE80",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              margin: "0 auto 16px",
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "8px" }}>
              Berhasil Diperbarui!
            </h2>
            <p style={{ fontSize: "0.85rem", color: "rgba(245,240,232,0.7)", marginBottom: "24px" }}>
              {successMsg}
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                background: "#D4651C",
                color: "#FFF",
                fontWeight: "700",
                fontSize: "0.9rem",
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Masuk Sekarang ➔
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Field Password Baru */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", marginBottom: "6px", color: "rgba(245,240,232,0.8)" }}>
                Kata Sandi Baru
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={pwVisible ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 14px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#F5F0E8",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setPwVisible(!pwVisible)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(245,240,232,0.5)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {pwVisible ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Field Konfirmasi Password Baru */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", marginBottom: "6px", color: "rgba(245,240,232,0.8)" }}>
                Konfirmasi Kata Sandi Baru
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={confirmVisible ? "text" : "password"}
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 14px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#F5F0E8",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setConfirmVisible(!confirmVisible)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(245,240,232,0.5)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {confirmVisible ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Tombol Simpan Password */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "8px",
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                background: loading ? "rgba(212,101,28,0.5)" : "#D4651C",
                color: "#FFF",
                fontWeight: "700",
                fontSize: "0.9rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {loading ? "Menyimpan kata sandi..." : "Simpan Kata Sandi Baru"}
            </button>

            {/* Link Batal / Kembali */}
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <Link
                href="/login"
                style={{
                  fontSize: "0.82rem",
                  color: "rgba(245,240,232,0.6)",
                  textDecoration: "none",
                }}
              >
                ← Kembali ke Halaman Masuk
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
