-- Site-wide flags (key/value). shop_public controls storefront visibility.

create table if not exists site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Default: shop is public. Admins can toggle off from the admin panel.
insert into site_settings (key, value)
values ('shop_public', 'true')
on conflict (key) do nothing;
