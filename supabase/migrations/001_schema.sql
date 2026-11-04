-- ============================================================================
-- JK Store — initial schema (PostgreSQL / Supabase)
-- Run in Supabase SQL Editor or via `supabase db push`.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: is the current JWT user an admin?
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- branding_settings (single-row table driving the whole site's identity)
-- ---------------------------------------------------------------------------
create table if not exists public.branding_settings (
  id                uuid primary key default gen_random_uuid(),
  store_name        text not null default 'JK Store',
  owner_name        text not null default 'Jahanzaib Khan',
  tagline           text not null default 'Premium Cosmetics & Beauty',
  logo_url          text,
  mobile_logo_url   text,
  favicon_url       text,
  primary_color     text not null default '#C9A227',   -- champagne gold
  secondary_color   text not null default '#111111',   -- black
  background_color  text not null default '#FFFFFF',   -- white
  font_display      text not null default 'Playfair Display',
  font_body         text not null default 'Inter',
  business_category text not null default 'Cosmetics & Beauty',
  contact_email     text,
  contact_address   text,
  seo_title         text,
  seo_description   text,
  seo_keywords      text,
  social_facebook   text,
  social_instagram  text,
  social_tiktok     text,
  social_whatsapp   text,
  updated_at        timestamptz not null default now(),
  updated_by        uuid
);
alter table public.branding_settings enable row level security;
create policy "branding is publicly readable"
  on public.branding_settings for select using (true);
create policy "admins manage branding"
  on public.branding_settings for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- store_settings (commerce behaviour: delivery fee, free-delivery threshold,
--                    currency, notification email, maintenance mode)
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  id                        uuid primary key default gen_random_uuid(),
  currency_code             text not null default 'PKR',
  currency_symbol           text not null default 'Rs.',
  delivery_charge           numeric(10,2) not null default 200,
  free_delivery_threshold   numeric(10,2),                  -- null = never free
  min_order_amount          numeric(10,2) not null default 0,
  notify_email              text not null default 'admin@example.com',
  order_prefix              text not null default 'JK',
  maintenance_mode          boolean not null default false,
  updated_at                timestamptz not null default now()
);
alter table public.store_settings enable row level security;
create policy "store settings publicly readable"
  on public.store_settings for select using (true);
create policy "admins manage store settings"
  on public.store_settings for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- contact_settings (phones / whatsapp numbers shown as order buttons)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_settings (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('phone','whatsapp')),
  label         text not null,
  number        text not null,               -- E.164-ish, e.g. +923001234567
  is_primary    boolean not null default false,
  is_enabled    boolean not null default true,
  button_label  text,                        -- custom CTA label
  show_on       text[] not null default array['product','cart','checkout','floating'],
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
alter table public.contact_settings enable row level security;
create policy "contacts publicly readable"
  on public.contact_settings for select using (true);
create policy "admins manage contacts"
  on public.contact_settings for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- admin_users (linked to Supabase auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  full_name  text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create policy "admins read admin list"
  on public.admin_users for select using (public.is_admin());
create policy "admins manage admins"
  on public.admin_users for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories & products
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "categories publicly readable"
  on public.categories for select using (true);
create policy "admins manage categories"
  on public.categories for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  short_description text,
  specifications jsonb not null default '{}'::jsonb,   -- key/value specs
  images        text[] not null default '{}',
  category_id   uuid references public.categories(id) on delete set null,
  original_price numeric(10,2) not null default 0,     -- MRP, crossed out
  selling_price  numeric(10,2),                        -- optional manual override
  discount_type  text check (discount_type in ('percent','fixed')),
  discount_value numeric(10,2),
  discount_active boolean not null default false,
  discount_start timestamptz,
  discount_end   timestamptz,
  stock          int not null default 0,
  sku            text,
  tags           text[] not null default '{}',
  is_published   boolean not null default true,
  is_featured    boolean not null default false,
  rating         numeric(2,1) not null default 0,
  reviews_count  int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_published_idx on public.products(is_published, is_featured);
alter table public.products enable row level security;
create policy "published products publicly readable"
  on public.products for select using (is_published = true or public.is_admin());
create policy "admins manage products"
  on public.products for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- customers (guest checkout — no auth account required)
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  phone        text not null,
  email        text,
  city         text,
  address      text,
  total_orders int not null default 0,
  total_spent  numeric(12,2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists customers_phone_idx on public.customers(phone);
alter table public.customers enable row level security;
create policy "admins read customers"
  on public.customers for select using (public.is_admin());
create policy "admins manage customers"
  on public.customers for all using (public.is_admin()) with check (public.is_admin());
-- server-side insert/update happens via service role in /api functions.

-- ---------------------------------------------------------------------------
-- orders & order_items (prices snapshotted at purchase time)
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,        -- human-friendly unique ID e.g. JK-20261104-AB12CD
  client_order_id  text not null unique,        -- idempotency key from the browser
  customer_id      uuid references public.customers(id) on delete set null,
  full_name        text not null,
  phone            text not null,
  email            text,
  city             text,
  address          text not null,
  instructions     text,
  source           text not null default 'website' check (source in ('website','phone','whatsapp','admin')),
  status           text not null default 'Pending'
                   check (status in ('Pending','Confirmed','Processing','Shipped','Out for Delivery','Delivered','Cancelled')),
  payment_method   text not null default 'COD',
  subtotal         numeric(12,2) not null default 0,
  discount_total   numeric(12,2) not null default 0,
  delivery_charge  numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  internal_notes   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_phone_idx on public.orders(phone);
alter table public.orders enable row level security;
create policy "admins read orders"
  on public.orders for select using (public.is_admin());
create policy "admins manage orders"
  on public.orders for all using (public.is_admin()) with check (public.is_admin());
-- NOTE: no public insert policy — orders are created ONLY through the
-- serverless /api/checkout function using the service role key.

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  product_id     uuid references public.products(id) on delete set null,
  product_name   text not null,                  -- snapshot
  product_image  text,
  quantity       int not null check (quantity > 0),
  unit_price     numeric(12,2) not null,         -- FINAL price per unit at order time
  original_unit  numeric(12,2),                  -- MRP at order time (for history)
  discount_unit  numeric(12,2) not null default 0,
  line_total     numeric(12,2) not null
);
create index if not exists order_items_order_idx on public.order_items(order_id);
alter table public.order_items enable row level security;
create policy "admins read order items"
  on public.order_items for select using (public.is_admin());
create policy "admins manage order items"
  on public.order_items for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_status_history (timestamped audit trail)
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     text not null,
  note       text,
  changed_by uuid,                              -- admin user id (null = system)
  created_at timestamptz not null default now()
);
create index if not exists osh_order_idx on public.order_status_history(order_id, created_at);
alter table public.order_status_history enable row level security;
create policy "admins read status history"
  on public.order_status_history for select using (public.is_admin());
create policy "admins manage status history"
  on public.order_status_history for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- email_notifications (delivery log + retry support)
-- ---------------------------------------------------------------------------
create table if not exists public.email_notifications (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references public.orders(id) on delete cascade,
  kind         text not null check (kind in ('admin_new_order','customer_confirmation','retry')),
  recipient    text not null,
  status       text not null default 'pending' check (status in ('pending','sent','failed')),
  provider_id  text,                            -- Resend message id
  error        text,
  attempts     int not null default 0,
  last_attempt timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists email_order_idx on public.email_notifications(order_id);
alter table public.email_notifications enable row level security;
create policy "admins read email log"
  on public.email_notifications for select using (public.is_admin());
create policy "admins manage email log"
  on public.email_notifications for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_customers_updated on public.customers;
create trigger trg_customers_updated before update on public.customers
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_branding_updated on public.branding_settings;
create trigger trg_branding_updated before update on public.branding_settings
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_store_updated on public.store_settings;
create trigger trg_store_updated before update on public.store_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RPC: public order tracking (order number + phone). Returns only that order.
-- SECURITY DEFINER but filters strictly on order_number + phone match.
-- ---------------------------------------------------------------------------
create or replace function public.track_order(p_order_number text, p_phone text)
returns table (
  order_number text, status text, source text, payment_method text,
  full_name text, city text, subtotal numeric, discount_total numeric,
  delivery_charge numeric, total numeric, created_at timestamptz,
  items jsonb, history jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select o.order_number, o.status, o.source, o.payment_method,
         o.full_name, o.city, o.subtotal, o.discount_total,
         o.delivery_charge, o.total, o.created_at,
         (select coalesce(jsonb_agg(jsonb_build_object(
            'product_name', i.product_name, 'quantity', i.quantity,
            'unit_price', i.unit_price, 'line_total', i.line_total, 'image', i.product_image
          ) order by i.product_name), '[]'::jsonb)
          from public.order_items i where i.order_id = o.id) as items,
         (select coalesce(jsonb_agg(jsonb_build_object(
            'status', h.status, 'note', h.note, 'created_at', h.created_at
          ) order by h.created_at), '[]'::jsonb)
          from public.order_status_history h where h.order_id = o.id) as history
  from public.orders o
  where o.order_number = p_order_number
    and o.phone = p_phone;
$$;
revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;
