# WaResto — Sistem Manajemen Restoran

Aplikasi manajemen restoran full-stack dengan fitur pemesanan pelanggan, dashboard kasir, dan panel admin.

## Tech Stack

| Layer    | Teknologi                                      |
| -------- | ---------------------------------------------- |
| Frontend | React + Vite + TypeScript                      |
| Backend  | Express + TypeScript                           |
| Database | PostgreSQL + Drizzle ORM                       |
| Auth     | better-auth (email & password, session-based)  |

## Struktur Folder

```
ayamlumionn/
├── waresto-frontend/   # React SPA (Vite)
├── waresto-backend/    # Express API server
├── PRD/                # Product requirement docs
└── asset/              # Asset gambar
```

## Setup

### 1. Clone & Konfigurasi Environment

```bash
# Copy file environment backend
cp waresto-backend/.env.example waresto-backend/.env
```

Buka `waresto-backend/.env` dan isi semua value-nya:

| Variable             | Keterangan                                     |
| -------------------- | ---------------------------------------------- |
| `PORT`               | Port backend (default: `3001`)                 |
| `DATABASE_URL`       | Connection string PostgreSQL                   |
| `BETTER_AUTH_SECRET`  | Random string minimal 32 karakter untuk auth   |
| `BETTER_AUTH_URL`    | Base URL backend (default: `http://localhost:3001`) |
| `NODE_ENV`           | `development` / `production`                   |

> [!CAUTION]
> **File `.env` tidak boleh di-commit ke Git!** File ini sudah ditambahkan ke `.gitignore`.
> Jika `.env` sudah terlanjur ter-commit sebelumnya, jalankan:
> ```bash
> cd waresto-backend
> git rm --cached .env
> git commit -m "chore: remove tracked .env"
> ```

### 2. Install Dependencies

```bash
# Backend
cd waresto-backend
npm install

# Frontend
cd ../waresto-frontend
npm install
```

### 3. Setup Database

```bash
cd waresto-backend

# Push schema ke database
npm run db:push

# Seed data awal (user admin, kategori, dll)
npm run db:seed
```

### 4. Jalankan Aplikasi

Buka **dua terminal** terpisah:

```bash
# Terminal 1 — Backend
cd waresto-backend
npm run dev
```

```bash
# Terminal 2 — Frontend
cd waresto-frontend
npm run dev
```

Backend berjalan di `http://localhost:3001`, frontend di `http://localhost:5173`.

## API Security

Semua endpoint mutasi (POST, PATCH, DELETE) dilindungi oleh middleware `requireAuth` yang memvalidasi session via better-auth. Endpoint GET publik (menu, kategori, meja) tetap terbuka untuk akses pelanggan.

## Scripts

### Backend (`waresto-backend/`)

| Script          | Perintah                | Fungsi                        |
| --------------- | ----------------------- | ----------------------------- |
| `dev`           | `npm run dev`           | Jalankan server development   |
| `build`         | `npm run build`         | Compile TypeScript            |
| `start`         | `npm run start`         | Jalankan production build     |
| `db:generate`   | `npm run db:generate`   | Generate migrasi Drizzle      |
| `db:push`       | `npm run db:push`       | Push schema ke database       |
| `db:seed`       | `npm run db:seed`       | Seed data awal                |
