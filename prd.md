# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Growkas
*Aplikasi Kasir untuk Manajemen Transaksi dan Konsolidasi Laporan Penjualan Usaha F&B Multi-Cabang*

---

| Item | Keterangan |
| :--- | :--- |
| **Nama Produk** | Growkas |
| **Nama Mahasiswa** | [diisi mahasiswa] |
| **NIM** | [diisi mahasiswa] |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | [diisi tanggal] |
| **Status** | Draft — untuk review dosen pembimbing |
| **Disusun Berdasarkan** | Tugas Eksplorasi Produk & Perancangan Fitur Bernilai Tambah (Studi Kasus: Mibebi Kasir) |

---

## 1. Ringkasan Eksekutif

Growkas adalah prototipe aplikasi kasir untuk usaha Food & Beverage (F&B) yang dirancang agar dapat mengikuti pertumbuhan skala usaha penggunanya — mulai dari usaha rumahan dengan satu titik penjualan hingga berkembang menjadi usaha dengan beberapa cabang. Growkas mengubah proses pencatatan transaksi yang semula manual (buku catatan atau aplikasi pesan instan) menjadi sistem digital terpusat, sekaligus memberikan pemilik usaha visibilitas atas kondisi bisnisnya secara real-time, baik untuk satu outlet maupun gabungan beberapa outlet.

Dokumen ini menjabarkan kebutuhan produk (*product requirements*) yang menjadi acuan pengembangan prototipe Growkas dalam lingkup skripsi, disusun berdasarkan hasil eksplorasi produk pembanding (Mibebi Kasir) serta analisis masalah, fitur inti, fitur bernilai tambah, prioritas, dan scope yang telah ditentukan sebelumnya.

---

## 2. Latar Belakang dan Masalah

Usaha F&B di Indonesia sebagian besar dimulai dari skala kecil — gerobak, kios, atau kedai rumahan — dengan pencatatan transaksi yang masih dilakukan secara manual. Ketika usaha mulai berkembang, baik dari sisi volume transaksi maupun jumlah cabang, metode pencatatan manual tersebut menjadi hambatan operasional dan bisnis.

### Masalah yang Diidentifikasi:
1. **Pencatatan Manual Rawan Kesalahan**: Buku catatan atau aplikasi pesan instan rawan terjadi kesalahan hitung dan sulit direkap menjadi laporan yang akurat.
2. **Data Antar Cabang Terpisah**: Ketika usaha berkembang menjadi beberapa cabang, data transaksi tiap cabang tercatat secara terpisah, sehingga pemilik usaha kesulitan melihat performa bisnis secara keseluruhan dalam satu waktu.
3. **Tidak Ada Indikator Kesiapan Ekspansi**: Pemilik usaha tidak memiliki indikator yang jelas untuk menilai kapan usahanya sudah cukup stabil dan layak untuk berekspansi ke cabang baru, sehingga keputusan ekspansi sering diambil berdasarkan asumsi, bukan data.

---

## 3. Matriks Klasifikasi Fitur (Fitur Inti vs Fitur Bernilai Tambah)

| Fitur | Jenis Fitur | Fungsi Utama | Alasan Dibutuhkan / Dampak Bisnis | Prioritas (MoSCoW) |
| :--- | :--- | :--- | :--- | :--- |
| **Manajemen Menu** | Fitur Inti | Mengelola data menu, kategori, dan harga jual per cabang/terpusat. | Dasar sebelum pesanan dan transaksi dapat diproses. | Must Have |
| **Manajemen Cabang & Pengguna** | Fitur Inti | Mendaftarkan outlet baru & mengatur akun owner, kasir, dan staf. | Membedakan data antar outlet sejak awal sesuai visi multi-cabang. | Must Have |
| **Manajemen Pesanan** | Fitur Inti | Mencatat item pesanan, jumlah, dan catatan khusus per outlet. | Acuan akurat bagi kasir dan dapur untuk menyusun pesanan. | Must Have |
| **Transaksi Pembayaran** | Fitur Inti | Memproses pembayaran, kembalian, dan metode pembayaran. | Fungsi utama aplikasi kasir untuk menyelesaikan penjualan. | Must Have |
| **Riwayat Transaksi** | Fitur Inti | Menyimpan seluruh transaksi selesai per cabang. | Dasar pemeriksaan audit dan penyusunan laporan keuangan. | Must Have |
| **Laporan Penjualan per Cabang** | Fitur Inti | Menyajikan ringkasan omzet, jumlah transaksi, dan produk terlaris per outlet. | Mengontrol operasional harian di masing-masing cabang. | Must Have |
| **Konsolidasi Laporan Multi-Cabang** | **Fitur Bernilai Tambah** | Menggabungkan data transaksi dari seluruh cabang ke dalam 1 dashboard terpusat real-time. | Mempercepat keputusan owner tanpa perlu rekap manual per cabang. | **Must Have** |
| **Perbandingan Kinerja Antar Cabang** | **Fitur Bernilai Tambah** | Membandingkan metrik utama (omzet, transaksi, rata-rata order) antar outlet pada periode yang sama. | Mengubah data mentah menjadi insight perbandingan peringkat & evaluasi cabang. | **Should Have** |
| **Growth Readiness Score** | **Fitur Bernilai Tambah** | Menganalisis tren omzet, konsistensi, & margin untuk menghasilkan skor kesiapan membuka cabang baru. | Mengubah data historis menjadi panduan ekspansi berbasis data, bukan asumsi. | **Could Have (Out of Scope MVP)** |

---

## 4. Tujuan Produk & Metrik Keberhasilan

### 4.1 Tujuan Bisnis
- Menyediakan sistem pencatatan transaksi yang akurat dan mengurangi kesalahan pencatatan manual pada usaha F&B skala kecil-menengah.
- Memberikan visibilitas performa bisnis secara terpusat bagi pemilik usaha yang memiliki lebih dari satu cabang.
- Mendukung pengambilan keputusan bisnis (operasional maupun ekspansi) berdasarkan data, bukan asumsi.

### 4.2 Tujuan Pengguna
- **Kasir**: Dapat mencatat pesanan dan memproses pembayaran dengan cepat dan minim kesalahan.
- **Pemilik Usaha (Owner)**: Dapat memantau kondisi seluruh cabangnya tanpa harus mengecek laporan satu per satu.
- **Staf Dapur**: Memiliki acuan pesanan yang jelas dari sistem, bukan komunikasi manual.

### 4.3 Metrik Keberhasilan (Success Metrics)

| Metrik | Target Indikatif | Terkait Fitur |
| :--- | :--- | :--- |
| Waktu rata-rata penyelesaian satu transaksi | < 1 menit per transaksi | Manajemen Pesanan, Transaksi Pembayaran |
| Waktu yang dibutuhkan owner untuk melihat performa seluruh cabang | < 30 detik (satu kali buka dashboard) | Konsolidasi Laporan Multi-Cabang |
| Akurasi pencatatan transaksi dibanding pencatatan manual | Tidak ada selisih pencatatan (0 error) pada skenario uji | Transaksi Pembayaran, Riwayat Transaksi |
| Jumlah cabang yang dapat dipantau dalam satu dashboard | Minimal 3 cabang pada skenario uji prototipe | Konsolidasi Laporan Multi-Cabang |

---

## 5. Target Pengguna

| Peran | Deskripsi | Kebutuhan Utama |
| :--- | :--- | :--- |
| **Pemilik Usaha (Owner)** | Pemilik usaha F&B skala kecil-menengah, dapat memiliki satu atau beberapa cabang. | Visibilitas performa bisnis, laporan gabungan, keputusan berbasis data. |
| **Kasir** | Staf yang bertugas mencatat pesanan dan memproses pembayaran di tiap outlet. | Pencatatan pesanan & transaksi yang cepat dan sederhana. |
| **Staf Dapur** | Staf yang menyiapkan pesanan berdasarkan data dari kasir. | Informasi pesanan yang jelas dan real-time. |

---

## 6. Deskripsi Produk dan Value Proposition

Growkas adalah aplikasi kasir F&B yang dirancang mengikuti pertumbuhan skala usaha — dari satu outlet rumahan hingga berkembang menjadi beberapa cabang. Nama "Growkas" berasal dari gabungan kata *grow* (bertumbuh) dan *kas* (transaksi keuangan), merepresentasikan visi utama produk: aplikasi kasir yang tidak berhenti mencatat transaksi pada satu titik waktu, tetapi ikut bertumbuh bersama skala usaha penggunanya.

> *"Aplikasi kami tidak hanya membantu mencatat transaksi harian di tiap outlet, tetapi juga membantu pemilik usaha F&B memantau dan membandingkan performa seluruh cabangnya secara terpusat, melalui fitur konsolidasi laporan multi-cabang dan perbandingan kinerja antar cabang, sehingga keputusan bisnis dapat diambil berdasarkan data, bukan asumsi."*

---

## 7. Ruang Lingkup (Scope)

### 7.1 In Scope
- Manajemen menu, pesanan, dan transaksi pembayaran per cabang.
- Manajemen cabang dan pengguna (owner, kasir).
- Riwayat transaksi dan laporan penjualan per cabang.
- Konsolidasi laporan multi-cabang pada dashboard pusat.
- Perbandingan kinerja antar cabang (benchmarking sederhana).

### 7.2 Out of Scope
- **Growth Readiness Score** — didokumentasikan sebagai rencana pengembangan lanjutan pasca-skripsi.
- Integrasi pembayaran digital / payment gateway pihak ketiga.
- Aplikasi self-order / QR meja untuk pelanggan.
- Fitur berbasis AI (rekomendasi menu otomatis, pengenalan gambar menu, dan sejenisnya).

---

## 8. Kebutuhan Fungsional (Functional Requirements)

Setiap kebutuhan fungsional diberi kode unik (FR-XX), tingkat prioritas mengikuti kerangka MoSCoW, deskripsi singkat, user story, dan acceptance criteria sebagai acuan pengujian saat vibe coding dan testing.

### 8.1 Fitur Inti (Core Features)

#### FR-01 — Manajemen Menu `[Must Have]`
- **Deskripsi**: Mengelola data menu, kategori, dan harga yang dijual, dapat diberlakukan per cabang atau secara terpusat.
- **User Story**: Sebagai owner/kasir, saya ingin mengelola data menu (nama, kategori, harga) sehingga kasir memiliki data produk yang akurat saat memproses pesanan.
- **Acceptance Criteria**:
  - Pengguna dapat menambah, mengubah, dan menonaktifkan item menu.
  - Setiap item menu memiliki nama, kategori, harga, dan status aktif/nonaktif.
  - Perubahan harga menu berlaku otomatis pada transaksi baru setelah disimpan.

#### FR-02 — Manajemen Cabang & Pengguna `[Must Have]`
- **Deskripsi**: Mendaftarkan cabang/outlet baru dan mengatur akun owner, kasir, dan staf pada tiap cabang.
- **User Story**: Sebagai owner, saya ingin mendaftarkan cabang baru dan mengatur akun pengguna pada tiap cabang, sehingga data transaksi setiap cabang dapat dipisahkan dan dikelola dengan hak akses yang sesuai.
- **Acceptance Criteria**:
  - Owner dapat menambahkan cabang baru dengan nama dan lokasi.
  - Owner dapat membuat akun kasir/staf dan menautkannya ke cabang tertentu.
  - Sistem membatasi akses kasir hanya pada data transaksi cabang tempat ia terdaftar.

#### FR-03 — Manajemen Pesanan `[Must Have]`
- **Deskripsi**: Mencatat item, jumlah, dan catatan khusus dari pesanan pelanggan pada tiap outlet.
- **User Story**: Sebagai kasir, saya ingin mencatat pesanan pelanggan dengan cepat, sehingga proses transaksi dapat berjalan akurat dan efisien.
- **Acceptance Criteria**:
  - Kasir dapat memilih menu dan jumlah item untuk membentuk satu pesanan.
  - Kasir dapat menambahkan catatan khusus pada pesanan (contoh: tanpa gula, extra pedas).
  - Pesanan yang belum dibayar dapat disimpan sementara sebagai draft/open order.

#### FR-04 — Transaksi Pembayaran `[Must Have]`
- **Deskripsi**: Memproses pembayaran dan mencatat detail transaksi dari sebuah pesanan.
- **User Story**: Sebagai kasir, saya ingin memproses pembayaran dari sebuah pesanan, sehingga transaksi dapat diselesaikan dan tercatat dengan benar.
- **Acceptance Criteria**:
  - Sistem menghitung total pembayaran secara otomatis dari item pesanan.
  - Kasir dapat mencatat metode pembayaran (tunai/non-tunai) dan menghitung kembalian untuk pembayaran tunai.
  - Transaksi yang sudah selesai tidak dapat diubah; pembatalan memerlukan otorisasi tambahan.

#### FR-05 — Riwayat Transaksi `[Must Have]`
- **Deskripsi**: Menyimpan seluruh transaksi yang telah selesai per cabang untuk ditinjau kembali.
- **User Story**: Sebagai kasir/owner, saya ingin melihat riwayat transaksi yang telah selesai, sehingga saya dapat melakukan pengecekan ulang atau audit.
- **Acceptance Criteria**:
  - Riwayat transaksi menampilkan tanggal, waktu, item, total, dan kasir yang memproses.
  - Pengguna dapat memfilter riwayat berdasarkan rentang tanggal dan cabang.

#### FR-06 — Laporan Penjualan per Cabang `[Must Have]`
- **Deskripsi**: Menampilkan omzet, jumlah transaksi, dan produk terlaris pada masing-masing outlet.
- **User Story**: Sebagai owner, saya ingin melihat laporan penjualan tiap cabang, sehingga saya dapat memantau performa operasional harian.
- **Acceptance Criteria**:
  - Laporan menampilkan omzet, jumlah transaksi, dan produk terlaris pada rentang waktu tertentu.
  - Laporan dapat difilter per cabang dan per periode (harian/mingguan/bulanan).

---

### 8.2 Fitur Bernilai Tambah (Value-Added Features)

#### FR-07 — Konsolidasi Laporan Multi-Cabang `[Must Have]`
- **Deskripsi**: Menggabungkan data transaksi dari seluruh cabang ke dalam satu dashboard terpusat secara real-time.
- **User Story**: Sebagai owner, saya ingin melihat laporan gabungan dari seluruh cabang dalam satu dashboard, sehingga saya tidak perlu mengecek laporan tiap cabang secara terpisah.
- **Acceptance Criteria**:
  - Dashboard menampilkan total omzet gabungan seluruh cabang.
  - Dashboard menampilkan kontribusi omzet masing-masing cabang terhadap total.
  - Data pada dashboard diperbarui otomatis setiap kali ada transaksi baru yang selesai diproses.

#### FR-08 — Perbandingan Kinerja Antar Cabang `[Should Have]`
- **Deskripsi**: Membandingkan metrik utama (omzet, jumlah transaksi, rata-rata nilai transaksi, margin) antar cabang pada periode yang sama.
- **User Story**: Sebagai owner, saya ingin membandingkan kinerja antar cabang pada periode yang sama, sehingga saya dapat mengidentifikasi cabang yang berkinerja baik maupun yang memerlukan perhatian.
- **Acceptance Criteria**:
  - Sistem menampilkan peringkat cabang berdasarkan omzet, jumlah transaksi, dan rata-rata nilai transaksi.
  - Sistem menandai cabang dengan penurunan performa signifikan dibanding periode sebelumnya.
  - Perbandingan dapat difilter berdasarkan periode (mingguan/bulanan).

#### FR-09 — Growth Readiness Score `[Could Have (Out of Scope MVP)]`
- **Deskripsi**: Menganalisis tren omzet, konsistensi transaksi, dan margin untuk menghasilkan skor kesiapan usaha bertumbuh beserta rekomendasi singkat.
- **User Story**: Sebagai owner, saya ingin mengetahui skor kesiapan usaha saya untuk berekspansi, sehingga keputusan membuka cabang baru didasarkan pada data historis, bukan asumsi.
- **Acceptance Criteria**:
  - (Rencana) Sistem menganalisis tren omzet dan margin dalam 3-6 bulan terakhir.
  - (Rencana) Sistem menghasilkan skor kesiapan beserta rekomendasi singkat yang actionable.
  - Fitur ini didokumentasikan untuk pengembangan lanjutan pasca-skripsi, tidak termasuk dalam scope prototipe.

---

## 9. Kebutuhan Non-Fungsional (Non-Functional Requirements)

| Kategori | Kebutuhan |
| :--- | :--- |
| **Performa** | Proses transaksi (dari pesanan hingga pembayaran selesai) dapat diselesaikan dalam waktu kurang dari 2 detik pada kondisi jaringan normal. |
| **Usabilitas** | Antarmuka kasir dapat dipelajari oleh staf baru dalam waktu kurang dari 15 menit tanpa pelatihan formal. |
| **Keandalan (Reliability)** | Data pesanan yang belum selesai (draft order) tidak boleh hilang meskipun aplikasi tertutup tiba-tiba (auto-save). |
| **Keamanan** | Akses ke dashboard konsolidasi multi-cabang hanya diberikan kepada akun owner; akun kasir hanya dapat mengakses data cabang tempatnya terdaftar. |
| **Skalabilitas** | Penambahan cabang baru dapat dilakukan tanpa mengubah struktur data/basis data secara signifikan. |
| **Konsistensi Data** | Data yang tampil pada dashboard konsolidasi harus konsisten dengan data laporan per cabang pada waktu yang sama. |

---

## 10. Alur Pengguna Utama (User Flow)

### 10.1 Alur Kasir — Memproses Transaksi
1. Kasir login dan memilih cabang tempatnya bertugas (otomatis terkunci sesuai akun).
2. Kasir memilih menu dan jumlah item untuk membentuk pesanan.
3. Kasir memproses pembayaran; sistem menghitung total dan kembalian.
4. Transaksi tersimpan ke Riwayat Transaksi dan otomatis memperbarui Laporan Penjualan cabang tersebut.

### 10.2 Alur Owner — Memantau Bisnis Multi-Cabang
1. Owner login ke akun dengan akses seluruh cabang.
2. Owner membuka Dashboard Konsolidasi Laporan Multi-Cabang untuk melihat omzet gabungan.
3. Owner membuka menu Perbandingan Kinerja Antar Cabang untuk melihat cabang mana yang memerlukan perhatian.
4. Owner dapat drill-down ke Laporan Penjualan per Cabang untuk detail lebih lanjut.

---

## 11. Asumsi dan Batasan

### 11.1 Asumsi
- Data transaksi diinput langsung oleh kasir melalui aplikasi (belum terintegrasi dengan mesin EDC atau payment gateway pihak ketiga).
- Pengujian prototipe dilakukan dengan skenario simulasi 2-3 cabang, bukan skala produksi penuh.
- Pengguna memiliki perangkat (tablet/PC/smartphone) dan koneksi internet yang memadai di lokasi outlet.

### 11.2 Batasan
- Prototipe dikembangkan dalam lingkup dan waktu skripsi (kurang lebih satu semester), sehingga fitur dibatasi sesuai scope pada Bagian 7.
- Belum mencakup manajemen inventori/bahan baku secara detail — sebatas pencatatan penjualan produk jadi.

---

## 12. Ketergantungan (Dependencies)

- Ketersediaan koneksi internet untuk sinkronisasi data antar cabang ke dashboard konsolidasi.
- Perangkat kasir (tablet/PC) yang tersedia di setiap outlet yang diuji.
- Basis data terpusat yang dapat diakses oleh seluruh cabang secara real-time atau near real-time.

---

## 13. Rencana Rilis (Release Plan)

| Milestone | Cakupan | Terkait Fitur |
| :--- | :--- | :--- |
| **Milestone 1 — MVP Kasir** | Fungsi dasar kasir per cabang berjalan penuh. | FR-01, FR-02, FR-03, FR-04, FR-05, FR-06 |
| **Milestone 2 — Konsolidasi** | Owner dapat memantau seluruh cabang dari satu dashboard. | FR-07 (Fitur Bernilai Tambah) |
| **Milestone 3 — Benchmarking** | Owner dapat membandingkan kinerja antar cabang. | FR-08 (Fitur Bernilai Tambah) |
| **Milestone 4 — Lanjutan (pasca-skripsi)** | Skor kesiapan bertumbuh berbasis data historis. | FR-09 (Fitur Bernilai Tambah / Out of Scope) |

---

## 14. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| **Kompleksitas sinkronisasi data multi-cabang lebih besar dari estimasi waktu skripsi.** | Milestone 2/3 berpotensi molor. | Gunakan basis data terpusat sederhana (bukan arsitektur terdistribusi) untuk skala prototipe; prioritaskan Must Have terlebih dahulu. |
| **Data uji (jumlah cabang/transaksi) tidak representatif.** | Fitur benchmarking dan konsolidasi sulit diuji secara realistis. | Menyusun data dummy dengan variasi skenario (cabang untung, rugi, stabil) untuk pengujian. |
| **Waktu pengerjaan skripsi terbatas.** | Fitur di luar scope berisiko ikut dikerjakan (scope creep). | Scope sudah dikunci pada Bagian 7; penambahan fitur baru harus melalui evaluasi ulang prioritas terlebih dahulu. |

---

## 15. Glosarium

| Istilah | Penjelasan |
| :--- | :--- |
| **MoSCoW** | Kerangka prioritas Must Have, Should Have, Could Have, Won't Have. |
| **Outlet/Cabang** | Satu titik penjualan fisik dari usaha F&B yang menggunakan Growkas. |
| **Dashboard Konsolidasi** | Tampilan yang menggabungkan data transaksi dari seluruh cabang secara terpusat. |
| **Draft/Open Order** | Pesanan yang sudah dicatat tetapi belum diproses pembayarannya. |
| **MVP** | Minimum Viable Product — versi produk dengan fitur minimum yang sudah dapat digunakan dan diuji. |

---

## Lampiran: Riwayat Perubahan Dokumen

| Versi | Tanggal | Perubahan |
| :--- | :--- | :--- |
| **1.0** | [diisi tanggal] | Draf awal PRD disusun berdasarkan hasil eksplorasi produk dan analisis fitur. |
