import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, MapPin, Settings2 } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import { canManageEvents, listEvents } from "@/lib/events/server";
import {
  formatEventDate,
  formatEventDay,
  formatEventMonth,
  formatEventTimeRange,
} from "@/lib/events/format";

export const Route = createFileRoute("/events")({
  loader: async () => {
    const [list, canManage] = await Promise.all([
      listEvents({
        data: {
          // Far window so signature multi-month calendars still load in one page;
          // keyset pagination is available via nextCursor if needed.
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          limit: 50,
        },
      }),
      canManageEvents(),
    ]);
    return { list, canManage };
  },
  component: EventsPage,
  head: () => ({
    meta: [{ title: "Events | H.O.P.E. Foundation" }],
  }),
});

function EventsPage() {
  const { list, canManage } = Route.useLoaderData();
  const { events } = list;

  return (
    <>
      <PageHero
        eyebrow="Events & Experiences"
        title="Signature moments that bring community together"
        description="From health fairs and derby days to 5Ks and black-tie galas—every event builds legacy and funds hope."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
            <img
              src="/images/events-experiences-w800.webp"
              srcSet="/images/events-experiences-w800.webp 800w, /images/events-experiences-w1200.webp 1200w, /images/events-experiences.webp 1400w"
              sizes="100vw"
              alt="Guests in festive hats celebrating at a HOPE Foundation community event"
              width={1400}
              height={600}
              className="aspect-[21/9] w-full object-cover object-[22%_32%]"
              fetchPriority="high"
              decoding="async"
            />
          </div>

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

          {events.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-[var(--shadow-card)]">
              <p className="font-display text-xl text-navy">No upcoming events yet</p>
              <p className="mt-2 text-sm text-muted">
                Check back soon, or contact us for the latest schedule.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="grid gap-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] md:grid-cols-[auto_1fr_auto] md:items-center"
                >
                  {event.imageUrl ? (
                    <div className="md:col-span-3">
                      <img
                        src={event.imageUrl}
                        alt=""
                        className="aspect-[21/9] w-full object-cover sm:aspect-[3/1]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-6 p-6 md:col-span-3 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:p-8">
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-xl gradient-navy text-center text-cream">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-gold">
                        {formatEventMonth(event.startsAt)}
                      </span>
                      <span className="font-display text-2xl font-semibold leading-none">
                        {formatEventDay(event.startsAt)}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-navy">
                        {event.title}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-4 text-gold-dark" aria-hidden />
                          {formatEventDate(event.startsAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-4 text-gold-dark" aria-hidden />
                          {formatEventTimeRange(event)}
                        </span>
                        {event.location ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-4 text-gold-dark" aria-hidden />
                            {event.location}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                        {event.description}
                      </p>
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
                      <Button asChild variant="outline" size="sm">
                        <Link to="/get-involved">Volunteer</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

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
