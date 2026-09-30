/**
 * Events data access + business logic — server-only.
 * Imported only from createServerFn handlers in `./server.ts` (never from client modules).
 */
import { getSql } from "@/lib/db";
import {
  ensureStaffAccess,
  requireStaff,
} from "@/lib/auth/staff.server";
import { getSessionUser } from "@/lib/auth/verify.server";
import {
  currentEtMonth,
  monthBounds,
  nextOccurrenceOnOrAfter,
  occurrenceInstants,
  type RecurrenceFields,
} from "./recurrence";
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
  image_url: string | null;
  banner_url: string | null;
  starts_at: string | Date;
  ends_at: string | Date | null;
  status: EventStatus;
  recurrence_freq: "weekly" | "monthly" | null;
  recurrence_interval: number | null;
  recurrence_until: string | Date | null;
  recurrence_count: number | null;
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
    imageUrl: row.image_url ?? null,
    bannerUrl: row.banner_url ?? null,
    startsAt: toIso(row.starts_at) as string,
    endsAt: toIso(row.ends_at),
    status: row.status,
    recurrenceFreq: row.recurrence_freq ?? null,
    recurrenceInterval: row.recurrence_interval ?? 1,
    recurrenceUntil: toIso(row.recurrence_until),
    recurrenceCount: row.recurrence_count ?? null,
  };
}

function ruleOf(event: CalendarEvent): RecurrenceFields {
  return {
    freq: event.recurrenceFreq,
    interval: event.recurrenceInterval || 1,
    until: event.recurrenceUntil,
    count: event.recurrenceCount,
  };
}

const EVENT_SELECT = `id, slug, title, description, location, cta_label, cta_url,
             image_url, banner_url, starts_at, ends_at, status,
             recurrence_freq, recurrence_interval, recurrence_until, recurrence_count`;

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

export type ListEventsInput = {
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
  includeAllStatuses?: boolean;
};

/**
 * Public calendar list (published only unless staff sets includeAllStatuses).
 * Keyset-paginated, range-filtered, hard-capped.
 */
export async function listEventsImpl(
  data: ListEventsInput,
): Promise<EventListResult> {
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

export async function getEventImpl(id: string): Promise<CalendarEvent | null> {
  const sql = await getSql();
  const rows = await sql.query<EventRow>(
    `select ${EVENT_SELECT}
       from events
       where id = $1 or slug = $1
       limit 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.status !== "published") {
    // Drafts only for staff
    try {
      const user = await getSessionUser();
      if (!user) return null;
      await requireStaff(user.id);
    } catch {
      return null;
    }
  }
  return mapRow(row);
}

export type MutateEventInput = {
  title: string;
  description: string;
  location: string;
  ctaLabel: string;
  ctaUrl?: string | null;
  startsAt: string;
  endsAt?: string | null;
  status: "draft" | "published" | "cancelled";
  slug?: string;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  recurrenceFreq?: "weekly" | "monthly" | null;
  recurrenceInterval?: number;
  recurrenceUntil?: string | null;
  recurrenceCount?: number | null;
};

function normalizeRecurrence(data: MutateEventInput): RecurrenceFields {
  const freq = data.recurrenceFreq ?? null;
  if (!freq) return { freq: null, interval: 1, until: null, count: null };
  const interval = data.recurrenceInterval ?? 1;
  if (interval < 1 || interval > 52) {
    throw new Error("Repeat interval must be between 1 and 52");
  }
  const until = data.recurrenceUntil ?? null;
  const count = data.recurrenceCount ?? null;
  if (!until && count == null) {
    throw new Error("A repeating event needs an end date or a count");
  }
  if (count != null && (count < 1 || count > 500)) {
    throw new Error("Repeat count must be between 1 and 500");
  }
  return { freq, interval, until, count };
}

export type UpdateEventInput = MutateEventInput & { id: string };

function assertSafeImageUrl(imageUrl: string | null | undefined): string | null {
  if (imageUrl == null || imageUrl === "") return null;
  if (!imageUrl.startsWith("/uploads/events/")) {
    throw new Error("image path must be an uploaded event image under /uploads/events/");
  }
  if (imageUrl.includes("..") || imageUrl.includes("//")) {
    throw new Error("Invalid imageUrl");
  }
  return imageUrl;
}

export async function createEventImpl(
  userId: string,
  data: MutateEventInput,
): Promise<CalendarEvent> {
  await requireStaff(userId);

  if (data.endsAt && new Date(data.endsAt) < new Date(data.startsAt)) {
    throw new Error("endsAt must be on or after startsAt");
  }

  const imageUrl =
    data.imageUrl === undefined ? null : assertSafeImageUrl(data.imageUrl);
  const bannerUrl =
    data.bannerUrl === undefined ? null : assertSafeImageUrl(data.bannerUrl);

  const sql = await getSql();
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(data.slug ?? slugify(data.title));

  const recurrence = normalizeRecurrence(data);
  const rows = await sql.query<EventRow>(
    `insert into events (
         id, slug, title, description, location, cta_label, cta_url, image_url, banner_url,
         starts_at, ends_at, status, created_by, updated_by,
         recurrence_freq, recurrence_interval, recurrence_until, recurrence_count
       ) values (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         $10::timestamptz, $11::timestamptz, $12, $13, $13,
         $14, $15, $16::timestamptz, $17
       )
       returning ${EVENT_SELECT}`,
    [
      id,
      slug,
      data.title,
      data.description,
      data.location,
      data.ctaLabel,
      data.ctaUrl ?? null,
      imageUrl,
      bannerUrl,
      data.startsAt,
      data.endsAt ?? null,
      data.status,
      userId,
      recurrence.freq,
      recurrence.interval,
      recurrence.until,
      recurrence.count,
    ],
  );
  return mapRow(rows[0]!);
}

export async function updateEventImpl(
  userId: string,
  data: UpdateEventInput,
): Promise<CalendarEvent> {
  await requireStaff(userId);

  if (data.endsAt && new Date(data.endsAt) < new Date(data.startsAt)) {
    throw new Error("endsAt must be on or after startsAt");
  }

  const sql = await getSql();
  const existing = await sql.query<{
    id: string;
    image_url: string | null;
    banner_url: string | null;
  }>(
    `select id, image_url, banner_url from events where id = $1 limit 1`,
    [data.id],
  );
  if (existing.length === 0) throw new Error("Event not found");

  const slug = await uniqueSlug(data.slug ?? slugify(data.title), data.id);

  let nextImageUrl = existing[0]!.image_url;
  let nextBannerUrl = existing[0]!.banner_url;
  const previousToDelete: string[] = [];
  if (data.imageUrl !== undefined) {
    const asserted = assertSafeImageUrl(data.imageUrl);
    if (asserted !== existing[0]!.image_url && existing[0]!.image_url) {
      previousToDelete.push(existing[0]!.image_url);
    }
    nextImageUrl = asserted;
  }
  if (data.bannerUrl !== undefined) {
    const asserted = assertSafeImageUrl(data.bannerUrl);
    if (asserted !== existing[0]!.banner_url && existing[0]!.banner_url) {
      previousToDelete.push(existing[0]!.banner_url);
    }
    nextBannerUrl = asserted;
  }

  const recurrence = normalizeRecurrence(data);
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
         recurrence_freq = $14,
         recurrence_interval = $15,
         recurrence_until = $16::timestamptz,
         recurrence_count = $17
       where id = $1
       returning ${EVENT_SELECT}`,
    [
      data.id,
      slug,
      data.title,
      data.description,
      data.location,
      data.ctaLabel,
      data.ctaUrl ?? null,
      nextImageUrl,
      nextBannerUrl,
      data.startsAt,
      data.endsAt ?? null,
      data.status,
      userId,
      recurrence.freq,
      recurrence.interval,
      recurrence.until,
      recurrence.count,
    ],
  );

  if (previousToDelete.length) {
    const { deleteEventImageFile } = await import("./upload.server");
    for (const path of previousToDelete) {
      // Never delete the other role's file if paths somehow collide.
      if (path === nextImageUrl || path === nextBannerUrl) continue;
      await deleteEventImageFile(path).catch(() => undefined);
    }
  }

  return mapRow(rows[0]!);
}

export async function deleteEventImpl(
  userId: string,
  id: string,
): Promise<{ ok: true }> {
  await requireStaff(userId);

  const sql = await getSql();
  const rows = await sql.query<{
    id: string;
    image_url: string | null;
    banner_url: string | null;
  }>(
    `delete from events where id = $1 returning id, image_url, banner_url`,
    [id],
  );
  if (rows.length === 0) throw new Error("Event not found");
  const { deleteEventImageFile } = await import("./upload.server");
  await deleteEventImageFile(rows[0]!.image_url).catch(() => undefined);
  await deleteEventImageFile(rows[0]!.banner_url).catch(() => undefined);
  return { ok: true };
}

export type UploadEventImageInput = {
  dataBase64: string;
  contentType: string;
  purpose?: "flyer" | "banner";
};

/** Staff-only: write image bytes to disk and return the public path (+ purpose aliases). */
export async function uploadEventImageImpl(
  userId: string,
  data: UploadEventImageInput,
) {
  await requireStaff(userId);
  const { saveEventImage } = await import("./upload.server");
  return saveEventImage(data);
}

/**
 * Soonest published event with startsAt >= now (public hero / homepage Events tile).
 * Server-only helper — call via getNextUpcomingPublishedEvent createServerFn from routes.
 */
export async function fetchNextUpcomingPublishedEvent(): Promise<CalendarEvent | null> {
  const sql = await getSql();
  const now = new Date();
  const rows = await sql.query<EventRow>(
    `select ${EVENT_SELECT}
     from events
     where status = 'published'
       and (
         starts_at >= $1::timestamptz
         or (
           recurrence_freq is not null
           and (recurrence_until is null or recurrence_until >= $1::timestamptz)
         )
       )
     order by starts_at asc, id asc
     limit 200`,
    [now.toISOString()],
  );
  let best: { at: Date; event: CalendarEvent } | null = null;
  for (const row of rows) {
    const event = mapRow(row);
    const at = nextOccurrenceOnOrAfter(event.startsAt, ruleOf(event), now);
    if (!at) continue;
    if (!best || at < best.at) best = { at, event };
  }
  return best?.event ?? null;
}

export type CalendarOccurrence = CalendarEvent & {
  occurrenceStartsAt: string;
  occurrenceEndsAt: string | null;
};

export async function listCalendarMonthImpl(month: string): Promise<{
  month: string;
  occurrences: CalendarOccurrence[];
}> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Invalid month");
  }
  const { from, to } = monthBounds(month);
  const sql = await getSql();
  const rows = await sql.query<EventRow>(
    `select ${EVENT_SELECT}
     from events
     where status = 'published'
       and (
         (
           recurrence_freq is null
           and starts_at >= $1::timestamptz
           and starts_at < $2::timestamptz
         )
         or (
           recurrence_freq is not null
           and starts_at < $2::timestamptz
           and (recurrence_until is null or recurrence_until >= $1::timestamptz)
         )
       )
     order by starts_at asc, id asc
     limit 500`,
    [from.toISOString(), to.toISOString()],
  );
  const occurrences: CalendarOccurrence[] = [];
  for (const row of rows) {
    const event = mapRow(row);
    const duration =
      event.endsAt == null
        ? null
        : new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime();
    for (const start of occurrenceInstants(event.startsAt, ruleOf(event), from, to)) {
      occurrences.push({
        ...event,
        occurrenceStartsAt: start.toISOString(),
        occurrenceEndsAt:
          duration == null ? null : new Date(start.getTime() + duration).toISOString(),
      });
    }
  }
  occurrences.sort((a, b) =>
    a.occurrenceStartsAt < b.occurrenceStartsAt
      ? -1
      : a.occurrenceStartsAt > b.occurrenceStartsAt
        ? 1
        : a.id < b.id
          ? -1
          : 1,
  );
  return { month, occurrences };
}

export { currentEtMonth };

/** Whether the current session can manage the calendar (staff or admin role). */
export async function canManageEventsImpl(): Promise<boolean> {
  try {
    const user = await getSessionUser();
    if (!user) return false;
    return ensureStaffAccess(user.id);
  } catch {
    return false;
  }
}
