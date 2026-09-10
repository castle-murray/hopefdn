import { createFileRoute, Link } from "@tanstack/react-router";
import {
  RedirectToSignIn,
  UserButton,
} from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Calendar, HandHeart, Heart, Users } from "lucide-react";

export const Route = createFileRoute("/desk")({
  component: DeskDashboard,
  head: () => ({
    meta: [{ title: "Dashboard | H.O.P.E. Foundation" }],
  }),
});

function DeskDashboard() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center text-muted">
        Loading…
      </section>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const name = user.displayName ?? user.primaryEmail ?? "friend";

  return (
    <>
      <PageHero
        eyebrow="Dashboard"
        title="Your HOPE desk"
        description={`Welcome back, ${name}. Manage your involvement from here.`}
      />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <UserButton />
          <Button asChild variant="outline">
            <Link to="/">Back to site</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DeskCard
            to="/get-involved"
            icon={HandHeart}
            title="Get involved"
            body="Volunteer, partner, or find ways to serve with us."
          />
          <DeskCard
            to="/events"
            icon={Calendar}
            title="Events"
            body="See upcoming gatherings and community programs."
          />
          <DeskCard
            to="/donate"
            icon={Heart}
            title="Give"
            body="Support guests across Hampton Roads."
          />
          <DeskCard
            to="/impact"
            icon={Users}
            title="Our impact"
            body="Stories and programs from the field."
          />
        </div>
      </section>
    </>
  );
}

function DeskCard({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: "/get-involved" | "/events" | "/donate" | "/impact";
  icon: typeof Heart;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition hover:border-gold/40 hover:shadow-md"
    >
      <Icon className="size-5 text-gold" aria-hidden />
      <h2 className="mt-3 font-display text-xl font-semibold text-navy group-hover:text-navy-deep">
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-muted">{body}</p>
    </Link>
  );
}
