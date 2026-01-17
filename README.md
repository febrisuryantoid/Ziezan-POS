# Ziezan POS - Sistem Manajemen Rental PlayStation

<p align="center">
  <img src="https://beeimg.com/images/t47564105964.png" alt="Ziezan POS Icon" width="128" style="border-radius: 24px" />
</p>

**Ziezan POS v1.1.0 (Stable)** adalah aplikasi Point of Sale (POS) berbasis web modern yang dirancang khusus untuk bisnis penyewaan konsol game. Aplikasi ini mengintegrasikan manajemen member, kontrol perangkat keras, dan sinkronisasi cloud pintar.

## 🚀 Fitur Baru di v1.1.0

*   **Premium Digital Member Card**: Kartu member digital dengan desain *glassmorphism* futuristik, animasi border dinamis sesuai Tier (Basic/Plus/VIP), dan layout responsif yang elegan untuk pelanggan.
*   **Smart Cloud Optimizer**: Secara otomatis membersihkan data transaksi lama di cloud untuk menghemat penyimpanan, sesuai konfigurasi pengguna.
*   **Bluetooth Thermal Print**: Dukungan pencetakan struk langsung ke printer thermal via Bluetooth tanpa driver tambahan.
*   **Auto-Birthday Bonus**: Sistem otomatis mendeteksi ulang tahun member dan memberikan saldo bonus.
*   **Partial Bonus Payment**: Mendukung pembayaran campuran (Saldo Bonus + Tunai) dalam satu transaksi.

---

## 🌟 Fitur Utama

### 🎮 Manajemen Konsol & Sesi
*   **Tracking Real-time:** Memantau status setiap unit (Tersedia, Sedang Main, Maintenance).
*   **Timer Otomatis:** Menghitung durasi sewa dan biaya secara otomatis.
*   **Kontrol TV:** Mode receiver khusus untuk menampilkan sisa waktu di layar TV pelanggan.

### 👥 Sistem Membership & Loyalitas
*   **Tier Membership:** Mendukung tingkatan member (Basic, Plus, VIP) dengan tema warna unik.
*   **Kartu Digital:** Member dapat memantau statistik main, level, dan saldo bonus mereka melalui link publik.
*   **Foto Profil Member:** Admin dapat mengambil foto member langsung dari kamera atau upload dari galeri.
*   **Bonus Playtime:** Logika otomatis "Main X Jam, Gratis Y Jam".

### 💰 Transaksi & Laporan
*   **Multi-Payment:** Tunai, QRIS, dan Bonus Balance.
*   **Laporan Keuangan:** Rekap pendapatan harian, riwayat transaksi, dan grafik utilitas konsol.
*   **Export Data:** Unduh laporan ke file CSV.

### 📡 Konektivitas
*   **Offline-First:** Tetap berjalan tanpa internet. Sinkronisasi otomatis saat online.
*   **Cross-Platform:** Dapat diinstal di Android (PWA/APK), iOS, dan Desktop.

---

## 🛠️ Teknologi

*   **Frontend:** React 18, Vite, TypeScript
*   **Styling:** Tailwind CSS (Glassmorphism & Animations)
*   **Database:** Supabase (PostgreSQL)
*   **Hardware:** Web Bluetooth API (Thermal Printer & TV Control)

---

## 📦 Cara Instalasi

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/ziezan-pos.git
    cd ziezan-pos
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Jalankan Aplikasi**
    ```bash
    npm run dev
    ```

---

*© 2026 Ziezan Station POS System. All Rights Reserved.*