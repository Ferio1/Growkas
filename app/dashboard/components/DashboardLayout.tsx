"use client";
// app/dashboard/components/DashboardLayout.tsx — Layout Utama Dashboard Growkas

import { useState, useEffect } from "react";
import GrowkasLogo from "@/app/components/GrowkasLogo";
import Link from "next/link";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeRole: "kasir" | "admin";
  onRoleChange: (role: "kasir" | "admin") => void;
  userSession: any;
}

export default function DashboardLayout({
  children,
  activeRole,
  onRoleChange,
  userSession,
}: DashboardLayoutProps) {
  const [clock, setClock] = useState("");
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    // 1. Coba baca dari prop userSession
    if (userSession?.user) {
      const name = userSession.user.user_metadata?.full_name
        || userSession.user.name
        || userSession.user.email?.split("@")[0];
      const email = userSession.user.email;
      if (email) {
        setCurrentUser({ name: name || email, email });
        return;
      }
    }

    // 2. Coba baca dari localStorage (hasil login Supabase client)
    try {
      const stored = localStorage.getItem("growkas_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const name = parsed.user_metadata?.full_name
          || parsed.full_name
          || parsed.email?.split("@")[0];
        const email = parsed.email;
        if (email) {
          setCurrentUser({ name: name || email, email });
          return;
        }
      }
    } catch {}
  }, [userSession]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const userName = currentUser?.name
    || userSession?.user?.name
    || (activeRole === "kasir" ? "Kasir Saray Yogyakarta" : "Admin Manager Saray");
  const userEmail = currentUser?.email
    || userSession?.user?.email
    || (activeRole === "kasir" ? "kasir@growkas.com" : "admin@growkas.com");

  return (
    <div style={{ display: "flex", height: "100vh", maxHeight: "100vh", overflow: "hidden", background: "#0A0A0A", color: "#F5F0E8", fontFamily: "system-ui, sans-serif" }}>
      
      {/* SIDEBAR NAVIGASI KIRI — DESKTOP (>= 1024px) */}
      <aside className="growkas-sidebar-desktop" style={{
        width: "240px",
        background: "rgba(255,255,255,0.02)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px 14px",
        flexShrink: 0,
        height: "100%",
        boxSizing: "border-box",
      }}>
        <div>
          {/* Logo & Brand */}
          <div style={{ marginBottom: "28px", paddingLeft: "4px" }}>
            <GrowkasLogo size={36} />
          </div>

          {/* Menu Items */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ fontSize: "0.7rem", color: "rgba(245,240,232,0.4)", textTransform: "uppercase", fontWeight: "700", paddingLeft: "8px", marginBottom: "6px" }}>
              NAVIGASI UTAMA
            </div>

            <button
              onClick={() => onRoleChange("kasir")}
              style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px",
                background: activeRole === "kasir" ? "rgba(212,101,28,0.15)" : "transparent",
                border: "1px solid " + (activeRole === "kasir" ? "rgba(212,101,28,0.3)" : "transparent"),
                color: activeRole === "kasir" ? "#D4651C" : "rgba(245,240,232,0.7)",
                fontWeight: activeRole === "kasir" ? "700" : "500",
                fontSize: "0.88rem", cursor: "pointer", width: "100%", textAlign: "left",
              }}
            >
              <span>🛒</span> Kasir (POS)
            </button>

            <button
              onClick={() => onRoleChange("admin")}
              style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px",
                background: activeRole === "admin" ? "rgba(212,101,28,0.15)" : "transparent",
                border: "1px solid " + (activeRole === "admin" ? "rgba(212,101,28,0.3)" : "transparent"),
                color: activeRole === "admin" ? "#D4651C" : "rgba(245,240,232,0.7)",
                fontWeight: activeRole === "admin" ? "700" : "500",
                fontSize: "0.88rem", cursor: "pointer", width: "100%", textAlign: "left",
              }}
            >
              <span>📊</span> Dashboard Konsolidasi
            </button>

            <Link
              href="/kitchen"
              target="_blank"
              style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px",
                color: "rgba(245,240,232,0.7)", fontSize: "0.88rem", textDecoration: "none",
              }}
            >
              <span>🍳</span> Layar Dapur (KDS) ↗
            </Link>

            <Link
              href="/dashboard/supabase-demo"
              style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px",
                color: "rgba(245,240,232,0.7)", fontSize: "0.88rem", textDecoration: "none",
              }}
            >
              <span>🧪</span> Status Supabase
            </Link>
          </nav>
        </div>

        {/* Profil & Logout */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", paddingLeft: "4px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%", background: "#D4651C", color: "#FFF",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.9rem",
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {userName}
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(245,240,232,0.4)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {userEmail}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              try {
                localStorage.removeItem("growkas_user");
              } catch {}
              window.location.href = "/login";
            }}
            style={{
              width: "100%", padding: "8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,240,232,0.7)", fontSize: "0.8rem",
              fontWeight: "600", cursor: "pointer",
            }}
          >
            Keluar dari Aplikasi
          </button>
        </div>
      </aside>

      {/* OFF-CANVAS DRAWER SIDEBAR — KHUSUS MOBILE HP & TABLET PORTRAIT (< 1024px) */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="animate-fade-in"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-slide-left safe-area-bottom"
            style={{
              width: "280px",
              maxWidth: "85vw",
              height: "100%",
              background: "#121212",
              borderRight: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "20px 16px",
              boxSizing: "border-box",
              boxShadow: "10px 0 40px rgba(0,0,0,0.8)",
            }}
          >
            <div>
              {/* Header Drawer dengan Tombol Tutup */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <GrowkasLogo size={32} />
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "none",
                    color: "#F5F0E8",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                  }}
                  aria-label="Tutup Menu"
                >
                  ✕
                </button>
              </div>

              {/* Menu Items Mobile */}
              <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "0.7rem", color: "rgba(245,240,232,0.4)", textTransform: "uppercase", fontWeight: "700", paddingLeft: "8px", marginBottom: "4px" }}>
                  NAVIGASI UTAMA
                </div>

                <button
                  onClick={() => {
                    onRoleChange("kasir");
                    setIsMobileDrawerOpen(false);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px",
                    background: activeRole === "kasir" ? "rgba(212,101,28,0.2)" : "transparent",
                    border: "1px solid " + (activeRole === "kasir" ? "rgba(212,101,28,0.4)" : "transparent"),
                    color: activeRole === "kasir" ? "#D4651C" : "rgba(245,240,232,0.85)",
                    fontWeight: activeRole === "kasir" ? "800" : "500",
                    fontSize: "0.92rem", cursor: "pointer", width: "100%", textAlign: "left",
                  }}
                >
                  <span>🛒</span> Kasir (POS)
                </button>

                <button
                  onClick={() => {
                    onRoleChange("admin");
                    setIsMobileDrawerOpen(false);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px",
                    background: activeRole === "admin" ? "rgba(212,101,28,0.2)" : "transparent",
                    border: "1px solid " + (activeRole === "admin" ? "rgba(212,101,28,0.4)" : "transparent"),
                    color: activeRole === "admin" ? "#D4651C" : "rgba(245,240,232,0.85)",
                    fontWeight: activeRole === "admin" ? "800" : "500",
                    fontSize: "0.92rem", cursor: "pointer", width: "100%", textAlign: "left",
                  }}
                >
                  <span>📊</span> Dashboard Konsolidasi
                </button>

                <Link
                  href="/kitchen"
                  target="_blank"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px",
                    color: "rgba(245,240,232,0.85)", fontSize: "0.92rem", textDecoration: "none",
                  }}
                >
                  <span>🍳</span> Layar Dapur (KDS) ↗
                </Link>

                <Link
                  href="/dashboard/supabase-demo"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px",
                    color: "rgba(245,240,232,0.85)", fontSize: "0.92rem", textDecoration: "none",
                  }}
                >
                  <span>🧪</span> Status Supabase
                </Link>
              </nav>
            </div>

            {/* Profil & Logout Drawer */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{
                  width: "38px", height: "38px", borderRadius: "50%", background: "#D4651C", color: "#FFF",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.95rem",
                }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: "700", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {userName}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "rgba(245,240,232,0.45)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {userEmail}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  try {
                    localStorage.removeItem("growkas_user");
                  } catch {}
                  window.location.href = "/login";
                }}
                style={{
                  width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)", color: "#f87171", fontSize: "0.85rem",
                  fontWeight: "700", cursor: "pointer",
                }}
              >
                Keluar dari Aplikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AREA UTAMA / KONTEN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        
        {/* Top Header Bar */}
        <header style={{
          height: "56px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.01)",
          flexShrink: 0,
          gap: "8px",
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 1, minWidth: 0 }}>
            {/* Hamburger Button untuk Mobile / Tablet */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="growkas-mobile-toggle"
              style={{
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#F5F0E8",
                fontSize: "1.2rem",
                cursor: "pointer",
                flexShrink: 0,
              }}
              aria-label="Buka Menu Navigasi"
            >
              ☰
            </button>

            <span style={{
              padding: "4px 10px", borderRadius: "100px", background: "rgba(74,222,128,0.15)",
              border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: "0.72rem", fontWeight: "bold",
              whiteSpace: "nowrap", flexShrink: 0,
            }}>
              ● Shift Aktif
            </span>

            <select
              defaultValue="Saray Coffee & Space (Yogyakarta)"
              className="growkas-outlet-select"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#F5F0E8",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: "700",
                outline: "none",
                cursor: "pointer",
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <option value="Saray Coffee & Space (Yogyakarta)" style={{ background: "#161616" }}>📍 Saray Coffee &amp; Space (Yogyakarta)</option>
              <option value="Outlet Jakarta Pusat" style={{ background: "#161616" }}>📍 Outlet Jakarta Pusat</option>
              <option value="Outlet Bandung" style={{ background: "#161616" }}>📍 Outlet Bandung</option>
              <option value="Outlet Surabaya" style={{ background: "#161616" }}>📍 Outlet Surabaya</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
            <div className="growkas-clock-badge" style={{ fontSize: "0.88rem", fontFamily: "monospace", color: "rgba(245,240,232,0.6)" }}>
              {clock || "00:00:00"}
            </div>

            <div style={{
              display: "flex", background: "rgba(255,255,255,0.05)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <button
                onClick={() => onRoleChange("kasir")}
                style={{
                  padding: "5px 12px", borderRadius: "6px", border: "none",
                  background: activeRole === "kasir" ? "#D4651C" : "transparent",
                  color: activeRole === "kasir" ? "#FFF" : "rgba(245,240,232,0.6)",
                  fontSize: "0.78rem", fontWeight: "700", cursor: "pointer",
                }}
              >
                View Kasir
              </button>
              <button
                onClick={() => onRoleChange("admin")}
                style={{
                  padding: "5px 12px", borderRadius: "6px", border: "none",
                  background: activeRole === "admin" ? "#D4651C" : "transparent",
                  color: activeRole === "admin" ? "#FFF" : "rgba(245,240,232,0.6)",
                  fontSize: "0.78rem", fontWeight: "700", cursor: "pointer",
                }}
              >
                View Admin
              </button>
            </div>
          </div>
        </header>

        <main style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          padding: "16px 20px",
          overflow: "hidden",
          minWidth: 0,
          boxSizing: "border-box"
        }}>
          {children}
        </main>
      </div>

    </div>
  );
}
