# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Growkas (v2.0 — All-in-One White-Label SaaS & QR Code System)
*Aplikasi Kasir F&B Multi-Cabang, System Pemesanan Self-Service QR Code Meja, dan Dashboard Konsolidasi Real-Time*

---

| Item | Keterangan |
| :--- | :--- |
| **Nama Produk** | Growkas |
| **Versi Dokumen** | 2.0 (White-Label SaaS & Self-Service QR Ordering Architecture) |
| **Tanggal Pembaruan** | 17 September 2026 |
| **Status** | Approved — Production Architecture & Active Implementation |
| **Platform Target** | Web & Mobile Responsive (Next.js 16 + React 19 + Supabase PostgreSQL) |
| **Integrasi AI** | Hermes Agent AI + Superpowers Workflows |

---

## 1. Ringkasan Eksekutif & Visi Produk

**Growkas** adalah platform *All-in-One White-Label SaaS Point of Sale (POS)* dan sistem pemesanan mandiri via QR Code meja yang dirancang khusus untuk bisnis Food & Beverage (F&B).

Growkas memungkinkan dua model penggunaan utama:
1. **Model Pengusaha F&B Mandiri (Single / Multi-Outlet)**: Mengelola transaksi kasir, inventaris menu, dan memantau performa gabungan cabang secara real-time dari satu dashboard terpusat.
2. **Model Pembeli Lisensi Website (Commercial SaaS Buyer)**: Pembeli sistem web dapat mendaftarkan outlet milik mereka sendiri secara mandiri tanpa terikat oleh sampel data keras (*hardcoded sample data*), dengan 1-click form pengisian cabang.

---

## 2. Latar Belakang & Perubahan Spesifikasi v2.0

### Skenario Lapangan & Masalah Utama yang Diselesaikan:
1. **Kemudahan Customer Pemesanan Tanpa Antri (QR Code Table Ordering)**:
   Customer yang tiba di tempat cukup memilih tempat duduk, memindai QR Code di meja (`/order?table=04`), memilih kustomisasi pesanan (level gula, es, topping), dan membayar secara online via QRIS atau kasir.
2. **Generasi QR Code Mandiri Berbasis Vektor**:
   Pemilik resto/kafe dapat langsung membuat dan mencetak stiker QR Code nomor meja per cabang langsung dari Dashboard Admin tanpa membutuhkan aplikasi desain pihak ketiga.
3. **White-Label SaaS Architecture untuk Pembeli Website**:
   Saat website ini dijual kepada klien baru, dashboard konsolidasi tidak akan terkunci pada nama cabang tertentu. Pembeli dapat menambahkan 1, 3, atau N cabang baru dengan alur pengisian cepat dan intuitif.

---

## 3. Fitur Utama & Spesifikasi Modul (v2.0)

| Modul Fitur | Jenis | Fungsi Utama | Dampak & Nilai Tambah |
| :--- | :--- | :--- | :--- |
| **SaaS White-Label Branch Onboarding** | SaaS Core | Form modal 1-click (`BranchManagerModal.tsx`) untuk mendaftarkan nama outlet, kota, dan target omzet. | Memudahkan pembeli web mengkonfigurasi struktur cabang bisnis mereka secara bebas. |
| **Generator & Cetak Stiker QR Code Meja** | Fitur Baru | Pembuat stiker QR Code vektor siap cetak per meja (`QRCodeGenerator.tsx`) dengan integrasi logo dan link dinamis. | Efisiensi biaya operasional resto tanpa perlu cetak spanduk/menu fisik tambahan. |
| **Self-Service Customer Ordering Page** | Fitur Baru | Halaman web mobile (`/order?table=XX`) untuk customer memilih menu, kustomisasi rasa/topping, dan bayar QRIS. | Mempercepat antrean di kasir hingga 60% dan meningkatkan pengalaman pelanggan. |
| **Kasir POS Mobile & Desktop** | Fitur Inti | Antarmuka kasir cepat (`KasirView.tsx`) dengan pencarian instant, keranjang belanja, cetak struk, dan shortcut bayar. | Transaksi di kasir selesai dalam waktu < 30 detik. |
| **Konsolidasi & Benchmarking Multi-Cabang** | Fitur Utama | Dashboard omzet terpusat real-time dengan perbandingan grafik kontribusi omzet antar outlet. | Owner memperoleh gambaran kesehatan bisnis seluruh cabang secara instan. |
| **Integrasi Database Supabase Real-Time** | Infrastruktur | Sinkronisasi data produk (`products`), transaksi (`transactions`), dan cabang (`branches`). | Data selalu mutakhir dan aman di cloud database. |

---

## 4. Alur Kerja Sistem (Workflow Architecture)

### 4.1 Alur Pemesanan Customer (Scan & Order Meja)
```
[Customer Duduk di Meja 04]
        │
        ▼
[Scan Stiker QR Code di Meja] ──► Web Membuka URL: /order?table=04
        │
        ▼
[Pilih Menu & Kustomisasi (Es, Sugar, Extra Shots)]
        │
        ▼
[Pilih Metode Pembayaran: QRIS Instant / Tunai di Kasir]
        │
        ▼
[Pesanan Terkirim ke Layar Kasir & Dapur secara Real-Time]
```

### 4.2 Alur Admin / SaaS Buyer Onboarding
```
[Login Admin Dashboard] ──► Click: "+ Tambah Outlet Baru"
        │
        ▼
[Isi Form: Nama Outlet, Kota, Alamat, Target Omzet]
        │
        ▼
[Outlet Berhasil Didaftarkan & Masuk ke Tab Konsolidasi]
        │
        ▼
[Buka Tab "Generator Stiker QR Code Meja" ──► Pilih Jumlah Meja ──► Cetak Stiker]
```

---

## 5. Mindset & Vibes Baru Hermes Agent AI

Dalam pengembangan Growkas v2.0, **Hermes Agent AI** beroperasi dengan panduan prinsip berikut:
- **Clean Architecture & Zero Technical Debt**: Semua komponen dibangun dengan Next.js App Router murni, TypeScript strict typed, dan modular CSS layout.
- **Continuous Build Verification**: Setiap perubahan kode wajib lulus dari proses kompilasi `npm run build` dengan 0 error.
- **Empirical Logging**: Rekap perkembangan harian dicatat secara otomatis pada direktori `catatan-harian/`.

---

## 6. Jadwal & Milestone Pengujian

- **Milestone 1**: Integrasi Dashboard Admin & Modal Onboarding Cabang Mandiri (`DONE`)
- **Milestone 2**: Generator Stiker QR Code Meja & Halaman Pemesanan Customer `/order` (`DONE`)
- **Milestone 3**: Verifikasi Build Production Next.js 16 (`DONE`)
- **Milestone 4**: Sinkronisasi Git & Dokumentasi Harian (`IN PROGRESS`)
