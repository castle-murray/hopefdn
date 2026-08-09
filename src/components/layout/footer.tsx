import { Link } from "@tanstack/react-router";
import {
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  TreePine,
  Youtube,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { mainNav, site } from "@/data/site";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="mt-auto">
      {/* Mission strip */}
      <div className="gradient-navy relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 section-ornament opacity-40" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-12 text-center sm:px-6 lg:flex-row lg:justify-between lg:text-left lg:px-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-navy-deep/50 text-gold">
              <TreePine className="size-7" aria-hidden />
            </span>
            <div>
              <p className="font-display text-2xl italic text-gold-light sm:text-3xl">
                {site.motto}
              </p>
              <p className="mt-1 max-w-xl text-sm text-cream/75">
                H.O.P.E. Foundation exists to restore hope, empower lives, and
                strengthen our community—one act of kindness at a time.
              </p>
            </div>
          </div>
          <Button asChild variant="gold" size="lg">
            <a href={site.donateUrl} target="_blank" rel="noopener noreferrer">
              <Heart className="size-4 fill-current" aria-hidden />
              Support the Mission
            </a>
          </Button>
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-navy-deep text-cream">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div className="space-y-4">
            <Logo variant="light" showTagline />
            <p className="text-sm leading-relaxed text-cream/70">
              A 501(c)(3) nonprofit dedicated to providing shelter, meals, and
              essential services to the disadvantaged and homeless population of{" "}
              {site.region}.
            </p>
            <div className="flex gap-2">
              <FooterSocial href={site.social.facebook} label="Facebook">
                <Facebook className="size-4" />
              </FooterSocial>
              <FooterSocial href={site.social.instagram} label="Instagram">
                <Instagram className="size-4" />
              </FooterSocial>
              <FooterSocial href={site.social.youtube} label="YouTube">
                <Youtube className="size-4" />
              </FooterSocial>
              <FooterSocial href={site.social.linkedin} label="LinkedIn">
                <Linkedin className="size-4" />
              </FooterSocial>
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg text-gold-light">Explore</h3>
            <ul className="mt-4 space-y-2">
              {mainNav.slice(0, 6).map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-sm text-cream/70 transition hover:text-gold-light"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg text-gold-light">Get Involved</h3>
            <ul className="mt-4 space-y-2 text-sm text-cream/70">
              <li>
                <Link to="/donate" className="transition hover:text-gold-light">
                  Donate
                </Link>
              </li>
              <li>
                <Link
                  to="/get-involved"
                  className="transition hover:text-gold-light"
                >
                  Volunteer
                </Link>
              </li>
              <li>
                <Link to="/partners" className="transition hover:text-gold-light">
                  Become a Partner
                </Link>
              </li>
              <li>
                <Link to="/legacy" className="transition hover:text-gold-light">
                  Legacy Collection
                </Link>
              </li>
              <li>
                <Link
                  to="/resource-center"
                  className="transition hover:text-gold-light"
                >
                  Resource Center Campaign
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg text-gold-light">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-cream/70">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                <span>
                  {site.address.line1}
                  <br />
                  {site.address.line2}
                </span>
              </li>
              <li>
                <a
                  href={site.phoneHref}
                  className="inline-flex items-center gap-2 transition hover:text-gold-light"
                >
                  <Phone className="size-4 text-gold" aria-hidden />
                  {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={site.emailHref}
                  className="inline-flex items-center gap-2 transition hover:text-gold-light"
                >
                  <Mail className="size-4 text-gold" aria-hidden />
                  {site.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-xs text-cream/50 sm:flex-row sm:text-left sm:px-6 lg:px-8">
            <p>
              © {new Date().getFullYear()} {site.name}. All rights reserved.
              501(c)(3) nonprofit organization.
            </p>
            <p className="font-display text-sm italic text-gold/70">{site.motto}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterSocial({
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition hover:border-gold hover:text-gold-light"
    >
      {children}
    </a>
  );
}
