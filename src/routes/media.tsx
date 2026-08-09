import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Newspaper } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { events, site } from "@/data/site";

export const Route = createFileRoute("/media")({
  component: MediaPage,
  head: () => ({
    meta: [{ title: "Media & News | H.O.P.E. Foundation" }],
  }),
});

function MediaPage() {
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
                  {e.date}
                </p>
                <p className="mt-2 font-display text-lg font-semibold text-navy">
                  {e.title}
                </p>
                <p className="mt-1 text-sm text-muted">{e.location}</p>
              </div>
            ))}
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
