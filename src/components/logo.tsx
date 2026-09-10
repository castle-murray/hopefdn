import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** Icon-only mark (transparent PNG provided by the foundation). */
export const HOPE_MARK_SRC = "/images/hope-mark.webp";

type LogoProps = {
  className?: string;
  variant?: "light" | "dark";
  showTagline?: boolean;
  /** Smaller mark + type for the sticky scrolled nav */
  compact?: boolean;
};

/**
 * Site logo: provided H.O.P.E. mark + text lockup (same layout as before).
 */
export function Logo({
  className,
  variant = "dark",
  showTagline = true,
  compact = false,
}: LogoProps) {
  const isLight = variant === "light";

  return (
    <Link
      to="/"
      className={cn(
        "group flex items-center no-underline outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-md transition-[gap] duration-300",
        compact ? "gap-2" : "gap-3",
        className,
      )}
      aria-label="H.O.P.E. Foundation home"
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition-all duration-300",
          compact ? "h-8 w-8" : "h-12 w-12",
          isLight
            ? "border-gold/80 bg-white/95"
            : "border-gold bg-white",
        )}
        aria-hidden
      >
        <img
          src={HOPE_MARK_SRC}
          alt=""
          className={cn(
            "object-contain transition-all duration-300",
            compact ? "h-6 w-6" : "h-10 w-10",
          )}
          width={80}
          height={80}
          decoding="async"
        />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "font-display font-semibold tracking-wide transition-all duration-300",
            compact ? "text-[1.15rem]" : "text-[1.65rem]",
            isLight ? "text-cream" : "text-navy",
          )}
        >
          H.O.P.E.
        </span>
        <span
          className={cn(
            "font-semibold uppercase tracking-[0.18em] transition-all duration-300",
            compact ? "text-[0.55rem]" : "text-[0.65rem]",
            isLight ? "text-gold-light" : "text-navy-soft",
          )}
        >
          Foundation Inc.
        </span>
        {showTagline && !compact ? (
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
