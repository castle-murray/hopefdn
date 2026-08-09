import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
};

export function PageHero({
  eyebrow,
  title,
  description,
  className,
  align = "left",
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden gradient-navy text-cream",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 section-ornament opacity-30" />
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      <div
        className={cn(
          "relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20",
          align === "center" && "text-center",
        )}
      >
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "mt-4 max-w-2xl text-base leading-relaxed text-cream/75 sm:text-lg",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        ) : null}
        <div
          className={cn(
            "mt-6 h-px w-24 bg-gradient-to-r from-gold to-transparent",
            align === "center" && "mx-auto",
          )}
        />
      </div>
    </section>
  );
}
