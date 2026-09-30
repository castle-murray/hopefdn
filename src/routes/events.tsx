import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Settings2 } from "lucide-react";
import { EventFlyerThumb } from "@/components/event-flyer-lightbox";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import {
  canManageEvents,
  getNextUpcomingMajorEvent,
  listCalendarMonth,
} from "@/lib/events/server";
import {
  currentEtMonth,
  daysInEtMonth,
  etDateKey,
  etWeekdayIndex,
  zonedDateTime,
} from "@/lib/events/recurrence";
import {
  formatEventDate,
  formatEventTimeRange,
} from "@/lib/events/format";
import type { CalendarEvent } from "@/lib/events/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Occurrence = CalendarEvent & {
  occurrenceStartsAt: string;
  occurrenceEndsAt: string | null;
};

export const Route = createFileRoute("/events")({
  loader: async () => {
    const month = currentEtMonth();
    const [calendar, canManage, majorEvent] = await Promise.all([
      listCalendarMonth({ data: { month } }),
      canManageEvents(),
      getNextUpcomingMajorEvent(),
    ]);
    return { calendar, canManage, majorEvent };
  },
  component: EventsPage,
  head: () => ({
    meta: [{ title: "Events | H.O.P.E. Foundation" }],
  }),
});

function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const index = mon! - 1 + delta;
  const year2 = year! + Math.floor(index / 12);
  const month0 = ((index % 12) + 12) % 12;
  return `${year2}-${String(month0 + 1).padStart(2, "0")}`;
}

function monthTitle(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(zonedDateTime(year!, mon!, 1, 12, 0, 0));
}

function EventsPage() {
  const loaded = Route.useLoaderData();
  const { canManage, majorEvent } = loaded;
  const [month, setMonth] = useState(loaded.calendar.month);
  const [occurrences, setOccurrences] = useState<Occurrence[]>(loaded.calendar.occurrences);
  const [selected, setSelected] = useState<string | null>(() => {
    const today = etDateKey(new Date().toISOString());
    return today.startsWith(loaded.calendar.month) ? today : null;
  });
  const [busy, setBusy] = useState(false);

  const heroUrl = majorEvent?.bannerUrl || null;

  const byDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const item of occurrences) {
      const key = etDateKey(item.occurrenceStartsAt);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [occurrences]);

  const cells = useMemo(() => {
    const [year, mon] = month.split("-").map(Number);
    const first = zonedDateTime(year!, mon!, 1, 12, 0, 0);
    const lead = etWeekdayIndex(first);
    const count = daysInEtMonth(month);
    const out: Array<{ key: string | null; day: number | null }> = [];
    for (let i = 0; i < lead; i += 1) out.push({ key: null, day: null });
    for (let day = 1; day <= count; day += 1) {
      const key = `${month}-${String(day).padStart(2, "0")}`;
      out.push({ key, day });
    }
    return out;
  }, [month]);

  const selectedItems = selected ? (byDay.get(selected) ?? []) : [];
  const todayKey = etDateKey(new Date().toISOString());

  async function go(delta: number) {
    const next = shiftMonth(month, delta);
    setBusy(true);
    try {
      const result = await listCalendarMonth({ data: { month: next } });
      setMonth(result.month);
      setOccurrences(result.occurrences);
      const today = etDateKey(new Date().toISOString());
      setSelected(today.startsWith(result.month) ? today : null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Events & Experiences"
        title="Signature moments that bring community together"
        description="From health fairs and derby days to 5Ks and black-tie galas—every event builds legacy and funds hope."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {heroUrl ? (
            <div className="mb-10 overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
              <img
                src={heroUrl}
                alt={`${majorEvent?.title ?? "Upcoming event"} — event banner`}
                width={1400}
                height={600}
                className="aspect-[21/9] w-full object-cover object-center"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          ) : null}

          {canManage ? (
            <div className="mb-8 flex justify-end">
              <Button asChild variant="outline" size="sm">
                <Link to="/events/manage">
                  <Settings2 className="size-4" aria-hidden />
                  Manage calendar
                </Link>
              </Button>
            </div>
          ) : null}

          <div id="event-calendar" className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-navy">{monthTitle(month)}</h2>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void go(-1)}>
                  <ChevronLeft className="size-4" aria-hidden />
                  Previous
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void go(1)}>
                  Next
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-muted sm:text-xs">
              {WEEKDAYS.map((label) => (
                <div key={label} className="py-2">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, index) => {
                if (!cell.key || cell.day == null) {
                  return <div key={`pad-${index}`} className="min-h-16 sm:min-h-24" />;
                }
                const items = byDay.get(cell.key) ?? [];
                const active = selected === cell.key;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelected(cell.key)}
                    className={`flex min-h-16 flex-col rounded-lg border p-1 text-left sm:min-h-24 sm:p-2 ${
                      active ? "border-gold bg-cream" : "border-border bg-background hover:border-gold"
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold sm:text-sm ${
                        cell.key === todayKey ? "text-gold-dark" : "text-navy"
                      }`}
                    >
                      {cell.day}
                    </span>
                    {items.slice(0, 2).map((item) => (
                      <span key={`${item.id}-${item.occurrenceStartsAt}`} className="mt-1 truncate text-[0.65rem] text-navy sm:text-xs">
                        {item.title}
                      </span>
                    ))}
                    {items.length > 2 ? (
                      <span className="text-[0.65rem] text-muted">+{items.length - 2}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            {!selected ? (
              <p className="text-sm text-muted">Choose a day to see that day’s events.</p>
            ) : selectedItems.length === 0 ? (
              <p className="text-sm text-muted">Nothing scheduled on {formatEventDate(zonedDateTime(Number(selected.slice(0, 4)), Number(selected.slice(5, 7)), Number(selected.slice(8, 10)), 12, 0, 0).toISOString())}.</p>
            ) : (
              <div className="grid gap-6">
                {selectedItems.map((event) => {
                  const timed = {
                    ...event,
                    startsAt: event.occurrenceStartsAt,
                    endsAt: event.occurrenceEndsAt,
                  };
                  return (
                    <article
                      key={`${event.id}-${event.occurrenceStartsAt}`}
                      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]"
                    >
                      {event.imageUrl ? (
                        <EventFlyerThumb src={event.imageUrl} title={event.title} />
                      ) : null}
                      <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
                        <div>
                          <h3 className="font-display text-2xl font-semibold text-navy">{event.title}</h3>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="size-4 text-gold-dark" aria-hidden />
                              {formatEventDate(event.occurrenceStartsAt)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="size-4 text-gold-dark" aria-hidden />
                              {formatEventTimeRange(timed)}
                            </span>
                            {event.location ? (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-4 text-gold-dark" aria-hidden />
                                {event.location}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{event.description}</p>
                        </div>
                        <div className="flex flex-col gap-2 md:items-end">
                          <Button asChild variant="default">
                            {event.ctaUrl ? (
                              <a href={event.ctaUrl} target="_blank" rel="noopener noreferrer">
                                {event.ctaLabel}
                              </a>
                            ) : (
                              <a href={site.emailHref}>{event.ctaLabel}</a>
                            )}
                          </Button>
                          {event.ticketUrl ? (
                            <Button asChild variant="outline" size="sm">
                              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                                Tickets
                              </a>
                            </Button>
                          ) : null}
                          <Button asChild variant="outline" size="sm">
                            <Link to="/get-involved">Volunteer</Link>
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-10 text-center text-sm text-muted">
            Calendar updates are shared on this site and social channels. Questions?{" "}
            <a href={site.emailHref} className="font-semibold text-gold-dark hover:underline">
              {site.email}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}

