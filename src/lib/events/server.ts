/**
 * Events RPC surface — safe to import from client routes/components.
 *
 * All DB / auth / staff logic lives in `./events.server.ts` and is only loaded
 * inside createServerFn handlers (server-side). Do not import `*.server` modules
 * from this file at the top level.
 *
 * HOPE-12 hotfix: tip `05b87e7` leaked DB client symbols into public assets
 * because routes imported a module that statically pulled the DB layer.
 * Mirror shop: thin createServerFn here + dynamic import of the heavy server module.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { CalendarEvent, EventListResult } from "./types";

const MAX_LIMIT = 100;

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
    const { listEventsImpl } = await import("./events.server");
    return listEventsImpl(data);
  });

const eventIdSchema = z.object({ id: z.string().min(1).max(128) });

export const getEvent = createServerFn({ method: "GET" })
  .validator((raw: unknown) => eventIdSchema.parse(raw))
  .handler(async ({ data }): Promise<CalendarEvent | null> => {
    const { getEventImpl } = await import("./events.server");
    return getEventImpl(data.id);
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
  /** Flyer: /uploads/events/… path after upload, or null to clear. Omit to leave unchanged on update. */
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),
  /** Banner/hero: separate from flyer. Same path rules. Omit to leave unchanged on update. */
  bannerUrl: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),
});

export const createEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => mutateSchema.parse(raw))
  .handler(async ({ data, context }): Promise<CalendarEvent> => {
    const { createEventImpl } = await import("./events.server");
    return createEventImpl(context.userId, data);
  });

const updateSchema = mutateSchema.extend({
  id: z.string().min(1).max(128),
});

export const updateEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => updateSchema.parse(raw))
  .handler(async ({ data, context }): Promise<CalendarEvent> => {
    const { updateEventImpl } = await import("./events.server");
    return updateEventImpl(context.userId, data);
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => eventIdSchema.parse(raw))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { deleteEventImpl } = await import("./events.server");
    return deleteEventImpl(context.userId, data.id);
  });

const uploadSchema = z.object({
  /** Raw base64 payload (no data: URL prefix). */
  dataBase64: z.string().min(1).max(7_500_000),
  contentType: z.string().min(3).max(100),
  /** flyer (default) → imageUrl; banner → bannerUrl. Same storage dir. */
  purpose: z.enum(["flyer", "banner"]).optional(),
});

/** Staff-only: write image bytes to disk and return the public path (+ purpose aliases). */
export const uploadEventImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => uploadSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { uploadEventImageImpl } = await import("./events.server");
    return uploadEventImageImpl(context.userId, data);
  });

/** Soonest published event with startsAt >= now (public hero / homepage Events tile). */
export const getNextUpcomingPublishedEvent = createServerFn({ method: "GET" }).handler(
  async (): Promise<CalendarEvent | null> => {
    const { fetchNextUpcomingPublishedEvent } = await import("./events.server");
    return fetchNextUpcomingPublishedEvent();
  },
);

/** Whether the current session can manage the calendar (staff or admin role). */
export const canManageEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    const { canManageEventsImpl } = await import("./events.server");
    return canManageEventsImpl();
  },
);
