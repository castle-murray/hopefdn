-- Legacy Collection demo shop: products, inventory, and orders.
-- Payment is simulated — no real card processing.

create table if not exists products (
  id text primary key,
  slug text not null,
  name text not null,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  image_url text not null default '/images/legacy-tumbler.jpg',
  category text not null default 'merchandise',
  -- active products appear in the storefront
  is_active boolean not null default true,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  low_stock_threshold integer not null default 5,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_slug_uidx on products (slug);
create index if not exists products_active_sort_idx
  on products (is_active, sort_order, name)
  where is_active = true;

create table if not exists orders (
  id text primary key,
  order_number text not null,
  -- Customer (demo checkout — no login required)
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  -- Shipping address
  ship_line1 text not null,
  ship_line2 text not null default '',
  ship_city text not null,
  ship_state text not null,
  ship_postal text not null,
  ship_country text not null default 'US',
  -- Money
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  -- Demo payment (never store full PAN)
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text not null default 'card',
  card_brand text not null default 'Demo',
  card_last4 text not null default '0000',
  -- Fulfillment
  packing_status text not null default 'unfulfilled'
    check (packing_status in ('unfulfilled', 'packing', 'packed')),
  shipping_status text not null default 'not_shipped'
    check (shipping_status in ('not_shipped', 'shipped', 'delivered')),
  tracking_number text,
  carrier text,
  notes text not null default '',
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists orders_order_number_uidx on orders (order_number);
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_payment_status_idx on orders (payment_status);
create index if not exists orders_shipping_status_idx on orders (shipping_status);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders (id) on delete cascade,
  product_id text references products (id) on delete set null,
  product_name text not null,
  product_sku text not null default '',
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create index if not exists order_items_order_id_idx on order_items (order_id);

-- ── Seed products ────────────────────────────────────────────────────────────
insert into products (
  id, slug, name, description, price_cents, image_url, category,
  is_active, stock_qty, sort_order
) values
  (
    'prod-tumbler',
    'legacy-tumbler',
    'Legacy Tumbler',
    'Insulated gold-finish tumbler embossed with the H.O.P.E. Legacy mark. Every purchase fuels guest services.',
    2800,
    '/images/product-legacy-tumbler.jpg',
    'drinkware',
    true,
    48,
    10
  ),
  (
    'prod-polo',
    'mission-polo',
    'Mission Polo',
    'Navy performance polo with gold heart emblem—the same look our volunteers wear in the field.',
    3500,
    '/images/product-mission-polo.jpg',
    'apparel',
    true,
    32,
    20
  ),
  (
    'prod-tee',
    'legacy-tee',
    'Legacy Tee',
    'Soft cotton tee with Together, We Build Legacy. Everyday wear that starts conversations.',
    2200,
    '/images/product-legacy-tee.jpg',
    'apparel',
    true,
    60,
    30
  ),
  (
    'prod-hoodie',
    'hope-hoodie',
    'HOPE Hoodie',
    'Cozy midweight hoodie with embroidered gold mark. Perfect for cool coastal mornings.',
    4500,
    '/images/product-hope-hoodie.jpg',
    'apparel',
    true,
    18,
    40
  ),
  (
    'prod-cap',
    'legacy-cap',
    'Legacy Cap',
    'Structured navy cap with gold stitched logo. One size, adjustable.',
    1800,
    '/images/product-legacy-cap.jpg',
    'accessories',
    true,
    40,
    50
  ),
  (
    'prod-tote',
    'hope-tote',
    'Market Tote',
    'Heavy canvas tote for market runs and meal service. Proceeds support guest resources.',
    1600,
    '/images/product-hope-tote.jpg',
    'accessories',
    true,
    55,
    60
  ),
  (
    'prod-sticker',
    'legacy-sticker-pack',
    'Sticker Pack',
    'Set of 5 vinyl stickers featuring mission marks and anniversary art.',
    800,
    '/images/product-sticker-pack.jpg',
    'accessories',
    true,
    120,
    70
  ),
  (
    'prod-circle-tee',
    'hope-circle-tee',
    'Classic HOPE Tee',
    'Navy soft cotton tee with the gold circular H.O.P.E. Foundation badge—hands, cross, and wordmark as worn in the field.',
    2400,
    '/images/product-hope-circle-tee.jpg',
    'apparel',
    true,
    40,
    25
  ),
  (
    'prod-retired',
    'retired-patch',
    'Founders Patch (Archived)',
    'Limited patch from year one — kept for inventory demo; not listed in storefront.',
    1200,
    '/images/product-founders-patch.jpg',
    'accessories',
    false,
    0,
    999
  )
on conflict (id) do nothing;

-- ── Seed demo orders in various fulfillment states ───────────────────────────
insert into orders (
  id, order_number, customer_name, customer_email, customer_phone,
  ship_line1, ship_line2, ship_city, ship_state, ship_postal, ship_country,
  subtotal_cents, shipping_cents, total_cents,
  payment_status, payment_method, card_brand, card_last4,
  packing_status, shipping_status, tracking_number, carrier, notes, is_demo,
  created_at
) values
  (
    'ord-demo-1', 'HOPE-1001',
    'Jordan Lee', 'jordan.lee@example.com', '757-555-0142',
    '412 Ocean View Ave', '', 'Norfolk', 'VA', '23503', 'US',
    6300, 599, 6899,
    'paid', 'card', 'Visa', '4242',
    'unfulfilled', 'not_shipped', null, null,
    'Demo: paid, awaiting pack', true,
    now() - interval '2 days'
  ),
  (
    'ord-demo-2', 'HOPE-1002',
    'Avery Morgan', 'avery.m@example.com', '757-555-0198',
    '88 Shore Dr', 'Apt 3B', 'Virginia Beach', 'VA', '23451', 'US',
    4500, 599, 5099,
    'paid', 'card', 'Mastercard', '5555',
    'packing', 'not_shipped', null, null,
    'Demo: currently packing', true,
    now() - interval '1 day'
  ),
  (
    'ord-demo-3', 'HOPE-1003',
    'Sam Rivera', 'sam.r@example.com', '757-555-0110',
    '210 Granby St', '', 'Norfolk', 'VA', '23510', 'US',
    5000, 0, 5000,
    'paid', 'card', 'Amex', '0005',
    'packed', 'shipped', '1Z999AA10123456784', 'UPS',
    'Demo: shipped with tracking', true,
    now() - interval '5 days'
  ),
  (
    'ord-demo-4', 'HOPE-1004',
    'Casey Brooks', 'casey.b@example.com', '804-555-0177',
    '15 Monument Ave', '', 'Richmond', 'VA', '23220', 'US',
    2800, 599, 3399,
    'paid', 'card', 'Visa', '1881',
    'packed', 'delivered', '9400111899562537875123', 'USPS',
    'Demo: delivered', true,
    now() - interval '12 days'
  ),
  (
    'ord-demo-5', 'HOPE-1005',
    'Riley Chen', 'riley.c@example.com', '757-555-0133',
    '900 Independence Blvd', '', 'Virginia Beach', 'VA', '23455', 'US',
    800, 599, 1399,
    'pending', 'card', 'Demo', '0000',
    'unfulfilled', 'not_shipped', null, null,
    'Demo: payment still pending', true,
    now() - interval '3 hours'
  ),
  (
    'ord-demo-6', 'HOPE-1006',
    'Taylor Quinn', 'taylor.q@example.com', '757-555-0166',
    '44 High St', '', 'Portsmouth', 'VA', '23704', 'US',
    5700, 599, 6299,
    'refunded', 'card', 'Visa', '9012',
    'unfulfilled', 'not_shipped', null, null,
    'Demo: refunded order', true,
    now() - interval '8 days'
  )
on conflict (id) do nothing;

insert into order_items (id, order_id, product_id, product_name, product_sku, unit_price_cents, quantity, line_total_cents) values
  ('oi-1a', 'ord-demo-1', 'prod-tumbler', 'Legacy Tumbler', 'legacy-tumbler', 2800, 1, 2800),
  ('oi-1b', 'ord-demo-1', 'prod-polo', 'Mission Polo', 'mission-polo', 3500, 1, 3500),
  ('oi-2a', 'ord-demo-2', 'prod-hoodie', 'HOPE Hoodie', 'hope-hoodie', 4500, 1, 4500),
  ('oi-3a', 'ord-demo-3', 'prod-tee', 'Legacy Tee', 'legacy-tee', 2200, 1, 2200),
  ('oi-3b', 'ord-demo-3', 'prod-tumbler', 'Legacy Tumbler', 'legacy-tumbler', 2800, 1, 2800),
  ('oi-4a', 'ord-demo-4', 'prod-tumbler', 'Legacy Tumbler', 'legacy-tumbler', 2800, 1, 2800),
  ('oi-5a', 'ord-demo-5', 'prod-sticker', 'Sticker Pack', 'legacy-sticker-pack', 800, 1, 800),
  ('oi-6a', 'ord-demo-6', 'prod-polo', 'Mission Polo', 'mission-polo', 3500, 1, 3500),
  ('oi-6b', 'ord-demo-6', 'prod-tee', 'Legacy Tee', 'legacy-tee', 2200, 1, 2200)
on conflict (id) do nothing;
