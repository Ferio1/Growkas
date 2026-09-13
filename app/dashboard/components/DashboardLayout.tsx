"use client";
// app/dashboard/components/DashboardLayout.tsx — Layout Utama Dashboard Growkas

import { useState, useEffect } from "react";
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

  const userName = userSession?.user?.name || (activeRole === "kasir" ? "Kasir Prabu" : "Owner Prabu");
  const userEmail = userSession?.user?.email || (activeRole === "kasir" ? "kasir@growkas.id" : "owner@growkas.id");

  return (
    <div style={{ display: "flex", height: "100vh", maxHeight: "100vh", overflow: "hidden", background: "#0A0A0A", color: "#F5F0E8", fontFamily: "system-ui, sans-serif" }}>
      
      {/* SIDEBAR NAVIGASI KIRI */}
      <aside style={{
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", paddingLeft: "8px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "8px", background: "linear-gradient(135deg, #D4651C, #B84E14)",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#FFF",
            }}>
              G
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: "900", letterSpacing: "0.08em" }}>GROWKAS</div>
              <div style={{ fontSize: "0.68rem", color: "#D4651C", fontWeight: "700", textTransform: "uppercase" }}>
                Sistem Kasir F&amp;B
              </div>
            </div>
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

      {/* AREA UTAMA / KONTEN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        
        {/* Top Header Bar */}
        <header style={{
          height: "60px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.01)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ padding: "4px 10px", borderRadius: "100px", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: "0.72rem", fontWeight: "bold" }}>
              ● Shift Aktif
            </span>
            <select
              defaultValue="Saray Coffee & Space (Yogyakarta)"
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
              }}
            >
              <option value="Saray Coffee & Space (Yogyakarta)" style={{ background: "#161616" }}>📍 Saray Coffee &amp; Space (Yogyakarta)</option>
              <option value="Outlet Jakarta Pusat" style={{ background: "#161616" }}>📍 Outlet Jakarta Pusat</option>
              <option value="Outlet Bandung" style={{ background: "#161616" }}>📍 Outlet Bandung</option>
              <option value="Outlet Surabaya" style={{ background: "#161616" }}>📍 Outlet Surabaya</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "0.88rem", fontFamily: "monospace", color: "rgba(245,240,232,0.6)" }}>
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

        <main style={{ flex: 1, padding: "20px", overflowY: "auto", minWidth: 0, boxSizing: "border-box" }}>
          {children}
        </main>
      </div>

    </div>
  );
}
