"use client";
// app/login/LoginClient.tsx — Komponen Login Interaktif (Client Component)
// Semua animasi, interaksi form, dan OAuth trigger ada di sini.
// Dipisah dari server component agar bisa pakai React hooks & event handlers.

import { useState, useEffect, useRef, useCallback } from "react";
import { signIn } from "next-auth/react";
import styles from "./login.module.css";

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface LoginClientProps {
  errorMessage: string | null; // Pesan error dari server (URL param)
  callbackUrl: string;          // Redirect URL setelah login berhasil
}

// ----------------------------------------------------------------
// KONSTANTA
// ----------------------------------------------------------------
const ROLES = [
  { id: "kasir", label: "Kasir", desc: "Transaksi harian" },
  { id: "admin", label: "Admin", desc: "Akses penuh" },
] as const;

type Role = (typeof ROLES)[number]["id"];

// ----------------------------------------------------------------
// KOMPONEN UTAMA
// ----------------------------------------------------------------
export default function LoginClient({ errorMessage, callbackUrl }: LoginClientProps) {
  // -- State --
  const [role, setRole] = useState<Role>("kasir");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(errorMessage);
  const [pwVisible, setPwVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  // -- Refs untuk magnetic button effect --
  const googleBtnRef = useRef<HTMLButtonElement>(null);
  const loginBtnRef  = useRef<HTMLButtonElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------------------
  // LIFECYCLE
  // ----------------------------------------------------------------

  // Mount animation trigger
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Live clock di panel kiri
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Magnetic button effect — tombol bergerak mengikuti kursor
  const makeMagnetic = useCallback(
    (ref: React.RefObject<HTMLButtonElement | null>) => {
      const el = ref.current;
      if (!el) return () => {};

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 80;

        if (dist < maxDist) {
          const strength = (maxDist - dist) / maxDist;
          el.style.transform = `translate(${dx * strength * 0.35}px, ${dy * strength * 0.35}px)`;
        } else {
          el.style.transform = "translate(0,0)";
        }
      };

      const onLeave = () => {
        el.style.transform = "translate(0,0)";
      };

      window.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        window.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    },
    []
  );

  useEffect(() => {
    const cleanG = makeMagnetic(googleBtnRef);
    const cleanL = makeMagnetic(loginBtnRef);
    return () => { cleanG(); cleanL(); };
  }, [makeMagnetic]);

  // Parallax pada panel kiri mengikuti mouse
  useEffect(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;

    const onMove = (e: MouseEvent) => {
      const rect = panel.getBoundingClientRect();
      // Hanya aktif jika kursor di atas panel kiri
      if (e.clientX > rect.right) return;

      const xRel = (e.clientX - rect.left) / rect.width - 0.5;
      const yRel = (e.clientY - rect.top)  / rect.height - 0.5;

      // Gerakkan elemen dekoratif
      const blobs = panel.querySelectorAll<HTMLElement>("[data-parallax]");
      blobs.forEach((blob) => {
        const speed = parseFloat(blob.dataset.parallax ?? "1");
        blob.style.transform = `translate(${xRel * speed * 20}px, ${yRel * speed * 20}px)`;
      });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ----------------------------------------------------------------
  // VALIDASI
  // ----------------------------------------------------------------
  const validateEmail = (val: string) => {
    if (!val.trim()) return "Email tidak boleh kosong";
    if (val.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      return "Format email tidak valid";
    return "";
  };

  const validatePassword = (val: string) => {
    if (!val) return "Password tidak boleh kosong";
    if (val.length < 6) return "Minimal 6 karakter";
    return "";
  };

  const validate = () => {
    const errors = {
      email:    validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(errors);
    setTouched({ email: true, password: true });
    return !errors.email && !errors.password;
  };

  // Live validation saat mengetik
  useEffect(() => {
    if (touched.email)    setFieldErrors(e => ({ ...e, email:    validateEmail(email) }));
  }, [email, touched.email]);

  useEffect(() => {
    if (touched.password) setFieldErrors(e => ({ ...e, password: validatePassword(password) }));
  }, [password, touched.password]);

  // ----------------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------------

  // Submit form (email + password)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    try {
      // NextAuth signIn dengan credentials provider
      // Di prototipe ini: simulasi delay, belum ada credentials provider nyata
      // Untuk produksi: tambahkan CredentialsProvider di auth.ts
      await new Promise(r => setTimeout(r, 1500));

      // Simulasi: hanya demo, arahkan ke dashboard
      // Di produksi: ganti dengan signIn("credentials", { email, password, redirect: false })
      window.location.href = callbackUrl;
    } catch {
      setServerError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  // Login dengan Google (NextAuth)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setServerError(null);

    try {
      // signIn("google") akan redirect ke Google OAuth consent screen
      // Setelah berhasil, otomatis redirect ke callbackUrl
      await signIn("google", {
        callbackUrl,
        redirect: true,
      });
    } catch {
      setServerError("Gagal terhubung ke Google. Coba lagi.");
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------------
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ----------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------
  return (
    <div className={`${styles.page} ${mounted ? styles.mounted : ""}`}>

      {/* ============================================================
          PANEL KIRI — Cinematic Visual
          ============================================================ */}
      <div className={styles.left} ref={leftPanelRef} aria-hidden="true">

        {/* Grain texture overlay */}
        <div className={styles.grain} />

        {/* Background gradient blob 1 */}
        <div className={styles.blob1} data-parallax="2" />
        {/* Background gradient blob 2 */}
        <div className={styles.blob2} data-parallax="3" />
        {/* Background gradient blob 3 */}
        <div className={styles.blob3} data-parallax="1.5" />

        {/* Grid lines dekoratif */}
        <div className={styles.grid} />

        {/* Konten utama panel kiri */}
        <div className={styles.leftContent}>

          {/* Wordmark besar */}
          <div className={styles.wordmarkWrap}>
            <span className={styles.wordmarkLabel}>SISTEM KASIR F&amp;B</span>
            <h1 className={styles.wordmark}>
              <span className={styles.wordmarkLine}>GROW</span>
              <span className={`${styles.wordmarkLine} ${styles.wordmarkItalic}`}>
                KAS
              </span>
            </h1>
          </div>

          {/* Floating feature cards */}
          <div className={styles.featureCards}>
            {/* Card 1: Transaksi */}
            <div className={`${styles.featureCard} ${styles.card1}`}>
              <div className={styles.cardIcon}>
                {/* Ikon receipt */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2l-3 2-3-2-3 2-3-2-3 2z"/>
                  <path d="M8 10h8M8 14h5"/>
                </svg>
              </div>
              <div>
                <div className={styles.cardTitle}>Transaksi</div>
                <div className={styles.cardStat}>124 hari ini</div>
              </div>
            </div>

            {/* Card 2: Pesanan */}
            <div className={`${styles.featureCard} ${styles.card2}`}>
              <div className={styles.cardIcon}>
                {/* Ikon pesanan */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <path d="M3 6h18"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <div>
                <div className={styles.cardTitle}>Pesanan</div>
                <div className={styles.cardStat}>37 aktif</div>
              </div>
            </div>

            {/* Card 3: Laporan */}
            <div className={`${styles.featureCard} ${styles.card3}`}>
              <div className={styles.cardIcon}>
                {/* Ikon chart */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <div className={styles.cardTitle}>Penjualan</div>
                <div className={styles.cardStat}>Rp 4,2 jt</div>
              </div>
            </div>
          </div>

          {/* Info bawah: tanggal + jam */}
          <div className={styles.timeInfo}>
            <div className={styles.timeDate}>{today}</div>
            <div className={styles.timeClock}>{time || "00:00:00"}</div>
          </div>
        </div>

        {/* Garis vertikal dekoratif */}
        <div className={styles.vertLine} />
      </div>

      {/* ============================================================
          PANEL KANAN — Form Login
          ============================================================ */}
      <div className={styles.right}>
        <div className={styles.formWrapper}>

          {/* Logo / brand kecil */}
          <div className={styles.formHeader}>
            <div className={styles.logo} aria-label="Growkas logo">
              {/* Ikon POS */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20 7H4C2.9 7 2 7.9 2 9v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 12H4V9h16v10zm-8-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM7 2h10v3H7z"/>
              </svg>
            </div>
            <div className={styles.formBrand}>GROWKAS</div>
          </div>

          {/* Heading form */}
          <div className={styles.formHeading}>
            <h2 className={styles.formTitle}>Selamat datang</h2>
            <p className={styles.formSubtitle}>
              Masuk untuk mulai shift Anda
            </p>
          </div>

          {/* ---- Role Selector ---- */}
          <div
            className={styles.roleSelector}
            role="tablist"
            aria-label="Pilih role"
          >
            {ROLES.map((r) => (
              <button
                key={r.id}
                role="tab"
                aria-selected={role === r.id}
                className={`${styles.roleTab} ${role === r.id ? styles.roleTabActive : ""}`}
                onClick={() => setRole(r.id)}
                type="button"
              >
                <span className={styles.roleTabLabel}>{r.label}</span>
                <span className={styles.roleTabDesc}>{r.desc}</span>
              </button>
            ))}
          </div>

          {/* ---- Pesan Error Server ---- */}
          {serverError && (
            <div className={styles.serverError} role="alert" aria-live="assertive">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {serverError}
            </div>
          )}

          {/* ---- FORM ---- */}
          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
            aria-label="Form login"
          >
            {/* Email / Username */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="input-email">
                Email atau Username
              </label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input
                  id="input-email"
                  className={`${styles.input} ${fieldErrors.email && touched.email ? styles.inputError : ""}`}
                  type="email"
                  autoComplete="username email"
                  placeholder={role === "kasir" ? "kasir@warungku.id" : "admin@warungku.id"}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  aria-invalid={!!(fieldErrors.email && touched.email)}
                  aria-describedby={fieldErrors.email ? "err-email" : undefined}
                  disabled={loading}
                />
              </div>
              {fieldErrors.email && touched.email && (
                <p className={styles.fieldError} id="err-email" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="input-pw">
                Password
              </label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="input-pw"
                  className={`${styles.input} ${fieldErrors.password && touched.password ? styles.inputError : ""}`}
                  type={pwVisible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  aria-invalid={!!(fieldErrors.password && touched.password)}
                  aria-describedby={fieldErrors.password ? "err-pw" : undefined}
                  disabled={loading}
                />
                {/* Toggle show/hide password */}
                <button
                  type="button"
                  className={styles.togglePw}
                  onClick={() => setPwVisible(v => !v)}
                  aria-label={pwVisible ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={pwVisible}
                  disabled={loading}
                >
                  {pwVisible ? (
                    /* Eye-off icon */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && touched.password && (
                <p className={styles.fieldError} id="err-pw" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Ingat saya + Lupa password */}
            <div className={styles.formRow}>
              <label className={styles.checkLabel} htmlFor="cb-remember">
                <input
                  id="cb-remember"
                  type="checkbox"
                  className={styles.checkbox}
                  aria-label="Ingat saya di perangkat ini"
                  disabled={loading}
                />
                <span className={styles.checkmark} aria-hidden="true" />
                Ingat saya
              </label>
              <button
                type="button"
                className={styles.forgotLink}
                onClick={() => alert("Fitur reset password akan segera tersedia.")}
              >
                Lupa password?
              </button>
            </div>

            {/* Tombol Masuk */}
            <button
              ref={loginBtnRef}
              type="submit"
              className={styles.btnLogin}
              disabled={loading}
              aria-busy={loading}
              aria-label="Masuk ke Growkas"
            >
              {loading ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : (
                <>
                  <span>Masuk sekarang</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* ---- Divider ---- */}
          <div className={styles.divider} aria-hidden="true">
            <span>atau</span>
          </div>

          {/* ---- Tombol Google ---- */}
          <button
            ref={googleBtnRef}
            type="button"
            className={styles.btnGoogle}
            onClick={handleGoogleSignIn}
            disabled={loading}
            aria-label="Masuk dengan akun Google"
          >
            {/* Google logo SVG resmi, multi-warna */}
            <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Lanjutkan dengan Google
          </button>

          {/* Footer note */}
          <p className={styles.footerNote}>
            Dengan masuk, Anda menyetujui{" "}
            <button type="button" className={styles.textLink} onClick={() => {}}>
              Syarat Penggunaan
            </button>{" "}
            dan{" "}
            <button type="button" className={styles.textLink} onClick={() => {}}>
              Kebijakan Privasi
            </button>{" "}
            Growkas.
          </p>
        </div>
      </div>
    </div>
  );
}
