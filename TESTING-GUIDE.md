# Panduan Testing Lengkap - Event Management Platform

## I. PERSIAPAN ENVIRONMENT

### 1. Setup Database (PostgreSQL dengan Neon atau Local)

```bash
# Di src/api, copy env
.copy env.example .env

# Edit .env dengan database testing
DATABASE_URL="postgresql://user:pass@localhost:5432/event_test"
JWT_SECRET="test-secret-key-12345"
PORT=3001
```

### 2. Migrate & Seed Database

```bash
# Root project
npm run db:migrate
npm run db:seed

# Atau manual di src/api
npx prisma migrate dev
npx prisma db seed
```

### 3. Jalankan Server

```bash
# Terminal 1 - Backend
cd src/api
npm run dev

# Terminal 2 - Frontend
cd src/web
npm run dev
```

---

## II. TESTING BACKEND API

### A. NOMOR 1: Event Discovery, Details, Creation, and Promotion

#### 1A. Landing Page & Event Browsing (Public)

```bash
# 1. Get semua event yang published
GET http://localhost:3001/api/events

# Response yang diharapkan:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Konser Musik 2024",
      "category": "MUSIC",
      "price": 150000,
      "availableSeats": 50,
      "isPublished": true,
      "organizer": { "firstName": "John", "lastName": "Doe" },
      "_count": { "transactions": 10, "reviews": 5 }
    }
  ]
}
```

#### 1B. Search Bar with Debounce (300-500ms)

```bash
# Test search dengan delay - seharusnya trigger setelah berhenti mengetik 400ms
GET http://localhost:3001/api/events?search=konser

# Backend menggunakan Prisma contains:
# where: {
#   OR: [
#     { title: { contains: "konser", mode: "insensitive" } },
#     { description: { contains: "konser", mode: "insensitive" } }
#   ]
# }

# Test filter kombinasi:
GET http://localhost:3001/api/events?search=konser&category=MUSIC&location=Jakarta
```

**Cara Test Debounce di Frontend:**
1. Buka browser DevTools → Network tab
2. Buka http://localhost:5173/
3. Ketik "konser" di search bar dengan cepat
4. Perhatikan: seharusnya hanya 1 request setelah berhenti mengetik 400ms
5. Jika request terus-menerus saat mengetik = DEBOUNCE TIDAK BERFUNGSI

#### 1C. Event Creation (Organizer)

```bash
# Login sebagai Organizer dulu:
POST http://localhost:3001/api/auth/login
Body: { "email": "organizer@test.com", "password": "password" }
# Simpan token dari response

# Create Event:
POST http://localhost:3001/api/organizer/events
Headers: Authorization: Bearer <organizer_token>
Content-Type: application/json

Body:
{
  "title": "Workshop Tech 2024",
  "description": "Belajar teknologi terbaru",
  "location": "Jakarta Convention Center",
  "category": "TECHNOLOGY",
  "price": 50000,
  "totalSeats": 100,
  "startDate": "2024-12-25T09:00:00Z",
  "endDate": "2024-12-25T17:00:00Z",
  "isPublished": true
}

# Test validasi Zod - seharusnya error jika:
# - title kosong
# - totalSeats < 1
# - startDate di masa lalu
```

#### 1D. Pricing & Promotions (Voucher)

```bash
# Create Voucher untuk event (Organizer only):
POST http://localhost:3001/api/organizer/events/1/vouchers
Headers: Authorization: Bearer <organizer_token>

Body:
{
  "code": "DISCOUNT20",
  "discount": 20,
  "quota": 50,
  "expiresAt": "2024-12-31T23:59:59Z"
}

# Get vouchers untuk event:
GET http://localhost:3001/api/organizer/events/1/vouchers

# Validasi voucher (saat checkout):
# - Discount 1-100%
# - Quota masih tersedia (usedCount < quota)
# - Belum expired (expiresAt > now)
```

---

### B. NOMOR 2: Event Transaction (FITUR PENTING - SIMON)

#### 2A. Purchasing & Point Usage

```bash
# PREPARATION: Cek data awal
-- Query SQL untuk cek kondisi awal:
SELECT id, title, available_seats, price FROM events WHERE id = 1;
SELECT id, first_name, points_balance FROM users WHERE role = 'CUSTOMER' LIMIT 1;

# 1. Login Customer
POST http://localhost:3001/api/auth/login
Body: { "email": "customer@test.com", "password": "password" }
# Response: { "token": "eyJhbGciOiJIUzI1NiIs...", "user": { "id": 2, ... } }

# 2. Create Transaction (Checkout)
POST http://localhost:3001/api/transactions
Headers: Authorization: Bearer <customer_token>
Content-Type: application/json

# Scenario 1: Bayar dengan Poin
Body:
{
  "eventId": 1,
  "ticketCount": 2,
  "pointsToUse": 10000,  -- Contoh: Rp100.000 - 10.000 poin = Rp90.000
  "voucherCode": "DISCOUNT20"
}

# Perhitungan yang terjadi di backend:
# - Harga tiket: Rp150.000 x 2 = Rp300.000 (subtotal)
# - Diskon voucher 20%: Rp300.000 x 20% = Rp60.000
# - Poin digunakan: Rp10.000
# - Total: Rp300.000 - Rp60.000 - Rp10.000 = Rp230.000

# VALIDASI YANG HARUS TERJADI:
# 1. Cek availableSeats >= ticketCount (2)
# 2. Cek user.pointsBalance >= pointsToUse (10000)
# 3. Cek voucher valid (quota, expired, event match)

# Response sukses:
{
  "success": true,
  "data": {
    "id": 1,
    "status": "WAITING_PAYMENT",  -- atau "WAITING_CONFIRMATION" jika free
    "ticketCount": 2,
    "subtotal": 300000,
    "pointsUsed": 10000,
    "voucherDiscount": 60000,
    "totalAmount": 230000,
    "voucherCode": "DISCOUNT20",
    "expiredAt": "2024-12-20T16:00:00Z",  -- 2 jam dari sekarang
    "event": {
      "title": "Konser Musik 2024",
      "startDate": "2024-12-25T09:00:00Z"
    }
  }
}

# VERIFIKASI DATABASE SETELAH CREATE:
-- 1. Cek kursi berkurang:
SELECT available_seats FROM events WHERE id = 1;  -- Harus berkurang 2

-- 2. Cek poin user berkurang:
SELECT points_balance FROM users WHERE id = 2;  -- Harus berkurang 10000

-- 3. Cek voucher usedCount bertambah:
SELECT code, used_count FROM event_vouchers WHERE code = 'DISCOUNT20';

-- 4. Cek transaction record:
SELECT * FROM transactions WHERE id = 1;
```

#### 2B. Transaction Statuses & Payment Proof (Timer 2 Jam)

```bash
# Status Flow: WAITING_PAYMENT → WAITING_CONFIRMATION → DONE

# 1. Setelah create, status = WAITING_PAYMENT
#    Timer 2 jam mulai berjalan

# 2. Upload Payment Proof (sebelum expiredAt!):
PUT http://localhost:3001/api/transactions/1/payment-proof
Headers: Authorization: Bearer <customer_token>

Body:
{
  "paymentProofUrl": "https://res.cloudinary.com/demo/image/upload/payment.jpg"
}

# Response: status berubah ke WAITING_CONFIRMATION

# VERIFIKASI TIMER:
-- Cek sisa waktu di database:
SELECT 
  id, 
  status, 
  expired_at, 
  NOW() as now,
  expired_at - NOW() as remaining_time
FROM transactions 
WHERE id = 1;

-- Jika expiredAt < NOW(), upload harus ditolak!
```

#### 2C. Automatic Status Changes (Cron Job)

```bash
# Test Manual Cron (tambahkan endpoint sementara untuk testing):

# Di server.ts, tambahkan:
app.post('/api/test/expire', async (req, res) => {
  const result = await TransactionService.expireOldTransactions()
  res.json(result)
})

# Trigger test:
POST http://localhost:3001/api/test/expire

# Atau tunggu cron job otomatis (jalan setiap 5 menit)
```

**Cara Test Expire Otomatis:**
```sql
-- 1. Buat transaction dengan expiredAt di masa lalu
UPDATE transactions 
SET expired_at = NOW() - INTERVAL '1 hour',
    status = 'WAITING_PAYMENT',
    payment_proof_url = NULL
WHERE id = 1;

-- 2. Catat data sebelum expire:
SELECT 
  t.id, 
  t.status, 
  t.ticket_count, 
  t.points_used, 
  e.available_seats
FROM transactions t
JOIN events e ON e.id = t.event_id
WHERE t.id = 1;

-- 3. Trigger cron job (atau tunggu 5 menit)

-- 4. Verifikasi setelah expire:
SELECT status FROM transactions WHERE id = 1;  -- Harus: EXPIRED
SELECT available_seats FROM events WHERE id = 1;  -- Harus: kembali ke awal
SELECT points_balance FROM users WHERE user_id = 2;  -- Harus: kembali ke awal
```

#### 2D. ROLLBACK (FITUR KRITIS - WAJIB DI TEST!)

**TEST CASE 1: Organizer Reject Transaction**

```sql
-- PREPARATION: Catat kondisi awal
BEGIN;
SELECT 
  'EVENT' as type, available_seats as value FROM events WHERE id = 1
UNION ALL
SELECT 
  'USER_POINTS', points_balance FROM users WHERE id = 2
UNION ALL
SELECT 
  'VOUCHER', used_count::text FROM event_vouchers WHERE code = 'DISCOUNT20';
COMMIT;
-- Output: EVENT: 48, USER_POINTS: 50000, VOUCHER: 1
```

```bash
# Organizer reject transaction:
PUT http://localhost:3001/api/organizer/transactions/1/reject
Headers: Authorization: Bearer <organizer_token>
```

```sql
-- VERIFIKASI ROLLBACK (HARUS SUKSES!):
-- 1. Seats restored
SELECT available_seats FROM events WHERE id = 1;  -- Harus: 50 (bertambah 2)

-- 2. Points restored
SELECT points_balance FROM users WHERE id = 2;  -- Harus: 60000 (bertambah 10000)

-- 3. Point refund record created
SELECT * FROM points 
WHERE user_id = 2 
AND reason LIKE '%Refund: Transaction rejected%'
ORDER BY created_at DESC LIMIT 1;

-- 4. Voucher usedCount decreased
SELECT used_count FROM event_vouchers WHERE code = 'DISCOUNT20';  -- Harus: 0

-- 5. Status changed to REJECTED
SELECT status FROM transactions WHERE id = 1;  -- Harus: REJECTED
```

**TEST CASE 2: Customer Cancel Transaction**

```bash
# Cancel transaction (hanya bisa jika status WAITING_PAYMENT atau WAITING_CONFIRMATION):
PUT http://localhost:3001/api/transactions/1/cancel
Headers: Authorization: Bearer <customer_token>
```

Verifikasi sama dengan reject (rollback harus terjadi).

**TEST CASE 3: Transaction Expired (Auto-Cancel)**

```sql
-- Setup: Buat transaksi yang sudah expired
UPDATE transactions 
SET status = 'WAITING_PAYMENT',
    expired_at = NOW() - INTERVAL '1 hour'
WHERE id = 1;

-- Trigger cron (atau tunggu)
-- Verifikasi rollback sama dengan di atas
```

**TEST CASE 4: Auto-Cancel karena Organizer Tidak Konfirmasi (3 Hari)**

```sql
-- Setup: Transaction WAITING_CONFIRMATION lebih dari 3 hari
UPDATE transactions 
SET status = 'WAITING_CONFIRMATION',
    updated_at = NOW() - INTERVAL '4 days'
WHERE id = 1;

-- Tunggu cron job berjalan (setiap 1 jam)
-- Verifikasi: status = CANCELED, rollback terjadi
```

---

### C. NOMOR 3: Event Reviews and Ratings

#### 3A. Review Submission (Hanya jika DONE & Event Selesai)

```bash
# 1. Cek apakah bisa review:
GET http://localhost:3001/api/reviews/can-review/1
Headers: Authorization: Bearer <customer_token>

# Response yang diharapkan jika BISA review:
{
  "success": true,
  "data": {
    "canReview": true
  }
}

# Response jika TIDAK bisa:
{
  "success": true,
  "data": {
    "canReview": false,
    "reason": "Event has not ended yet"  -- atau "Transaction is not completed"
  }
}
```

```sql
-- VERIFIKASI KONDISI REVIEW:
-- Query untuk cek apakah transaksi memenuhi syarat:
SELECT 
  t.id,
  t.status,  -- Harus: DONE
  e.start_date,
  e.end_date,
  CASE 
    WHEN t.status != 'DONE' THEN 'Transaction not DONE'
    WHEN COALESCE(e.end_date, e.start_date) > NOW() THEN 'Event not ended'
    ELSE 'Can review'
  END as review_status
FROM transactions t
JOIN events e ON e.id = t.event_id
WHERE t.id = 1;
```

```bash
# 2. Submit Review (Rating 1-5):
POST http://localhost:3001/api/reviews
Headers: Authorization: Bearer <customer_token>

Body:
{
  "transactionId": 1,
  "rating": 5,
  "comment": "Event sangat bagus dan terorganisir dengan baik!"
}

# Response:
{
  "success": true,
  "data": {
    "id": 1,
    "rating": 5,
    "comment": "Event sangat bagus...",
    "createdAt": "2024-12-20T10:30:00Z"
  }
}
```

#### 3B. Organizer Profile with Aggregated Ratings

```bash
# Get Organizer Profile (Public - tanpa login):
GET http://localhost:3001/api/organizers/1

# Response:
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "profilePicture": "https://...",
    "avgRating": 4.5,  -- Average dari semua event
    "totalReviews": 25,
    "events": [...],
    "reviews": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Bagus!",
        "user": { "firstName": "Jane", "lastName": "Smith" },
        "event": { "title": "Konser Musik" }
      }
    ]
  }
}
```

```sql
-- Verifikasi agregasi rating:
SELECT 
  u.id,
  u.first_name,
  COUNT(DISTINCT e.id) as total_events,
  COUNT(DISTINCT r.id) as total_reviews,
  AVG(r.rating) as avg_rating,
  SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as five_star_count,
  SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as one_star_count
FROM users u
LEFT JOIN events e ON e.organizer_id = u.id
LEFT JOIN reviews r ON r.event_id = e.id
WHERE u.id = 1 AND u.role = 'ORGANIZER'
GROUP BY u.id, u.first_name;
```

---

## III. TESTING FRONTEND

### A. Landing Page & Event Browsing

**Test Steps:**
1. Buka http://localhost:5173/
2. **Grid Responsif**: Resize browser window
   - Desktop: 4 kolom
   - Tablet: 2 kolom  
   - Mobile: 1 kolom
3. **Search Debounce**:
   - Buka DevTools → Network tab
   - Ketik "konser" dengan cepat di search bar
   - Seharusnya hanya 1 request setelah berhenti 400ms
4. **Filter Category**: Klik category "MUSIC", events harus terfilter
5. **Filter Free**: Centang "Gratis saja", hanya event dengan price=0 yang tampil

### B. Event Detail & Checkout

**Test Steps:**
1. Klik event card → masuk ke `/events/1`
2. **Cek Data Event**:
   - Title, description, location tampil
   - Available seats: sesuai database
   - Price: format Rupiah
   - Voucher tersedia: tampil di sidebar
   - Reviews: bintang 1-5, komentar
3. **Klik Beli Tiket** → masuk ke `/checkout/1`
4. **Test Perhitungan**:
   - Tiket 2 x Rp150.000 = Rp300.000
   - Masukkan voucher DISCOUNT20 → diskon Rp60.000
   - Masukkan poin 10.000 → potong Rp10.000
   - Total = Rp230.000
5. **Klik Bayar** → redirect ke `/transactions/1`

### C. Transaction Detail & Payment Proof

**Test Steps:**
1. Lihat status: "Menunggu Pembayaran"
2. **Timer Countdown**: Lihat "Sisa Waktu Pembayaran" (countdown 2 jam)
3. **Upload Bukti**:
   - Klik "Unggah Bukti Pembayaran"
   - Pilih file (simulasi Cloudinary URL)
   - Status berubah ke "Menunggu Konfirmasi"
4. **Test Cancel**:
   - Klik "Batalkan Transaksi"
   - Confirm dialog
   - Status berubah ke "Dibatalkan"
   - Cek database: kursi & poin restored

### D. My Transactions & Review

**Test Steps:**
1. Buka `/my-transactions`
2. **Filter Status**: Klik filter "Selesai", hanya DONE yang tampil
3. **Review Button**:
   - Cari transaction dengan status DONE dan event sudah lewat
   - Klik "Bisa diulas" → masuk ke `/review/1`
4. **Rating Stars**:
   - Hover bintang: highlight
   - Klik bintang 4: set rating = 4
   - Tulis komentar
   - Submit
5. **Verify**: Kembali ke transaction detail, review tampil

---

## IV. AUTOMATED TESTING SCRIPT

Buat file `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3001/api"

echo "=== EVENT MANAGEMENT API TESTS ==="

# 1. Test Public Events
echo -e "\n[TEST 1] Get Public Events"
curl -s "$BASE_URL/events" | jq '.success'

# 2. Test Search
echo -e "\n[TEST 2] Search Events"
curl -s "$BASE_URL/events?search=test" | jq '.data | length'

# 3. Test Categories
echo -e "\n[TEST 3] Get Categories"
curl -s "$BASE_URL/categories" | jq '.data | length'

# 4. Test Organizer Profile (Public)
echo -e "\n[TEST 4] Get Organizer Profile"
curl -s "$BASE_URL/organizers/1" | jq '.success'

echo -e "\n=== TESTS COMPLETE ==="
```

Jalankan:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## V. TROUBLESHOOTING

### Issue 1: "Cannot find module"
```bash
cd src/api
npm install
cd ../web
npm install
```

### Issue 2: Database connection error
```bash
# Cek .env
# Pastikan DATABASE_URL format benar:
# postgresql://user:password@host:port/database
```

### Issue 3: Rollback tidak berjalan
```sql
-- Cek apakah transaction dalam $transaction block
-- Cek error log:
SELECT * FROM logs WHERE level = 'ERROR' ORDER BY created_at DESC;
```

### Issue 4: Cron job tidak jalan
```bash
# Cek server console, harus ada log:
# "[CRON] Scheduler initialized successfully"
# "[CRON] Checking for expired transactions..."
```

---

## VI. CHECKLIST TESTING (Untuk Simon)

### ✅ NOMOR 1: Event Discovery
- [ ] Landing page fetch events
- [ ] Search dengan debounce 400ms
- [ ] Filter by category
- [ ] Filter by location
- [ ] Responsive grid layout

### ✅ NOMOR 1: Event Creation
- [ ] Organizer create event
- [ ] Cloudinary image upload
- [ ] Zod validation (title, seats, dates)

### ✅ NOMOR 1: Pricing & Promotions
- [ ] Create voucher (discount %, quota, expiry)
- [ ] Apply voucher saat checkout
- [ ] Voucher validation (quota, expiry)

### ✅ NOMOR 2: Purchasing & Points
- [ ] Checkout dengan poin (1 poin = Rp 1)
- [ ] Calculate: total = subtotal - points - voucher
- [ ] Check available_seats sebelum transaksi

### ✅ NOMOR 2: Transaction Statuses
- [ ] Status: WAITING_PAYMENT → WAITING_CONFIRMATION → DONE
- [ ] Upload payment proof (Cloudinary)
- [ ] Timer 2 jam untuk upload

### ✅ NOMOR 2: Automatic Status Changes
- [ ] Auto EXPIRED setelah 2 jam (cron job)
- [ ] Auto CANCELED setelah 3 hari (organizer tidak konfirmasi)

### ✅ NOMOR 2: Rollback (KRITIS!)
- [ ] **Reject**: kursi kembali ✅
- [ ] **Reject**: poin kembali ✅
- [ ] **Reject**: voucher usedCount berkurang ✅
- [ ] **Cancel**: sama seperti reject ✅
- [ ] **Expired**: sama seperti reject ✅
- [ ] **Point refund record** masuk ke tabel points ✅

### ✅ NOMOR 3: Reviews
- [ ] Review hanya jika DONE & event selesai
- [ ] Rating 1-5 bintang
- [ ] Komentar opsional
- [ ] Organizer profile: avgRating & totalReviews

---

**CATATAN PENTING UNTUK SIMON:**

> Pastikan logika **Rollback** pada Nomor 2-D diuji dengan teliti menggunakan `prisma.$transaction` agar tidak ada kursi atau poin yang "nyangkut" saat transaksi gagal.

Jika ada kursi/poin yang "nyangkut" (tidak kembali saat rollback):
1. Cek log error di server console
2. Verifikasi semua query dalam `$transaction` block
3. Pastikan tidak ada query yang diluar transaction block
4. Test dengan skenario: create transaction → cancel/reject/expire → verify data konsisten
