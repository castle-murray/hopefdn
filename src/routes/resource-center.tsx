import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Heart } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { resources, site } from "@/data/site";

export const Route = createFileRoute("/resource-center")({
  component: ResourceCenterPage,
  head: () => ({
    meta: [{ title: "Resource Center Campaign | H.O.P.E. Foundation" }],
  }),
});

function ResourceCenterPage() {
  return (
    <>
      <PageHero
        eyebrow="Resource Center Campaign"
        title="Help us build a home for HOPE"
        description="A permanent place where guests find shelter coordination, meals, documents, training, and care—under one roof."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
            <img
              src="/images/resource-center.jpg"
              alt="Vision for the HOPE community resource center"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">
              <Building2 className="size-3.5" aria-hidden />
              Capital Campaign
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold text-navy sm:text-4xl">
              One roof. Full continuum of care.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              For ten years, H.O.P.E. has met guests where they are—often
              without a dedicated campus. The Resource Center will anchor our
              work: a welcoming hub for overnight shelter coordination, daily
              meals, document assistance, health resources, recovery support,
              education, and employment pathways.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Your gift toward the campaign builds infrastructure that multiplies
              every volunteer hour and partner dollar for decades to come.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <a
                  href={site.donateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Heart className="size-4 fill-current" aria-hidden />
                  Give to the Campaign
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={site.emailHref}>Talk to Our Team</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            Services the center will expand
          </h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <li
                key={r}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-navy shadow-sm"
              >
                {r}
              </li>
            ))}
          </ul>
          <div className="mt-12 rounded-2xl gradient-navy p-8 text-center text-cream sm:p-10">
            <p className="font-display text-2xl italic text-gold-light sm:text-3xl">
              {site.motto}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm text-cream/75">
              Join churches, businesses, and neighbors investing in a permanent
              home for hope in {site.region}.
            </p>
            <Button asChild variant="gold" size="lg" className="mt-6">
              <Link to="/donate">Support the Mission</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
