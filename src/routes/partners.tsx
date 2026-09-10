import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { partnerTiers, site } from "@/data/site";

export const Route = createFileRoute("/partners")({
  component: PartnersPage,
  head: () => ({
    meta: [{ title: "Partners & Sponsors | H.O.P.E. Foundation" }],
  }),
});

const tiers: { key: keyof typeof partnerTiers; label: string; accent: string }[] = [
  { key: "platinum", label: "Platinum Partners", accent: "text-gold-dark" },
  { key: "gold", label: "Gold Partners", accent: "text-gold" },
  { key: "silver", label: "Silver Partners", accent: "text-navy-soft" },
  { key: "bronze", label: "Bronze Partners", accent: "text-muted" },
];

function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Partners & Sponsors"
        title="Together, we go further"
        description="Meet the churches, businesses, unions, media, and civic leaders actively helping us make a difference in Hampton Roads."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)] sm:p-10">
            <h2 className="font-display text-3xl font-semibold text-navy">
              Become a partner
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              Partnerships power meals, shelter coordination, events, and Hope
              Community Haven. We welcome corporate sponsors, faith communities,
              labor organizations, media, and private donors at every level.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <a href={site.emailHref}>Partner With Us</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/donate">Make a Gift</Link>
              </Button>
            </div>
          </div>

          <div className="mt-14 space-y-12">
            {tiers.map((tier) => (
              <div key={tier.key}>
                <h3
                  className={`font-display text-2xl font-semibold ${tier.accent}`}
                >
                  {tier.label}
                </h3>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {partnerTiers[tier.key].map((name) => (
                    <li
                      key={name}
                      className="rounded-xl border border-border bg-ivory px-4 py-3.5 text-sm font-medium text-navy shadow-sm"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
