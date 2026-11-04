-- ============================================================================
-- JK Store — seed data
-- Products extracted from the provided Dr. Zain screenshots.
-- Each original (MRP) price is Rs. 2,000 as requested.
-- ============================================================================

-- Branding (initial identity — fully editable from /admin > Branding)
insert into public.branding_settings (
  store_name, owner_name, tagline, primary_color, secondary_color, background_color,
  font_display, font_body, business_category, contact_email, contact_address,
  seo_title, seo_description, seo_keywords
) values (
  'JK Store',
  'Jahanzaib Khan',
  'Premium Cosmetics & Beauty — Cash on Delivery across Pakistan',
  '#C9A227', '#111111', '#FFFFFF',
  'Playfair Display', 'Inter',
  'Cosmetics & Beauty',
  'support@jkstore.pk',
  'Lahore, Punjab, Pakistan',
  'JK Store — Premium Cosmetics & Beauty Products',
  'Shop premium herbal hair care and beauty products at JK Store. Cash on Delivery, fast delivery across Pakistan.',
  'cosmetics, beauty, hair care, herbal, shampoo, hair oil, Pakistan, cash on delivery'
) on conflict do nothing;

-- Store settings
insert into public.store_settings (
  currency_code, currency_symbol, delivery_charge, free_delivery_threshold,
  min_order_amount, notify_email, order_prefix
) values ('PKR', 'Rs.', 200, 5000, 0, 'admin@example.com', 'JK')
on conflict do nothing;

-- Contact / communication settings (editable in admin)
insert into public.contact_settings (kind, label, number, is_primary, is_enabled, button_label, show_on, sort_order)
values
  ('phone',    'Order Helpline',  '+923001234567', true,  true, 'Call to Order',  array['product','cart','checkout','floating'], 0),
  ('whatsapp', 'WhatsApp Orders', '+923001234567', true,  true, 'Order on WhatsApp', array['product','cart','checkout','floating'], 1)
on conflict do nothing;

-- Category
insert into public.categories (name, slug, description, sort_order)
values ('Hair Care', 'hair-care', 'Herbal hair care range — shampoos, oils and combo packs.', 0)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- The three products from the screenshots. Original price Rs. 2,000 each.
-- ---------------------------------------------------------------------------
with cat as (select id from public.categories where slug = 'hair-care' limit 1)
insert into public.products (
  name, slug, description, short_description, specifications, images, category_id,
  original_price, selling_price, discount_type, discount_value, discount_active,
  stock, sku, tags, is_published, is_featured, rating, reviews_count
)
select * from (values
  (
    'Dr. Zain Medicated Shampoo',
    'dr-zain-medicated-shampoo',
    E'Dr. Zain Medicated Shampoo — a 100% herbal medicated shampoo that cleanses & nourishes for healthier hair. Part of the Dr. Zain Hair Care Range: Healthy Hair | Stronger Roots | Natural Care. Promotes hair growth, reduces dandruff and nourishes scalp & roots with 72 natural herbal ingredients. Natural care for beautiful hair.',
    'Medicated herbal shampoo — cleanses & nourishes for healthier, dandruff-free hair.',
    '{"Brand":"Dr. Zain","Type":"Medicated Shampoo","Herbal Ingredients":"72","Benefits":"Promotes Hair Growth; Reduces Dandruff; Nourishes Scalp & Roots","Formula":"100% Herbal","Tagline":"Natural Care For Beautiful Hair","Range":"Healthy Hair | Stronger Roots | Natural Care"}',
    array['/products/shampoo.jpg','/products/combo-banner.jpg'],
    (select id from cat),
    2000.00, null, null, null, false,
    50, 'DZ-SHAMPOO-72', array['shampoo','hair-care','herbal','medicated','dandruff-free'],
    true, true, 4.9, 5500
  ),
  (
    'Dr. Zain Hair Oil 72',
    'dr-zain-hair-oil-72',
    E'Dr. Zain Hair Oil 72 — 100% herbal hair oil with 72 natural ingredients for long & nourished, dandruff-free hair. Promotes hair growth, reduces dandruff and nourishes scalp & roots. Nature''s care for stronger, healthier hair.',
    '100% herbal hair oil (72 herbs) for long, nourished, dandruff-free hair.',
    '{"Brand":"Dr. Zain","Type":"Hair Oil","Herbal Ingredients":"72","Benefits":"Promotes Hair Growth; Reduces Dandruff; Nourishes Scalp & Roots","Formula":"100% Herbal","Tagline":"For Long & Nourished Dandruff Free Hair","Range":"Nature''s Care for Stronger, Healthier Hair"}',
    array['/products/hair-oil.jpg','/products/hair-oil-box.jpg'],
    (select id from cat),
    2000.00, null, null, null, false,
    50, 'DZ-OIL-72', array['hair-oil','hair-care','herbal','dandruff-free','nourishing'],
    true, true, 4.9, 5500
  ),
  (
    'Dr. Zain Oil & Shampoo Combo Pack',
    'dr-zain-oil-shampoo-combo',
    E'Dr. Zain Oil & Shampoo Combo Pack — the complete Dr. Zain Hair Care Range in one pack: Medicated Shampoo + Hair Oil 72. 100% herbal, promotes hair growth, reduces dandruff and nourishes scalp & roots for long, nourished, dandruff-free hair. Healthy Hair | Stronger Roots | Natural Care. Trustscore 4.9 | 5,500+ reviews.',
    'Complete hair care combo — Medicated Shampoo + Hair Oil 72 in one pack.',
    '{"Brand":"Dr. Zain","Type":"Combo Pack (Shampoo + Hair Oil)","Contents":"Dr. Zain Medicated Shampoo + Dr. Zain Hair Oil 72","Herbal Ingredients":"72","Benefits":"Promotes Hair Growth; Reduces Dandruff; Nourishes Scalp & Roots","Formula":"100% Herbal","Trustscore":"4.9 | 5,500+ reviews"}',
    array['/products/combo-banner.jpg','/products/listing-shot.jpg','/products/shampoo.jpg','/products/hair-oil.jpg'],
    (select id from cat),
    2000.00, null, 'percent', 20.00, true,   -- Rs. 2,000 -> Rs. 1,600 (matches the SALE listing)
    30, 'DZ-COMBO-72', array['combo','hair-care','herbal','bestseller','sale'],
    true, true, 4.9, 5500
  )
) as v(name, slug, description, short_description, specifications, images, category_id,
       original_price, selling_price, discount_type, discount_value, discount_active,
       stock, sku, tags, is_published, is_featured, rating, reviews_count)
on conflict (slug) do nothing;
