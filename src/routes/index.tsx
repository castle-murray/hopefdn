import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  FileText,
  Heart,
  HeartHandshake,
  HeartPulse,
  HelpCircle,
  Home,
  Package,
  Phone,
  Shield,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { impactStats, site } from "@/data/site";
import { listEvents } from "@/lib/events/server";
import {
  formatEventDate,
  formatEventTimeRange,
} from "@/lib/events/format";
import {
  CARD_SRCSET_WIDTHS,
  imgSrcSet,
} from "@/lib/images";
import { getShopVisibility } from "@/lib/shop/server";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [list, shop] = await Promise.all([
      listEvents({
        data: {
          from: new Date().toISOString(),
          limit: 4,
        },
      }),
      getShopVisibility().catch(() => ({
        publicEnabled: false,
        canAccess: false,
      })),
    ]);
    return {
      events: list.events,
      shopPublic: shop.publicEnabled,
    };
  },
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

/** Guest-facing shortcuts under the hero → every subject on /need-help-now. */
const guestHelpLinks = [
  {
    hash: "shelter",
    label: "Shelter",
    icon: Home,
    iconClass: "bg-[#dbeafe] text-[#2563eb]",
  },
  {
    hash: "food",
    label: "Food",
    icon: Utensils,
    iconClass: "bg-[#ffedd5] text-[#ea580c]",
  },
  {
    hash: "documents",
    label: "IDs / Docs",
    icon: FileText,
    iconClass: "bg-[#ede9fe] text-[#7c3aed]",
  },
  {
    hash: "counseling",
    label: "Counseling",
    icon: HeartHandshake,
    iconClass: "bg-[#ffe4e6] text-[#e11d48]",
  },
  {
    hash: "supplies",
    label: "Supplies",
    icon: Package,
    iconClass: "bg-[#d1fae5] text-[#059669]",
  },
  {
    hash: "jobs",
    label: "Jobs",
    icon: Briefcase,
    iconClass: "bg-[#fef3c7] text-[#d97706]",
  },
  {
    hash: "benefits",
    label: "Benefits",
    icon: HeartPulse,
    iconClass: "bg-[#fce7f3] text-[#db2777]",
  },
  {
    hash: "veterans",
    label: "Veterans",
    icon: Shield,
    iconClass: "bg-[#e0e7ff] text-[#4f46e5]",
  },
  {
    hash: "other",
    label: "Other",
    icon: HelpCircle,
    iconClass: "bg-[#f1f5f9] text-[#475569]",
  },
] as const;

function HomePage() {
  const { events, shopPublic } = Route.useLoaderData();
  return (
    <>
      {/* Hero — hug photo with mockup headline; no scrim, no CTAs on the image */}
      <section className="relative min-h-[min(78vh,640px)] overflow-hidden bg-navy sm:min-h-[min(72vh,640px)]">
        <img
          src="/images/hero-hug-w1280.webp"
          srcSet="/images/hero-hug-w800.webp 800w, /images/hero-hug-w1280.webp 1280w, /images/hero-hug.webp 1360w"
          sizes="100vw"
          alt="Two people sharing a supportive embrace outdoors"
          width={1360}
          height={768}
          className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
          fetchPriority="high"
          decoding="async"
        />

        <div className="relative mx-auto flex min-h-[min(78vh,640px)] max-w-7xl flex-col justify-center px-4 py-14 sm:min-h-[min(72vh,640px)] sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="max-w-2xl text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]">
            <h1 className="font-hero text-[3.25rem] font-normal leading-[1.05] tracking-wide text-balance sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              You are
              <span className="mt-1 block sm:mt-2">Not alone</span>
            </h1>
            <p className="mt-5 max-w-lg text-base font-semibold leading-snug tracking-wide sm:mt-6 sm:text-lg lg:text-xl">
              Food. Resources. Support.
              <br />
              A Brighter Tomorrow
            </p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/95 sm:text-base lg:text-lg">
              H.O.P.E meets people where they are and helps them take the next
              step.
            </p>
          </div>
        </div>
      </section>

      {/* Guest help shortcuts — one card per Need Help Now subject */}
      <section className="relative z-10 bg-ivory pb-8 pt-2 sm:pb-10 sm:pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mx-auto mb-4 w-fit rounded-xl gradient-gold px-5 py-2 text-center font-display text-2xl font-semibold tracking-tight text-black sm:mb-5 sm:px-6 sm:py-2.5 sm:text-3xl">
            I need&hellip;
          </h2>
          <nav
            aria-label="Get help now"
            className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5 lg:grid-cols-9"
          >
            {guestHelpLinks.map(({ hash, label, icon: Icon, iconClass }) => (
              <Link
                key={hash}
                to="/need-help-now"
                hash={hash}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-black/5 bg-white px-2 py-4 text-center shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 active:scale-[0.99] sm:gap-3 sm:px-3 sm:py-5"
              >
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${iconClass}`}
                >
                  <Icon className="size-6 sm:size-7" strokeWidth={1.6} aria-hidden />
                </span>
                <span className="text-[0.75rem] font-semibold leading-snug tracking-tight text-slate-800 sm:text-[0.8rem] lg:text-[0.85rem]">
                  {label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex justify-center sm:mt-6">
            <Button
              asChild
              variant="default"
              size="lg"
              className="h-auto min-h-12 w-full max-w-xl gap-2 rounded-xl bg-navy px-5 py-3 text-center text-sm font-bold text-gold shadow-sm hover:bg-navy-mid hover:text-gold-light sm:w-auto sm:text-base"
            >
              <a href={site.phoneHref}>
                <Phone className="size-5 shrink-0" aria-hidden />
                I&apos;m not sure what I need — Talk to H.O.P.E.
              </a>
            </Button>
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

      {/* Who We Are — photo + copy from new-direction mockup */}
      <section className="bg-cream/60 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
            <img
              src="/images/who-we-are-w800.webp"
              srcSet={imgSrcSet("/images/who-we-are.webp", [
                ...CARD_SRCSET_WIDTHS,
              ])}
              sizes="(max-width: 1024px) 100vw, 50vw"
              alt="Guests and volunteers standing together outdoors at a H.O.P.E. gathering"
              width={1200}
              height={625}
              className="aspect-[16/9] w-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
              Who We Are
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-navy text-balance sm:text-4xl">
              Restoring Faith. Empowering Lives. Building Legacy.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              The H.O.P.E. Foundation exists to serve the underrepresented
              homeless population — our cherished guests. Operating under
              biblical principles, we provide shelter, meals, and essential
              services to the disadvantaged and homeless population of Hampton
              Roads. We are a 501(c)(3) nonprofit grounded in Christian love.
            </p>
            <p className="mt-5 font-display text-lg italic leading-relaxed text-navy sm:text-xl">
              &ldquo;When we focus on His goodness, His power, and His grace, we
              begin to change. We begin to be more like Jesus.{" "}
              <span className="font-semibold not-italic text-gold-dark">
                Inspiring Hope.
              </span>
              &rdquo;
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
                      {formatEventDate(event.startsAt)}
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
                  {formatEventTimeRange(event)}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {event.description}
                </p>
                <div className="mt-5">
                  <Button asChild variant="ghost" size="sm" className="px-0">
                    <Link to="/events">
                      {event.ctaLabel}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
            {events.length === 0 ? (
              <p className="text-sm text-muted md:col-span-2">
                More events will appear here as they are published.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Hope Community Haven campaign */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/resource-center-w800.webp"
            srcSet={imgSrcSet("/images/resource-center.webp", [
              ...CARD_SRCSET_WIDTHS,
            ])}
            sizes="100vw"
            alt="Vision for Hope Community Haven"
            width={1200}
            height={800}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-navy/85" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Capital Campaign
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cream text-balance sm:text-4xl lg:text-5xl">
              Help us build Hope Community Haven.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/75">
              Hope Community Haven will create a permanent place where guests
              can find shelter coordination, meals, counseling, IDs, training,
              and the full continuum of care—under one roof in {site.region}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link to="/hope-community-haven">Support the Campaign</Link>
              </Button>
              <Button asChild variant="outline-light" size="lg">
                <Link to="/donate">Give Today</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-cream/15 bg-cream/5 p-6 backdrop-blur-sm sm:p-8">
            <h3 className="font-display text-2xl text-gold-light">
              What the Haven will offer
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
            {shopPublic ? (
              <Button asChild variant="outline" size="lg">
                <Link to="/legacy">Shop Legacy Collection</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
