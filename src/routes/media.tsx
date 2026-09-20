import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Mic2, Newspaper } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import { listEvents } from "@/lib/events/server";
import { formatEventDate } from "@/lib/events/format";

export const Route = createFileRoute("/media")({
  loader: async () => {
    const list = await listEvents({
      data: { from: new Date().toISOString(), limit: 4 },
    });
    return { events: list.events };
  },
  component: MediaPage,
  head: () => ({
    meta: [{ title: "Media & News | H.O.P.E. Foundation" }],
  }),
});

function MediaPage() {
  const { events } = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow="Media & News"
        title="Stories from the field"
        description="Press, updates, and highlights from a decade of impact across Hampton Roads."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] lg:col-span-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">
                <Newspaper className="size-4" aria-hidden />
                Feature
              </div>
              <h2 className="mt-3 font-display text-3xl font-semibold text-navy">
                Celebrating 10 years of impact & legacy
              </h2>
              <p className="mt-4 text-muted leading-relaxed">
                Since founding, H.O.P.E. Foundation has walked with guests through
                meals, shelter coordination, document recovery, training, and
                spiritual encouragement. In 2026 we mark a decade of building
                legacy through compassion, dignity, and community—and invite
                media and neighbors to join the celebration.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <a href={site.emailHref}>Media Inquiries</a>
              </Button>
            </article>

            <aside className="rounded-2xl gradient-navy p-6 text-cream">
              <h3 className="font-display text-xl text-gold-light">Press kit</h3>
              <ul className="mt-4 space-y-3 text-sm text-cream/80">
                <li>Organization: {site.name}</li>
                <li>Tagline: {site.tagline}</li>
                <li>Motto: {site.motto}</li>
                <li>Region: {site.region}, Virginia</li>
                <li>
                  Contact:{" "}
                  <a href={site.emailHref} className="text-gold-light hover:underline">
                    {site.email}
                  </a>
                </li>
                <li>
                  Phone:{" "}
                  <a href={site.phoneHref} className="text-gold-light hover:underline">
                    {site.phone}
                  </a>
                </li>
              </ul>
            </aside>
          </div>

          <Link
            to="/nobody-asked-me"
            className="group mt-10 flex flex-col gap-6 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[var(--shadow-elevated)] sm:flex-row sm:items-center sm:p-8"
          >
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold text-navy-deep shadow">
              <Mic2 className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Podcast · Coming Soon
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-navy transition group-hover:text-gold-dark sm:text-3xl">
                Nobody Asked Me
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                Honest conversations about hope, dignity, and the stories that
                shape our community—launching soon from H.O.P.E. Foundation.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold-dark">
              Learn more
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>

          <h3 className="mt-14 font-display text-2xl font-semibold text-navy">
            On the calendar
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {events.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-border bg-surface p-5 shadow-sm"
              >
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-gold-dark">
                  <Calendar className="size-3.5" aria-hidden />
                  {formatEventDate(e.startsAt)}
                </p>
                <p className="mt-2 font-display text-lg font-semibold text-navy">
                  {e.title}
                </p>
                <p className="mt-1 text-sm text-muted">{e.location}</p>
              </div>
            ))}
            {events.length === 0 ? (
              <p className="text-sm text-muted sm:col-span-2">
                No upcoming events on the calendar right now.
              </p>
            ) : null}
          </div>

          <div className="mt-10 text-center">
            <Button asChild variant="default">
              <Link to="/events">Full Events Calendar</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
