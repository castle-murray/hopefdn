import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  Heart,
  Mail,
  Menu,
  Phone,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { mainNav, site } from "@/data/site";
import { cn } from "@/lib/utils";

/** Gold filled disc with navy icon strokes (phone, email). */
const goldDiscStyle = {
  background:
    "radial-gradient(circle at 32% 28%, #f5e6a8 0%, #dfc15a 38%, #c9a227 72%, #a6841c 100%)",
} as const;

const goldDiscClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-navy-deep shadow-[0_1px_3px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.35)]";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Scroll offset captured on the open tap, before the header leaves the flow
  // (going fixed shifts content and browser scroll anchoring nudges scrollY).
  const openScrollYRef = useRef<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [hideContactBar, setHideContactBar] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Collapse contact strip on scroll with a wide hysteresis band.
  // Collapsing the bar shortens the document and can drop scrollY by ~50–80px;
  // the gap between hide/show must be larger than that or the bar flip-flops.
  useEffect(() => {
    const HIDE_AFTER = 200; // hide only once clearly past the top
    const SHOW_BEFORE = 40; // re-show only when back near the very top

    const onScroll = () => {
      // Menu scroll lock (body position:fixed) drops scrollY to 0; ignore it so
      // the header keeps its size while open and doesn't resize on close.
      if (document.body.style.position === "fixed") return;
      const y = window.scrollY;
      setHideContactBar((hidden) => {
        if (!hidden && y > HIDE_AFTER) return true;
        if (hidden && y < SHOW_BEFORE) return false;
        return hidden;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Match hide threshold on route change (don't use the show threshold here).
    setHideContactBar(window.scrollY > 200);
  }, [pathname]);

  // Close drawers on navigation so they never stick open on a new page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // The menu is hamburger-only (below xl). If the viewport grows past xl while
  // it is open (rotate / resize), close it so the fixed overlay can't linger.
  useEffect(() => {
    if (!mobileOpen) return;
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mobileOpen]);

  // Lock page scroll while the mobile menu is open; only the menu panel scrolls.
  useEffect(() => {
    if (!mobileOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollY = openScrollYRef.current ?? window.scrollY;
    openScrollYRef.current = null;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    // iOS Safari: overflow:hidden alone often still scrolls the document.
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      // "instant": the site sets scroll-behavior:smooth, which would animate
      // up from 0 and let the contact-bar hysteresis shift the landing spot.
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, [mobileOpen]);

  const navItems = mainNav;

  // Collapse contact strip on scroll, or while the mobile menu is open so the
  // menu sits flush under the main nav without the utility bar above it.
  const contactBarHidden = hideContactBar || mobileOpen;

  return (
    // Opaque shell so the hero never flashes through while the contact strip
    // collapses and the nav slides up into its place.
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-ivory",
        // Open menu: pin the header to the viewport. The scroll lock below sets
        // body{position:fixed; top:-scrollY}, which stops the page scrolling, so
        // a *sticky* header falls back to its flow position (scrollY px above the
        // viewport) and the menu ends up off-screen with page content showing
        // (HOPE-15). Fixed + full height keeps it on top at any scroll offset;
        // z-[70] also clears other fixed layers (staff bar z-60, need-help-now
        // call bar z-50) but stays below the flyer lightbox (z-100).
        mobileOpen &&
          "fixed inset-x-0 top-0 z-[70] flex h-dvh flex-col overflow-hidden",
      )}
    >
      {/* Contact / utility bar — hides when scrolling down or mobile menu open */}
      <div
        className={cn(
          "grid shrink-0 bg-navy-deep transition-[grid-template-rows] duration-300 ease-in-out",
          contactBarHidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        )}
        aria-hidden={contactBarHidden}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="gradient-navy text-cream">
            <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 lg:px-8">
              {/* Phone | Email — left */}
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-3.5">
                <a
                  href={site.phoneHref}
                  className="inline-flex items-center gap-2 text-cream/95 transition hover:text-gold-light"
                  tabIndex={contactBarHidden ? -1 : undefined}
                >
                  <ContactGlyph>
                    <Phone className="size-3.5" strokeWidth={2.25} aria-hidden />
                  </ContactGlyph>
                  <span className="tracking-wide">{site.phone}</span>
                </a>

                <span
                  className="hidden h-3.5 w-px shrink-0 bg-gold/55 sm:block"
                  aria-hidden
                />

                <a
                  href={site.emailHref}
                  className="inline-flex items-center gap-2 text-cream/95 transition hover:text-gold-light"
                  tabIndex={contactBarHidden ? -1 : undefined}
                >
                  <ContactGlyph>
                    <Mail className="size-3.5" strokeWidth={2.25} aria-hidden />
                  </ContactGlyph>
                  <span className="hidden tracking-wide sm:inline">
                    {site.email}
                  </span>
                  <span className="sm:hidden">Email Us</span>
                </a>
              </div>

              {/* Motto — true horizontal center of the bar */}
              <p className="site-motto pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 md:inline-flex">
                <span>{site.motto}</span>
                <Heart
                  className="size-3.5 fill-gold text-gold drop-shadow-[0_0_4px_rgb(223_193_90/0.55)]"
                  aria-hidden
                />
              </p>

              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/need-help-now"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gold/70 bg-cream/10 px-3 text-xs font-bold uppercase tracking-wide text-gold-light transition hover:border-gold hover:bg-cream/15 hover:text-gold sm:px-3.5"
                  tabIndex={contactBarHidden ? -1 : undefined}
                >
                  <Phone className="size-3.5" aria-hidden />
                  Get Help Now
                </Link>

                <Link
                  to="/donate"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full gradient-gold px-3.5 text-xs font-bold uppercase tracking-wide text-navy-deep shadow-[var(--shadow-gold)] transition hover:brightness-105"
                  tabIndex={contactBarHidden ? -1 : undefined}
                >
                  <Heart className="size-3.5 fill-current" aria-hidden />
                  Donate
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav — sticky; slim when scrolled */}
      <div
        className={cn(
          "border-b border-border bg-ivory transition-shadow duration-300",
          mobileOpen && "flex min-h-0 flex-1 flex-col",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 transition-[padding] duration-300 ease-in-out",
            hideContactBar ? "py-1" : "py-3",
          )}
        >
          <Logo
            showTagline={!hideContactBar}
            compact={hideContactBar}
            className="min-w-0"
          />

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              const hasChildren = Boolean(item.children?.length);
              const linkPad = hideContactBar
                ? "px-2 py-1 text-[0.68rem]"
                : "px-2.5 py-2 text-[0.72rem]";

              if (!hasChildren) {
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "rounded-md font-semibold uppercase tracking-[0.06em] transition-all duration-300",
                      linkPad,
                      active
                        ? "text-gold-dark"
                        : "text-navy/80 hover:bg-cream hover:text-navy",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    to={item.href}
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-md font-semibold uppercase tracking-[0.06em] transition-all duration-300",
                      linkPad,
                      active
                        ? "text-gold-dark"
                        : "text-navy/80 hover:bg-cream hover:text-navy",
                    )}
                    onFocus={() => setOpenDropdown(item.label)}
                  >
                    {item.label}
                    <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                  </Link>
                  {openDropdown === item.label ? (
                    <div className="absolute left-0 top-full z-50 min-w-[240px] pt-1">
                      <div className="rounded-xl border border-border bg-surface p-2 shadow-[var(--shadow-elevated)]">
                        {item.children!.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            className="block rounded-lg px-3 py-2.5 transition hover:bg-cream"
                            onClick={() => setOpenDropdown(null)}
                          >
                            <span className="block text-sm font-semibold text-navy">
                              {child.label}
                            </span>
                            {child.description ? (
                              <span className="mt-0.5 block text-xs text-muted">
                                {child.description}
                              </span>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center rounded-md border border-border text-navy transition-all duration-300 xl:hidden",
                hideContactBar ? "h-8 w-8" : "h-11 w-11",
              )}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => {
                if (!mobileOpen) openScrollYRef.current = window.scrollY;
                setMobileOpen((v) => !v);
              }}
            >
              {mobileOpen ? (
                <X className={hideContactBar ? "size-4" : "size-5"} />
              ) : (
                <Menu className={hideContactBar ? "size-4" : "size-5"} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu — scrolls inside the panel; page scroll is locked */}
        {mobileOpen ? (
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain border-t border-border bg-ivory xl:hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <nav
              className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-4 pb-8 sm:px-6"
              aria-label="Mobile"
            >
              {navItems.map((item) => (
                <div key={item.href} className="w-full">
                  <Link
                    to={item.href}
                    className={cn(
                      "flex w-full items-center rounded-xl border px-4 py-3.5 text-sm font-semibold uppercase tracking-wide transition active:scale-[0.99]",
                      pathname === item.href
                        ? "border-gold/40 bg-cream text-gold-dark shadow-sm"
                        : "border-border/80 bg-surface text-navy hover:border-border hover:bg-cream/70",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.children?.length ? (
                    <div className="mt-1 flex w-full flex-col gap-1 border-l-2 border-border/70 py-1 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="flex w-full items-center rounded-lg border border-transparent px-3 py-2.5 text-sm text-muted transition hover:border-border/60 hover:bg-surface hover:text-navy"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function ContactGlyph({ children }: { children: React.ReactNode }) {
  return (
    <span className={goldDiscClass} style={goldDiscStyle} aria-hidden>
      {children}
    </span>
  );
}
