import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { legacyProducts, site } from "@/data/site";

export const Route = createFileRoute("/legacy")({
  component: LegacyPage,
  head: () => ({
    meta: [{ title: "The Legacy Collection | H.O.P.E. Foundation" }],
  }),
});

function LegacyPage() {
  return (
    <>
      <PageHero
        eyebrow="The Legacy Collection"
        title="Wear the mission. Carry the legacy."
        description="Purpose-driven merchandise that funds guest services and sparks conversations about HOPE across Hampton Roads."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl bg-cream shadow-[var(--shadow-elevated)]">
              <img
                src="/images/legacy-tumbler.jpg"
                alt="HOPE Legacy Collection gold tumbler"
                className="mx-auto aspect-[3/4] max-h-[520px] w-full object-cover object-center"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Shop with purpose
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
                Every purchase fuels dignity
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted">
                The Legacy Collection turns everyday items into ambassadors for
                compassion. Proceeds support meals, shelter coordination, IDs,
                training, and the full continuum of care for our guests.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Whether you gift a tumbler, wear a mission polo, or gear up for
                the 5K, you help write the next decade of impact.
              </p>
              <Button asChild variant="gold" size="lg" className="mt-8">
                <a href={site.emailHref}>
                  <ShoppingBag className="size-4" aria-hidden />
                  Inquire About Orders
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="scroll-mt-28 bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            Featured pieces
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {legacyProducts.map((product) => (
              <article
                key={product.name}
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-cream">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-semibold text-navy">
                      {product.name}
                    </h3>
                    <span className="text-sm font-bold text-gold-dark">
                      {product.price}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {product.description}
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <a href={site.emailHref}>Request Item</a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center sm:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <p className="font-display text-2xl italic text-gold-dark">
            {site.motto}
          </p>
          <p className="mt-4 text-muted">
            Prefer a direct gift? 100% of donations go to mission programs.
          </p>
          <Button asChild variant="default" className="mt-6">
            <Link to="/donate">
              <Heart className="size-4 fill-current" aria-hidden />
              Donate Instead
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
