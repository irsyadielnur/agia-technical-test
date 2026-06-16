# 🛒 AI Ecommerce Chatbot - AGIA Technical Test

Proyek ini adalah hasil pengerjaan **Tantangan Pilihan 1: AI Ecommerce Chatbot** untuk *technical test* Junior Full Stack Engineer di AGIA. Aplikasi ini adalah *mini e-commerce* yang dilengkapi dengan panel admin untuk manajemen produk, serta *widget* AI Chatbot cerdas (berbasis Gemini API) yang mampu memberikan rekomendasi produk sesuai dengan data dari *database* (Supabase).

## 🚀 Teknologi yang Digunakan

* **Framework:** Next.js (App Router)
* **Bahasa:** TypeScript
* **Database & Auth:** Supabase (PostgreSQL)
* **Storage:** Supabase Storage (untuk gambar produk)
* **AI API:** Gemini API (Google)
* **Styling:** Tailwind CSS

---

## ✨ Fitur yang Telah Diselesaikan

Aplikasi ini telah memenuhi **semua *minimum requirements*** beserta beberapa **fitur bonus (opsional)**.

### 🌐 Halaman Publik (Customer)
- [x] Daftar produk (Katalog dinamis dari database).
- [x] Detail produk.
- [x] Pencarian dan filter produk.
- [x] Antarmuka responsif (Mobile, Tablet, Desktop).

### 🤖 AI Chatbot
- [x] *Widget floating chat* di pojok kanan bawah halaman publik.
- [x] Menjawab pertanyaan seputar produk & memberikan rekomendasi.
- [x] **Context-Aware:** Jawaban bersumber dari data produk di Supabase secara *real-time* (tidak berhalusinasi/jawaban generik).
- [x] Riwayat percakapan tersimpan per pengguna/sesi dan dapat dilanjutkan (persisten).

### 🛡️ Admin Panel
- [x] Login menggunakan Supabase Auth.
- [x] Manajemen Produk (CRUD: Tambah, Ubah, Hapus).
- [x] Daftar produk dalam bentuk tabel admin.
- [x] Halaman **Rekap Percakapan**: Admin dapat melihat daftar seluruh *conversation* dan isi detail *chat* pengguna.

### 🌟 Fitur Bonus (Opsional)
- [x] **Supabase Storage:** Upload gambar produk langsung ke *cloud storage*.
- [x] **Row Level Security (RLS) Aktif:** Pengamanan *database* standar.
- [x] **Product Card in Chat:** Chatbot dapat memunculkan UI *card* produk langsung di dalam gelembung obrolan untuk UX yang lebih baik, dan dapat dipilih lalu dialihkan kehalaman detail product
- [x] **Smart Cart (Keranjang Belanja):** Menggunakan `localStorage` browser untuk pengunjung (*guest*), dan otomatis tersinkronisasi ke *database* Supabase jika pengguna melakukan *login*.
- [x] **Dashboard Analitik Sederhana:** Menampilkan metrik operasional seperti:
  - Estimasi pendapatan & jumlah penjualan.
  - Jumlah pengguna terdaftar & jumlah produk.
  - Interaksi chatbot (Sesi chat).
  - Aktivitas Keranjang dan Favorite pengguna.
  - jumlah product per-kategori
  - Peringatan *restock* produk yang mau habis.

---

## 🚧 Fitur Belum Selesai & Kendala Teknis

**Semantic Search / Vector Search**
Saya belum dapat mengimplementasikan fitur pencarian berbasis semantik/vektor.
* **Alasan Teknis:** Awalnya saya menggunakan pencarian standar berbasis kecocokan teks (`LIKE %keyword%`). Setelah meriset fitur *semantic search*, saya menyadari bahwa implementasinya membutuhkan ekstensi `pgvector` di Supabase. Setiap teks produk (nama, deskripsi) harus diubah terlebih dahulu menjadi deretan angka matematis (*vector embeddings*) menggunakan AI, lalu disimpan di tabel, dan pencariannya menggunakan fungsi RPC (*Remote Procedure Call*) untuk menghitung kedekatan (*cosine similarity*). Mengingat keterbatasan waktu tes (3 hari), saya memutuskan untuk memprioritaskan stabilitas fitur utama, integrasi RAG (Retrieval-Augmented Generation) pada chatbot, dan UI/UX sebelum masuk ke tahap *vector database*.

---

## ⚖️ Tradeoff Teknis

Selama proses pengembangan, saya mengambil beberapa keputusan *tradeoff* teknis:
1. **Penyimpanan Cart (Local Storage vs Database):** Saya memutuskan membuat sistem hibrida. Untuk *guest*, data disimpan di `localStorage` agar situs terasa super cepat tanpa perlu melakukan *fetch* ke server. Konsekuensinya, *state management* di *frontend* menjadi lebih rumit karena harus menyinkronkan data dari lokal ke *database* Supabase saat pengguna akhirnya mendaftar/login.
2. **Session Chat untuk Guest:** Alih-alih memaksa pengguna login untuk mengobrol dengan AI, saya menghasilkan ID Sesi (Session ID) unik berbasis *cookies/local storage* agar *guest* tetap bisa melanjutkan *history chat*. Tradeoff-nya, riwayat ini bisa hilang jika *guest* menghapus *cache* browser, namun ini mengorbankan sedikit persistensi demi kenyamanan akses.
3. **Penyimpanan Gambar di Supabase dengan Tabel sendiri:** agar setiap product dapat memiliki gambar yang lebih dari satu, saya memutuskan untuk membuat tabel terpisah untuk image.
4. **Arsitektur Real-time (Server-Sent Events vs Socket.io):** Karena aplikasi ini di-deploy di Vercel (lingkungan Serverless), penggunaan socket.io tradisional sangat rentan mengalami koneksi terputus (timeout). Sebagai gantinya, saya mengandalkan metode Server-Sent Events (SSE) untuk efek streaming ketikan AI Chatbot, dan Supabase Realtime untuk sinkronisasi data. Tradeoff-nya, kode backend menjadi lebih spesifik pada ekosistem Next.js/Supabase, namun jauh lebih stabil dan tidak membebani memori server.
5. **Optimasi Media (Client-Side Compression vs Upload Mentah):** Daripada menyimpan gambar dalam format Base64 (yang akan membuat database bengkak) atau mengunggah gambar resolusi tinggi secara mentah, saya menerapkan kompresi di sisi client. Gambar diubah menjadi format WebP dengan resolusi maksimal sebelum dikirim ke Supabase Storage. Tradeoff-nya, ada tambahan logika dan sedikit waktu pemrosesan di browser admin saat mengunggah, namun ini memangkas ukuran aset hingga 80%, menghemat kuota cloud, dan membuat First Contentful Paint (FCP) halaman publik jauh lebih cepat.

---

## 📝 Pertanyaan Refleksi

**1. Mengapa Anda memilih tantangan ini?**
Saya memilih tantangan AI Ecommerce Chatbot karena kasus ini sangat cocok dengan proyek yang pernah saya buat untuk tugas akhir saya, yaitu website penjualan rajut toko Uneeya Handicraft, meskipun begitu, saya tertantang untuk membuat website yang seperti uneeya handicarft lagi namun dengan tech stack yang berbeda, yaitu Next.js Typescript dan Supabase, untuk Next.js dan Typescript saya sudah pernah belajar dasarnya sedikit, dalam proses belajarnya saya masih di level Hello World!, sedangkan Supabase, saya baru nyemplung ke database ini, dan ini menjadi tantangan utama karena technical test ini harus selesai dalam waktu 3 hari.

**2. Bagian mana yang paling sulit?**
**Pertama,** untuk fitur keranjang (Cart), saya harus membangun logika hibrida yang mulus: membaca/menulis dari localStorage saat pengunjung masih berstatus guest, lalu memigrasikan dan menyinkronkan data tersebut ke Supabase tanpa ada duplikasi saat pengguna melakukan login.

**Kedua,** mengelola alur asinkron saat Admin mengunggah produk. Saya harus merangkai proses kompresi gambar (client-side), mengunggahnya ke Supabase Storage untuk mendapatkan Public URL, dan akhirnya menyimpannya bersama data teks ke dalam database relasional. Memastikan seluruh alur ini tidak error, aman (RLS aktif), dan tetap memberikan feedback loading yang baik untuk UX admin merupakan tantangan teknis yang sangat menarik.

**Ketiga,** membangun jembatan konteks antara database Supabase dan Gemini API (menerapkan konsep dasar RAG / Retrieval-Augmented Generation). Tantangannya terbagi menjadi dua tahap: Pertama, saya harus merancang API Route di backend agar dapat melakukan fetch data produk yang up-to-date dari Supabase, lalu memformat data JSON tersebut menjadi string konteks yang efisien agar tidak melebihi batas token limit. Kedua, melakukan prompt engineering yang ketat pada System Prompt Gemini. Saya harus memastikan AI benar-benar bertindak sebagai asisten toko yang hanya menjawab berdasarkan data yang disuntikkan, membuat Prompt aturan untuk chatbot, mengatur agar pemberian rekomendasi hanya saat pesan pengguna berhubungan dengan product, mencegah AI berhalusinasi (merekomendasikan barang yang tidak ada di toko), serta memformat responsnya sedemikian rupa agar frontend bisa mendeteksinya dan merender UI Product Card langsung di dalam gelembung chat.

**3. Apabila diberikan tambahan waktu satu hari, bagian mana yang akan Anda perbaiki?**
Saya akan memprioritaskan perbaikan pada **tampilan dan animasi**. Saya ingin membuat transisi yang lebih mulus, dan memoles detail *layouting* di mode *mobile* agar terasa lebih setara dengan aplikasi standar produksi. saya juga akan merapikan semua kode, seperti kode yang bisa dibuat menjadi komponen terpisah, agar file kode utama tidak terlalu panjang, dan semua file kode mudah untuk dibaca dan diperbaiki.

**4. Bagaimana cara Anda melakukan scaling terhadap aplikasi ini apabila jumlah pengguna bertambah?**
* **Database:** Mengoptimalkan *query* SQL di Supabase, menambahkan *indexes* pada tabel yang sering dicari, dan mempertimbangkan pemisahan (sharding) atau *read replicas* jika transaksi sangat tinggi.
* **AI / Backend:** Menerapkan strategi *caching* (seperti Redis atau Vercel KV) untuk pertanyaan chatbot yang berulang. Ini akan drastis mengurangi panggilan API ke Gemini, menghemat token, dan mempercepat *response time*.
* **Frontend:** Memaksimalkan fitur fitur *Incremental Static Regeneration* (ISR) di Next.js untuk halaman detail produk agar katalog dapat dirender dengan sangat cepat tanpa terus-menerus membebani *database*.

---

## 💻 Cara Setup & Menjalankan Proyek (Local Development)

### Prasyarat
Pastikan Anda telah menginstal **Node.js** di komputer Anda. Anda juga memerlukan akun Supabase dan Gemini API Key.

### 1. Clone Repositori
```bash
git clone [https://github.com/USERNAME_ANDA/NAMA_REPOSITORI.git](https://github.com/USERNAME_ANDA/NAMA_REPOSITORI.git)
cd NAMA_REPOSITORI
```

### 2. Install Dependencies
Buka terminal di dalam folder proyek Anda, lalu jalankan perintah berikut untuk mengunduh semua *library* yang dibutuhkan:
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat sebuah file baru bernama .env.local di root direktori (folder paling luar) proyek, lalu salin kode di bawah ini. Isi variabel tersebut dengan API Key milik Anda:
```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=

# Supabase Project API Keys (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase Project API Keys (service_role)
SUPABASE_SERVICE_ROLE_KEY=

# Gemini API Key
NEXT_GEMINI_API_KEY=
```

### 4. Setup Database (Supabase)
Pastikan Anda telah melakukan pengaturan berikut di dashboard Supabase Anda:
- Membuat tabel-tabel yang diperlukan untuk menjalankan proyek ini
- Mengaktifkan Row Level Security (RLS) untuk mengamankan data pengguna.
- Membuat bucket di Supabase Storage (misalnya dengan nama images) dan mengatur akses publik (public policy) agar gambar produk dapat ditampilkan.

### 5. Tabel (Supabase)
```Schema SQL
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  category text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  guest_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
CREATE TABLE public.carts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  product_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT carts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'customer'::user_role,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.wishlists (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wishlists_pkey PRIMARY KEY (id),
  CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
```
untuk query lengkap selama proses pengembangan saya dapat dilihat pada file querySQL.txt

### 6. Jalankan Server Development
Setelah semua pengaturan selesai, jalankan server lokal dengan perintah ini:

```Bash
npm run dev
```
Buka browser dan akses http://localhost:3000 untuk melihat aplikasi.

## 🔐 Akun Simulasi Admin
Untuk keperluan pengujian (testing) dan evaluasi saat sesi review teknis, Anda dapat mengakses Halaman Admin menggunakan kredensial simulasi berikut:

- Email: admin@toko.com
- Password: admin!@#


