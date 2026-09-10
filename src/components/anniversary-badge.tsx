import { site } from "@/data/site";
import { cn } from "@/lib/utils";

type AnniversaryBadgeProps = {
  className?: string;
  size?: "md" | "lg";
};

/**
 * Commemorative seal — uses the provided badge artwork with a CSS lens flare
 * layered on the top / top-left (true alpha, so the gold can still glint).
 */
export function AnniversaryBadge({
  className,
  size = "lg",
}: AnniversaryBadgeProps) {
  const dim =
    size === "lg"
      ? "h-[9.5rem] w-[10rem] sm:h-[11rem] sm:w-[11.6rem] lg:h-[12.5rem] lg:w-[13.2rem]"
      : "h-28 w-[7.4rem]";

  return (
    <div
      className={cn("relative shrink-0 select-none", dim, className)}
      role="img"
      aria-label={`Celebrating ${site.yearsOfImpact} years of impact and legacy`}
    >
      {/* Soft gold ambient glow */}
      <div
        className="pointer-events-none absolute -inset-[8%] rounded-full opacity-70 blur-md"
        style={{
          background:
            "radial-gradient(circle, rgb(201 162 39 / 0.5) 0%, transparent 68%)",
        }}
        aria-hidden
      />

      <img
        src="/images/anniversary-badge.png"
        alt=""
        draggable={false}
        className="relative z-[1] h-full w-full object-contain drop-shadow-[0_10px_24px_rgb(11_29_58/0.4)]"
      />

      {/*
        CSS lens flare — clipped to a circle so it only glints on the medallion
        face (not the ribbon tips). Soft white core + gold halo + streak.
      */}
      <div
        className="pointer-events-none absolute inset-[4%] z-[2] overflow-hidden rounded-full"
        aria-hidden
      >
        {/* Primary hot spot — upper left of the gold face */}
        <div
          className="absolute left-[8%] top-[4%] h-[58%] w-[58%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 40% 38%, rgb(255 255 255 / 0.78) 0%, rgb(255 248 220 / 0.42) 22%, rgb(240 215 138 / 0.16) 48%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Secondary top rim glint */}
        <div
          className="absolute left-[22%] top-[-2%] h-[36%] w-[62%] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgb(255 255 255 / 0.55) 0%, rgb(255 250 230 / 0.22) 35%, transparent 68%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Diagonal streak across the upper-left quadrant */}
        <div
          className="absolute left-[2%] top-[8%] h-[42%] w-[70%] -rotate-[28deg] rounded-full"
          style={{
            background:
              "linear-gradient(105deg, transparent 10%, rgb(255 255 255 / 0.35) 38%, rgb(255 255 255 / 0.08) 52%, transparent 72%)",
            mixBlendMode: "soft-light",
          }}
        />
        {/* Tiny specular core */}
        <div
          className="absolute left-[22%] top-[16%] h-[14%] w-[14%] rounded-full blur-[1px]"
          style={{
            background:
              "radial-gradient(circle, rgb(255 255 255 / 0.95) 0%, rgb(255 255 255 / 0.35) 40%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
}
