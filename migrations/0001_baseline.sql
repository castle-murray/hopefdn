-- Baseline schema for the H.O.P.E. Foundation site (replaces the old
-- 0001_auth … 0014_drop_store chain; it produces the same schema).
--
-- Runs only on an empty database. A database that already ran the old chain
-- (has 0014_drop_store.sql in _migrations) is marked as baselined by
-- scripts/migrate.mjs without running this file.
--
-- No seed data: events come from the restored dump or are entered in /events/manage.
-- Better Auth tables use Better Auth's camelCase column names.

create table "user" (
  id text not null,
  name text not null,
  email text not null,
  "emailVerified" boolean not null,
  image text,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null default current_timestamp,
  username text,
  "displayUsername" text,
  constraint user_pkey primary key (id),
  constraint user_email_key unique (email)
);
create unique index user_username_uidx on "user" (username) where username is not null;

create table session (
  id text not null,
  "expiresAt" timestamptz not null,
  token text not null,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null,
  constraint session_pkey primary key (id),
  constraint session_token_key unique (token),
  constraint "session_userId_fkey" foreign key ("userId") references "user" (id) on delete cascade
);
create index "session_userId_idx" on session ("userId");

create table account (
  id text not null,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null,
  constraint account_pkey primary key (id),
  constraint "account_userId_fkey" foreign key ("userId") references "user" (id) on delete cascade
);
create index "account_userId_idx" on account ("userId");

create table verification (
  id text not null,
  identifier text not null,
  value text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null default current_timestamp,
  constraint verification_pkey primary key (id)
);
create index verification_identifier_idx on verification (identifier);

-- Staff roles: admin (everything, incl. users) and staff (events only).
create table user_roles (
  user_id text not null,
  role text not null,
  granted_at timestamptz not null default now(),
  constraint user_roles_pkey primary key (user_id, role),
  constraint user_roles_role_check check (role in ('staff', 'admin')),
  constraint user_roles_user_id_fkey foreign key (user_id) references "user" (id) on delete cascade
);
create index user_roles_role_idx on user_roles (role);

create table events (
  id text not null,
  slug text not null,
  title text not null,
  description text not null default '',
  location text not null default '',
  cta_label text not null default 'Learn More',
  cta_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'published',
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  image_url text,        -- flyer, /uploads/events/<file>
  banner_url text,       -- wide banner, /uploads/events/<file>
  recurrence_freq text,  -- null = one-off; 'weekly' or 'monthly'
  recurrence_interval integer not null default 1,
  recurrence_until timestamptz,
  recurrence_count integer,
  ticket_url text,
  major_event boolean not null default false,
  constraint events_pkey primary key (id),
  constraint events_ends_after_start check (ends_at is null or ends_at >= starts_at),
  constraint events_recurrence_freq_check
    check (recurrence_freq is null or recurrence_freq in ('weekly', 'monthly')),
  -- A repeating event may have an end date, a count, or neither (open-ended).
  constraint events_recurrence_shape_check check (
    recurrence_interval >= 1
    and recurrence_interval <= 52
    and (recurrence_count is null or (recurrence_count >= 1 and recurrence_count <= 500))
    and (
      (recurrence_freq is null and recurrence_until is null and recurrence_count is null)
      or recurrence_freq is not null
    )
  ),
  constraint events_status_check check (status in ('draft', 'published', 'cancelled')),
  constraint events_created_by_fkey foreign key (created_by) references "user" (id) on delete set null,
  constraint events_updated_by_fkey foreign key (updated_by) references "user" (id) on delete set null
);
create unique index events_slug_uidx on events (slug);
create index events_starts_at_idx on events (starts_at);
create index events_starts_at_id_idx on events (starts_at, id);
create index events_published_starts_at_idx on events (starts_at, id) where status = 'published';
