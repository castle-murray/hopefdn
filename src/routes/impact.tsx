import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { impactStats, resources, site } from "@/data/site";

export const Route = createFileRoute("/impact")({
  component: ImpactPage,
  head: () => ({
    meta: [{ title: "Our Impact | H.O.P.E. Foundation" }],
  }),
});

function ImpactPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Impact"
        title="Real stories. Real change. Real HOPE."
        description={`See how comprehensive programs and compassionate partnership are transforming lives across ${site.region}.`}
      />

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {impactStats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-surface p-6 text-center shadow-[var(--shadow-card)]"
              >
                <p className="font-display text-4xl font-semibold text-gold-dark">
                  {s.value}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
            <img
              src="/images/impact-counseling.jpg"
              alt="Counselor supporting a guest at HOPE"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
              Strengthening individuals. Restoring families.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              Every resource we offer is designed to remove barriers and open
              doors—so guests can pursue excellence with dignity. From the first
              meal to a path toward housing, work, and wellness, HOPE walks
              alongside.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Our impact is measured not only in meals served or documents
              obtained, but in restored faith in humanity—and in the lasting
              legacy of kindness across {site.region}.
            </p>
            <Button asChild variant="default" className="mt-8">
              <Link to="/get-involved">
                Join the Mission
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="programs" className="scroll-mt-28 bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
              Programs & Services
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
              A continuum of care for our guests
            </h2>
            <p className="mt-4 text-muted">
              Operating under biblical principles, we are blessed to provide a
              full range of resources—practical, educational, and restorative.
            </p>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 shadow-sm"
              >
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0 text-gold-dark"
                  aria-hidden
                />
                <span className="text-sm font-medium text-navy">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-navy">
            Help write the next chapter of impact
          </h2>
          <p className="mt-4 text-muted">
            Your gift, time, or partnership multiplies every story of hope we
            celebrate.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gold" size="lg">
              <Link to="/donate">Donate</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/partners">Partner With Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
