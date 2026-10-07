import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { HandHeart, Heart, Users } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { pledges } from "@/data/site";

// Original hopefdn.org Google Form (stopgap). The "?embedded=true" variant
// answers 401 with a Google sign-in wall for signed-out visitors, so the
// iframe uses the plain viewform URL, which Google allows to be framed.
const VOLUNTEER_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf3X5JI-vQfjQB9yx2GEQ5A58h8KnHUKkqTRrP7emTMtIjd3w/viewform";
const VOLUNTEER_FORM_EMBED_URL = VOLUNTEER_FORM_URL;
const VOLUNTEER_FORM_ID = "volunteer-form";

export const Route = createFileRoute("/get-involved")({
  component: GetInvolvedPage,
  head: () => ({
    meta: [{ title: "Get Involved | H.O.P.E. Foundation" }],
  }),
});

function GetInvolvedPage() {
  // The form starts hidden (SSR and first client render agree) and is revealed
  // by the Volunteer button or by arriving with #volunteer-form in the URL.
  const [formOpen, setFormOpen] = useState(false);
  const [scrollRequest, setScrollRequest] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const formFrameRef = useRef<HTMLIFrameElement>(null);
  // Set when the visitor scrolls or types after a reveal, so the scroll
  // corrections below never fight them.
  const userInputRef = useRef(false);

  const revealForm = useCallback(() => {
    setFormOpen(true);
    setScrollRequest((n) => n + 1);
  }, []);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === `#${VOLUNTEER_FORM_ID}`) revealForm();
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [revealForm]);

  useEffect(() => {
    if (!formOpen || scrollRequest === 0) return;
    let cancelled = false;
    let frame = 0;
    let cleanupSettle: (() => void) | undefined;
    userInputRef.current = false;
    // Wait for web fonts so the layout above the form has settled.
    void Promise.resolve(document.fonts?.ready).then(() => {
      if (cancelled) return;
      frame = window.requestAnimationFrame(() => {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        formRef.current?.scrollIntoView({
          behavior: reduceMotion ? "instant" : "smooth",
          block: "start",
        });
        // The sticky header shrinks once the page scrolls, which shortens the
        // page mid-scroll and overshoots the target. Re-align when it settles.
        const settle = () => {
          window.removeEventListener("scrollend", settle);
          window.clearTimeout(settleTimer);
          if (!cancelled && !userInputRef.current) {
            formRef.current?.scrollIntoView({
              behavior: "instant",
              block: "start",
            });
          }
        };
        window.addEventListener("scrollend", settle, { once: true });
        const settleTimer = window.setTimeout(settle, 1200);
        cleanupSettle = () => {
          window.removeEventListener("scrollend", settle);
          window.clearTimeout(settleTimer);
        };
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      cleanupSettle?.();
    };
  }, [formOpen, scrollRequest]);

  // Once loaded, the Google Form focuses its own "Sign in to continue" dialog,
  // which makes the browser jump the page about 1,100px down past the heading.
  // For a short window after a reveal, and only if the visitor hasn't scrolled
  // or typed, undo that jump by putting the form heading back at the top.
  useEffect(() => {
    if (!formOpen || scrollRequest === 0) return;
    const revealedAt = performance.now();
    let stopWatching: (() => void) | undefined;
    const onUserInput = () => {
      userInputRef.current = true;
    };
    const onBlur = () => {
      if (userInputRef.current || performance.now() - revealedAt > 15000)
        return;
      window.setTimeout(() => {
        if (document.activeElement !== formFrameRef.current) return;
        const onScroll = () => {
          if (userInputRef.current) return;
          const top = formRef.current?.getBoundingClientRect().top;
          // Heading still on screen: nothing jumped, leave the page alone.
          if (top === undefined || (top >= 0 && top < window.innerHeight / 2))
            return;
          stopWatching?.();
          formRef.current?.scrollIntoView({
            behavior: "instant",
            block: "start",
          });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        const timer = window.setTimeout(() => stopWatching?.(), 1500);
        stopWatching = () => {
          window.removeEventListener("scroll", onScroll);
          window.clearTimeout(timer);
          stopWatching = undefined;
        };
        // The jump may already have happened before this callback ran.
        onScroll();
      }, 0);
    };
    const inputEvents = ["wheel", "touchmove", "keydown"] as const;
    inputEvents.forEach((type) =>
      window.addEventListener(type, onUserInput, { passive: true }),
    );
    window.addEventListener("blur", onBlur);
    return () => {
      inputEvents.forEach((type) =>
        window.removeEventListener(type, onUserInput),
      );
      window.removeEventListener("blur", onBlur);
      stopWatching?.();
    };
  }, [formOpen, scrollRequest]);

  return (
    <>
      <PageHero
        eyebrow="Get Involved"
        title="Volunteer. Partner. Serve. Make a difference."
        description="There are many ways to build legacy with H.O.P.E.—from a single shift to a lifelong partnership."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <InvolveCard
              icon={<Users className="size-6" />}
              title="Volunteer"
              body="Serve at events, meal service, resource days, and special campaigns. Your time is a gift that multiplies."
              href="#volunteer"
              cta="Learn how"
            />
            <InvolveCard
              icon={<Heart className="size-6" />}
              title="Give"
              body="One-time gifts and monthly pledges fund shelter, meals, IDs, training, and care for our guests."
              href="/donate"
              cta="Donate now"
            />
            <InvolveCard
              icon={<HandHeart className="size-6" />}
              title="Partner"
              body="Churches, businesses, and civic groups amplify our reach. Join a growing family of sponsors."
              href="/partners"
              cta="Become a partner"
            />
          </div>
        </div>
      </section>

      <section id="volunteer" className="scroll-mt-28 bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
            <img
              src="/images/get-involved-w800.webp"
              srcSet="/images/get-involved-w800.webp 800w, /images/get-involved-w1200.webp 1200w"
              sizes="(max-width: 1024px) 100vw, 50vw"
              alt="Diverse hands joined together in community service"
              width={1200}
              height={900}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold text-navy">
              Volunteer with HOPE
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              Whether you can serve once a month or join our event teams, we
              have a place for your gifts. Volunteers help with hospitality,
              logistics, guest welcome, meal prep, fundraising events, and more.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              {[
                "Event support (Derby Dreams, 5K, Gala, Health Fair)",
                "Meal service and hospitality",
                "Resource day assistance",
                "Professional skills (legal, medical, education, media)",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="default"
              size="lg"
              className="mt-8"
              aria-controls={VOLUNTEER_FORM_ID}
              aria-expanded={formOpen}
              onClick={revealForm}
            >
              Volunteer
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-3xl px-4 sm:px-6 lg:px-0">
          <div className="overflow-hidden rounded-2xl border border-border bg-navy shadow-[var(--shadow-card)]">
            <iframe
              src="https://www.youtube-nocookie.com/embed/UmN8Pc7kyKI"
              title="H O P E Foundation, Inc Volunteer Introductory Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="block aspect-video w-full border-0"
            />
          </div>

          <div
            id={VOLUNTEER_FORM_ID}
            ref={formRef}
            role="region"
            aria-labelledby="volunteer-form-heading"
            hidden={!formOpen}
            className="mt-12 scroll-mt-28"
          >
            {formOpen ? (
              <>
                <h3
                  id="volunteer-form-heading"
                  className="font-display text-2xl font-semibold text-navy sm:text-3xl"
                >
                  Volunteer and Sponsor Interest Form
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Trouble seeing the form below?{" "}
                  <a
                    href={VOLUNTEER_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gold-dark underline underline-offset-2 hover:text-navy"
                  >
                    Open the form
                  </a>{" "}
                  in a new tab.
                </p>
                <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
                  <iframe
                    ref={formFrameRef}
                    src={VOLUNTEER_FORM_EMBED_URL}
                    title="H.O.P.E. Foundation Volunteer and Sponsor Interest Form"
                    loading="lazy"
                    className="block h-[3250px] w-full border-0 sm:h-[2850px]"
                  >
                    Loading…
                  </iframe>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section id="pledge" className="scroll-mt-28 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
              Personal Partners Program
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
              Monthly pledges that sustain HOPE
            </h2>
            <p className="mt-4 text-muted">
              Your pledge helps provide home-cooked meals, skill training,
              Virginia DMV IDs, health screenings, Medicaid/Medicare navigation,
              GEDs, veteran services, safe overnight shelter, and much more.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pledges.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[var(--shadow-elevated)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-dark">
                  {p.name}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-navy">
                  ${p.monthly}
                  <span className="text-base font-normal text-muted">/mo</span>
                </p>
                <p className="mt-1 text-xs text-muted">${p.yearly} / year</p>
                <p className="mt-4 text-sm font-semibold text-navy group-hover:text-gold-dark">
                  Pledge Today →
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function InvolveCard({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  const isInternal = href.startsWith("/");
  const content = (
    <>
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cream text-gold-dark">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-2xl font-semibold text-navy">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</p>
      <span className="mt-5 text-sm font-semibold text-gold-dark">{cta} →</span>
    </>
  );

  if (isInternal) {
    return (
      <Link
        to={href}
        className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition hover:border-gold/40"
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition hover:border-gold/40"
    >
      {content}
    </a>
  );
}
