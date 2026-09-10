import { Link } from "@tanstack/react-router";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shared 404 UI for TanStack Router (root + defaultNotFoundComponent).
 */
export function NotFoundComponent() {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-border bg-cream text-gold-dark shadow-[var(--shadow-card)]">
        <SearchX className="size-7" aria-hidden />
      </span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
        404
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
        That link may be outdated, mistyped, or the page may have moved. Head
        home to keep exploring the mission.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="gold">
          <Link to="/">
            <Home className="size-4" aria-hidden />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/about">About HOPE</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/events">Events</Link>
        </Button>
      </div>
    </section>
  );
}
