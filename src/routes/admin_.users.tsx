import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Plus, Shield, Trash2 } from "lucide-react";
import { BackToAdmin } from "@/components/back-to-admin";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  canManageUsers,
  createManagedUser,
  deleteManagedUser,
  getUserContentOwnership,
  listManagedUsers,
  setUserRoles,
  type ManagedUser,
  type UserContentOwnership,
} from "@/lib/auth/users";
import { adminSetUserPassword } from "@/lib/auth/password";
import { cn } from "@/lib/utils";

type AppRole = "staff" | "admin";

export const Route = createFileRoute("/admin_/users")({
  loader: async () => {
    const isAdmin = await canManageUsers();
    if (!isAdmin) {
      return { isAdmin: false as const, users: [] as ManagedUser[] };
    }
    const users = await listManagedUsers();
    return { isAdmin: true as const, users };
  },
  component: AdminUsersPage,
  head: () => ({
    meta: [{ title: "Manage Users | H.O.P.E. Foundation" }],
  }),
});

function AdminUsersPage() {
  const { user, isPending } = useCurrentUserState();
  const { isAdmin, users: initial } = Route.useLoaderData();
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    roles: { staff: true, admin: false },
  });
  const [passwordFor, setPasswordFor] = useState<ManagedUser | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [deleteFor, setDeleteFor] = useState<ManagedUser | null>(null);
  const [deleteOwnership, setDeleteOwnership] =
    useState<UserContentOwnership | null>(null);
  const [reassignToUserId, setReassignToUserId] = useState("");

  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;

  if (!isAdmin) {
    return (
      <>
        <PageHero
          eyebrow="Superuser"
          title="Access denied"
          description="Only superusers can create accounts and grant permissions."
          align="center"
        />
        <section className="mx-auto max-w-lg px-4 py-12 text-center">
          <Button asChild variant="outline">
            <Link to="/">Home</Link>
          </Button>
        </section>
      </>
    );
  }

  async function refresh() {
    const next = await listManagedUsers();
    setUsers(next);
    await router.invalidate();
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const roles: AppRole[] = [];
      if (form.roles.staff) roles.push("staff");
      if (form.roles.admin) roles.push("admin");
      if (roles.length === 0) throw new Error("Select at least one role");

      await createManagedUser({
        data: {
          username: form.username.trim(),
          password: form.password,
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          roles,
        },
      });
      setForm({
        username: "",
        password: "",
        name: "",
        email: "",
        roles: { staff: true, admin: false },
      });
      setOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordFor) return;
    setBusy(true);
    setError(null);
    try {
      await adminSetUserPassword({
        data: {
          userId: passwordFor.id,
          newPassword: adminNewPassword,
        },
      });
      setPasswordFor(null);
      setAdminNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password update failed");
    } finally {
      setBusy(false);
    }
  }

  async function openDelete(target: ManagedUser) {
    setBusy(true);
    setError(null);
    setPasswordFor(null);
    setOpen(false);
    try {
      const ownership = await getUserContentOwnership({
        data: { userId: target.id },
      });
      setDeleteFor(target);
      setDeleteOwnership(ownership);
      setReassignToUserId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load ownership");
    } finally {
      setBusy(false);
    }
  }

  function closeDelete() {
    setDeleteFor(null);
    setDeleteOwnership(null);
    setReassignToUserId("");
  }

  async function onDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteFor || !deleteOwnership) return;
    if (deleteOwnership.needsReassign && !reassignToUserId) {
      setError("Choose a user to reassign owned content to before deleting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteManagedUser({
        data: {
          userId: deleteFor.id,
          reassignToUserId: deleteOwnership.needsReassign
            ? reassignToUserId
            : undefined,
        },
      });
      closeDelete();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRole(target: ManagedUser, role: AppRole) {
    setBusy(true);
    setError(null);
    try {
      const next = new Set(target.roles);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      await setUserRoles({
        data: { userId: target.id, roles: Array.from(next) },
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const reassignCandidates = users.filter((u) => u.id !== deleteFor?.id);

  return (
    <>
      <PageHero
        eyebrow="Superuser"
        title="Manage accounts"
        description="Create staff accounts and grant permissions. Public sign-up is disabled."
      />

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <BackToAdmin />
              <Button asChild variant="outline" size="sm">
                <Link to="/events/manage">
                  <ArrowLeft className="size-4" aria-hidden />
                  Event calendar
                </Link>
              </Button>
            </div>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={() => {
                setOpen(true);
                setError(null);
                closeDelete();
              }}
            >
              <Plus className="size-4" aria-hidden />
              New account
            </Button>
          </div>

          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {passwordFor ? (
            <form
              onSubmit={(e) => void onSetPassword(e)}
              className="mb-8 grid gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
            >
              <h2 className="font-display text-xl font-semibold text-navy">
                Set password for @{passwordFor.username ?? passwordFor.name}
              </h2>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-navy">New password</span>
                <input
                  type="password"
                  className={inputClass}
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Update password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setPasswordFor(null);
                    setAdminNewPassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          {deleteFor && deleteOwnership ? (
            <form
              onSubmit={(e) => void onDelete(e)}
              className="mb-8 grid gap-4 rounded-2xl border border-red-200 bg-surface p-6 shadow-[var(--shadow-card)]"
            >
              <h2 className="font-display text-xl font-semibold text-navy">
                Delete @{deleteFor.username ?? deleteFor.name}?
              </h2>
              <p className="text-sm text-muted">
                This permanently removes the account. Sessions and login
                credentials are removed automatically. You cannot delete
                yourself or the last superuser.
              </p>
              {deleteOwnership.needsReassign ? (
                <div className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <p className="font-medium">
                    This user still owns content that must be reassigned:
                  </p>
                  <ul className="list-inside list-disc text-amber-900">
                    <li>
                      Events (created_by): {deleteOwnership.eventsCreatedBy}
                    </li>
                    <li>
                      Events (updated_by): {deleteOwnership.eventsUpdatedBy}
                    </li>
                    <li>
                      Distinct events: {deleteOwnership.eventsTotal}
                    </li>
                  </ul>
                  <label className="mt-2 grid gap-1.5">
                    <span className="font-medium text-navy">
                      Reassign owned content to
                    </span>
                    <select
                      className={inputClass}
                      value={reassignToUserId}
                      onChange={(e) => setReassignToUserId(e.target.value)}
                      required
                    >
                      <option value="">Select a user…</option>
                      {reassignCandidates.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} (@{u.username ?? "—"})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-ivory px-4 py-3 text-sm text-navy">
                  No app content is tied to this user (seeded events and shop
                  orders are not user-owned). Safe to delete.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={
                    busy ||
                    (deleteOwnership.needsReassign && !reassignToUserId)
                  }
                  className="bg-red-700 text-white hover:bg-red-800"
                >
                  {busy ? "Deleting…" : "Delete user"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={closeDelete}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          {open ? (
            <form
              onSubmit={(e) => void onCreate(e)}
              className="mb-8 grid gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
            >
              <h2 className="font-display text-xl font-semibold text-navy">
                Create account
              </h2>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-navy">Display name</span>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  maxLength={120}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-navy">Username</span>
                <input
                  className={inputClass}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  required
                  minLength={3}
                  maxLength={32}
                  pattern="[a-zA-Z0-9_]+"
                  spellCheck={false}
                  autoComplete="off"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-navy">
                  Email{" "}
                  <span className="font-normal text-muted">
                    (for password resets — recommended)
                  </span>
                </span>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@example.com"
                  autoComplete="off"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-navy">Temporary password</span>
                <input
                  type="password"
                  className={inputClass}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-navy">Roles</legend>
                <label className="flex items-center gap-2 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={form.roles.staff}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        roles: { ...f.roles, staff: e.target.checked },
                      }))
                    }
                  />
                  Staff — manage event calendar
                </label>
                <label className="flex items-center gap-2 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={form.roles.admin}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        roles: { ...f.roles, admin: e.target.checked },
                      }))
                    }
                  />
                  Superuser — create accounts &amp; grant roles
                </label>
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? "Creating…" : "Create account"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          <ul className="grid gap-3">
            {users.map((u) => (
              <li
                key={u.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">
                      {u.name}{" "}
                      <span className="font-normal text-muted">
                        @{u.username ?? "—"}
                      </span>
                      {u.id === user.id ? (
                        <span className="ml-2 text-xs font-normal text-muted">
                          (you)
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["staff", "admin"] as const).map((role) => {
                      const on = u.roles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleRole(u, role)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition",
                            on
                              ? "bg-navy text-cream"
                              : "border border-border bg-ivory text-muted hover:border-gold",
                          )}
                        >
                          {role === "admin" ? (
                            <Shield className="size-3" aria-hidden />
                          ) : null}
                          {role === "admin" ? "superuser" : role}
                          <span className="opacity-70">{on ? "✓" : "+"}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setPasswordFor(u);
                        setAdminNewPassword("");
                        setOpen(false);
                        closeDelete();
                        setError(null);
                      }}
                      className="rounded-full border border-border bg-ivory px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy hover:border-gold"
                    >
                      Set password
                    </button>
                    {u.id !== user.id ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void openDelete(u)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-800 hover:border-red-400"
                      >
                        <Trash2 className="size-3" aria-hidden />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
            {users.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
                No users yet.
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";