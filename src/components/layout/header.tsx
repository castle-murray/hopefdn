import { useState } from "react";
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
  X,
  Youtube,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { mainNav, site } from "@/data/site";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Utility bar */}
      <div className="gradient-navy text-cream">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <a
              href={site.phoneHref}
              className="inline-flex items-center gap-1.5 text-cream/90 transition hover:text-gold-light"
            >
              <Phone className="size-3.5 text-gold" aria-hidden />
              <span>{site.phone}</span>
            </a>
            <a
              href={site.emailHref}
              className="inline-flex items-center gap-1.5 text-cream/90 transition hover:text-gold-light"
            >
              <Mail className="size-3.5 text-gold" aria-hidden />
              <span className="hidden sm:inline">{site.email}</span>
              <span className="sm:hidden">Email Us</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden font-display text-sm italic text-gold-light md:block">
              {site.motto}
            </p>
            <div className="flex items-center gap-2">
              <SocialIcon href={site.social.facebook} label="Facebook">
                <Facebook className="size-3.5" />
              </SocialIcon>
              <SocialIcon href={site.social.instagram} label="Instagram">
                <Instagram className="size-3.5" />
              </SocialIcon>
              <SocialIcon href={site.social.youtube} label="YouTube">
                <Youtube className="size-3.5" />
              </SocialIcon>
              <SocialIcon href={site.social.linkedin} label="LinkedIn">
                <Linkedin className="size-3.5" />
              </SocialIcon>
            </div>
            <a
              href={site.donateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-full gradient-gold px-3.5 text-xs font-bold uppercase tracking-wide text-navy-deep shadow-[var(--shadow-gold)] transition hover:brightness-105"
            >
              <Heart className="size-3.5 fill-current" aria-hidden />
              Donate
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="border-b border-border bg-ivory/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Logo showTagline className="min-w-0" />

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
            {mainNav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              const hasChildren = Boolean(item.children?.length);

              if (!hasChildren) {
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "rounded-md px-2.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.06em] transition",
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
                      "inline-flex items-center gap-0.5 rounded-md px-2.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.06em] transition",
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
            <Button asChild variant="gold" size="sm" className="hidden sm:inline-flex">
              <a href={site.donateUrl} target="_blank" rel="noopener noreferrer">
                <Heart className="size-3.5 fill-current" aria-hidden />
                Support HOPE
              </a>
            </Button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-navy xl:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen ? (
          <div className="border-t border-border bg-ivory xl:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6" aria-label="Mobile">
              {mainNav.map((item) => (
                <div key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "block rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-wide",
                      pathname === item.href
                        ? "bg-cream text-gold-dark"
                        : "text-navy hover:bg-cream",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.children?.length ? (
                    <div className="mb-2 ml-3 border-l border-border pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="block rounded-md px-2 py-2 text-sm text-muted hover:text-navy"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              <a
                href={site.donateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-lg gradient-gold font-bold text-navy-deep"
                onClick={() => setMobileOpen(false)}
              >
                <Heart className="size-4 fill-current" aria-hidden />
                Donate Now
              </a>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
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
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition hover:border-gold hover:text-gold-light"
    >
      {children}
    </a>
  );
}
