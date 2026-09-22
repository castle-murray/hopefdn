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
  /** Public path e.g. `/uploads/events/….webp`, or null when unset. */
  imageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  status: EventStatus;
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
