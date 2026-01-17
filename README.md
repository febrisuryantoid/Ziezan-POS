# Ziezan POS - Sistem Manajemen Rental PlayStation

<p align="center">
  <img src="https://beeimg.com/images/t47564105964.png" alt="Ziezan POS Icon" width="128" style="border-radius: 24px" />
</p>

**Ziezan POS v1.0.0** adalah aplikasi Point of Sale (POS) berbasis web modern yang dirancang khusus untuk bisnis penyewaan konsol game (PlayStation Rental). Aplikasi ini mengintegrasikan manajemen member, kontrol perangkat keras via Bluetooth, dan sinkronisasi data cloud untuk efisiensi operasional yang maksimal.

## 🚀 Fitur Utama

Aplikasi ini dilengkapi dengan fitur-fitur canggih untuk memudahkan operasional rental:

### 🎮 Manajemen Konsol & Sesi
*   **Tracking Real-time:** Memantau status setiap unit (Tersedia, Sedang Main, Maintenance).
*   **Timer Otomatis:** Menghitung durasi sewa dan biaya secara otomatis.
*   **Bluetooth Control:** Mematikan/menghidupkan TV secara otomatis saat sesi dimulai atau berakhir (memerlukan hardware receiver Bluetooth pada TV).

### 👥 Sistem Membership & Loyalitas
*   **Tier Membership:** Mendukung tingkatan member dengan warna dan logika berbeda.
*   **Foto Profil Member:** Admin dapat mengambil foto member langsung dari kamera atau upload dari galeri.
*   **Bonus Playtime:** Logika otomatis "Main X Jam, Gratis Y Jam" berdasarkan akumulasi waktu bermain.
*   **Riwayat Member:** Mencatat total pengeluaran dan jam bermain setiap pelanggan.

### 💰 Transaksi & Laporan
*   **Multi-Payment:** Mendukung pencatatan pembayaran Tunai (Cash) dan QRIS.
*   **Laporan Keuangan:** Rekap pendapatan harian, riwayat transaksi, dan grafik utilitas konsol.
*   **Export Data:** Fitur untuk mengunduh laporan ke file CSV.

### 📡 Konektivitas & Mode
*   **Offline-First:** Aplikasi tetap berjalan lancar tanpa internet. Data akan disinkronisasi ke Supabase saat koneksi kembali online.
*   **TV Receiver Mode:** Mode tampilan khusus untuk layar TV yang menampilkan sisa waktu bermain kepada pelanggan.
*   **Multi-Platform:** Responsif untuk Desktop, Tablet, dan Mobile (PWA Support).

---

## 🏆 Membership Demo

Aplikasi ini memiliki 3 tingkatan membership default yang dapat dikonfigurasi:

| Tier Name | Warna Tema | Ikon | Deskripsi Default |
| :--- | :--- | :---: | :--- |
| **Basic** | Silver / Grey | 🛡️ | Membership standar. Tidak ada biaya bulanan. Bonus Playtime standar. |
| **Plus** | Purple / Violet | ⭐ | Membership menengah. Tampilan kartu eksklusif berwarna ungu. Bonus lebih cepat didapat. |
| **VIP** | Gold / Amber | 👑 | Membership tertinggi. Tampilan kartu emas mewah. Prioritas bonus tertinggi. |

*Tampilan kartu member di aplikasi akan menyesuaikan warna tema di atas secara otomatis.*

---

## 🛠️ Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan tumpukan teknologi modern untuk performa dan skalabilitas:

*   **Frontend Framework:** React 18 (Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (Custom Color Palette: Trendy Purple 2026)
*   **Icons:** Lucide React
*   **Charts:** Recharts
*   **Database & Sync:** Supabase (PostgreSQL)
*   **Hardware Interface:** Web Bluetooth API
*   **Local Storage:** Browser LocalStorage (dengan manajemen kuota gambar Base64)

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
    Pastikan konfigurasi API Key Supabase sudah terpasang di file `services/supabaseClient.ts` atau menggunakan `.env` file jika sudah dikonfigurasi.

4.  **Jalankan Aplikasi**
    ```bash
    npm run dev
    ```
    Buka browser dan akses `http://localhost:5173`.

---

## 👨‍💻 Tentang Pengembang

Aplikasi ini dikembangkan dan dipelihara oleh:

*   **Nama:** Febri Suryanto
*   **Website:** [febrisuryanto.com](https://febrisuryanto.com)
*   **Email:** [hello@febrisuryanto.com](mailto:hello@febrisuryanto.com)
*   **WhatsApp:** [+62 823-1290-7731](https://wa.me/6282312907731)

---
*© 2026 Ziezan Station POS System. All Rights Reserved.*