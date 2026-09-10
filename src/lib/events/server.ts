/**
 * Event calendar data access + server functions (server-only paths via createServerFn).
 *
 * Query shape is built for thousands of events:
 * - Always filter by starts_at range when possible
 * - Keyset pagination on (starts_at, id) — no OFFSET
 * - Hard LIMIT cap
 * - Lean column list
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireStaff } from "@/lib/auth/staff.server";
import type { CalendarEvent, EventListResult, EventStatus } from "./types";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  cta_label: string;
  cta_url: string | null;
  starts_at: string | Date;
  ends_at: string | Date | null;
  status: EventStatus;
};

function toIso(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  // PGLite / drivers may return timestamptz as string already.
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function mapRow(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    location: row.location,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    startsAt: toIso(row.starts_at) as string,
    endsAt: toIso(row.ends_at),
    status: row.status,
  };
}

function clampLimit(limit?: number): number {
  if (limit == null || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
}

function encodeCursor(startsAt: string, id: string): string {
  return Buffer.from(`${startsAt}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): { startsAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const pipe = raw.indexOf("|");
    if (pipe <= 0) return null;
    const startsAt = raw.slice(0, pipe);
    const id = raw.slice(pipe + 1);
    if (!startsAt || !id) return null;
    if (Number.isNaN(new Date(startsAt).getTime())) return null;
    return { startsAt, id };
  } catch {
    return null;
  }
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "event";
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const sql = await getSql();
  let candidate = base;
  for (let i = 0; i < 50; i += 1) {
    const rows = await sql.query<{ id: string }>(
      excludeId
        ? `select id from events where slug = $1 and id <> $2 limit 1`
        : `select id from events where slug = $1 limit 1`,
      excludeId ? [candidate, excludeId] : [candidate],
    );
    if (rows.length === 0) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

const listInputSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
  cursor: z.string().min(1).max(512).optional(),
  includeAllStatuses: z.boolean().optional(),
});

/**
 * Public calendar list (published only unless staff sets includeAllStatuses).
 * Keyset-paginated, range-filtered, hard-capped.
 */
export const listEvents = createServerFn({ method: "GET" })
  .validator((raw: unknown) => listInputSchema.parse(raw ?? {}))
  .handler(async ({ data }): Promise<EventListResult> => {
    const sql = await getSql();
    const limit = clampLimit(data.limit);
    const from = data.from ?? new Date().toISOString();
    const to = data.to;
    const cursor = data.cursor ? decodeCursor(data.cursor) : null;
    if (data.cursor && !cursor) {
      throw new Error("Invalid cursor");
    }

    // Staff-only expansion is gated separately when needed; public always published.
    // includeAllStatuses requires auth — checked below if true.
    let includeAll = false;
    if (data.includeAllStatuses) {
      try {
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const user = await getSessionUser();
        if (user) {
          await requireStaff(user.id);
          includeAll = true;
        }
      } catch {
        includeAll = false;
      }
    }

    const params: unknown[] = [];
    const where: string[] = [];

    if (!includeAll) {
      where.push(`status = 'published'`);
    }

    // Range lower bound — either from, or cursor seek (which is after a prior row).
    if (cursor) {
      params.push(cursor.startsAt, cursor.id);
      where.push(
        `(starts_at, id) > ($${params.length - 1}::timestamptz, $${params.length}::text)`,
      );
      // Still respect from if provided and later than cursor (usually not).
      if (data.from) {
        params.push(from);
        where.push(`starts_at >= $${params.length}::timestamptz`);
      }
    } else {
      params.push(from);
      where.push(`starts_at >= $${params.length}::timestamptz`);
    }

    if (to) {
      params.push(to);
      where.push(`starts_at < $${params.length}::timestamptz`);
    }

    params.push(limit + 1); // fetch one extra to detect hasMore
    const text = `
      select id, slug, title, description, location, cta_label, cta_url,
             starts_at, ends_at, status
      from events
      where ${where.join(" and ")}
      order by starts_at asc, id asc
      limit $${params.length}
    `;

    const rows = await sql.query<EventRow>(text, params);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const events = page.map(mapRow);
    const last = events[events.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor(last.startsAt, last.id) : null;

    return { events, nextCursor, hasMore };
  });

const eventIdSchema = z.object({ id: z.string().min(1).max(128) });

export const getEvent = createServerFn({ method: "GET" })
  .validator((raw: unknown) => eventIdSchema.parse(raw))
  .handler(async ({ data }): Promise<CalendarEvent | null> => {
    const sql = await getSql();
    const rows = await sql.query<EventRow>(
      `select id, slug, title, description, location, cta_label, cta_url,
              starts_at, ends_at, status
       from events
       where id = $1 or slug = $1
       limit 1`,
      [data.id],
    );
    const row = rows[0];
    if (!row) return null;
    if (row.status !== "published") {
      // Drafts only for staff
      try {
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const user = await getSessionUser();
        if (!user) return null;
        await requireStaff(user.id);
      } catch {
        return null;
      }
    }
    return mapRow(row);
  });

const mutateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).default(""),
  location: z.string().trim().max(500).default(""),
  ctaLabel: z.string().trim().min(1).max(80).default("Learn More"),
  ctaUrl: z.string().url().max(2000).nullable().optional(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.enum(["draft", "published", "cancelled"]).default("published"),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});

export const createEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => mutateSchema.parse(raw))
  .handler(async ({ data, context }): Promise<CalendarEvent> => {
    await requireStaff(context.userId);

    if (data.endsAt && new Date(data.endsAt) < new Date(data.startsAt)) {
      throw new Error("endsAt must be on or after startsAt");
    }

    const sql = await getSql();
    const id = crypto.randomUUID();
    const slug = await uniqueSlug(data.slug ?? slugify(data.title));

    const rows = await sql.query<EventRow>(
      `insert into events (
         id, slug, title, description, location, cta_label, cta_url,
         starts_at, ends_at, status, created_by, updated_by
       ) values (
         $1, $2, $3, $4, $5, $6, $7,
         $8::timestamptz, $9::timestamptz, $10, $11, $11
       )
       returning id, slug, title, description, location, cta_label, cta_url,
                 starts_at, ends_at, status`,
      [
        id,
        slug,
        data.title,
        data.description,
        data.location,
        data.ctaLabel,
        data.ctaUrl ?? null,
        data.startsAt,
        data.endsAt ?? null,
        data.status,
        context.userId,
      ],
    );
    return mapRow(rows[0]!);
  });

const updateSchema = mutateSchema.extend({
  id: z.string().min(1).max(128),
});

export const updateEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => updateSchema.parse(raw))
  .handler(async ({ data, context }): Promise<CalendarEvent> => {
    await requireStaff(context.userId);

    if (data.endsAt && new Date(data.endsAt) < new Date(data.startsAt)) {
      throw new Error("endsAt must be on or after startsAt");
    }

    const sql = await getSql();
    const existing = await sql.query<{ id: string }>(
      `select id from events where id = $1 limit 1`,
      [data.id],
    );
    if (existing.length === 0) throw new Error("Event not found");

    const slug = await uniqueSlug(data.slug ?? slugify(data.title), data.id);

    const rows = await sql.query<EventRow>(
      `update events set
         slug = $2,
         title = $3,
         description = $4,
         location = $5,
         cta_label = $6,
         cta_url = $7,
         starts_at = $8::timestamptz,
         ends_at = $9::timestamptz,
         status = $10,
         updated_by = $11,
         updated_at = now()
       where id = $1
       returning id, slug, title, description, location, cta_label, cta_url,
                 starts_at, ends_at, status`,
      [
        data.id,
        slug,
        data.title,
        data.description,
        data.location,
        data.ctaLabel,
        data.ctaUrl ?? null,
        data.startsAt,
        data.endsAt ?? null,
        data.status,
        context.userId,
      ],
    );
    return mapRow(rows[0]!);
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => eventIdSchema.parse(raw))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireStaff(context.userId);

    const sql = await getSql();
    const rows = await sql.query<{ id: string }>(
      `delete from events where id = $1 returning id`,
      [data.id],
    );
    if (rows.length === 0) throw new Error("Event not found");
    return { ok: true };
  });

/** Whether the current session can manage the calendar (staff or admin role). */
export const canManageEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const { ensureStaffAccess } = await import("@/lib/auth/staff.server");
      const user = await getSessionUser();
      if (!user) return false;
      return ensureStaffAccess(user.id);
    } catch {
      return false;
    }
  },
);
