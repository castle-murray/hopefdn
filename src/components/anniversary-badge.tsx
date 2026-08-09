import { site } from "@/data/site";
import { cn } from "@/lib/utils";

type AnniversaryBadgeProps = {
  className?: string;
  size?: "md" | "lg";
};

/**
 * Commemorative seal matching the HOPE mockup:
 * multi-ring gold medallion, cream face, navy "10", stacked legacy copy.
 */
export function AnniversaryBadge({
  className,
  size = "lg",
}: AnniversaryBadgeProps) {
  const dim =
    size === "lg"
      ? "h-[9.5rem] w-[9.5rem] sm:h-[10.5rem] sm:w-[10.5rem] lg:h-[11.5rem] lg:w-[11.5rem]"
      : "h-28 w-28";

  return (
    <div
      className={cn("relative shrink-0 select-none", dim, className)}
      role="img"
      aria-label={`Celebrating ${site.yearsOfImpact} years of impact and legacy`}
    >
      {/* Soft gold glow */}
      <div
        className="pointer-events-none absolute -inset-2 rounded-full opacity-70 blur-md"
        style={{
          background:
            "radial-gradient(circle, rgb(201 162 39 / 0.55) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Outer metallic ring */}
      <div
        className="absolute inset-0 rounded-full p-[3px] shadow-[0_8px_28px_rgb(11_29_58/0.35),0_2px_8px_rgb(201_162_39/0.45)]"
        style={{
          background:
            "conic-gradient(from 210deg, #8a6d12, #f0d78a, #c9a227, #6f5610, #e8c96a, #a6841c, #f5e2a8, #8a6d12)",
        }}
      >
        {/* Mid ring (navy trim like a seal edge) */}
        <div className="h-full w-full rounded-full bg-navy p-[2px]">
          {/* Inner gold ring */}
          <div
            className="h-full w-full rounded-full p-[3px]"
            style={{
              background:
                "linear-gradient(145deg, #f0d78a 0%, #c9a227 40%, #8a6d12 70%, #dfc15a 100%)",
            }}
          >
            {/* Face */}
            <div
              className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-full px-2 text-center"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, #fffdf6 0%, #f7f0dc 45%, #efe2b8 100%)",
                boxShadow:
                  "inset 0 1px 0 rgb(255 255 255 / 0.9), inset 0 -6px 14px rgb(166 132 28 / 0.18)",
              }}
            >
              {/* subtle inner dashed ring */}
              <div
                className="pointer-events-none absolute inset-[7px] rounded-full border border-dashed border-gold/35"
                aria-hidden
              />

              {/* decorative diamond */}
              <svg
                className="relative z-[1] mb-0.5 h-2 w-2 text-gold-dark"
                viewBox="0 0 8 8"
                aria-hidden
              >
                <path d="M4 0L8 4L4 8L0 4Z" fill="currentColor" />
              </svg>

              <span className="relative z-[1] text-[0.55rem] font-bold uppercase tracking-[0.22em] text-gold-dark sm:text-[0.62rem]">
                Celebrating
              </span>

              <span
                className="relative z-[1] font-display text-[2.75rem] font-bold leading-[0.9] tracking-tight text-navy sm:text-[3.15rem] lg:text-[3.4rem]"
                style={{ textShadow: "0 1px 0 rgb(255 255 255 / 0.6)" }}
              >
                {site.yearsOfImpact}
              </span>

              <span className="relative z-[1] mt-0.5 text-[0.58rem] font-bold uppercase leading-[1.15] tracking-[0.14em] text-navy sm:text-[0.65rem]">
                Years
              </span>
              <span className="relative z-[1] text-[0.48rem] font-semibold uppercase leading-[1.2] tracking-[0.12em] text-navy-soft sm:text-[0.55rem]">
                of Impact
              </span>
              <span className="relative z-[1] text-[0.48rem] font-semibold uppercase leading-[1.2] tracking-[0.12em] text-navy-soft sm:text-[0.55rem]">
                & Legacy
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
