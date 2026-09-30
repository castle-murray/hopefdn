export type EventStatus = "draft" | "published" | "cancelled";

/** Lean row returned to clients (JSON-safe ISO date strings). */
export type CalendarEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  ctaLabel: string;
  ctaUrl: string | null;
  /** Public http(s) ticket link, or null when unset. */
  ticketUrl: string | null;
  /** When true, this event can supply the public calendar banner. */
  majorEvent: boolean;
  /** Flyer/card public path e.g. `/uploads/events/….webp`, or null when unset. */
  imageUrl: string | null;
  /**
   * Wide banner/hero public path e.g. `/uploads/events/….webp`, or null when unset.
   * Separate from flyer `imageUrl`. Used by /events hero + homepage Events tile.
   */
  bannerUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  status: EventStatus;
  /** weekly or monthly. Null is a one-off. */
  recurrenceFreq: "weekly" | "monthly" | null;
  /** Step between occurrences. 1 for one-offs. */
  recurrenceInterval: number;
  /** Last occurrence may start through this instant. Null if unused. */
  recurrenceUntil: string | null;
  /** Includes the first occurrence. Null if unused. */
  recurrenceCount: number | null;
};

export type EventListResult = {
  events: CalendarEvent[];
  /** Pass as `cursor` on the next request for keyset pagination. */
  nextCursor: string | null;
  /** True when another page may exist. */
  hasMore: boolean;
};

export type ListEventsInput = {
  /** Inclusive lower bound (ISO). Defaults to "now" for public upcoming lists. */
  from?: string;
  /** Exclusive upper bound (ISO). */
  to?: string;
  /** Max rows (1–100). Default 50. */
  limit?: number;
  /**
   * Keyset cursor from a previous page: base64url of `startsAt|id`.
   * Prefer this over offset for large calendars.
   */
  cursor?: string;
  /** Include draft/cancelled (staff only). Default false. */
  includeAllStatuses?: boolean;
};

/**
 * Hero/tile image fallback: bannerUrl → imageUrl (flyer) → undefined.
 * Caller keeps the current static/default asset when undefined. Do not invent assets.
 */
export function resolveEventHeroUrl(
  event: Pick<CalendarEvent, "bannerUrl" | "imageUrl"> | null | undefined,
): string | undefined {
  if (!event) return undefined;
  return event.bannerUrl || event.imageUrl || undefined;
}
