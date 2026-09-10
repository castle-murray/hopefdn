import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BackToAdmin } from "@/components/back-to-admin";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { changeMyPassword } from "@/lib/auth/password";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () => ({
    meta: [{ title: "Account | H.O.P.E. Foundation" }],
  }),
});

function AccountPage() {
  const { user, isPending } = useCurrentUserState();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (newPassword !== confirm) {
        throw new Error("New passwords do not match");
      }
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters");
      }
      await changeMyPassword({
        data: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setSuccess("Password updated. Other sessions were signed out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Your account"
        description="Update your staff password. Use a strong password you do not reuse elsewhere."
        align="center"
      />
      <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6">
            <UserButton />
            {user.primaryEmail ? (
              <p className="mt-2 text-sm text-muted">{user.primaryEmail}</p>
            ) : null}
          </div>

          <h2 className="font-display text-xl font-semibold text-navy">
            Change password
          </h2>

          {error ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {success}
            </p>
          ) : null}

          <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-navy">Current password</span>
              <input
                type="password"
                className={fieldClass}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
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
              <span className="font-medium text-navy">Confirm new password</span>
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
              {busy ? "Saving…" : "Update password"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2">
            <BackToAdmin className="w-full" />
            <Button asChild variant="outline">
              <Link to="/events/manage">Event calendar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Home</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

const fieldClass =
  "w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";
