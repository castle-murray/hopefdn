/**
 * Helpers for responsive WebP assets in /public/images.
 * Variants are named `{stem}-w{width}.webp` (see scripts / ImageMagick exports).
 */

/** Build a srcset from explicit widths, e.g. imgSrcSet("/images/hero.webp", [800, 1280, 1728]) */
export function imgSrcSet(path: string, widths: number[]): string {
  const stem = path.replace(/\.webp$/i, "");
  return widths.map((w) => `${stem}-w${w}.webp ${w}w`).join(", ");
}

/** Common card / section photo sizes (mobile ~full width → ~800 CSS px @2x). */
export const CARD_SRCSET_WIDTHS = [800, 1200] as const;

/** Hero / full-bleed photo sizes. */
export const HERO_SRCSET_WIDTHS = [800, 1280] as const;

/**
 * Default `sizes` for the home quick-link cards:
 * 1 col on small screens, up to 5 cols on large.
 */
export const QUICK_LINK_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw";

/** Half-width editorial photos (about / impact / get-involved). */
export const HALF_WIDTH_SIZES = "(max-width: 1024px) 100vw, 50vw";

/**
 * Props for a `/images/*.webp` asset that has `-w800` (and optionally larger) variants.
 * Falls back to the original URL when it is not a local WebP path.
 */
export function responsiveImageProps(
  path: string,
  widths: readonly number[] = CARD_SRCSET_WIDTHS,
  sizes: string = HALF_WIDTH_SIZES,
): { src: string; srcSet?: string; sizes?: string } {
  if (!path.startsWith("/images/") || !/\.webp$/i.test(path)) {
    return { src: path };
  }
  const sorted = [...widths].sort((a, b) => a - b);
  const smallest = sorted[0]!;
  const stem = path.replace(/\.webp$/i, "");
  return {
    src: `${stem}-w${smallest}.webp`,
    srcSet: imgSrcSet(path, sorted),
    sizes,
  };
}
