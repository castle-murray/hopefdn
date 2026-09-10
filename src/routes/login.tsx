import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [{ title: "Sign In | H.O.P.E. Foundation" }],
  }),
});

function Login() {
  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Sign In"
        description="Sign in to manage your involvement with H.O.P.E. Foundation."
        align="center"
      />
      <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-2xl font-semibold text-navy">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-muted">
            Continue with a provider below. New to HOPE?{" "}
            <Link to="/get-involved" className="font-semibold text-gold-dark hover:underline">
              Get involved
            </Link>{" "}
            anytime.
          </p>
          <div className="mt-6 space-y-3">
            {authEnabled ? (
              GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/desk" })}
                >
                  Continue with {p.label}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted">Sign-in is disabled.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
