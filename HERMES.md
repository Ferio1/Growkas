# HERMES AGENT AI — GROWKAS APPLICATION MANIFEST

This manifest provides context for **Hermes Agent AI** operating within `growkas`.

---

## ☕ Application Features

1. **POS Kasir (KasirView.tsx)**:
   - Interactive Katalog F&B: *Kopi & Espresso*, *Non-Coffee & Mocktail*, *Makanan Utama*, *Pastry & Snack*.
   - **F&B Customizer Modal**: Level Es (*Normal Ice, Less Ice, No Ice*), Level Gula (*Normal Sugar, Less Sugar, No Sugar*), Add-On (*Extra Shot, Extra Syrup*), Dine In (No. Meja) / Takeaway, Catatan Dapur.
   - Quick Cash suggestion modal & auto stock deduction in Supabase.
   - Digital & Printable Receipt Modal (`ReceiptModal.tsx`).

2. **Dashboard Konsolidasi Admin (AdminView.tsx)**:
   - Total sales revenue, transaction count, average order value.
   - Performance comparison across 4 active branches (Saray Coffee Yogyakarta, Jakarta Pusat, Bandung, Surabaya).

3. **Database Integration (posActions.ts & authActions.ts)**:
   - Real-time stock updates in Supabase `products` table.
   - Clean login with official accounts: `kasir@growkas.com` & `admin@growkas.com`.

---

## 📁 Key Directories

- Components: `app/dashboard/components/`
- Brand Logo: `app/components/GrowkasLogo.tsx`
- Actions & DB: `app/actions/posActions.ts`
- Daily Logs: `docs/catatan-harian/`
