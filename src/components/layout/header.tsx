import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  Menu,
  Phone,
  Share2,
  X,
  Youtube,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { mainNav, site } from "@/data/site";
import { getShopVisibility } from "@/lib/shop/server";
import { cn } from "@/lib/utils";

const socialLinks = [
  { href: site.social.facebook, label: "Facebook", Icon: Facebook },
  { href: site.social.instagram, label: "Instagram", Icon: Instagram },
  { href: site.social.youtube, label: "YouTube", Icon: Youtube },
  { href: site.social.linkedin, label: "LinkedIn", Icon: Linkedin },
] as const;

/** Gold filled disc with navy icon strokes (phone, email, socials). */
const goldDiscStyle = {
  background:
    "radial-gradient(circle at 32% 28%, #f5e6a8 0%, #dfc15a 38%, #c9a227 72%, #a6841c 100%)",
} as const;

const goldDiscClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-navy-deep shadow-[0_1px_3px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.35)]";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showShop, setShowShop] = useState(true);
  const [hideContactBar, setHideContactBar] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;
    void getShopVisibility()
      .then((v) => {
        if (!cancelled) setShowShop(v.canAccess);
      })
      .catch(() => {
        if (!cancelled) setShowShop(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Collapse contact strip on scroll with a wide hysteresis band.
  // Collapsing the bar shortens the document and can drop scrollY by ~50–80px;
  // the gap between hide/show must be larger than that or the bar flip-flops.
  useEffect(() => {
    const HIDE_AFTER = 200; // hide only once clearly past the top
    const SHOW_BEFORE = 40; // re-show only when back near the very top

    const onScroll = () => {
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
    setSocialOpen(false);
  }, [pathname]);

  // Close social sheet when the contact bar collapses (scroll / mobile nav).
  useEffect(() => {
    if (hideContactBar || mobileOpen) setSocialOpen(false);
  }, [hideContactBar, mobileOpen]);

  // Escape closes the social overlay.
  useEffect(() => {
    if (!socialOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSocialOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [socialOpen]);

  // Lock page scroll while the mobile menu is open; only the menu panel scrolls.
  useEffect(() => {
    if (!mobileOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
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
      window.scrollTo(0, scrollY);
    };
  }, [mobileOpen]);

  const navItems = useMemo(
    () =>
      showShop
        ? mainNav
        : mainNav.filter((item) => item.href !== "/legacy"),
    [showShop],
  );

  // Collapse contact strip on scroll, or while the mobile menu is open so the
  // menu sits flush under the main nav without the utility bar above it.
  const contactBarHidden = hideContactBar || mobileOpen;

  return (
    // Opaque shell so the hero never flashes through while the contact strip
    // collapses and the nav slides up into its place.
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-ivory",
        // Cap height + clip so the menu panel (not the page) becomes the scroller.
        mobileOpen && "flex max-h-dvh flex-col overflow-hidden",
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

              <div className="flex items-center gap-3 sm:gap-4">
                {/* Desktop: full social row */}
                <div className="hidden items-center gap-2 sm:flex">
                  {socialLinks.map(({ href, label, Icon }) => (
                    <SocialIcon key={label} href={href} label={label}>
                      <Icon className="size-3.5" />
                    </SocialIcon>
                  ))}
                </div>

                {/* Mobile: single social button → overlay menu */}
                <button
                  type="button"
                  className={`${goldDiscClass} transition hover:brightness-110 active:scale-95 sm:hidden`}
                  style={goldDiscStyle}
                  aria-label={socialOpen ? "Close social links" : "Social media links"}
                  aria-expanded={socialOpen}
                  aria-haspopup="dialog"
                  tabIndex={contactBarHidden ? -1 : undefined}
                  onClick={() => setSocialOpen((v) => !v)}
                >
                  {socialOpen ? (
                    <X className="size-3.5" aria-hidden />
                  ) : (
                    <Share2 className="size-3.5" aria-hidden />
                  )}
                </button>

                <a
                  href={site.donateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full gradient-gold px-3.5 text-xs font-bold uppercase tracking-wide text-navy-deep shadow-[var(--shadow-gold)] transition hover:brightness-105"
                  tabIndex={contactBarHidden ? -1 : undefined}
                >
                  <Heart className="size-3.5 fill-current" aria-hidden />
                  Donate
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile social overlay — only while contact bar is visible */}
      {socialOpen && !contactBarHidden ? (
        <div
          className="fixed inset-0 z-[60] sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Social media"
        >
          <button
            type="button"
            className="absolute inset-0 bg-navy-deep/55 backdrop-blur-[2px]"
            aria-label="Dismiss social menu"
            onClick={() => setSocialOpen(false)}
          />
          <div className="absolute inset-x-4 top-[max(4.5rem,env(safe-area-inset-top))] mx-auto max-w-sm rounded-2xl border border-gold/30 bg-navy p-4 shadow-[var(--shadow-elevated)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-light">
                Connect with us
              </p>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-cream/80 transition hover:bg-cream/10 hover:text-cream"
                aria-label="Close"
                onClick={() => setSocialOpen(false)}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {socialLinks.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-cream/10 bg-cream/5 px-3 py-3 text-sm font-semibold text-cream transition hover:border-gold/40 hover:bg-cream/10"
                    onClick={() => setSocialOpen(false)}
                  >
                    <span className={goldDiscClass} style={goldDiscStyle}>
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

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
              onClick={() => setMobileOpen((v) => !v)}
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

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`${goldDiscClass} transition hover:brightness-110 active:scale-95`}
      style={goldDiscStyle}
    >
      {children}
    </a>
  );
}
