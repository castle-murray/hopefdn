/**
 * Apply migrations/*.sql against a real Postgres (Neon) when DATABASE_URL is set.
 * No-op when unset — local preview uses PGLite, which migrates itself in src/lib/db.ts.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.log("[migrate] DATABASE_URL not set — skipping (PGLite handles local migrations)");
  process.exit(0);
}

const BASELINE = "0001_baseline.sql";
const OLD_CHAIN = [
  "0001_auth.sql", "0002_events.sql", "0003_username.sql", "0004_shop.sql",
  "0005_product_images.sql", "0006_product_images_logo.sql", "0007_circle_logo_tee.sql",
  "0008_shop_public_setting.sql", "0009_webp_product_images.sql", "0010_event_image.sql",
  "0011_event_banner.sql", "0012_event_recurrence.sql",
  "0013_event_ticket_major_indefinite.sql", "0014_drop_store.sql",
];
const OLD_CHAIN_LAST = "0014_drop_store.sql";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "migrations");

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  await client.query(`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const { rows: doneRows } = await client.query("select name from _migrations");
  const done = new Set(doneRows.map((r) => r.name));

  // Databases created before 0001_baseline.sql (same schema): if the earlier
  // migration set is complete, mark the baseline as applied instead of running
  // it; if it is incomplete, stop with an error.
  if (!done.has(BASELINE)) {
    const oldNames = [...done].filter((n) => OLD_CHAIN.includes(n));
    if (done.has(OLD_CHAIN_LAST)) {
      await client.query(
        "insert into _migrations (name) values ($1) on conflict (name) do nothing",
        [BASELINE],
      );
      done.add(BASELINE);
      console.log(`[migrate] old chain complete (${OLD_CHAIN_LAST}) — marked ${BASELINE} as applied`);
    } else if (oldNames.length > 0) {
      throw new Error(
        `[migrate] this database ran only part of the old migration chain (last: ${oldNames.sort().at(-1)}). ` +
          `Finish it with the migrations from commit fa167dd (git show fa167dd:migrations/<file>), then re-run.`,
      );
    }
  }

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const name of files) {
    if (done.has(name)) {
      console.log(`[migrate] skip ${name}`);
      continue;
    }
    const text = await readFile(path.join(migrationsDir, name), "utf8");
    await client.query("begin");
    try {
      await client.query(text);
      await client.query("insert into _migrations (name) values ($1)", [name]);
      await client.query("commit");
      console.log(`[migrate] applied ${name}`);
    } catch (err) {
      await client.query("rollback");
      throw err;
    }
  }
  console.log("[migrate] done");
} finally {
  await client.end();
}
