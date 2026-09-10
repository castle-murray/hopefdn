import { createFileRoute, Link } from "@tanstack/react-router";
import { HandHeart, Heart, Users } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { pledges, site } from "@/data/site";

export const Route = createFileRoute("/get-involved")({
  component: GetInvolvedPage,
  head: () => ({
    meta: [{ title: "Get Involved | H.O.P.E. Foundation" }],
  }),
});

function GetInvolvedPage() {
  return (
    <>
      <PageHero
        eyebrow="Get Involved"
        title="Volunteer. Partner. Serve. Make a difference."
        description="There are many ways to build legacy with H.O.P.E.—from a single shift to a lifelong partnership."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <InvolveCard
              icon={<Users className="size-6" />}
              title="Volunteer"
              body="Serve at events, meal service, resource days, and special campaigns. Your time is a gift that multiplies."
              href="#volunteer"
              cta="Learn how"
            />
            <InvolveCard
              icon={<Heart className="size-6" />}
              title="Give"
              body="One-time gifts and monthly pledges fund shelter, meals, IDs, training, and care for our guests."
              href="/donate"
              cta="Donate now"
            />
            <InvolveCard
              icon={<HandHeart className="size-6" />}
              title="Partner"
              body="Churches, businesses, and civic groups amplify our reach. Join a growing family of sponsors."
              href="/partners"
              cta="Become a partner"
            />
          </div>
        </div>
      </section>

      <section id="volunteer" className="scroll-mt-28 bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
            <img
              src="/images/get-involved-w800.webp"
              srcSet="/images/get-involved-w800.webp 800w, /images/get-involved-w1200.webp 1200w"
              sizes="(max-width: 1024px) 100vw, 50vw"
              alt="Diverse hands joined together in community service"
              width={1200}
              height={900}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold text-navy">
              Volunteer with HOPE
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              Whether you can serve once a month or join our event teams, we
              have a place for your gifts. Volunteers help with hospitality,
              logistics, guest welcome, meal prep, fundraising events, and more.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              {[
                "Event support (Derby Dreams, 5K, Gala, Health Fair)",
                "Meal service and hospitality",
                "Resource day assistance",
                "Professional skills (legal, medical, education, media)",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild variant="default" size="lg" className="mt-8">
              <a href={site.emailHref}>Email to Volunteer</a>
            </Button>
          </div>
        </div>
      </section>

      <section id="pledge" className="scroll-mt-28 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
              Personal Partners Program
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
              Monthly pledges that sustain HOPE
            </h2>
            <p className="mt-4 text-muted">
              Your pledge helps provide home-cooked meals, skill training,
              Virginia DMV IDs, health screenings, Medicaid/Medicare navigation,
              GEDs, veteran services, safe overnight shelter, and much more.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pledges.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[var(--shadow-elevated)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-dark">
                  {p.name}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-navy">
                  ${p.monthly}
                  <span className="text-base font-normal text-muted">/mo</span>
                </p>
                <p className="mt-1 text-xs text-muted">${p.yearly} / year</p>
                <p className="mt-4 text-sm font-semibold text-navy group-hover:text-gold-dark">
                  Pledge Today →
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function InvolveCard({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  const isInternal = href.startsWith("/");
  const content = (
    <>
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cream text-gold-dark">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-2xl font-semibold text-navy">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</p>
      <span className="mt-5 text-sm font-semibold text-gold-dark">{cta} →</span>
    </>
  );

  if (isInternal) {
    return (
      <Link
        to={href}
        className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition hover:border-gold/40"
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition hover:border-gold/40"
    >
      {content}
    </a>
  );
}
