import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Truck } from "lucide-react";
import { BackToAdmin } from "@/components/back-to-admin";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  canManageOrders,
  listOrders,
  updateOrderStatus,
} from "@/lib/shop/server";
import type {
  Order,
  PackingStatus,
  PaymentStatus,
  ShippingStatus,
} from "@/lib/shop/types";
import { formatMoney } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin_/orders")({
  loader: async () => {
    const can = await canManageOrders().catch(() => false);
    // When the public shop is off, only superusers may open orders.
    if (!can) throw redirect({ to: "/admin" });
    const orders = await listOrders();
    return { can: true as const, orders };
  },
  component: AdminOrdersPage,
  head: () => ({
    meta: [{ title: "Orders | H.O.P.E. Foundation" }],
  }),
});

function AdminOrdersPage() {
  const { user, isPending } = useCurrentUserState();
  const { can, orders: initial } = Route.useLoaderData();
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "open") {
      return orders.filter(
        (o) =>
          o.paymentStatus === "paid" && o.shippingStatus !== "delivered",
      );
    }
    if (filter === "shipped") {
      return orders.filter((o) => o.shippingStatus === "shipped");
    }
    if (filter === "delivered") {
      return orders.filter((o) => o.shippingStatus === "delivered");
    }
    return orders;
  }, [orders, filter]);

  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  if (!can) {
    return (
      <>
        <PageHero
          eyebrow="Staff"
          title="Orders access required"
          description="Staff accounts can view and update demo orders."
          align="center"
        />
        <section className="py-12 text-center">
          <Button asChild variant="outline">
            <Link to="/legacy">Back to shop</Link>
          </Button>
        </section>
      </>
    );
  }

  async function refresh() {
    const next = await listOrders();
    setOrders(next);
    await router.invalidate();
  }

  async function save(patch: {
    id: string;
    paymentStatus?: PaymentStatus;
    packingStatus?: PackingStatus;
    shippingStatus?: ShippingStatus;
    trackingNumber?: string | null;
    carrier?: string | null;
    notes?: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const updated = await updateOrderStatus({ data: patch });
      setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)));
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const selectClass =
    "rounded-md border border-border bg-ivory px-2 py-1.5 text-sm text-navy";

  return (
    <>
      <PageHero
        eyebrow="Staff tools"
        title="Orders"
        description="Demo orders with payment, packing, and shipping status — including tracking numbers."
      />
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <BackToAdmin />
              <Button asChild variant="outline" size="sm">
                <Link to="/legacy">
                  <ArrowLeft className="size-4" aria-hidden />
                  Storefront
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/shop">Products</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["all", "All"],
                  ["open", "Open"],
                  ["shipped", "Shipped"],
                  ["delivered", "Delivered"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                    filter === key
                      ? "bg-navy text-cream"
                      : "bg-cream text-muted hover:text-navy",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <ul className="grid max-h-[70vh] gap-2 overflow-y-auto">
              {filtered.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition",
                      selectedId === o.id
                        ? "border-gold bg-cream shadow-[var(--shadow-card)]"
                        : "border-border bg-surface hover:border-gold/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-navy">
                          {o.orderNumber}
                        </p>
                        <p className="text-sm text-muted">{o.customerName}</p>
                      </div>
                      <p className="text-sm font-bold text-gold-dark">
                        {formatMoney(o.totalCents)}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      pay:{o.paymentStatus} · pack:{o.packingStatus} · ship:
                      {o.shippingStatus}
                    </p>
                  </button>
                </li>
              ))}
              {filtered.length === 0 ? (
                <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
                  No orders in this filter.
                </li>
              ) : null}
            </ul>

            {selected ? (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-navy">
                      {selected.orderNumber}
                    </h2>
                    <p className="text-sm text-muted">
                      {new Date(selected.createdAt).toLocaleString()}
                      {selected.isDemo ? " · demo" : ""}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gold-dark">
                    {formatMoney(selected.totalCents)}
                  </p>
                </div>

                <div className="mt-4 grid gap-1 text-sm text-muted">
                  <p>
                    <strong className="text-navy">Customer:</strong>{" "}
                    {selected.customerName} · {selected.customerEmail}
                    {selected.customerPhone
                      ? ` · ${selected.customerPhone}`
                      : ""}
                  </p>
                  <p>
                    <strong className="text-navy">Ship to:</strong>{" "}
                    {selected.shipLine1}
                    {selected.shipLine2 ? `, ${selected.shipLine2}` : ""},{" "}
                    {selected.shipCity}, {selected.shipState}{" "}
                    {selected.shipPostal}
                  </p>
                  <p>
                    <strong className="text-navy">Card:</strong>{" "}
                    {selected.cardBrand} ···· {selected.cardLast4}
                  </p>
                </div>

                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {selected.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between text-sm text-navy"
                    >
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <span>{formatMoney(item.lineTotalCents)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-navy">Payment</span>
                    <select
                      className={selectClass}
                      disabled={busy}
                      value={selected.paymentStatus}
                      onChange={(e) =>
                        void save({
                          id: selected.id,
                          paymentStatus: e.target.value as PaymentStatus,
                        })
                      }
                    >
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="failed">failed</option>
                      <option value="refunded">refunded</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-navy">Packing</span>
                    <select
                      className={selectClass}
                      disabled={busy}
                      value={selected.packingStatus}
                      onChange={(e) =>
                        void save({
                          id: selected.id,
                          packingStatus: e.target.value as PackingStatus,
                        })
                      }
                    >
                      <option value="unfulfilled">unfulfilled</option>
                      <option value="packing">packing</option>
                      <option value="packed">packed</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-navy">Shipping</span>
                    <select
                      className={selectClass}
                      disabled={busy}
                      value={selected.shippingStatus}
                      onChange={(e) =>
                        void save({
                          id: selected.id,
                          shippingStatus: e.target.value as ShippingStatus,
                        })
                      }
                    >
                      <option value="not_shipped">not_shipped</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-navy">Carrier</span>
                    <input
                      className={selectClass}
                      disabled={busy}
                      defaultValue={selected.carrier ?? ""}
                      key={`carrier-${selected.id}-${selected.carrier}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (selected.carrier ?? "")) {
                          void save({
                            id: selected.id,
                            carrier: v || null,
                          });
                        }
                      }}
                      placeholder="UPS / USPS / FedEx"
                    />
                  </label>
                  <label className="grid gap-1 text-sm sm:col-span-2">
                    <span className="inline-flex items-center gap-1 font-medium text-navy">
                      <Truck className="size-3.5" aria-hidden />
                      Tracking number
                    </span>
                    <input
                      className={cn(selectClass, "w-full")}
                      disabled={busy}
                      defaultValue={selected.trackingNumber ?? ""}
                      key={`track-${selected.id}-${selected.trackingNumber}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (selected.trackingNumber ?? "")) {
                          void save({
                            id: selected.id,
                            trackingNumber: v || null,
                            shippingStatus:
                              v && selected.shippingStatus === "not_shipped"
                                ? "shipped"
                                : undefined,
                          });
                        }
                      }}
                      placeholder="Enter tracking number"
                    />
                  </label>
                  <label className="grid gap-1 text-sm sm:col-span-2">
                    <span className="font-medium text-navy">Notes</span>
                    <textarea
                      className={cn(selectClass, "min-h-20 w-full")}
                      disabled={busy}
                      defaultValue={selected.notes}
                      key={`notes-${selected.id}-${selected.notes}`}
                      onBlur={(e) => {
                        if (e.target.value !== selected.notes) {
                          void save({
                            id: selected.id,
                            notes: e.target.value,
                          });
                        }
                      }}
                    />
                  </label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  disabled={busy}
                  onClick={() => void refresh()}
                >
                  Refresh list
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
                Select an order to manage status and tracking.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}