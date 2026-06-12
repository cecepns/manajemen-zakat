# Manajemen Zakat

Aplikasi fullstack untuk manajemen zakat multi-level (Admin/Bendahara & Amil).

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS + PWA
- **Backend:** Express.js + MySQL
- **Auth:** JWT

## Fitur

- Input pembayaran zakat (Fitrah Uang/Beras, Maal, Fidyah, Infaq)
- Auto hitung zakat fitrah & kembalian
- Cetak struk dengan QR Code validasi
- Lock data setelah cetak struk
- Setor saldo ke bendahara (verifikasi password)
- Dashboard & laporan Amil
- Dashboard admin dengan grafik
- Rekap seluruh amil
- Master harga beras
- Export PDF & Excel
- Audit log & backup database

## Setup

### 1. Database

```bash
mysql -u root -p < backend/sql/database.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Akun Demo

| Username   | Password | Role      |
|------------|----------|-----------|
| admin      | admin123 | ADMIN     |
| bendahara  | admin123 | BENDAHARA |
| nofrianto  | admin123 | AMIL      |
| doli       | admin123 | AMIL      |
| mahesadev  | admin123 | AMIL      |

## Struktur Project

```
zakat/
├── backend/
│   ├── server.js
│   ├── sql/database.sql
│   ├── uploads-zakat/
│   └── package.json
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── utils/
```
# manajemen-zakat
