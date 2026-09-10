import { useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { authClient, authEnabled } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";

export const Route = createFileRoute("/desk")({
  component: Login,
  head: () => ({
    meta: [{ title: "Staff Sign In | H.O.P.E. Foundation" }],
  }),
});

const DEFAULT_AFTER_LOGIN = "/admin";

function safeRedirectPath(raw: string | null): string {
  // Only allow same-app relative paths (no open redirects).
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return DEFAULT_AFTER_LOGIN;
  return raw;
}

function Login() {
  const navigate = useNavigate();
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await authClient.signIn.username({
        username: username.trim(),
        password,
      });
      if (err) throw new Error(err.message ?? "Sign-in failed");

      // Admin panel by default. Optional override: ?redirect=/events/manage
      const redirectParam = new URLSearchParams(
        searchStr.startsWith("?") ? searchStr.slice(1) : searchStr,
      ).get("redirect");
      const dest = safeRedirectPath(redirectParam);
      await navigate({ to: dest as "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Staff"
        title="Sign In"
        description="Authorized staff access only. Accounts are created by a superuser."
        align="center"
      />
      <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
          <SignedIn>
            <h2 className="font-display text-2xl font-semibold text-navy">
              You&apos;re signed in
            </h2>
            <div className="mt-4">
              <UserButton />
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button asChild>
                <Link to="/admin">Admin panel</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Public site</Link>
              </Button>
            </div>
          </SignedIn>

          <SignedOut>
            <h2 className="font-display text-2xl font-semibold text-navy">
              Staff sign in
            </h2>
            <p className="mt-2 text-sm text-muted">
              Use the username and password issued by a superuser. Public
              registration is not available.
            </p>

            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-navy">Username</span>
                <input
                  className={fieldClass}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  minLength={3}
                  maxLength={32}
                  spellCheck={false}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-navy">Password</span>
                <input
                  type="password"
                  className={fieldClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
              </label>
              <Button type="submit" className="w-full" disabled={busy || !authEnabled}>
                {busy ? "Please wait…" : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted">
                <Link
                  to="/forgot-password"
                  className="font-semibold text-gold-dark hover:underline"
                >
                  Forgot password?
                </Link>
              </p>
            </form>
          </SignedOut>
        </div>
      </section>
    </>
  );
}

const fieldClass =
  "w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";
