-- Username field for password login (Better Auth username plugin).
-- Public self-registration is disabled; only superusers create accounts.

alter table "user" add column if not exists "username" text;
alter table "user" add column if not exists "displayUsername" text;

create unique index if not exists "user_username_uidx"
  on "user" ("username")
  where "username" is not null;
