# Ziezan POS - Sistem Manajemen Rental PlayStation

**Ziezan POS** adalah aplikasi Point of Sale (POS) berbasis web modern yang dirancang khusus untuk bisnis penyewaan konsol game (PlayStation Rental). Aplikasi ini mengintegrasikan manajemen member, kontrol perangkat keras via Bluetooth, dan sinkronisasi data cloud untuk efisiensi operasional yang maksimal.

## 🚀 Fitur Utama

Aplikasi ini dilengkapi dengan fitur-fitur canggih untuk memudahkan operasional rental:

### 🎮 Manajemen Konsol & Sesi
*   **Tracking Real-time:** Memantau status setiap unit (Tersedia, Sedang Main, Maintenance).
*   **Timer Otomatis:** Menghitung durasi sewa dan biaya secara otomatis.
*   **Bluetooth Control:** Mematikan/menghidupkan TV secara otomatis saat sesi dimulai atau berakhir (memerlukan hardware receiver Bluetooth pada TV).

### 👥 Sistem Membership & Loyalitas
*   **Tier Membership:** Mendukung tingkatan member (Basic, Plus, VIP) dengan harga dan aturan berbeda.
*   **Bonus Playtime:** Logika otomatis "Main X Jam, Gratis Y Jam" berdasarkan akumulasi waktu bermain.
*   **Riwayat Member:** Mencatat total pengeluaran dan jam bermain setiap pelanggan.

### 💰 Transaksi & Laporan
*   **Multi-Payment:** Mendukung pencatatan pembayaran Tunai (Cash) dan QRIS.
*   **Laporan Keuangan:** Rekap pendapatan harian, riwayat transaksi, dan grafik utilitas konsol.
*   **AI Insights:** Analisis bisnis cerdas menggunakan Google Gemini AI untuk memberikan saran operasional.

### 📡 Konektivitas & Mode
*   **Offline-First:** Aplikasi tetap berjalan lancar tanpa internet. Data akan disinkronisasi ke Supabase saat koneksi kembali online.
*   **TV Receiver Mode:** Mode tampilan khusus untuk layar TV yang menampilkan sisa waktu bermain kepada pelanggan.
*   **Multi-Platform:** Responsif untuk Desktop, Tablet, dan Mobile.

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend:** React 18, TypeScript, Tailwind CSS
*   **Backend / Database:** Supabase (PostgreSQL)
*   **Hardware Interface:** Web Bluetooth API
*   **AI:** Google Gemini API
*   **Icons:** Lucide React

---

## 📦 Cara Instalasi

Ikuti langkah-langkah berikut untuk menjalankan aplikasi ini di lingkungan lokal (Localhost):

### Prasyarat
*   Node.js (versi 18 atau terbaru)
*   NPM atau Yarn

### Langkah-langkah
1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/ziezan-pos.git
    cd ziezan-pos
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # atau
    yarn install
    ```

3.  **Konfigurasi Environment**
    Pastikan konfigurasi API Key Supabase dan Google Gemini sudah terpasang di file `services/supabaseClient.ts` dan `services/geminiService.ts` atau menggunakan `.env` file jika sudah dikonfigurasi.

4.  **Jalankan Aplikasi**
    ```bash
    npm run dev
    ```
    Buka browser dan akses `http://localhost:5173`.

---

## 📖 Panduan Penggunaan

### 1. Masuk Sistem (Login)
*   Untuk alasan keamanan dan privasi, kredensial login tidak ditampilkan secara publik.
*   **Silakan hubungi pengembang (Febri Suryanto) melalui WhatsApp atau Email untuk mendapatkan akses login.**

### 2. Menambah Unit Console
*   Masuk ke menu **Unit**.
*   Klik tombol **Tambah**.
*   Masukkan nama unit (misal: "PS5 - Unit 01") dan simpan.

### 3. Memulai Rental (Operator)
*   Di menu **Unit**, pilih konsol yang berstatus *Available*.
*   Klik tombol **Sewa Unit**.
*   Pilih **Member** dari daftar (atau tambah member baru di menu Member).
*   Masukkan **Durasi** main (jam). Sistem akan menghitung biaya dan potongan bonus jika ada.
*   Pilih metode pembayaran (Cash/QRIS) dan klik **Mulai Sesi**.
*   *Jika Bluetooth terhubung, TV akan menyala otomatis.*

### 4. Mode TV Display
*   Buka aplikasi di browser Smart TV.
*   Aplikasi akan mendeteksi device TV dan meminta pemilihan Unit ID.
*   Pilih Unit yang sesuai dengan TV tersebut.
*   Layar akan menampilkan status "AVAILABLE" atau Timer Mundur saat ada sesi aktif.

### 5. Sinkronisasi Data
*   Aplikasi menyimpan data di Local Storage browser secara otomatis.
*   Saat perangkat terhubung ke internet, indikator di pojok kanan atas akan berubah menjadi **SYNCING...** dan data akan diunggah ke cloud (Supabase).

---

## 👨‍💻 Tentang Pengembang

Aplikasi ini dikembangkan dan dipelihara oleh:

*   **Nama:** Febri Suryanto
*   **Website:** [febrisuryanto.com](https://febrisuryanto.com)
*   **Email:** [hello@febrisuryanto.com](mailto:hello@febrisuryanto.com)
*   **WhatsApp:** [+62 823-1290-7731](https://wa.me/6282312907731)

---
*© 2026 Ziezan Station POS System. All Rights Reserved.*
