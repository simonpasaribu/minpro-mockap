# Event Management Platform

Platform manajemen event dengan fitur autentikasi, referral system, dan role-based access control.

## Feature 2 - Nomor 1: User Authentication and Authorization

### Poin yang Dikerjakan

#### ✅ Poin A: Account Creation
- Registration dengan password hashing menggunakan Bcrypt
- Validasi email unik
- Simpan data user ke PostgreSQL

#### ✅ Poin B: Roles (Customer & Organizer)
- Enum Role: `CUSTOMER` dan `ORGANIZER`
- Default role untuk user baru adalah `CUSTOMER`

#### ✅ Poin C: Referral Registration & Generation
- Generate unique referral code saat registrasi (format: `XX######`)
- Validasi referral code saat registrasi
- SQL Transaction untuk menghindari race condition

#### ✅ Poin D: Role-Based Access Control
- Middleware JWT untuk autentikasi (`authenticateToken`)
- Middleware role-based (`authorizeRoles`, `isOrganizer`, `isCustomer`)
- Protected routes untuk endpoint yang memerlukan autentikasi

## Project Structure

```
.
├── package.json                    # Root package.json (workspaces)
├── src/
│   ├── api/                        # Backend API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   └── prisma.config.ts    # Prisma v7 config
│   │   └── src/
│   │       ├── server.ts           # Entry point
│   │       ├── controllers/
│   │       │   └── auth.controller.ts
│   │       ├── middleware/
│   │       │   └── auth.middleware.ts
│   │       ├── routes/
│   │       │   ├── index.ts
│   │       │   └── auth.routes.ts
│   │       ├── services/
│   │       │   └── auth.service.ts
│   │       ├── types/
│   │       │   └── index.ts
│   │       └── utils/
│   │           ├── prisma.ts
│   │           ├── jwt.ts
│   │           ├── validation.ts
│   │           └── referral.ts
│   └── web/                        # Frontend React (belum dibuat)
└── Issue.md                        # GitHub Issue #1
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd "d:\PROJECT PD BOOTCAMP\mini-project\tes-lagi"
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan:

```bash
cd src/api
copy .env.example .env
```

Edit file `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/event_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 4. Start Development Server

```bash
# Start backend only
npm run dev:api

# Atau start semua (backend + frontend)
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/validate-referral` | Validate referral code | No |
| GET | `/api/auth/profile` | Get current user profile | Yes |

### Request/Response Examples

#### Register User

**Request:**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "referralCode": "JD1A2B3C"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "referralCode": "JD4X5Y6Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login User

**Request:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Get Profile (Protected)

**Request:**
```
GET /api/auth/profile
Authorization: Bearer <token>
```

## Database Schema

### Models

- **User**: Data user dengan role (CUSTOMER/ORGANIZER)
- **Point**: Sistem poin dengan expiry date
- **Coupon**: Kupon diskon dengan expiry date
- **Event**: Data event yang dibuat organizer
- **Transaction**: Data transaksi tiket event

### Referral System

1. Saat registrasi dengan referral code:
   - User baru mendapat 1 kupon diskon 10%
   - Pemilik referral code mendapat 10,000 poin

2. Semua reward memiliki expiry 3 bulan

3. Menggunakan `prisma.$transaction` untuk atomicity

## Tech Stack

- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma v7
- **Authentication**: JWT, Bcrypt
- **Validation**: Zod

## Next Steps

Untuk Feature 2 - Nomor 2 (Referral System, Profile, and Prizes):
1. Implementasi Profile Management API
2. Password Reset dengan email/token
3. Update profile dengan Cloudinary

Untuk Feature 2 - Nomor 3 (Event Management Dashboard):
1. Event CRUD API (Organizer only)
2. Transaction management
3. Statistics visualization
