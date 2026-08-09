import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "light" | "dark";
  showTagline?: boolean;
};

export function Logo({
  className,
  variant = "dark",
  showTagline = true,
}: LogoProps) {
  const isLight = variant === "light";

  return (
    <Link
      to="/"
      className={cn(
        "group flex items-center gap-3 no-underline outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-md",
        className,
      )}
      aria-label="H.O.P.E. Foundation home"
    >
      <span
        className={cn(
          "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2",
          isLight
            ? "border-gold/80 bg-navy-deep/40"
            : "border-gold bg-navy text-gold",
        )}
        aria-hidden
      >
        <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
          <path
            d="M24 38c-1.2 0-14-8.2-14-17.2C10 14.6 14.5 11 19.2 11c2.6 0 4.5 1.2 4.8 1.4.3-.2 2.2-1.4 4.8-1.4C33.5 11 38 14.6 38 20.8 38 29.8 25.2 38 24 38z"
            className={isLight ? "fill-gold" : "fill-gold"}
            opacity="0.25"
          />
          <path
            d="M16 26c2.5-1 5-4 6.5-7.5M32 26c-2.5-1-5-4-6.5-7.5"
            stroke="currentColor"
            className={isLight ? "stroke-gold" : "stroke-gold"}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M15 28c3 4 6.5 6.5 9 7.5 2.5-1 6-3.5 9-7.5"
            stroke="currentColor"
            className={isLight ? "stroke-gold" : "stroke-gold"}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M24 14v6M21 17h6"
            stroke="currentColor"
            className={isLight ? "stroke-cream" : "stroke-cream"}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.65rem] font-semibold tracking-wide",
            isLight ? "text-cream" : "text-navy",
          )}
        >
          H.O.P.E.
        </span>
        <span
          className={cn(
            "text-[0.65rem] font-semibold uppercase tracking-[0.18em]",
            isLight ? "text-gold-light" : "text-navy-soft",
          )}
        >
          Foundation Inc.
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-1 hidden text-[0.62rem] font-medium tracking-wide sm:block",
              isLight ? "text-cream/70" : "text-muted",
            )}
          >
            Helping Others. Pursuing Excellence.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
