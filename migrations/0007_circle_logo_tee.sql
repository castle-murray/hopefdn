-- Classic HOPE Tee featuring the circular gold badge from customer sample artwork.

insert into products (
  id, slug, name, description, price_cents, image_url, category,
  is_active, stock_qty, sort_order
) values (
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
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  image_url = excluded.image_url,
  category = excluded.category,
  is_active = excluded.is_active,
  stock_qty = excluded.stock_qty,
  sort_order = excluded.sort_order,
  updated_at = now();
