import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  FileText,
  HeartPulse,
  HelpCircle,
  Home,
  Phone,
  Shield,
  Utensils,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/need-help-now")({
  component: NeedHelpNowPage,
  head: () => ({
    meta: [
      {
        title: "Need Help Now? | H.O.P.E. Foundation",
      },
      {
        name: "description",
        content:
          "Hungry, homeless, or missing documents? Call H.O.P.E. at 757-241-6900. Food, shelter, IDs, jobs, benefits, and veterans help in Hampton Roads.",
      },
    ],
  }),
});

/** Guest help line (Sep 2026). Distinct from general office phone in site.ts. */
const HELP_PHONE = "757-241-6900";
const HELP_TEL = "tel:+17572416900";

const jumpLinks = [
  { id: "food", label: "Food", icon: Utensils },
  { id: "shelter", label: "Shelter/Housing", icon: Home },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "jobs", label: "Jobs/Education", icon: Briefcase },
  { id: "benefits", label: "Benefits", icon: HeartPulse },
  { id: "veterans", label: "Veterans", icon: Shield },
  { id: "other", label: "Other Help", icon: HelpCircle },
] as const;

function CallHopeButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button asChild variant="gold" size="lg" className={className}>
      <a href={HELP_TEL}>
        <Phone className="size-4" aria-hidden />
        {children}
      </a>
    </Button>
  );
}

function NeedHelpNowPage() {
  return (
    <>
      <PageHero
        eyebrow="You Are Not Alone"
        title="Need Help Now?"
        description="If you are experiencing homelessness, hunger, a housing crisis, or need help obtaining important documents or connecting to community resources, H.O.P.E. is here to help."
      />

      {/* Immediate call + jump nav */}
      <section className="border-b border-border bg-cream/80 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold-dark">
                Call H.O.P.E.
              </p>
              <a
                href={HELP_TEL}
                className="mt-1 inline-block font-display text-3xl font-semibold text-navy hover:text-gold-dark sm:text-4xl"
              >
                {HELP_PHONE}
              </a>
              <p className="mt-2 max-w-xl text-sm text-muted">
                Tell us what you need. We will listen and help connect you with
                the right services and resources.
              </p>
            </div>
            <CallHopeButton className="w-full sm:w-auto">
              Call {HELP_PHONE}
            </CallHopeButton>
          </div>

          <h2 className="mt-8 font-display text-xl font-semibold text-navy sm:text-2xl">
            How can we help you today?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tap a box to jump to that section.
          </p>
          <nav
            aria-label="Help categories"
            className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7"
          >
            {jumpLinks.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-3 py-4 text-center shadow-[var(--shadow-card)] transition hover:border-gold/50 hover:shadow-[var(--shadow-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream text-gold-dark">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-navy">{label}</span>
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* FOOD */}
      <section
        id="food"
        tabIndex={-1}
        className="scroll-mt-24 py-14 sm:scroll-mt-28 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            I Need Food
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-navy">
            H.O.P.E. Meals on Wheels
          </h2>
          <div className="mt-6 max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <p className="text-base leading-relaxed text-muted">
              H.O.P.E. provides hot meals in the Downtown Norfolk area:
            </p>
            <ul className="mt-4 space-y-2 text-navy">
              <li className="font-semibold">
                Every Sunday, Wednesday &amp; Friday
              </li>
              <li>Beginning at 4:30 PM</li>
              <li>Downtown Norfolk, Virginia</li>
            </ul>
            <p className="mt-4 text-sm text-muted">
              For current meal locations or more information, call H.O.P.E.
            </p>
            <CallHopeButton className="mt-6">Get Meal Information</CallHopeButton>
          </div>
        </div>
      </section>

      {/* SHELTER */}
      <section
        id="shelter"
        tabIndex={-1}
        className="scroll-mt-24 bg-cream/60 py-14 sm:scroll-mt-28 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            I Need Shelter or Housing Help
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-navy">
            Shelter &amp; housing resources
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">
            If you are homeless, sleeping outside, staying somewhere
            temporarily, facing eviction, or do not have a safe place to stay,
            please reach out for assistance.
          </p>
          <p
            className="mt-4 max-w-3xl rounded-xl border border-gold/40 bg-ivory px-4 py-3 text-sm font-semibold text-navy"
            role="note"
          >
            Shelter availability can change—please call first.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-xl font-semibold text-navy">
                Norfolk
              </h3>
              <p className="mt-3 text-sm font-semibold text-navy">
                Norfolk Community Services Board — Homeless Services
              </p>
              <p className="mt-1 text-sm text-muted">
                For homeless services, support services, and shelter assistance:
              </p>
              <a
                href="tel:+17577565600"
                className="mt-2 inline-block text-lg font-semibold text-gold-dark hover:underline"
              >
                757-756-5600
              </a>
              <p className="mt-4 text-sm font-semibold text-navy">
                Families experiencing a housing crisis
              </p>
              <p className="text-sm text-muted">Housing Crisis Hotline:</p>
              <a
                href="tel:+17575874202"
                className="mt-1 inline-block text-lg font-semibold text-gold-dark hover:underline"
              >
                757-587-4202
              </a>
              <p className="mt-4 text-sm font-semibold text-navy">The Center</p>
              <p className="text-sm text-muted">
                1050 Tidewater Drive
                <br />
                Norfolk, VA
              </p>
              <p className="mt-2 text-sm text-muted">
                Year-round emergency shelter for single adults, plus day
                services, case management, housing navigation, and connections
                to benefits.
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-xl font-semibold text-navy">
                Virginia Beach
              </h3>
              <p className="mt-3 text-sm font-semibold text-navy">
                Virginia Beach Housing Resource Center
              </p>
              <p className="text-sm text-muted">
                104 N. Witchduck Road
                <br />
                Virginia Beach, VA
              </p>
              <a
                href="tel:+17573855167"
                className="mt-2 inline-block text-lg font-semibold text-gold-dark hover:underline"
              >
                757-385-5167
              </a>
              <p className="mt-3 text-sm text-muted">
                Shelter and housing assistance, triage and assessment,
                supportive services, and community resource connections.
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-xl font-semibold text-navy">
                Chesapeake
              </h3>
              <p className="mt-3 text-sm font-semibold text-navy">
                Chesapeake Cares Resource Center
              </p>
              <p className="text-sm text-muted">
                2255 Steppingstone Square
                <br />
                Chesapeake, VA
              </p>
              <a
                href="tel:+17573822373"
                className="mt-2 inline-block text-lg font-semibold text-gold-dark hover:underline"
              >
                757-382-2373
              </a>
              <p className="mt-3 text-sm text-muted">
                Showers, laundry, meals, mail services, employment connections,
                and connections to medical services.
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-xl font-semibold text-navy">
                Portsmouth
              </h3>
              <p className="mt-3 text-sm text-muted">
                For Portsmouth homelessness and housing assistance:
              </p>
              <p className="mt-2 text-sm font-semibold text-navy">
                Portsmouth Homeless Hotline
              </p>
              <a
                href="tel:+17579662107"
                className="mt-1 inline-block text-lg font-semibold text-gold-dark hover:underline"
              >
                757-966-2107
              </a>
              <p className="mt-6 text-sm font-semibold text-navy">
                Regional Housing Crisis Hotline
              </p>
              <p className="text-sm text-muted">
                If you are unsure where to begin:
              </p>
              <a
                href="tel:+17575874202"
                className="mt-1 inline-block text-lg font-semibold text-gold-dark hover:underline"
              >
                757-587-4202
              </a>
              <p className="mt-2 text-sm text-muted">
                An intake specialist can help determine what housing, shelter,
                or community resources may be available.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* DOCUMENTS */}
      <section
        id="documents"
        tabIndex={-1}
        className="scroll-mt-24 py-14 sm:scroll-mt-28 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            I Need Important Documents
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-navy">
            Document &amp; ID help
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Missing identification can make it difficult to find employment,
            obtain housing, receive benefits, or enroll in programs. H.O.P.E.
            can help you navigate obtaining or replacing:
          </p>
          <ul className="mt-4 max-w-xl list-disc space-y-1 pl-5 text-navy">
            <li>Virginia identification cards</li>
            <li>Birth certificates</li>
            <li>Social Security cards / replacements</li>
            <li>Other documentation needed to access services</li>
            <li>Voter registration &amp; civil rights restoration guidance</li>
          </ul>
          <p className="mt-4 text-sm text-muted">
            Call and tell us which document you need. A H.O.P.E. representative
            will help determine your next steps.
          </p>
          <CallHopeButton className="mt-6">I Need Document Help</CallHopeButton>
        </div>
      </section>

      {/* JOBS */}
      <section
        id="jobs"
        tabIndex={-1}
        className="scroll-mt-24 bg-cream/60 py-14 sm:scroll-mt-28 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            I Need Job Skills or Education Assistance
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-navy">
            Jobs &amp; education
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Ready to take the next step toward employment or education? H.O.P.E.
            can help connect you with resources for:
          </p>
          <ul className="mt-4 max-w-xl list-disc space-y-1 pl-5 text-navy">
            <li>Job and skills training</li>
            <li>Employment readiness</li>
            <li>Continuing education</li>
            <li>Career resources</li>
            <li>Community programs and referrals</li>
          </ul>
          <CallHopeButton className="mt-6">
            Get Education &amp; Job Help
          </CallHopeButton>
        </div>
      </section>

      {/* BENEFITS */}
      <section
        id="benefits"
        tabIndex={-1}
        className="scroll-mt-24 py-14 sm:scroll-mt-28 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            I Need Benefits or Healthcare Assistance
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-navy">
            Benefits &amp; healthcare
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            H.O.P.E. can help individuals navigate or connect with resources
            for:
          </p>
          <ul className="mt-4 max-w-xl list-disc space-y-1 pl-5 text-navy">
            <li>Medicaid applications</li>
            <li>Medicare information</li>
            <li>Benefits enrollment</li>
            <li>Healthcare resources</li>
            <li>Community health services</li>
          </ul>
          <CallHopeButton className="mt-6">Get Benefits Help</CallHopeButton>
        </div>
      </section>

      {/* VETERANS */}
      <section
        id="veterans"
        tabIndex={-1}
        className="scroll-mt-24 bg-cream/60 py-14 sm:scroll-mt-28 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            I Am a Veteran and Need Assistance
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-navy">
            Veterans support
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            H.O.P.E. is committed to helping veterans connect with available
            resources. We can assist with referrals and navigation for:
          </p>
          <ul className="mt-4 max-w-xl list-disc space-y-1 pl-5 text-navy">
            <li>Veterans benefits and claims</li>
            <li>Housing resources</li>
            <li>Identification documents</li>
            <li>Healthcare resources</li>
            <li>Employment and training</li>
            <li>Community support services</li>
          </ul>
          <p className="mt-4 text-sm text-muted">
            When calling, please tell us that you are a veteran seeking
            assistance.
          </p>
          <CallHopeButton className="mt-6">Veterans — Get Help</CallHopeButton>
        </div>
      </section>

      {/* OTHER */}
      <section
        id="other"
        tabIndex={-1}
        className="scroll-mt-24 py-14 sm:scroll-mt-28 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            I Don&apos;t Know What Kind of Help I Need
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-navy">
            That&apos;s okay
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Sometimes the hardest part is knowing where to start. Call H.O.P.E.
            and tell us what is happening. We will listen, identify the type of
            assistance you may need, and help connect you with available
            resources.
          </p>
          <CallHopeButton className="mt-6">
            Talk to Someone at H.O.P.E.
          </CallHopeButton>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-xl font-semibold text-navy">
                Your first 3 steps
              </h3>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-muted">
                <li>
                  <strong className="text-navy">Tell us what you need</strong> —
                  Food, Shelter/Housing, Documents, Jobs/Education, Benefits,
                  Veterans, or Other Help.
                </li>
                <li>
                  <strong className="text-navy">Contact H.O.P.E.</strong> — Call{" "}
                  <a href={HELP_TEL} className="font-semibold text-gold-dark">
                    {HELP_PHONE}
                  </a>{" "}
                  and explain your situation.
                </li>
                <li>
                  <strong className="text-navy">
                    Let us help you navigate
                  </strong>{" "}
                  — Our team will identify H.O.P.E. services or community
                  resources that may be able to assist.
                </li>
              </ol>
            </div>

            <div className="rounded-2xl gradient-navy p-6 text-cream sm:p-8">
              <h3 className="font-display text-xl font-semibold text-gold-light">
                Are you in immediate danger?
              </h3>
              <p className="mt-3 text-sm text-cream/80">
                For a life-threatening emergency, call{" "}
                <a href="tel:911" className="font-bold text-gold hover:underline">
                  911
                </a>
                .
              </p>
              <p className="mt-3 text-sm text-cream/80">
                If you or someone you know is experiencing a mental health,
                emotional, or substance-use crisis, call or text{" "}
                <a href="tel:988" className="font-bold text-gold hover:underline">
                  988
                </a>{" "}
                for the Suicide &amp; Crisis Lifeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-cream py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="font-display text-2xl italic text-gold-dark sm:text-3xl">
            Homelessness is a situation. It is not who you are.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Whether you need a meal, identification, housing resources,
            benefits, education, employment assistance, or simply someone to
            help you determine where to begin — H.O.P.E. is here to help you
            take your next step.
          </p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-navy">
            H.O.P.E. Foundation, Inc. · Helping Others Pursue Excellence
          </p>
          <a
            href={HELP_TEL}
            className="mt-3 inline-block font-display text-2xl font-semibold text-gold-dark hover:underline"
          >
            {HELP_PHONE}
          </a>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Get Help · Find Resources · Take the Next Step
          </p>
          <div className="mt-8">
            <Button asChild variant="outline" size="lg">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Spacer so sticky mobile bar does not cover content */}
      <div className="h-20 md:hidden" aria-hidden />

      {/* Sticky mobile call bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/20 bg-navy p-3 shadow-[0_-4px_24px_rgba(11,29,58,0.35)] md:hidden">
        <a
          href={HELP_TEL}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg gradient-gold text-base font-bold text-navy-deep"
        >
          <Phone className="size-5" aria-hidden />
          Call H.O.P.E. — {HELP_PHONE}
        </a>
      </div>
    </>
  );
}
