-- Public event calendar + staff roles for multi-user management.
--
-- Performance notes (designed for thousands of rows):
-- - starts_at is timestamptz so range scans use indexes (never free-text dates).
-- - Partial index covers the public "published" calendar path only.
-- - Composite (starts_at, id) supports stable keyset (cursor) pagination.
-- - List APIs must filter by time window + LIMIT; do not SELECT * unbounded.

create table if not exists events (
  id text primary key,
  slug text not null,
  title text not null,
  description text not null default '',
  location text not null default '',
  cta_label text not null default 'Learn More',
  cta_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'published'
    check (status in ('draft', 'published', 'cancelled')),
  created_by text references "user" ("id") on delete set null,
  updated_by text references "user" ("id") on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_ends_after_start check (ends_at is null or ends_at >= starts_at)
);

create unique index if not exists events_slug_uidx on events (slug);

-- Primary calendar scan: upcoming / month windows ordered by time.
create index if not exists events_starts_at_idx on events (starts_at);

-- Keyset pagination: order by starts_at, id with a seek predicate.
create index if not exists events_starts_at_id_idx on events (starts_at, id);

-- Hot path: public site only shows published rows.
create index if not exists events_published_starts_at_idx
  on events (starts_at, id)
  where status = 'published';

-- Staff / admin roles for write access (any authenticated user can sign up;
-- only staff/admin may mutate the calendar).
create table if not exists user_roles (
  user_id text not null references "user" ("id") on delete cascade,
  role text not null check (role in ('staff', 'admin')),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index if not exists user_roles_role_idx on user_roles (role);

-- Seed the four signature 2026 events (idempotent).
insert into events (
  id, slug, title, description, location, cta_label, cta_url,
  starts_at, ends_at, status
) values
  (
    'health-fair-2026',
    'health-fair-2026',
    '2026 Annual Health Fair',
    'A community event for wellness and hope—connecting guests and neighbors with free health resources, screenings, and providers who care.',
    'TBD — Hampton Roads',
    'Learn More',
    null,
    '2026-07-18 14:00:00+00',
    null,
    'published'
  ),
  (
    'derby-dreams-2026',
    'derby-dreams-2026',
    'Derby Dreams: Building HOPE for All',
    'A signature tradition and lasting legacy. Hats, hospitality, and hope—our premier community celebration supporting programs year-round.',
    'Sheraton Norfolk',
    'RSVP / Sponsor',
    null,
    '2026-08-22 16:00:00+00',
    '2026-08-22 20:00:00+00',
    'published'
  ),
  (
    '5k-2026',
    '5k-2026',
    '2026 H.O.P.E. 5K Run/Walk',
    'Lace up for legacy. Join runners, walkers, and families for a morning of fitness and fundraising across Hampton Roads.',
    'Mount Trashmore Park, 310 Edwin Drive, Virginia Beach, VA',
    'Register / Sponsor',
    null,
    '2026-09-05 12:00:00+00',
    null,
    'published'
  ),
  (
    'gala-2026',
    'gala-2026',
    'World Homeless Day Black Tie Gala: An Evening of H.O.P.E.',
    'An elegant evening honoring dignity, compassion, and community on World Homeless Day—our black-tie celebration of ten years of impact.',
    'Murray Center',
    'RSVP Today',
    null,
    '2026-10-10 20:30:00+00',
    '2026-10-11 02:00:00+00',
    'published'
  )
on conflict (id) do nothing;
