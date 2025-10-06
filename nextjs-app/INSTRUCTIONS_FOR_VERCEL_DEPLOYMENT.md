# Instruksi untuk Konfigurasi Variabel Lingkungan di Vercel

Dokumen ini memberikan panduan langkah demi langkah untuk mengkonfigurasi variabel lingkungan (environment variables) yang diperlukan agar aplikasi Next.js Anda dapat terhubung ke Supabase saat di-deploy di Vercel.

Kesalahan login yang sering terjadi di lingkungan produksi (seperti di Vercel) biasanya disebabkan oleh variabel lingkungan yang belum diatur.

## Variabel yang Dibutuhkan

Anda perlu menambahkan dua variabel berikut ke pengaturan proyek Vercel Anda:

1.  `NEXT_PUBLIC_SUPABASE_URL`: URL proyek Supabase Anda.
2.  `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kunci *anon* (publik) proyek Supabase Anda.

## Cara Menemukan Kunci API Supabase

Anda dapat menemukan kedua nilai ini di dasbor proyek Supabase Anda:

1.  Masuk ke akun [Supabase](https://supabase.com/) Anda.
2.  Pilih proyek yang Anda gunakan untuk aplikasi ini.
3.  Di menu sebelah kiri, klik ikon **Pengaturan** (roda gigi).
4.  Pilih **API** di dalam menu pengaturan.
5.  Di halaman ini, Anda akan menemukan:
    *   **Project URL** (ini adalah nilai untuk `NEXT_PUBLIC_SUPABASE_URL`).
    *   **Project API Keys** > `anon` `public` (ini adalah nilai untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## Langkah-langkah Konfigurasi di Vercel

Ikuti langkah-langkah berikut untuk menambahkan variabel lingkungan ke proyek Vercel Anda:

1.  **Masuk ke Vercel**: Buka [vercel.com](https://vercel.com/) dan masuk ke akun Anda.
2.  **Pilih Proyek**: Navigasikan ke dasbor Anda dan pilih proyek yang sesuai (misalnya, `sistemkeung`).
3.  **Buka Pengaturan**: Di halaman proyek, klik tab **Settings**.
4.  **Pilih Environment Variables**: Di menu sebelah kiri, pilih **Environment Variables**.
5.  **Tambahkan Variabel Pertama**:
    *   **KEY**: Masukkan `NEXT_PUBLIC_SUPABASE_URL`.
    *   **VALUE**: Salin dan tempel URL proyek Supabase Anda.
    *   Pastikan semua lingkungan (Production, Preview, Development) tercentang.
    *   Klik **Save**.
6.  **Tambahkan Variabel Kedua**:
    *   **KEY**: Masukkan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
    *   **VALUE**: Salin dan tempel kunci `anon` `public` Supabase Anda.
    *   Pastikan semua lingkungan tercentang.
    *   Klik **Save**.

## Deploy Ulang Aplikasi Anda

Setelah Anda menyimpan kedua variabel lingkungan tersebut, Anda perlu men-deploy ulang aplikasi Anda agar perubahan diterapkan.

1.  Navigasikan ke tab **Deployments** di proyek Vercel Anda.
2.  Temukan deployment terakhir, klik menu tiga titik (...) di sebelah kanannya, dan pilih **Redeploy**.
3.  Tunggu hingga proses deployment selesai.

Setelah deployment berhasil, aplikasi Anda seharusnya dapat terhubung ke Supabase, dan fitur login akan berfungsi seperti yang diharapkan.