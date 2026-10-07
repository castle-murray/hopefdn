import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Heart, Home } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";

/**
 * The online store has been retired from this site. /legacy stays as the
 * store URL (nav links point here) and shows a simple Coming Soon page; old
 * store URLs redirect here (see src/lib/store-redirects.ts).
 */
export const Route = createFileRoute("/legacy")({
  component: StoreComingSoonPage,
  head: () => ({
    meta: [{ title: "Store Coming Soon | H.O.P.E. Foundation" }],
  }),
});

function StoreComingSoonPage() {
  return (
    <>
      <PageHero
        eyebrow="The Legacy Collection"
        title="Our store is coming soon"
        description="We're preparing a new home for H.O.P.E. Foundation merchandise. Please check back soon."
        align="center"
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="font-display text-2xl italic text-gold-dark sm:text-3xl">
            Thank you for your patience.
          </p>
          <p className="mt-4 text-muted leading-relaxed">
            In the meantime, you can still support the mission with a gift or
            join us at an upcoming event.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gold" size="lg">
              <Link to="/donate">
                <Heart className="size-4 fill-current" aria-hidden />
                Donate
              </Link>
            </Button>
            <Button asChild variant="default" size="lg">
              <Link to="/events">
                <Calendar className="size-4" aria-hidden />
                Upcoming Events
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/">
                <Home className="size-4" aria-hidden />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
