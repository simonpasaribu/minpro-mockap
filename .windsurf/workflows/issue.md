# Event Management Platform

## Objective
The main goal of the MVP is to create a simple and functional event management platform that allows event organizers to create and promote events, while attendees can browse and register for those events.

---

## I. TECH STACK & DEPENDENCIES

### 1. CORE STACK (Fullstack)
- Language: TypeScript
- Validation: Zod (Frontend & Backend)
- Database: PostgreSQL (Neon)
- ORM: Prisma v7.7.0

### 2. FRONTEND DEPENDENCIES (src/web)
- Framework: React
- Build Tool: Vite
- Styling: Tailwind CSS v4
- State Management: Zustand
- Routing: React Router DOM
- HTTP Client: Axios
- Icons: Lucide React
- CSS Tools: PostCSS, Autoprefixer

### 3. BACKEND DEPENDENCIES (src/api)
- Framework: Express.js
- Runtime: Node.js
- Authentication: JSON Web Token (JWT)
- Password Hashing: Bcrypt
- File Upload: Cloudinary SDK
- Email Service: Nodemailer (Optional/Simulasi)
- Payment Gateway: Midtrans Node.js SDK (Sandbox Simulator)

### 4. DEVELOPMENT & TOOLING
- Linter: ESLint
- Formatter: Prettier
- Testing: Unit Test (Jest / Vitest)
- Environment: Dotenv
- Deployment: Monorepo Structure

---

## II. DETAILED WORKFLOW: FEATURE 1 (SIMON)

### Nomor 1: Event Discovery, Details, Creation, and Promotion
Fokus pada pengalaman pengguna dalam mencari acara dan kemudahan penyelenggara dalam mengelola konten.

* **Poin A: Landing Page & Event Browsing**
  * **Flow:** Aplikasi melakukan `fetch` data event aktif. User dapat melakukan filter berdasarkan kategori atau lokasi. Frontend menampilkan hasil dalam grid kartu yang responsif.
* **Poin B: Search Bar with Debounce**
  * **Flow:** Saat user mengetik, fungsi **Debounce** menunda API call selama 300-500ms. Backend melakukan pencarian string menggunakan Prisma `contains` untuk memberikan hasil yang relevan.
* **Poin C: Event Creation (Organizer)**
  * **Flow:** Organizer mengisi form event (nama, harga, kursi, tanggal, deskripsi). Gambar diunggah ke Cloudinary dan URL-nya disimpan ke database. Data divalidasi oleh Zod sebelum disimpan.
* **Poin D: Pricing & Promotions**
  * **Flow:** Sistem mendukung event gratis dan berbayar (IDR). Organizer dapat membuat voucher promosi dengan kuota dan batas waktu tertentu yang spesifik untuk event tersebut.

### Nomor 2: Event Transaction
Fokus pada integritas data keuangan dan manajemen stok tiket (kursi) secara real-time.

* **Poin A: Purchasing & Point Usage**
  * **Flow:** Customer memilih tiket dan dapat menggunakan saldo poin untuk mengurangi total harga (contoh: Rp300.000 - 20.000 poin = Rp280.000). Sistem mengecek sisa kursi (`available_seats`) sebelum transaksi dibuat.
* **Poin B: Transaction Statuses & Payment Proof**
  * **Flow:** Ada 6 status: *waiting for payment, waiting for admin confirmation, done, rejected, expired,* dan *canceled*. Setelah checkout, muncul timer 2 jam untuk unggah bukti bayar ke Cloudinary.
* **Poin C: Automatic Status Changes**
  * **Flow:** Transaksi otomatis menjadi `EXPIRED` jika bukti bayar tidak diunggah dalam 2 jam. Jika Organizer tidak melakukan konfirmasi dalam 3 hari, status otomatis menjadi `CANCELED`.
* **Poin D: Rollbacks and Seat Restoration**
  * **Flow:** Menggunakan **SQL Transaction**, jika transaksi expired/canceled/rejected, sistem wajib mengembalikan poin, voucher, atau kupon yang terpakai serta memulihkan kuota kursi event.

### Nomor 3: Event Reviews and Ratings
Fokus pada sistem feedback pasca-event untuk membangun reputasi platform.

* **Poin A: Review Submission**
  * **Flow:** Customer hanya bisa memberikan ulasan dan rating (1-5) jika transaksi sudah berstatus `DONE` dan acara tersebut telah selesai dilaksanakan.
* **Poin B: Organizer Profile**
  * **Flow:** Backend melakukan agregasi rating. Halaman profil Organizer menampilkan skor rata-rata beserta kumpulan ulasan dari para peserta untuk transparansi kualitas.

---

**Note for Simon:** Pastikan logika **Rollback** pada Nomor 2-D diuji dengan teliti menggunakan `prisma.$transaction` agar tidak ada kursi atau poin yang "nyangkut" saat transaksi gagal.
