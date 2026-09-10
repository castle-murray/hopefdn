import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { requestPasswordResetEmail } from "@/lib/auth/password";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [{ title: "Forgot Password | H.O.P.E. Foundation" }],
  }),
});

function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await requestPasswordResetEmail({
        data: { identifier: identifier.trim() },
      });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Staff"
        title="Forgot password"
        description="Enter your username or the email on your account. We will send a reset link if a match is found."
        align="center"
      />
      <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {message}
            </p>
          ) : null}

          <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-navy">Username or email</span>
              <input
                className={fieldClass}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </label>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/desk" className="font-semibold text-gold-dark hover:underline">
              Back to sign in
            </Link>
          </p>
          <p className="mt-3 text-xs text-muted">
            Until SMTP is configured, reset links are printed in the server
            console. Set real <code className="rounded bg-cream px-1">SMTP_*</code>{" "}
            values in <code className="rounded bg-cream px-1">.env</code>.
          </p>
        </div>
      </section>
    </>
  );
}

const fieldClass =
  "w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";
