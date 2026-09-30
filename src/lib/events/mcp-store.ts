/**
 * Plain async DB helpers for Hope Events MCP.
 * Mirrors SQL from hope-event-image src/lib/events/server.ts (incl. image_url + banner_url).
 * Does NOT use createServerFn / session auth — caller supplies actorUserId.
 * Leaves desk server.ts untouched (minimal churn tip pack).
 */
import { z } from "zod";
import { getSql } from "@/lib/db";
import { normalizeTicketUrl, ticketUrlSchema } from "./ticket-url";
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
  ticket_url: string | null;
  image_url: string | null;
  banner_url: string | null;
  starts_at: string | Date;
  ends_at: string | Date | null;
  status: EventStatus;
  recurrence_freq: "weekly" | "monthly" | null;
  recurrence_interval: number | null;
  recurrence_until: string | Date | null;
  recurrence_count: number | null;
  major_event: boolean;
};

function toIso(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
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
    ticketUrl: row.ticket_url ?? null,
    imageUrl: row.image_url ?? null,
    bannerUrl: row.banner_url ?? null,
    startsAt: toIso(row.starts_at) as string,
    endsAt: toIso(row.ends_at),
    status: row.status,
    recurrenceFreq: row.recurrence_freq ?? null,
    recurrenceInterval: row.recurrence_interval ?? 1,
    recurrenceUntil: toIso(row.recurrence_until),
    recurrenceCount: row.recurrence_count ?? null,
    majorEvent: row.major_event === true,
  };
}

const EVENT_SELECT = `id, slug, title, description, location, cta_label, cta_url, ticket_url,
             image_url, banner_url, starts_at, ends_at, status,
             recurrence_freq, recurrence_interval, recurrence_until, recurrence_count,
             major_event`;

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

/** Same rules as desk assertSafeImageUrl. */
export function assertSafeImageUrl(
  imageUrl: string | null | undefined,
): string | null {
  if (imageUrl == null || imageUrl === "") return null;
  if (!imageUrl.startsWith("/uploads/events/")) {
    throw new Error(
      "imageUrl must be an uploaded event image path (/uploads/events/...)",
    );
  }
  if (imageUrl.includes("..") || imageUrl.includes("//")) {
    throw new Error("Invalid imageUrl");
  }
  return imageUrl;
}

const isoOffset = z.string().datetime({ offset: true });

export const mcpListInputSchema = z.object({
  from: isoOffset.optional(),
  to: isoOffset.optional(),
  limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
  cursor: z.string().min(1).max(512).optional(),
  /** MCP admin default: include drafts/cancelled. */
  include_all_statuses: z.boolean().optional(),
  includeAllStatuses: z.boolean().optional(),
});

export type McpListInput = z.infer<typeof mcpListInputSchema>;

/**
 * List events (keyset pagination). MCP trusted key → include_all_statuses
 * defaults to true (drafts + published + cancelled).
 *
 * Date strings: ISO-8601 with offset. Documented as America/New_York wall times
 * when callers pass ET offsets (-04:00 / -05:00).
 */
export async function mcpListEvents(
  raw: McpListInput = {},
): Promise<EventListResult> {
  const data = mcpListInputSchema.parse(raw ?? {});
  const sql = await getSql();
  const limit = clampLimit(data.limit);
  const from = data.from ?? new Date().toISOString();
  const to = data.to;
  const cursor = data.cursor ? decodeCursor(data.cursor) : null;
  if (data.cursor && !cursor) {
    throw new Error("Invalid cursor");
  }

  const includeAll =
    data.include_all_statuses ?? data.includeAllStatuses ?? true;

  const params: unknown[] = [];
  const where: string[] = [];

  if (!includeAll) {
    where.push(`status = 'published'`);
  }

  if (cursor) {
    params.push(cursor.startsAt, cursor.id);
    where.push(
      `(starts_at, id) > ($${params.length - 1}::timestamptz, $${params.length}::text)`,
    );
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

  params.push(limit + 1);
  const text = `
      select ${EVENT_SELECT}
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
}

export const mcpGetInputSchema = z
  .object({
    id: z.string().min(1).max(128).optional(),
    slug: z.string().min(1).max(100).optional(),
  })
  .refine((v) => Boolean(v.id || v.slug), {
    message: "Provide id or slug",
  });

/** Get by id or slug (MCP sees all statuses). */
export async function mcpGetEvent(raw: {
  id?: string;
  slug?: string;
}): Promise<CalendarEvent | null> {
  const data = mcpGetInputSchema.parse(raw);
  const key = (data.id ?? data.slug) as string;
  const sql = await getSql();
  const rows = await sql.query<EventRow>(
    `select ${EVENT_SELECT}
     from events
     where id = $1 or slug = $1
     limit 1`,
    [key],
  );
  const row = rows[0];
  return row ? mapRow(row) : null;
}

const statusEnum = z.enum(["draft", "published", "cancelled"]);

export const mcpCreateInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).optional().default(""),
    location: z.string().trim().max(500).optional().default(""),
    ctaLabel: z.string().trim().min(1).max(80).optional().default("Learn More"),
    cta_label: z.string().trim().min(1).max(80).optional(),
    ctaUrl: z.string().url().max(2000).nullable().optional(),
    cta_url: z.string().url().max(2000).nullable().optional(),
    startsAt: isoOffset.optional(),
    starts_at: isoOffset.optional(),
    endsAt: isoOffset.nullable().optional(),
    ends_at: isoOffset.nullable().optional(),
    status: statusEnum.optional().default("published"),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    imageUrl: z.string().trim().max(500).nullable().optional(),
    image_url: z.string().trim().max(500).nullable().optional(),
    bannerUrl: z.string().trim().max(500).nullable().optional(),
    banner_url: z.string().trim().max(500).nullable().optional(),
    ticketUrl: ticketUrlSchema,
    ticket_url: ticketUrlSchema,
    majorEvent: z.boolean().optional(),
    major_event: z.boolean().optional(),
  })
  .refine((v) => Boolean(v.startsAt || v.starts_at), {
    message: "startsAt (or starts_at) is required",
  });

export async function mcpCreateEvent(
  raw: z.input<typeof mcpCreateInputSchema>,
  actorUserId: string,
): Promise<CalendarEvent> {
  const data = mcpCreateInputSchema.parse(raw);
  const startsAt = data.startsAt ?? data.starts_at;
  if (!startsAt) throw new Error("startsAt is required");
  const endsAt = data.endsAt !== undefined ? data.endsAt : (data.ends_at ?? null);
  if (endsAt && new Date(endsAt) < new Date(startsAt)) {
    throw new Error("endsAt must be on or after startsAt");
  }

  const imageRaw =
    data.imageUrl !== undefined ? data.imageUrl : data.image_url;
  const imageUrl =
    imageRaw === undefined ? null : assertSafeImageUrl(imageRaw);
  const bannerRaw =
    data.bannerUrl !== undefined ? data.bannerUrl : data.banner_url;
  const bannerUrl =
    bannerRaw === undefined ? null : assertSafeImageUrl(bannerRaw);

  const ctaLabel = data.cta_label ?? data.ctaLabel ?? "Learn More";
  const ctaUrl =
    data.cta_url !== undefined ? data.cta_url : (data.ctaUrl ?? null);
  const ticketRaw = data.ticketUrl !== undefined ? data.ticketUrl : data.ticket_url;
  const ticketUrl = normalizeTicketUrl(ticketRaw ?? null) ?? null;
  const majorEvent = data.majorEvent ?? data.major_event ?? false;

  const sql = await getSql();
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(data.slug ?? slugify(data.title));

  const rows = await sql.query<EventRow>(
    `insert into events (
       id, slug, title, description, location, cta_label, cta_url, image_url, banner_url,
       starts_at, ends_at, status, created_by, updated_by, ticket_url, major_event
     ) values (
       $1, $2, $3, $4, $5, $6, $7, $8, $9,
       $10::timestamptz, $11::timestamptz, $12, $13, $13, $14, $15
     )
     returning ${EVENT_SELECT}`,
    [
      id,
      slug,
      data.title,
      data.description ?? "",
      data.location ?? "",
      ctaLabel,
      ctaUrl,
      imageUrl,
      bannerUrl,
      startsAt,
      endsAt,
      data.status ?? "published",
      actorUserId,
      ticketUrl,
      majorEvent,
    ],
  );
  return mapRow(rows[0]!);
}

/** Partial update — only provided fields change. id required. */
export const mcpUpdateInputSchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(500).optional(),
  ctaLabel: z.string().trim().min(1).max(80).optional(),
  cta_label: z.string().trim().min(1).max(80).optional(),
  ctaUrl: z.string().url().max(2000).nullable().optional(),
  cta_url: z.string().url().max(2000).nullable().optional(),
  startsAt: isoOffset.optional(),
  starts_at: isoOffset.optional(),
  endsAt: isoOffset.nullable().optional(),
  ends_at: isoOffset.nullable().optional(),
  status: statusEnum.optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  /** Flyer path, or null to clear. Omit to leave unchanged. */
  imageUrl: z.string().trim().max(500).nullable().optional(),
  image_url: z.string().trim().max(500).nullable().optional(),
  /** Banner path, or null to clear. Omit to leave unchanged. */
  bannerUrl: z.string().trim().max(500).nullable().optional(),
  banner_url: z.string().trim().max(500).nullable().optional(),
  ticketUrl: ticketUrlSchema,
  ticket_url: ticketUrlSchema,
  majorEvent: z.boolean().optional(),
  major_event: z.boolean().optional(),
});

export async function mcpUpdateEvent(
  raw: z.input<typeof mcpUpdateInputSchema>,
  actorUserId: string,
): Promise<CalendarEvent> {
  const data = mcpUpdateInputSchema.parse(raw);
  const sql = await getSql();

  const existing = await sql.query<EventRow>(
    `select ${EVENT_SELECT} from events where id = $1 limit 1`,
    [data.id],
  );
  if (existing.length === 0) throw new Error("Event not found");
  const cur = existing[0]!;

  const title = data.title ?? cur.title;
  const description =
    data.description !== undefined ? data.description : cur.description;
  const location = data.location !== undefined ? data.location : cur.location;
  const ctaLabel =
    data.cta_label ?? data.ctaLabel ?? cur.cta_label;
  const ctaUrl =
    data.cta_url !== undefined
      ? data.cta_url
      : data.ctaUrl !== undefined
        ? data.ctaUrl
        : cur.cta_url;
  const startsAt =
    data.startsAt ?? data.starts_at ?? (toIso(cur.starts_at) as string);
  const endsAt =
    data.endsAt !== undefined
      ? data.endsAt
      : data.ends_at !== undefined
        ? data.ends_at
        : toIso(cur.ends_at);
  const status = data.status ?? cur.status;
  const ticketUrl =
    data.ticketUrl !== undefined || data.ticket_url !== undefined
      ? (normalizeTicketUrl(
          data.ticketUrl !== undefined ? data.ticketUrl : data.ticket_url,
        ) ?? null)
      : cur.ticket_url;
  const majorEvent =
    data.majorEvent !== undefined
      ? data.majorEvent
      : data.major_event !== undefined
        ? data.major_event
        : cur.major_event === true;

  if (endsAt && new Date(endsAt) < new Date(startsAt)) {
    throw new Error("endsAt must be on or after startsAt");
  }

  let nextImageUrl = cur.image_url;
  let nextBannerUrl = cur.banner_url;
  const previousToDelete: string[] = [];
  const imageRaw =
    data.imageUrl !== undefined ? data.imageUrl : data.image_url;
  if (imageRaw !== undefined) {
    const asserted = assertSafeImageUrl(imageRaw);
    if (asserted !== cur.image_url && cur.image_url) {
      previousToDelete.push(cur.image_url);
    }
    nextImageUrl = asserted;
  }
  const bannerRaw =
    data.bannerUrl !== undefined ? data.bannerUrl : data.banner_url;
  if (bannerRaw !== undefined) {
    const asserted = assertSafeImageUrl(bannerRaw);
    if (asserted !== cur.banner_url && cur.banner_url) {
      previousToDelete.push(cur.banner_url);
    }
    nextBannerUrl = asserted;
  }

  const slug =
    data.slug !== undefined
      ? await uniqueSlug(data.slug, data.id)
      : data.title !== undefined
        ? await uniqueSlug(slugify(data.title), data.id)
        : cur.slug;

  const rows = await sql.query<EventRow>(
    `update events set
       slug = $2,
       title = $3,
       description = $4,
       location = $5,
       cta_label = $6,
       cta_url = $7,
       image_url = $8,
       banner_url = $9,
       starts_at = $10::timestamptz,
       ends_at = $11::timestamptz,
       status = $12,
       updated_by = $13,
       updated_at = now(),
       ticket_url = $14,
       major_event = $15
     where id = $1
     returning ${EVENT_SELECT}`,
    [
      data.id,
      slug,
      title,
      description,
      location,
      ctaLabel,
      ctaUrl,
      nextImageUrl,
      nextBannerUrl,
      startsAt,
      endsAt,
      status,
      actorUserId,
      ticketUrl,
      majorEvent,
    ],
  );

  if (previousToDelete.length) {
    const { deleteEventImageFile } = await import("./upload.server");
    for (const path of previousToDelete) {
      if (path === nextImageUrl || path === nextBannerUrl) continue;
      await deleteEventImageFile(path).catch(() => undefined);
    }
  }

  return mapRow(rows[0]!);
}

export const mcpDeleteInputSchema = z.object({
  id: z.string().min(1).max(128),
});

/**
 * Hard DELETE (matches desk deleteEvent) + flyer/banner file cleanup.
 * Not a soft/status cancel — use update_event status=cancelled for that.
 */
export async function mcpDeleteEvent(raw: {
  id: string;
}): Promise<{ ok: true; deletedId: string }> {
  const data = mcpDeleteInputSchema.parse(raw);
  const sql = await getSql();
  const rows = await sql.query<{
    id: string;
    image_url: string | null;
    banner_url: string | null;
  }>(
    `delete from events where id = $1 returning id, image_url, banner_url`,
    [data.id],
  );
  if (rows.length === 0) throw new Error("Event not found");
  const { deleteEventImageFile } = await import("./upload.server");
  await deleteEventImageFile(rows[0]!.image_url).catch(() => undefined);
  await deleteEventImageFile(rows[0]!.banner_url).catch(() => undefined);
  return { ok: true, deletedId: rows[0]!.id };
}
