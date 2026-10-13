# H.O.P.E. Foundation website (hopefdn.org)

This is the public website for the H.O.P.E. Foundation, plus a small staff area
for managing events and staff accounts.

It is a custom app, not WordPress:

- **TanStack Start + React + TypeScript** (built with Vite; the server is Nitro)
- **Node.js** runs the built server
- **PostgreSQL** stores events, staff accounts and sessions
- **Better Auth** handles staff sign-in (username + password)
- Tailwind CSS for styling

> **The online store was removed.** Regina runs the store separately. Old
> store links (`/shop`, `/cart`, `/legacy/...`, etc.) redirect to `/legacy`,
> which is now a "store coming soon" page. Migration `0014_drop_store.sql`
> drops the old store tables.

---

## 1. Requirements

| What | Version | Notes |
| --- | --- | --- |
| Node.js | **22.x** (the live servers run **22.23.2**) | `package.json` has no `engines` field and there is no `.nvmrc`; 22 is what is tested. npm 10 (comes with Node 22). |
| PostgreSQL | **16** (live servers run 16.15) | 14+ should work; the dump was made with `pg_dump` 16. |
| nginx | any recent | reverse proxy in front of the app |
| Disk | ~1 GB | `node_modules` + build output + uploaded images |

## 2. What is in this package

```
README.md                 this file
.env.example              every setting the app reads, with placeholders
package.json, package-lock.json
vite.config.ts            build config
migrations/               SQL migrations, applied in order by scripts/migrate.mjs
scripts/migrate.mjs       migration runner (npm run db:migrate)
src/                      app source (routes in src/routes)
public/                   static files; uploaded event images in public/uploads/events/
db/hopefdn-sanitized.dump PostgreSQL dump (custom format): full schema + events,
                          with NO user accounts, passwords or sessions
```

## 3. Environment settings

Copy the example file and fill it in:

```bash
cp .env.example .env
chmod 600 .env
```

Every setting is explained in `.env.example`. The important ones:

- `DATABASE_URL` — `postgres://USER:PASSWORD@127.0.0.1:5432/DBNAME`. **Required in
  production.** (If unset, the dev server uses a throw-away embedded database,
  PGlite. The built production server does not support that.)
- `BETTER_AUTH_SECRET` — a long random string, e.g. `openssl rand -hex 32`.
  Changing it signs everyone out.
- `SUPERUSER_USERNAME` / `SUPERUSER_PASSWORD` / `SUPERUSER_NAME` / `SUPERUSER_EMAIL`
  — used once to create the first admin (see "First admin" below).
- `PORT` / `HOST` — where the built server listens (e.g. `3005` on `127.0.0.1`).
- `SMTP_*` and `CONTACT_TO` — mail server for password-reset emails and the
  contact form (see "Email (SMTP)").
- `UPLOAD_EVENTS_DIR` — optional; where event images are stored (default
  `public/uploads/events` inside the app folder).
- `HOPE_EVENTS_MCP_API_KEY` / `HOPE_EVENTS_MCP_ACTOR_USER_ID` — optional, only for
  the `/mcp` endpoint.

**How `.env` gets loaded:** the Vite dev server and `vite build` read `.env`
automatically. The **built server and `npm run db:migrate` do not** — they only
see real environment variables. So either use systemd `EnvironmentFile=` / a PM2
ecosystem file (examples below), or load it in your shell first:

```bash
set -a; . ./.env; set +a
```

If a value contains spaces or shell characters (`&`, `$`, `#`, `;`), wrap it in
double quotes in `.env`, or the `set -a; . ./.env` line above will mangle it.
Never commit `.env`.

## 4. Database setup

Create a database and an owner (as the `postgres` superuser):

```bash
sudo -u postgres psql <<'SQL'
create user hope with password 'CHANGE-ME';
create database hopefdn owner hope;
SQL
```

Then pick **one** of these:

**A. Restore the included dump (keeps the current events and images):**

```bash
pg_restore --no-owner --no-privileges -d "postgres://hope:CHANGE-ME@127.0.0.1:5432/hopefdn" db/hopefdn-sanitized.dump
```

The dump already includes the `_migrations` table, so `npm run db:migrate`
afterwards only applies anything newer.

**B. Start empty:** just run the migrations (`npm run db:migrate` with `.env`
loaded). There is one migration, `0001_baseline.sql`, which creates every table.
It adds no sample data; add events at `/events/manage`.

`npm run build` **also runs the migrations** at the end (it is
`vite build && npm run db:migrate`), but only if `DATABASE_URL` is in the
environment at that moment. Migrations are tracked in the `_migrations` table and
each runs once.

### Existing databases (old migration chain)

Before October 2026 the schema was built by 14 files (`0001_auth.sql` …
`0014_drop_store.sql`). They were squashed into `0001_baseline.sql`, which makes
exactly the same schema. `scripts/migrate.mjs` handles older databases itself:

- **Finished the old chain** (`0014_drop_store.sql` is in `_migrations`): it
  records `0001_baseline.sql` as applied and runs nothing. No action needed.
- **Stopped part-way** (some old names, but not `0014_drop_store.sql`): it stops
  with an error. Finish the old chain first from a separate copy of the old files:

  ```bash
  mkdir /tmp/hope-old && git archive fa167dd migrations scripts | tar -x -C /tmp/hope-old
  ln -s "$PWD/node_modules" /tmp/hope-old/node_modules
  node /tmp/hope-old/scripts/migrate.mjs     # with .env loaded; take a backup first
  npm run db:migrate                         # now marks the baseline
  ```

  The current hopefdn.org database is in this state (it stops after `0009`).

The included dump already has only the `0001_baseline.sql` row, so migrating it
does nothing.

### First admin

There are no accounts in the included dump. On startup, if **no user has the
`admin` role**, the server creates one from `SUPERUSER_USERNAME`,
`SUPERUSER_PASSWORD`, `SUPERUSER_NAME` and `SUPERUSER_EMAIL` (defaults are
`admin` / `changeme` — **set real values first**). It logs
`[auth] Bootstrapped superuser "..."`. Sign in at `/desk`, then change the
password from the account page. After that the SUPERUSER_* values are ignored
(you can remove the password from `.env`).

## 5. Build

```bash
npm ci
set -a; . ./.env; set +a     # so the build can also run migrations
npm run build
```

The build produces a plain Node server at `.output/server/index.mjs` (Nitro
`node-server` preset, the default in `vite.config.ts`). To target another
host, set `NITRO_PRESET` (e.g. `vercel`) in the environment or `.env` before
building; most people never need it.

## 6. Run

```bash
set -a; . ./.env; set +a
node .output/server/index.mjs        # listens on $HOST:$PORT
```

Run it under a process manager so it restarts on crash/reboot. Run it as its own
non-root user (the live server uses user `hope`, app in `/opt/hopefdn`).

**systemd** (`/etc/systemd/system/hopefdn.service`):

```ini
[Unit]
Description=Hope Foundation website
After=network.target postgresql.service

[Service]
User=hope
WorkingDirectory=/opt/hopefdn
EnvironmentFile=/opt/hopefdn/.env
ExecStart=/usr/bin/node /opt/hopefdn/.output/server/index.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hopefdn
```

**PM2** (alternative), `ecosystem.config.cjs` (keep secrets in `.env`, not here):

```js
module.exports = {
  apps: [{
    name: "hopefdn",
    cwd: "/opt/hopefdn",
    script: ".output/server/index.mjs",
    node_args: "--env-file=.env",
  }],
};
```

```bash
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
```

## 7. nginx reverse proxy

```nginx
upstream hopefdn { server 127.0.0.1:3005; }

server {
    listen 80;
    server_name hopefdn.org www.hopefdn.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hopefdn.org www.hopefdn.org;

    # Cloudflare Origin Certificate (or Let's Encrypt)
    ssl_certificate     /etc/ssl/hopefdn/origin.pem;
    ssl_certificate_key /etc/ssl/hopefdn/origin.key;

    client_max_body_size 10m;   # event image uploads are up to 5 MB

    location / {
        proxy_pass http://hopefdn;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

The `Host` header matters: sign-in only works for the host names the app knows
(`hopefdn.org`, `www.hopefdn.org`, plus localhost). A new domain must be added in
`src/lib/public-hosts.ts`.

## 8. Cloudflare DNS

- `A` record `hopefdn.org` → the server's public IP, **Proxied** (orange cloud).
- `A` (or `CNAME` to `hopefdn.org`) for `www`, also Proxied.
- SSL/TLS mode: **Full (strict)** with a Cloudflare Origin Certificate or a
  Let's Encrypt cert on nginx. ("Full" works with a self-signed cert; never use
  "Flexible" — it causes redirect loops with the HTTP→HTTPS redirect above.)

## 9. Uploaded event images (must be backed up)

Staff uploads (event flyers and banners, JPG/PNG/WebP/GIF, max 5 MB) are saved
as files in `public/uploads/events/` (or `UPLOAD_EVENTS_DIR`) and served at
`/uploads/events/<file>`. They are **not** in the database — the database only
stores the path. When you move servers or restore a backup, copy this folder
too, or events will show broken images. This package includes the current
images in `public/uploads/events/`.

## 10. Email (SMTP)

Two things send email, both through `src/lib/mail.ts` and the same settings:

1. **Contact form** ("Get In Touch" on `/about#contact`) → sent to `CONTACT_TO`,
   with Reply-To set to the visitor's email, so you can reply directly. It has
   a hidden spam trap field and allows 5 messages per visitor IP per 10 minutes.
2. **Staff password-reset links** → sent to the staff member.

Settings (in `.env`):

| Setting | Example | Notes |
| --- | --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` | mail server |
| `SMTP_PORT` | `587` | 587 (STARTTLS) or 465 (TLS) |
| `SMTP_SECURE` | `false` | `true` for 465; `false` for 587 (STARTTLS is required) |
| `SMTP_USER` / `SMTP_PASS` | | mailbox login / app password |
| `SMTP_FROM` | `"H.O.P.E. Foundation <noreply@hopefdn.org>"` | must be allowed by the mail server |
| `CONTACT_TO` | `regina@hopefdn.org` | contact form recipient(s), comma-separated |

If SMTP or `CONTACT_TO` isn't set, the contact form shows visitors "please call
757-241-6900 or email …" and the server log says
`[contact] SMTP_* or CONTACT_TO not configured`. Password-reset links are then
printed in the server log instead of emailed. Restart the app after changing these.

## 11. MCP events endpoint (optional)

`/mcp` is a Model Context Protocol endpoint that lets an AI assistant or script
list/create/update/delete events and upload event images
(`/api/mcp/events/upload`). It is off unless `HOPE_EVENTS_MCP_API_KEY` is set;
callers send `Authorization: Bearer <key>`. `HOPE_EVENTS_MCP_ACTOR_USER_ID` must
be the id of an existing staff/admin user (from the `"user"` table) and is
recorded as the event's creator. If you don't need it, leave both unset.

---

## Operations

### Staff area

- Sign in at **`/desk`**, then go to **`/admin`** (dashboard).
- **Events:** `/events/manage`. Each event has: title, slug (URL), description,
  location, start/end date-time (entered in Eastern time), status
  (draft / published / cancelled), button label + link, ticket link,
  flyer image and banner image (upload), **major event** (shows the big
  banner on the home and events pages), and **repeat** settings (weekly or monthly, every N
  weeks/months, until a date, N times, or with no end).
  Only *published* events appear publicly.
- **Users and roles:** `/admin/users` (admins only). There is no public sign-up;
  admins create accounts. Roles: **admin** (everything, including users) and
  **staff** (events only). Deleting a user lets you hand their events to someone
  else.
- **Password reset:** "Forgot password" on `/desk` (`/forgot-password`) emails a link (needs
  `SMTP_*`; otherwise the link is printed in the server log). An admin can also
  set a new password for a user on `/admin/users`.

### Backups

Back up both the database and the images, e.g. nightly:

```bash
pg_dump -Fc -d "$DATABASE_URL" -f /backups/hopefdn-$(date +%F).dump
tar -czf /backups/hopefdn-uploads-$(date +%F).tar.gz -C /opt/hopefdn/public uploads
```

Restore with `pg_restore --clean --if-exists -d "$DATABASE_URL" file.dump` and
untar the uploads back into `public/`. Keep a copy of `.env` somewhere safe too
(it holds the auth secret and DB password).

### Updating the site

```bash
cd /opt/hopefdn
git pull                      # or unpack the new release
npm ci
set -a; . ./.env; set +a
npm run build                 # builds and applies new migrations
npm run db:migrate            # harmless re-run; needed if the build had no DATABASE_URL
sudo systemctl restart hopefdn   # or: pm2 restart hopefdn
```

Take a database backup before updating.

### Restarting and logs

| | systemd | PM2 |
| --- | --- | --- |
| restart | `sudo systemctl restart hopefdn` | `pm2 restart hopefdn` |
| status | `systemctl status hopefdn` | `pm2 status` |
| logs | `journalctl -u hopefdn -f` | `pm2 logs hopefdn` |

nginx logs: `/var/log/nginx/access.log` and `error.log`.

### Local development

```bash
npm ci
npm run dev        # http://localhost:3011, uses embedded PGlite if DATABASE_URL is unset
npm run typecheck
npm run lint
```
