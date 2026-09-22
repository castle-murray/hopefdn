import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { BackToAdmin } from "@/components/back-to-admin";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  canManageEvents,
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
  uploadEventImage,
} from "@/lib/events/server";
import { canManageUsers } from "@/lib/auth/users";
import type { CalendarEvent, EventStatus } from "@/lib/events/types";
import {
  formatEventDate,
  formatEventTimeRange,
} from "@/lib/events/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events_/manage")({
  loader: async () => {
    const [canManage, isAdmin] = await Promise.all([
      canManageEvents(),
      canManageUsers().catch(() => false),
    ]);
    if (!canManage) {
      return {
        canManage: false as const,
        isAdmin: false,
        events: [] as CalendarEvent[],
      };
    }
    const list = await listEvents({
      data: {
        from: "2000-01-01T00:00:00.000Z",
        includeAllStatuses: true,
        limit: 100,
      },
    });
    return { canManage: true as const, isAdmin, events: list.events };
  },
  component: ManageEventsPage,
  head: () => ({
    meta: [{ title: "Manage Events | H.O.P.E. Foundation" }],
  }),
});

type FormState = {
  id?: string;
  title: string;
  description: string;
  location: string;
  ctaLabel: string;
  ctaUrl: string;
  startsAtLocal: string;
  endsAtLocal: string;
  status: EventStatus;
  /** Existing saved path, if any. */
  imageUrl: string | null;
  /** Local file chosen for upload (not yet saved). */
  imageFile: File | null;
  /** Clear existing image on save. */
  removeImage: boolean;
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  location: "",
  ctaLabel: "Learn More",
  ctaUrl: "",
  startsAtLocal: "",
  endsAtLocal: "",
  status: "published",
  imageUrl: null,
  imageFile: null,
  removeImage: false,
});

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // datetime-local wants YYYY-MM-DDTHH:mm in local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date/time");
  return d.toISOString();
}

function eventToForm(event: CalendarEvent): FormState {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    ctaLabel: event.ctaLabel,
    ctaUrl: event.ctaUrl ?? "",
    startsAtLocal: toLocalInput(event.startsAt),
    endsAtLocal: toLocalInput(event.endsAt),
    status: event.status,
    imageUrl: event.imageUrl,
    imageFile: null,
    removeImage: false,
  };
}

async function fileToBase64Payload(file: File): Promise<{
  dataBase64: string;
  contentType: string;
}> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return {
    dataBase64: btoa(binary),
    contentType: file.type || "application/octet-stream",
  };
}

function ManageEventsPage() {
  const { user, isPending } = useCurrentUserState();
  const { canManage, isAdmin, events: initial } = Route.useLoaderData();
  const router = useRouter();
  const [events, setEvents] = useState(initial);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;

  if (!canManage) {
    return (
      <>
        <PageHero
          eyebrow="Staff"
          title="Calendar access required"
          description="A superuser must create your account and grant the staff role before you can manage events."
          align="center"
        />
        <section className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-sm text-muted">
            Signed in as {user.displayName ?? user.primaryEmail ?? "user"}. Ask a
            superuser to grant you staff access.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/events">Back to events</Link>
          </Button>
        </section>
      </>
    );
  }

  async function refresh() {
    const list = await listEvents({
      data: {
        from: "2000-01-01T00:00:00.000Z",
        includeAllStatuses: true,
        limit: 100,
      },
    });
    setEvents(list.events);
    await router.invalidate();
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let imageUrl: string | null | undefined = undefined;
      if (form.imageFile) {
        const payload = await fileToBase64Payload(form.imageFile);
        const uploaded = await uploadEventImage({ data: payload });
        imageUrl = uploaded.imageUrl;
      } else if (form.removeImage) {
        imageUrl = null;
      } else if (!form.id) {
        imageUrl = null;
      }
      // else: omit imageUrl on update → leave unchanged

      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        ctaLabel: form.ctaLabel || "Learn More",
        ctaUrl: form.ctaUrl.trim() ? form.ctaUrl.trim() : null,
        startsAt: fromLocalInput(form.startsAtLocal),
        endsAt: form.endsAtLocal ? fromLocalInput(form.endsAtLocal) : null,
        status: form.status,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      };
      if (form.id) {
        await updateEvent({ data: { id: form.id, ...payload } });
      } else {
        await createEvent({ data: payload });
      }
      clearPreview();
      setForm(emptyForm());
      setOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this event permanently?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteEvent({ data: { id } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const shownImage =
    previewUrl ||
    (!form.removeImage && form.imageUrl ? form.imageUrl : null);

  return (
    <>
      <PageHero
        eyebrow="Staff tools"
        title="Manage event calendar"
        description="Create and update public events. Lists are range-indexed so the public calendar stays fast as you grow."
      />

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <BackToAdmin />
              <Button asChild variant="outline" size="sm">
                <Link to="/events">
                  <ArrowLeft className="size-4" aria-hidden />
                  Public calendar
                </Link>
              </Button>
              {isAdmin ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/users">Manage users</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link to="/account">Change password</Link>
              </Button>
            </div>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={() => {
                clearPreview();
                setForm(emptyForm());
                setOpen(true);
                setError(null);
              }}
            >
              <Plus className="size-4" aria-hidden />
              New event
            </Button>
          </div>

          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {open ? (
            <form
              onSubmit={(e) => void onSubmit(e)}
              className="mb-8 grid gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
            >
              <h2 className="font-display text-xl font-semibold text-navy">
                {form.id ? "Edit event" : "New event"}
              </h2>
              <Field label="Title" required>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  maxLength={200}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className={cn(inputClass, "min-h-24")}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  maxLength={5000}
                />
              </Field>
              <Field label="Location">
                <input
                  className={inputClass}
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  maxLength={500}
                />
              </Field>
              <Field label="Event image (optional)">
                <div className="grid gap-3">
                  {shownImage ? (
                    <img
                      src={shownImage}
                      alt=""
                      className="h-40 w-full max-w-md rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <p className="text-xs text-muted">
                      JPEG, PNG, WebP, or GIF up to 5 MB.
                    </p>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-sm text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-cream"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      clearPreview();
                      if (file) {
                        setPreviewUrl(URL.createObjectURL(file));
                        setForm((f) => ({
                          ...f,
                          imageFile: file,
                          removeImage: false,
                        }));
                      } else {
                        setForm((f) => ({ ...f, imageFile: null }));
                      }
                    }}
                  />
                  {form.imageUrl && !form.imageFile ? (
                    <label className="flex items-center gap-2 text-sm text-navy">
                      <input
                        type="checkbox"
                        checked={form.removeImage}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            removeImage: e.target.checked,
                          }))
                        }
                      />
                      Remove current image
                    </label>
                  ) : null}
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Starts" required>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.startsAtLocal}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startsAtLocal: e.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Ends (optional)">
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.endsAtLocal}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endsAtLocal: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CTA label">
                  <input
                    className={inputClass}
                    value={form.ctaLabel}
                    onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                    maxLength={80}
                  />
                </Field>
                <Field label="CTA URL (optional)">
                  <input
                    type="url"
                    className={inputClass}
                    value={form.ctaUrl}
                    onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                    placeholder="https://"
                  />
                </Field>
              </div>
              <Field label="Status">
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as EventStatus,
                    }))
                  }
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy} variant="default">
                  {busy ? "Saving…" : form.id ? "Save changes" : "Create event"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setOpen(false);
                    clearPreview();
                    setForm(emptyForm());
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          <ul className="grid gap-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-navy">{event.title}</h3>
                      <StatusBadge status={event.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {formatEventDate(event.startsAt)} · {formatEventTimeRange(event)}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      clearPreview();
                      setForm(eventToForm(event));
                      setOpen(true);
                      setError(null);
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void onDelete(event.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
            {events.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
                No events yet. Create the first one.
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-navy">
        {label}
        {required ? <span className="text-gold-dark"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: EventStatus }) {
  const styles =
    status === "published"
      ? "bg-emerald-50 text-emerald-800"
      : status === "draft"
        ? "bg-amber-50 text-amber-900"
        : "bg-stone-100 text-stone-600";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase", styles)}>
      {status}
    </span>
  );
}
