import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import {
  aboutSummary,
  goals,
  mission,
  scriptures,
  site,
  vision,
} from "@/data/site";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [{ title: "About Us | H.O.P.E. Foundation" }],
  }),
});

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Who We Are"
        description="A 501(c)(3) nonprofit restoring hope and dignity for guests across Hampton Roads."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
              Helping Others. Pursuing Excellence.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              {aboutSummary}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              We welcome each person seeking our services as a cherished guest—not
              a case number. From safe shelter and home-cooked meals to IDs,
              training, counseling, and spiritual encouragement, our programs
              meet practical needs while affirming human dignity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold">
                <a
                  href={site.donateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Heart className="size-4 fill-current" aria-hidden />
                  Support HOPE
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/impact">Our Programs</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
            <img
              src="/images/about-community.webp"
              alt="HOPE Foundation volunteers and community members together in the park"
              className="aspect-[4/3] h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section id="mission" className="scroll-mt-28 bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
                Mission
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">{mission}</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
                Vision
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">{vision}</p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
                Goals
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                {goals.map((g) => (
                  <li key={g} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            Scripture That Guides Us
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {scriptures.map((s) => (
              <blockquote
                key={s.ref}
                className="rounded-2xl border border-border bg-surface-soft p-6"
              >
                <p className="font-display text-lg italic leading-relaxed text-navy">
                  &ldquo;{s.text}&rdquo;
                </p>
                <cite className="mt-4 block text-xs font-semibold not-italic uppercase tracking-[0.14em] text-gold-dark">
                  {s.ref}
                </cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-28 border-t border-border bg-ivory py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Get In Touch
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-navy">
                We'd love to hear from you
              </h2>
              <p className="mt-4 text-muted">
                Looking for help, wanting to volunteer, ready to donate, or
                curious about our community projects? Reach out—we welcome every
                conversation.
              </p>
              <ul className="mt-8 space-y-4 text-sm">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 text-gold-dark" aria-hidden />
                  <span>
                    {site.address.line1}
                    <br />
                    {site.address.line2}
                  </span>
                </li>
                <li>
                  <a
                    href={site.phoneHref}
                    className="inline-flex items-center gap-3 font-semibold text-navy hover:text-gold-dark"
                  >
                    <Phone className="size-5 text-gold-dark" aria-hidden />
                    {site.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={site.emailHref}
                    className="inline-flex items-center gap-3 font-semibold text-navy hover:text-gold-dark"
                  >
                    <Mail className="size-5 text-gold-dark" aria-hidden />
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

function ContactForm() {
  return (
    <form
      className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const subject = encodeURIComponent(
          `HOPE Foundation inquiry — ${String(data.get("topic") || "General")}`,
        );
        const body = encodeURIComponent(
          `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nPhone: ${data.get("phone")}\nTopic: ${data.get("topic")}\n\n${data.get("message")}`,
        );
        window.location.href = `${site.emailHref}?subject=${subject}&body=${body}`;
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Phone" name="phone" type="tel" />
        <label className="block text-sm">
          <span className="mb-1.5 block font-semibold text-navy">I am interested in</span>
          <select
            name="topic"
            className="h-11 w-full rounded-md border border-border bg-ivory px-3 text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            defaultValue="Volunteer"
          >
            <option>Help / Guest Services</option>
            <option>Volunteer</option>
            <option>Donate</option>
            <option>Partnership</option>
            <option>General Information</option>
          </select>
        </label>
      </div>
      <label className="mt-4 block text-sm">
        <span className="mb-1.5 block font-semibold text-navy">Message</span>
        <textarea
          name="message"
          required
          rows={4}
          className="w-full rounded-md border border-border bg-ivory px-3 py-2.5 text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          placeholder="How can we help?"
        />
      </label>
      <Button type="submit" variant="default" size="lg" className="mt-5 w-full sm:w-auto">
        Send Message
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-semibold text-navy">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="h-11 w-full rounded-md border border-border bg-ivory px-3 text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
      />
    </label>
  );
}
