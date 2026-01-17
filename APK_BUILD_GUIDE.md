# Panduan Membuat Aplikasi Android (.APK) Ziezan Station

Panduan ini akan membantu Anda mengubah kode web (PWA) ini menjadi aplikasi Android native yang siap diinstal atau diupload ke Google Play Store menggunakan teknologi **Trusted Web Activity (TWA)**.

## Prasyarat
Pastikan komputer Anda sudah terinstal:
1.  **Node.js** (versi 14 ke atas)
2.  **JDK 8** atau terbaru (biasanya sudah ada jika Anda pernah install Android Studio)

---

## Langkah 1: Hosting Aplikasi Anda
Sebelum membuat APK, aplikasi web Anda **harus sudah online** (dihosting). Google Play Store tidak bisa menerima APK yang mengarah ke `localhost`.

1.  Deploy kode ini ke Vercel, Netlify, atau hosting lainnya.
2.  Catat URL domain Anda (misalnya: `https://ziezanpos.vercel.app/`).

## Langkah 2: Install Bubblewrap CLI
Bubblewrap adalah alat resmi dari Google untuk membuat APK dari PWA. Buka terminal/cmd dan jalankan:

```bash
npm install -g @bubblewrap/cli
```

## Langkah 3: Inisialisasi Proyek Android
Buat folder baru di komputer Anda (di luar folder coding ini), misal `ziezan-android`, lalu masuk ke folder tersebut melalui terminal.

Jalankan perintah ini:

```bash
bubblewrap init --manifest https://DOMAIN-ANDA.com/manifest.json
```

*(Ganti `https://DOMAIN-ANDA.com` dengan URL hosting Anda dari Langkah 1)*

Bubblewrap akan menanyakan beberapa pertanyaan:
*   **Domain:** (Otomatis terisi)
*   **Application Name:** Ziezan Station POS
*   **Launcher Icon:** (Otomatis mengambil dari manifest.json)
*   **Theme Color:** (Otomatis)

## Langkah 4: Build APK
Setelah inisialisasi selesai, jalankan perintah:

```bash
bubblewrap build
```

Jika ini pertama kali, Bubblewrap akan meminta untuk menginstal **Android SDK** dan **Java**. Jawab "Yes" (Y) untuk semuanya.

Anda juga akan diminta membuat **Signing Key** (Kunci Tanda Tangan).
*   **Password:** Buat password yang kuat dan **JANGAN SAMPAI HILANG**. Password ini wajib digunakan saat Anda ingin mengupdate aplikasi di Play Store nanti.

## Langkah 5: Ambil File APK
Setelah proses selesai, di dalam folder tersebut akan muncul dua file penting:
1.  `app-release-bundle.aab` -> File ini yang diupload ke **Google Play Store**.
2.  `app-release-signed.apk` -> File ini yang bisa dikirim lewat WhatsApp/Telegram dan diinstal langsung di HP Android.

## Langkah 6: Verifikasi Aset (Penting untuk Hilangkan Bar Browser)
Agar Address Bar (URL bar) browser benar-benar hilang saat aplikasi dibuka di HP:
1.  Bubblewrap akan menghasilkan file bernama `assetlinks.json`.
2.  Upload file ini ke hosting web Anda di folder `.well-known`.
3.  Alamatnya harus bisa diakses di: `https://DOMAIN-ANDA.com/.well-known/assetlinks.json`.

---

**Selesai!** Aplikasi Ziezan Station Anda sekarang sudah menjadi aplikasi native Android.