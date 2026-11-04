# JK Store — Premium Cosmetics E-Commerce

A complete, production-ready e-commerce storefront for cosmetics & beauty products, owned by **Jahanzaib Khan**.
Built with **React + Vite + TypeScript + Tailwind CSS**, **Supabase** (PostgreSQL, Auth, Storage), **Resend** (email), and deployable to **Vercel** in minutes.

> **Dynamic branding:** the store name, owner, logo, favicon, colors, fonts, tagline, contact details, social links and SEO are all editable from **/admin → Settings → Branding** and propagate instantly to the website, admin UI, emails and browser metadata — no code edits or redeploys.

---

## Features

### Storefront
- Premium minimalist design (white / champagne gold / black), fully responsive
- Homepage with animated hero, featured products, sale promo
- Shop with live search, category filters, sale filter and sorting
- Product pages with image galleries, specifications, discount badges, crossed-out MRP
- Cart with quantity controls and automatic totals
- **Guest checkout** (no registration): name, mobile, optional email, city, address, instructions — Cash on Delivery
- Order tracking by Order ID + phone number (privacy-safe)
- About, Contact, Track pages; responsive nav + footer
- Floating & contextual **Call to Order** (`tel:`) and **WhatsApp order** buttons (prefilled message with product, price, qty, link); desktop shows number with copy button
- Framer Motion animations, Lucide icons

### Admin (`/admin`, Supabase Auth + `admin_users` check)
- Dashboard: revenue, order counts by status, 14-day revenue chart, recent orders
- Products: add/edit/delete, image upload (Supabase Storage), categories, stock, variants via specs, MRP, custom selling price, **% or fixed discounts**, **scheduled sales**, publish/unpublish
- Orders: full detail with price snapshots, status workflow (Pending → Confirmed → Processing → Shipped → Out for Delivery → Delivered / Cancelled), timestamped status history, internal notes, search/filter, **CSV export**, record phone/WhatsApp orders manually
- Customers: contact info, order history, counts, total spend
- Settings: **Branding** (all identity fields), **Store & Email** (delivery fee, free-delivery threshold, notification email), **Phones & WhatsApp** (multiple numbers, primary, enable/disable, button labels, placement)

### Backend / Security
- All prices computed **server-side** in `/api/checkout` (never trusts the client)
- Unique order IDs + `client_order_id` idempotency (no duplicate orders on refresh/retry)
- PostgreSQL tables: `products, categories, orders, order_items, customers, admin_users, branding_settings, store_settings, contact_settings, order_status_history, email_notifications`
- UUIDs, FK relationships, timestamps, indexes, constraints, **Supabase RLS** everywhere
- Historical prices snapshotted into `order_items`
- Service-role & Resend keys exist **only** in Vercel serverless functions — never in the client bundle
- Resend emails on every order → admin (configurable) + customer confirmation; failures logged in `email_notifications` with retry API

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router, Framer Motion, Lucide |
| Backend | Supabase (PostgreSQL + RLS + Auth + Storage) + Vercel Serverless Functions (`/api/*`) |
| Email | Resend |
| Hosting | Vercel (free tier) |

---

## Quick start

```bash
# 1. Clone & install
git clone <your-github-repo> jk-store && cd jk-store
npm install

# 2. Environment
cp .env.example .env.local
# fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (safe for browser)
# and SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY / RESEND_FROM_EMAIL (server-only)

# 3. Database
# Open Supabase → SQL Editor and run, in order:
#   supabase/migrations/001_schema.sql
#   supabase/seed.sql
# Create a public Storage bucket named "product-images" (Supabase → Storage → New bucket → public).

# 4. Create the first admin
# Supabase → Authentication → Users → Add user (email + password, confirmed).
# Then in SQL Editor:
#   insert into public.admin_users (id, email, full_name)
#   values ('<the-new-user-uuid-from-auth.users>', 'admin@example.com', 'Admin');

# 5. Run locally
npm run dev    # http://localhost:5173  (admin: http://localhost:5173/admin)
```

---

## Deployment

### 1. GitHub
```bash
git init && git add -A && git commit -m "JK Store initial commit"
git remote add origin https://github.com/<you>/jk-store.git
git push -u origin main
```

### 2. Supabase (free tier)
- Create project at [supabase.com](https://supabase.com) (free tier: 500 MB DB, 1 GB storage, 50k MAU — plenty to start).
- Run the SQL files above; create the `product-images` **public** bucket.
- Copy **Project URL** and **anon key** (Settings → API) → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Copy **service_role key** (Settings → API, keep secret!) → `SUPABASE_SERVICE_ROLE_KEY` in Vercel only.

### 3. Resend (free tier: 100 emails/day, 3,000/month)
- Sign up at [resend.com](https://resend.com), create an API key.
- Verify a sending domain (or use `onboarding@resend.dev` for testing).
- Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Vercel.

### 4. Vercel (free tier: 100 GB bandwidth, serverless functions)
```bash
npm i -g vercel
vercel          # link the repo, framework = Vite
```
Then in Vercel → Project → Settings → Environment Variables add **all** variables from `.env.example` (the `VITE_*` ones as-is; the rest are server-only). Redeploy. SPA routing is handled by `vercel.json` rewrites.

### Free-tier limitations to know
- **Supabase free**: pauses after 1 week of inactivity; 500 MB database; 2 GB bandwidth/mo.
- **Resend free**: 100 emails/day; must use verified domain for production volume.
- **Vercel free**: 100 GB bandwidth/mo, 12s max serverless execution (checkout is well under this), Hobby plan is non-commercial.

---

## Project structure

```
jk-store/
├── api/                     # Vercel serverless (service-role, Resend) — SECRET env only
│   ├── checkout.ts          # guest checkout, server-side pricing, idempotency, emails
│   ├── track.ts             # privacy-safe order tracking RPC
│   ├── retry-email.ts       # admin email retry
│   └── _shared.ts
├── supabase/
│   ├── migrations/001_schema.sql   # all tables, RLS, triggers, track_order RPC
│   └── seed.sql                    # branding + 3 Dr. Zain products (MRP Rs. 2,000)
├── public/products/         # product images extracted from your screenshots
└── src/
    ├── lib/                 # supabase client, types, branding context, cart context, formatters
    ├── components/          # Navbar, Footer, ProductCard, OrderButtons, FloatingOrderButtons
    ├── pages/               # Home, Shop, Product, Cart, Checkout, Track, About, Contact
    └── admin/               # login, layout, dashboard, products, orders, customers, settings
```

## Routine operations (no code needed)
Everything routine is done in `/admin`: change branding/colors/logo, add products & discounts, schedule sales, update statuses, manage phone/WhatsApp buttons, change the notification email, export orders to CSV.
