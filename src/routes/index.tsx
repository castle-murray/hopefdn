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
import { impactStats, quickLinks, site } from "@/data/site";
import { listEvents } from "@/lib/events/server";
import {
  formatEventDate,
  formatEventTimeRange,
} from "@/lib/events/format";
import {
  CARD_SRCSET_WIDTHS,
  imgSrcSet,
  QUICK_LINK_SIZES,
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
      // Public storefront flag — card stays visible either way; "Coming soon" when off.
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

const iconMap = {
  calendar: Calendar,
  "shopping-bag": ShoppingBag,
  "heart-handshake": HeartHandshake,
  building: Building2,
  users: Users,
} as const;

const heroBtn =
  "h-8 shrink-0 gap-1 rounded-full px-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.04em] sm:h-9 sm:px-3 sm:text-[0.65rem] [&_svg]:size-3";

const quickLinkCardClass =
  "group relative flex min-h-[11.5rem] overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)] transition sm:min-h-[13rem]";

function HomePage() {
  const { events, shopPublic } = Route.useLoaderData();
  return (
    <>
      {/* Hero — cream wash + dark type (stronger scrim on mobile for legibility) */}
      <section className="relative min-h-[min(78vh,640px)] overflow-hidden bg-ivory sm:min-h-[min(72vh,640px)]">
        <img
          src="/images/hero-community-w1280.webp"
          srcSet="/images/hero-community-w800.webp 800w, /images/hero-community-w1280.webp 1280w, /images/hero-community.webp 1728w"
          sizes="100vw"
          alt="H.O.P.E. Foundation volunteers and children sharing a joyful moment outdoors"
          width={1728}
          height={1152}
          className="absolute inset-0 h-full w-full object-cover object-[55%_40%] sm:object-[62%_42%]"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-overlay absolute inset-0" />

        <div className="relative mx-auto flex min-h-[min(78vh,640px)] max-w-7xl flex-col justify-center px-4 py-14 sm:min-h-[min(72vh,640px)] sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold-dark sm:mb-4 sm:text-sm">
              Building Legacy Through
            </p>
            <h1 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-navy text-balance sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
              Compassion,{" "}
              <span className="text-gold-dark">Dignity</span> &{" "}
              Community.
            </h1>
            <p className="mt-4 flex flex-wrap items-center gap-2 text-[0.95rem] text-navy/85 sm:mt-5 sm:text-lg">
              <Heart className="size-4 shrink-0 text-gold-dark" aria-hidden />
              <span>
                Celebrating{" "}
                <strong className="font-semibold text-gold-dark">
                  {site.yearsOfImpact} Years
                </strong>{" "}
                of Impact Across {site.region}.
              </span>
            </p>

          </div>

          {/* CTAs sit below the copy column so a single compact row has room to fit */}
          <div className="mt-5 flex flex-row flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 sm:mt-6 sm:gap-2 sm:overflow-visible">
            {/* Alternate gold / navy so CTAs stay readable over the photo wash */}
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
            <Button asChild variant="default" className={heroBtn}>
              <Link to="/impact">
                <Users aria-hidden />
                Explore Our Impact
              </Link>
            </Button>
            <Button asChild variant="gold" className={heroBtn}>
              <Link to="/events">
                <Calendar aria-hidden />
                Upcoming Events
              </Link>
            </Button>
            <Button asChild variant="default" className={heroBtn}>
              <Link to="/partners">
                <HeartHandshake aria-hidden />
                Become a Partner
              </Link>
            </Button>
          </div>

          {/* 10 Years commemorative seal — smaller / lower opacity on mobile so it doesn't fight copy */}
          <div className="pointer-events-none absolute bottom-4 right-2 scale-75 opacity-90 sm:bottom-10 sm:right-6 sm:scale-100 sm:opacity-100 lg:bottom-14 lg:right-10">
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
              const comingSoon =
                item.href === "/legacy" && !shopPublic;

              const media = (
                <>
                  <img
                    src={item.image.replace(/\.webp$/i, "-w800.webp")}
                    srcSet={imgSrcSet(item.image, [...CARD_SRCSET_WIDTHS])}
                    sizes={QUICK_LINK_SIZES}
                    alt=""
                    width={1200}
                    height={800}
                    className={
                      comingSoon
                        ? "absolute inset-0 h-full w-full object-cover"
                        : "absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    }
                    style={
                      "imagePosition" in item && item.imagePosition
                        ? { objectPosition: item.imagePosition }
                        : undefined
                    }
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="quick-link-overlay absolute inset-0" />
                  {comingSoon ? (
                    <span className="absolute right-3 top-3 z-10 rounded-full bg-gold px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-navy-deep shadow">
                      Coming soon
                    </span>
                  ) : null}
                  {/* Icon sits ~1/4 down on the right, separate from bottom copy */}
                  <span className="absolute right-3 top-1/4 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-navy-deep shadow">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="relative z-10 flex h-full w-full flex-col justify-end p-4">
                    <h2
                      className={
                        comingSoon
                          ? "font-display text-lg font-semibold leading-snug text-navy"
                          : "font-display text-lg font-semibold leading-snug text-navy transition group-hover:text-gold-dark"
                      }
                    >
                      {item.title}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-navy/80">
                      {comingSoon
                        ? "Merchandise that carries the mission — launching soon."
                        : item.description}
                    </p>
                  </div>
                </>
              );

              if (comingSoon) {
                return (
                  <div
                    key={item.href}
                    className={quickLinkCardClass}
                    aria-label={`${item.title}: Coming soon`}
                  >
                    {media}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`${quickLinkCardClass} hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]`}
                >
                  {media}
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
                src="/images/impact-counseling-w800.webp"
                srcSet={imgSrcSet("/images/impact-counseling.webp", [
                  ...CARD_SRCSET_WIDTHS,
                ])}
                sizes="(max-width: 1024px) 100vw, 50vw"
                alt="A HOPE counselor meeting with a guest in a welcoming community space"
                width={1200}
                height={900}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                decoding="async"
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
