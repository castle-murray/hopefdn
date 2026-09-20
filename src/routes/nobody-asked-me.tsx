import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mic2 } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/nobody-asked-me")({
  component: NobodyAskedMePage,
  head: () => ({
    meta: [{ title: "Nobody Asked Me | H.O.P.E. Foundation" }],
  }),
});

function NobodyAskedMePage() {
  return (
    <>
      <PageHero
        eyebrow="Podcast"
        title="Nobody Asked Me"
        description="Honest conversations about hope, dignity, and the stories that shape our community—coming soon from H.O.P.E. Foundation."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-navy-deep shadow-[var(--shadow-card)]">
            <Mic2 className="size-7" aria-hidden />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Coming Soon
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-navy text-balance sm:text-4xl">
            A new voice for hope is on the way.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted">
            <strong className="font-semibold text-navy">Nobody Asked Me</strong>{" "}
            is a podcast from H.O.P.E. Foundation—warm, candid conversations
            with guests, partners, and neighbors about faith, service, and the
            quiet courage it takes to rebuild a life with dignity.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
            We are preparing the first episodes. Check back here for listen
            links, show notes, and ways to join the conversation.
          </p>

          <div className="mt-10 rounded-2xl border border-border bg-surface p-8 text-left shadow-[var(--shadow-card)] sm:p-10">
            <h3 className="font-display text-xl font-semibold text-navy">
              What to expect
            </h3>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
              <li className="flex gap-3">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                  aria-hidden
                />
                Stories of hope from Hampton Roads and beyond
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                  aria-hidden
                />
                Conversations that honor every guest as a person of worth
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                  aria-hidden
                />
                Reflections on compassion, community, and legacy
              </li>
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild variant="default" size="lg">
              <Link to="/">
                Back to Home
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/media">Media &amp; News</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
