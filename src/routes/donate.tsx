import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Heart } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { pledges, site } from "@/data/site";

export const Route = createFileRoute("/donate")({
  component: DonatePage,
  head: () => ({
    meta: [{ title: "Donate | H.O.P.E. Foundation" }],
  }),
});

function DonatePage() {
  return (
    <>
      <PageHero
        eyebrow="Support the Mission"
        title="Your gift restores hope"
        description="Every dollar helps provide shelter, meals, essential documents, training, and care for guests across Hampton Roads."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <a
              href={site.donateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl gradient-navy p-8 text-cream shadow-[var(--shadow-elevated)] transition hover:brightness-110 lg:col-span-2"
            >
              <Heart className="size-8 text-gold" aria-hidden />
              <h2 className="mt-4 font-display text-3xl font-semibold">
                Give online via GiveButter
              </h2>
              <p className="mt-3 max-w-lg text-cream/75">
                Secure one-time or recurring gifts. The fastest way to put
                resources in the hands of our guests today.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gold-light">
                Donate now
                <ExternalLink className="size-4" aria-hidden />
              </span>
            </a>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-xl font-semibold text-navy">
                Other ways to give
              </h3>
              <ul className="mt-4 space-y-4 text-sm">
                <li>
                  <a
                    href={site.cashApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gold-dark hover:underline"
                  >
                    Cash App: $hopefoundation1
                  </a>
                </li>
                <li>
                  <a
                    href={site.paypal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gold-dark hover:underline"
                  >
                    PayPal: hopefdn
                  </a>
                </li>
                <li className="text-muted">
                  <span className="font-semibold text-navy">Mail a check:</span>
                  <br />
                  {site.address.line1}
                  <br />
                  {site.address.line2}
                </li>
              </ul>
            </div>
          </div>

          <h3 className="mt-14 font-display text-2xl font-semibold text-navy">
            Monthly partner pledges
          </h3>
          <p className="mt-2 max-w-2xl text-muted">
            Sustainable monthly giving keeps programs running year-round. Choose
            a level that fits—every pledge honors our guests with dignity.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pledges.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-border bg-ivory p-5 transition hover:border-gold/50 hover:shadow-[var(--shadow-card)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-dark">
                  {p.name}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-navy">
                  ${p.monthly}
                  <span className="text-base font-normal text-muted">/mo</span>
                </p>
                <p className="mt-3 text-sm font-semibold text-navy">Pledge Today →</p>
              </a>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button asChild variant="outline">
              <Link to="/get-involved">Explore more ways to help</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
