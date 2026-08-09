import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, MapPin } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { events, site } from "@/data/site";

export const Route = createFileRoute("/events")({
  component: EventsPage,
  head: () => ({
    meta: [{ title: "Events | H.O.P.E. Foundation" }],
  }),
});

function EventsPage() {
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
              src="/images/events-derby.jpg"
              alt="Guests celebrating at a HOPE Foundation derby-style fundraiser"
              className="aspect-[21/9] w-full object-cover object-center"
            />
          </div>

          <div className="grid gap-6">
            {events.map((event, i) => (
              <article
                key={event.id}
                className="grid gap-6 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] md:grid-cols-[auto_1fr_auto] md:items-center md:p-8"
              >
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-xl gradient-navy text-center text-cream">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-gold">
                    2026
                  </span>
                  <span className="font-display text-2xl font-semibold leading-none">
                    {["Jul", "Aug", "Sep", "Oct"][i]}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-navy">
                    {event.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-4 text-gold-dark" aria-hidden />
                      {event.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4 text-gold-dark" aria-hidden />
                      {event.time}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4 text-gold-dark" aria-hidden />
                      {event.location}
                    </span>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                    {event.description}
                  </p>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  <Button asChild variant="default">
                    <a href={site.emailHref}>
                      {event.cta}
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/get-involved">Volunteer</Link>
                  </Button>
                </div>
              </article>
            ))}
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
