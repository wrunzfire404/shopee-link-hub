# Shopee Link Hub

Custom affiliate link page — replace Linktree with full control.  
Deploy ke Vercel (free), manage link dari admin panel.

## Features

- 🔗 Public link page (audience akses dari bio)
- 🔢 Numbering system (produk nomer 1, 2, 3...)
- 📊 Click tracking per link
- ⚡ Admin panel (tambah/edit/hapus/reorder link)
- 🔐 Login system (password protected)
- 📱 Mobile-first design
- 🚀 Deploy di Vercel (free tier)

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Open
# Public page: http://localhost:3000
# Admin panel: http://localhost:3000/admin
# Login: admin / admin123
```

## Deploy ke Vercel

1. Push repo ke GitHub
2. Ke vercel.com → Import project
3. Set environment variables:
   - `ADMIN_USERNAME` = username lo
   - `ADMIN_PASSWORD` = password lo
   - `ADMIN_SECRET` = random string panjang
   - `NEXT_PUBLIC_SITE_NAME` = nama toko lo
   - `NEXT_PUBLIC_SITE_DESCRIPTION` = deskripsi
4. Deploy!

## Penting untuk Vercel

Karena data disimpan di file JSON, di Vercel (serverless) file system bersifat read-only.  
Untuk production, upgrade ke salah satu:

- **Vercel KV** (free 256MB) — tinggal ganti storage.ts
- **Supabase** (free tier) — PostgreSQL
- **Upstash Redis** (free tier)

Untuk testing & demo, JSON file works fine secara lokal.

## Cara Pakai

### Di Video TikTok/IG:
Caption: "Produk nomer 3, link di bio 👆"

### Di Bio:
Paste URL vercel lo: `https://yoursite.vercel.app`

### Manage Links:
Buka `/admin` → Login → Tambah/edit/hapus link

## Struktur

```
src/
├── app/
│   ├── page.tsx            → Public link page
│   ├── admin/
│   │   ├── page.tsx        → Admin dashboard
│   │   └── login/page.tsx  → Login page
│   └── api/
│       ├── links/          → CRUD links
│       ├── auth/           → Login/logout
│       └── config/         → Site settings
├── components/
│   └── LinkCard.tsx        → Link card component
├── lib/
│   ├── types.ts            → TypeScript types
│   ├── storage.ts          → Data layer (JSON file)
│   └── auth.ts             → Authentication
data/
└── links.json              → Link data
```

## Custom Domain

1. Beli domain murah (Rp 100-150k/tahun)
2. Di Vercel → Settings → Domains → Add
3. Point DNS ke Vercel
4. Done!
