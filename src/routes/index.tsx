import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Calendar,
  Heart,
  HeartHandshake,
  HandHeart,
  ShoppingBag,
  Users,
} from "lucide-react";
import { AnniversaryBadge } from "@/components/anniversary-badge";
import { Button } from "@/components/ui/button";
import {
  events,
  impactStats,
  quickLinks,
  site,
} from "@/data/site";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      {
        title:
          "H.O.P.E. Foundation, Inc. | Building Legacy Through Compassion",
      },
    ],
  }),
});

const iconMap = {
  calendar: Calendar,
  "shopping-bag": ShoppingBag,
  "heart-handshake": HeartHandshake,
  building: Building2,
  users: Users,
} as const;

const heroBtn =
  "h-10 gap-1.5 rounded-full px-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] sm:h-11 sm:px-4 sm:text-[0.72rem] [&_svg]:size-3.5";

function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[min(88vh,820px)] overflow-hidden bg-navy-deep">
        <img
          src="/images/hero-community.jpg"
          alt="H.O.P.E. Foundation volunteers and children sharing a joyful moment outdoors"
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-deep/70 via-transparent to-navy-deep/20" />

        <div className="relative mx-auto flex min-h-[min(88vh,820px)] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-gold sm:text-sm">
              Building Legacy Through
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-cream text-balance sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
              Compassion,{" "}
              <span className="text-gold-light">Dignity</span> &{" "}
              Community.
            </h1>
            <p className="mt-5 flex flex-wrap items-center gap-2 text-base text-cream/85 sm:text-lg">
              <Heart className="size-4 text-gold" aria-hidden />
              <span>
                Celebrating{" "}
                <strong className="font-semibold text-gold-light">
                  {site.yearsOfImpact} Years
                </strong>{" "}
                of Impact Across {site.region}.
              </span>
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2.5">
              <Button asChild variant="gold" className={heroBtn}>
                <a
                  href={site.donateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HandHeart aria-hidden />
                  Support the Mission
                </a>
              </Button>
              <Button asChild variant="outline-light" className={heroBtn}>
                <Link to="/impact">
                  <Users aria-hidden />
                  Explore Our Impact
                </Link>
              </Button>
              <Button asChild variant="outline-light" className={heroBtn}>
                <Link to="/events">
                  <Calendar aria-hidden />
                  Upcoming Events
                </Link>
              </Button>
              <Button asChild variant="outline-light" className={heroBtn}>
                <Link to="/partners">
                  <HeartHandshake aria-hidden />
                  Become a Partner
                </Link>
              </Button>
            </div>
          </div>

          {/* 10 Years commemorative seal — matches mockup medallion */}
          <div className="pointer-events-none absolute bottom-6 right-3 sm:bottom-10 sm:right-6 lg:bottom-14 lg:right-10">
            <AnniversaryBadge />
          </div>
        </div>
      </section>

      {/* Quick links strip */}
      <section className="relative z-10 -mt-8 pb-4 sm:-mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {quickLinks.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={item.image}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-navy/10" />
                    <span className="absolute bottom-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gold text-navy-deep shadow">
                      <Icon className="size-4" aria-hidden />
                    </span>
                  </div>
                  <div className="p-4">
                    <h2 className="font-display text-lg font-semibold text-navy group-hover:text-gold-dark">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-2xl gradient-navy p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4 lg:p-10">
            {impactStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-cream/10 bg-cream/5 px-5 py-6 text-center"
              >
                <p className="font-display text-4xl font-semibold text-gold-light sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-cream/70">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission block */}
      <section className="bg-cream/60 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="relative">
            <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
              <img
                src="/images/impact-counseling.jpg"
                alt="A HOPE counselor meeting with a guest in a welcoming resource center"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -right-2 max-w-[220px] rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:-right-4">
              <p className="font-display text-lg italic text-navy">
                &ldquo;Inspiring hope—one act of kindness at a time.&rdquo;
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
              Who We Are
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-navy text-balance sm:text-4xl">
              Restoring faith. Empowering lives. Building legacy.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              H.O.P.E. Foundation, Inc. serves the under-represented homeless
              population of {site.region}—our cherished guests. Grounded in
              Christian love, we provide shelter, meals, and a full spectrum of
              essential resources so every person can pursue excellence with
              dignity.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              When we focus on His goodness, His power, and His grace, we begin
              to change. We begin to be more like Jesus.{" "}
              <strong className="font-semibold text-navy">Inspiring hope.</strong>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="default" size="lg">
                <Link to="/about">
                  About the Foundation
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/impact">See Our Programs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Community Calendar
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
                Upcoming Events
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/events">
                View All Events
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {events.map((event) => (
              <article
                key={event.id}
                className="group flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition hover:border-gold/40 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">
                      {event.date}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-semibold text-navy group-hover:text-gold-dark sm:text-2xl">
                      {event.title}
                    </h3>
                  </div>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-gold-dark">
                    <Calendar className="size-4" aria-hidden />
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {event.time} · {event.location}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {event.description}
                </p>
                <div className="mt-5">
                  <Button asChild variant="ghost" size="sm" className="px-0">
                    <Link to="/events">
                      {event.cta}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Resource center campaign */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/resource-center.jpg"
            alt="Modern community resource center building"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-navy/85" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Capital Campaign
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cream text-balance sm:text-4xl lg:text-5xl">
              Help us build a home for HOPE.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/75">
              The Resource Center Campaign will create a permanent place where
              guests can find shelter coordination, meals, counseling, IDs,
              training, and the full continuum of care—under one roof in{" "}
              {site.region}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link to="/resource-center">Support the Campaign</Link>
              </Button>
              <Button asChild variant="outline-light" size="lg">
                <Link to="/donate">Give Today</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-cream/15 bg-cream/5 p-6 backdrop-blur-sm sm:p-8">
            <h3 className="font-display text-2xl text-gold-light">
              What the center will offer
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-cream/80">
              {[
                "Safe overnight shelter coordination",
                "Daily home-cooked meals",
                "Document & ID assistance",
                "Health, mental health & recovery resources",
                "GED, skills training & job pathways",
                "Veteran and family support services",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Heart className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="font-display text-2xl italic text-gold-dark sm:text-3xl">
            {site.motto}
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-navy text-balance sm:text-4xl">
            Your partnership changes lives today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Volunteer, become a monthly partner, shop the Legacy Collection, or
            make a gift. Every act of compassion builds lasting legacy in{" "}
            {site.region}.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gold" size="lg">
              <a
                href={site.donateUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Heart className="size-4 fill-current" aria-hidden />
                Donate Now
              </a>
            </Button>
            <Button asChild variant="default" size="lg">
              <Link to="/get-involved">Get Involved</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/legacy">Shop Legacy Collection</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
