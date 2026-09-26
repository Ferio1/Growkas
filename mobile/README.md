# 📱 Growkas POS Mobile (Flutter Cross-Platform)

Implementasi aplikasi mobile **Growkas POS** berbasis **Flutter (Dart)** yang terhubung langsung ke database dan autentikasi **Supabase PostgreSQL** yang sama persis dengan versi Web Next.js.

Proyek ini dibuat sebagai pemenuhan revisi dosen penguji: **"Cobain Flutter dengan project ini"**.

---

## 🚀 Arsitektur & Fitur Utama

1. **Koneksi Resmi Supabase (`supabase_flutter`)**:
   - URL: `https://pijpptetccvgmwyjvsse.supabase.co`
   - Menggunakan tabel yang sama: `products`, `transactions`, `profiles`, dan Supabase Auth.
   - Akun kasir (`kasir@growkas.com`) dan admin (`admin@growkas.com`) dapat digunakan secara langsung.

2. **Mobile POS Kasir & Waiter Ordering**:
   - **Katalog Sentuh Ergonomis**: Grid menu kartu F&B 2-kolom yang nyaman dioperasikan staf menggunakan jempol tangan.
   - **Filter Kategori**: Tab horizontal instan (*Semua*, *Kopi & Espresso*, *Non-Coffee*, *Makanan*, *Snack*).
   - **Pencarian Cepat**: Input pencarian real-time untuk mempercepat kasir mencari menu.
   - **Floating Bottom Cart**: Bilah melayang di bawah layar yang menampilkan jumlah item dan total belanja secara dinamis.

3. **Manajemen Meja & Jenis Pesanan**:
   - Pilihan instan antara **Dine In (Makan di Tempat)** dengan pemilihan nomor meja (01 - 20) vs **Takeaway (Bawa Pulang)**.

4. **Integrasi Thermal Printer Bluetooth 58mm**:
   - Modul `thermal_printer_service.dart` yang siap dihubungkan ke printer kasir Bluetooth portabel (*SPP Profile* via `blue_thermal_printer`).
   - Menyediakan dialog preview struk belanja thermal 58mm yang rapi dan profesional.

5. **State Management Bersih (Provider Pattern)**:
   - `CartProvider`: Mengelola penambahan item, kalkulasi subtotal, pajak PB1 10%, dan grand total secara reaktif tanpa re-render berlebih.

---

## 🛠️ Struktur Direktori

```
growkas_mobile/
├── lib/
│   ├── main.dart                       # Entry point aplikasi & tema Dark Terracotta
│   ├── core/
│   │   ├── constants.dart              # Konstanta warna, nama outlet, kredensial Supabase
│   │   └── supabase_service.dart       # Layanan Auth, query produk & simpan transaksi
│   ├── models/
│   │   ├── product_model.dart          # Model data produk F&B
│   │   └── cart_item_model.dart        # Model item keranjang pesanan
│   ├── providers/
│   │   └── cart_provider.dart          # State management keranjang belanja
│   ├── screens/
│   │   ├── login_screen.dart           # Layar masuk kasir & alur lupa password
│   │   ├── pos_cashier_screen.dart     # Layar utama kasir POS sentuh
│   │   └── cart_sheet_screen.dart      # Bottom sheet keranjang & checkout
│   └── services/
│       └── thermal_printer_service.dart# Layanan cetak struk Bluetooth 58mm
├── pubspec.yaml                        # Dependensi Flutter & metadata
└── README.md                           # Dokumentasi teknis proyek
```

---

## 💻 Cara Menjalankan Aplikasi

Jika Flutter SDK sudah terpasang di komputer Anda:

```bash
# 1. Masuk ke direktori mobile
cd growkas_mobile

# 2. Unduh seluruh dependensi paket
flutter pub get

# 3. Jalankan aplikasi pada HP fisik / Emulator Android / Chrome
flutter run
```
