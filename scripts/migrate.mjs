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
