// app/dashboard/page.tsx — Dashboard Placeholder
// Tampil setelah login berhasil.
// Jika login via Google: menampilkan nama & foto user.
// Jika login via form demo: menampilkan pesan selamat datang default.

import { auth } from "@/auth";
import { signOut } from "@/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Growkas",
};

export default async function DashboardPage() {
  // Ambil session jika ada — tidak redirect jika tidak ada (demo mode)
  const session = await auth().catch(() => null);
  const user    = session?.user ?? null;
  const role    = (user as any)?.role ?? "kasir";
  const name    = user?.name?.split(" ")[0] ?? "Kasir";
  const email   = user?.email ?? null;
  const avatar  = user?.image ?? null;

  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Dashboard — Growkas</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, sans-serif;
            background: #0A0A0A;
            color: #F5F0E8;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card {
            text-align: center;
            padding: 48px 40px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px;
            background: rgba(255,255,255,0.04);
            max-width: 480px;
            width: 90%;
          }
          .badge {
            display: inline-block;
            padding: 4px 14px;
            background: rgba(212,101,28,0.15);
            border: 1px solid rgba(212,101,28,0.3);
            border-radius: 100px;
            font-size: 0.72rem;
            color: #D4651C;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-bottom: 24px;
          }
          .avatar {
            width: 64px; height: 64px;
            border-radius: 50%;
            margin: 0 auto 16px;
            display: block;
            border: 2px solid rgba(212,101,28,0.3);
          }
          h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 8px; }
          .sub {
            color: rgba(245,240,232,0.45);
            line-height: 1.7;
            margin-bottom: 28px;
            font-size: 0.9rem;
          }
          .role { color: #D4651C; font-weight: 700; }
          .email { font-size: 0.78rem; opacity: 0.4; display: block; margin-top: 4px; }
          .btn {
            padding: 11px 24px;
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            color: #F5F0E8;
            font-size: 0.875rem;
            cursor: pointer;
            font-family: system-ui;
          }
          .btn:hover { background: rgba(255,255,255,0.12); }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="badge">✓ Login Berhasil</div>

          {avatar && (
            <img className="avatar" src={avatar} alt="Avatar" width={64} height={64} />
          )}

          <h1>Halo, {name}!</h1>
          <p className="sub">
            Anda masuk sebagai <span className="role">{role.toUpperCase()}</span>.
            <br />
            Dashboard Growkas sedang dalam pengembangan.
            {email && <span className="email">{email}</span>}
          </p>

          {/* Tombol keluar — server action */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="btn" type="submit">Keluar dari Growkas</button>
          </form>
        </div>
      </body>
    </html>
  );
}
