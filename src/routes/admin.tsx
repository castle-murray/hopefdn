import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Calendar,
  KeyRound,
  Package,
  Truck,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { canManageEvents } from "@/lib/events/server";
import {
  canManageOrders,
  canManageShop,
  getShopVisibility,
  setShopPublic,
} from "@/lib/shop/server";
import { canManageUsers } from "@/lib/auth/users";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  loader: async () => {
    const [events, shop, users, visibility, ordersAccess] = await Promise.all([
      canManageEvents().catch(() => false),
      canManageShop().catch(() => false),
      canManageUsers().catch(() => false),
      getShopVisibility().catch(() => ({
        publicEnabled: true,
        canAccess: true,
      })),
      canManageOrders().catch(() => false),
    ]);
    return {
      events,
      shop,
      users,
      shopPublic: visibility.publicEnabled,
      ordersAccess,
    };
  },
  component: AdminPanelPage,
  head: () => ({
    meta: [{ title: "Admin Panel | H.O.P.E. Foundation" }],
  }),
});

function AdminPanelPage() {
  const { user, isPending } = useCurrentUserState();
  const { events, shop, users, shopPublic: initialPublic, ordersAccess } =
    Route.useLoaderData();
  const router = useRouter();
  const [shopPublic, setShopPublicState] = useState(initialPublic);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;

  async function onToggleShopPublic() {
    if (!users) return; // superuser only
    setToggleBusy(true);
    setToggleError(null);
    try {
      const next = !shopPublic;
      const res = await setShopPublic({ data: { enabled: next } });
      setShopPublicState(res.publicEnabled);
      await router.invalidate();
    } catch (err) {
      setToggleError(
        err instanceof Error ? err.message : "Could not update shop visibility",
      );
    } finally {
      setToggleBusy(false);
    }
  }

  const tools = [
    events
      ? {
          to: "/events/manage" as const,
          title: "Events calendar",
          description: "Create and edit public events.",
          icon: Calendar,
        }
      : null,
    shop
      ? {
          to: "/admin/shop" as const,
          title: "Shop products",
          description: "Catalog, inventory, and availability.",
          icon: Package,
        }
      : null,
    ordersAccess
      ? {
          to: "/admin/orders" as const,
          title: "Shop orders",
          description: "Payment, packing, shipping, and tracking.",
          icon: Truck,
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
    to: "/events/manage" | "/admin/shop" | "/admin/orders" | "/admin/users" | "/account";
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
          {users ? (
            <div className="mb-8 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-navy">Public shop</h2>
                  <p className="mt-1 text-sm text-muted">
                    When hidden, Shop is removed from the site navigation and{" "}
                    <code className="rounded bg-cream px-1">/legacy</code> is
                    blocked for everyone except administrators.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={shopPublic}
                  disabled={toggleBusy}
                  onClick={() => void onToggleShopPublic()}
                  className={cn(
                    "relative inline-flex h-9 w-[4.5rem] shrink-0 items-center rounded-full border transition",
                    shopPublic
                      ? "border-emerald-600 bg-emerald-600"
                      : "border-border bg-stone-200",
                    toggleBusy && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-1 top-1 h-7 w-7 rounded-full bg-white shadow transition",
                      shopPublic && "translate-x-8",
                    )}
                  />
                  <span className="sr-only">
                    {shopPublic ? "Shop is public" : "Shop is hidden"}
                  </span>
                </button>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Status:{" "}
                <span className={shopPublic ? "text-emerald-800" : "text-amber-900"}>
                  {shopPublic ? "Visible to the public" : "Hidden (admin only)"}
                </span>
              </p>
              {toggleError ? (
                <p className="mt-2 text-sm text-red-700">{toggleError}</p>
              ) : null}
            </div>
          ) : null}

          {!events && !shop && !users ? (
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