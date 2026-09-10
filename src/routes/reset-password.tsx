import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: ResetPasswordPage,
  head: () => ({
    meta: [{ title: "Reset Password | H.O.P.E. Foundation" }],
  }),
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!token) throw new Error("Missing or invalid reset token. Request a new link.");
      if (newPassword !== confirm) throw new Error("Passwords do not match");
      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      const { error: err } = await authClient.resetPassword({
        newPassword,
        token,
      });
      if (err) throw new Error(err.message ?? "Reset failed");

      setDone(true);
      window.setTimeout(() => {
        void navigate({ to: "/desk" });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Staff"
        title="Choose a new password"
        description="Set a new password for your staff account."
        align="center"
      />
      <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
          {!token ? (
            <p className="text-sm text-muted">
              This reset link is missing a token.{" "}
              <Link
                to="/forgot-password"
                className="font-semibold text-gold-dark hover:underline"
              >
                Request a new one
              </Link>
              .
            </p>
          ) : done ? (
            <p className="text-sm text-emerald-900">
              Password updated. Redirecting to sign in…
            </p>
          ) : (
            <>
              {error ? (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              ) : null}
              <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-navy">New password</span>
                  <input
                    type="password"
                    className={fieldClass}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-navy">Confirm password</span>
                  <input
                    type="password"
                    className={fieldClass}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Saving…" : "Reset password"}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/desk" className="font-semibold text-gold-dark hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

const fieldClass =
  "w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";
