import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, KeyRound, Users } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { canManageEvents } from "@/lib/events/server";
import { canManageUsers } from "@/lib/auth/users";

export const Route = createFileRoute("/admin")({
  loader: async () => {
    const [events, users] = await Promise.all([
      canManageEvents().catch(() => false),
      canManageUsers().catch(() => false),
    ]);
    return { events, users };
  },
  component: AdminPanelPage,
  head: () => ({
    meta: [{ title: "Admin Panel | H.O.P.E. Foundation" }],
  }),
});

function AdminPanelPage() {
  const { user, isPending } = useCurrentUserState();
  const { events, users } = Route.useLoaderData();

  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;

  const tools = [
    events
      ? {
          to: "/events/manage" as const,
          title: "Events calendar",
          description: "Create and edit public events.",
          icon: Calendar,
        }
      : null,
    users
      ? {
          to: "/admin/users" as const,
          title: "User accounts",
          description: "Create staff accounts and grant roles.",
          icon: Users,
        }
      : null,
    {
      to: "/account" as const,
      title: "Account & password",
      description: "Change your own password.",
      icon: KeyRound,
    },
  ].filter(Boolean) as {
    to: "/events/manage" | "/admin/users" | "/account";
    title: string;
    description: string;
    icon: typeof Calendar;
  }[];

  return (
    <>
      <PageHero
        eyebrow="Staff"
        title="Admin panel"
        description={`Signed in as ${user.displayName ?? user.primaryEmail ?? "staff"}. Choose a tool below.`}
      />
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {!events && !users ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
              <p className="text-sm text-muted">
                Your account is signed in but does not have staff permissions yet.
                Ask a superuser to grant the staff or admin role.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link to="/">Back to site</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.to}
                    to={tool.to}
                    className="group rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition hover:border-gold/50 hover:shadow-[var(--shadow-elevated)]"
                  >
                    <Icon
                      className="size-6 text-gold-dark transition group-hover:scale-105"
                      aria-hidden
                    />
                    <h2 className="mt-3 font-display text-xl font-semibold text-navy">
                      {tool.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{tool.description}</p>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="mt-8 text-center">
            <Button asChild variant="outline" size="sm">
              <Link to="/">View public site</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}