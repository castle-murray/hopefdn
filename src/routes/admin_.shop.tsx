import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Package, Plus } from "lucide-react";
import { BackToAdmin } from "@/components/back-to-admin";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  adjustStock,
  canManageShop,
  deleteProduct,
  listAllProducts,
  saveProduct,
} from "@/lib/shop/server";
import type { Product } from "@/lib/shop/types";
import { formatMoney } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin_/shop")({
  loader: async () => {
    const can = await canManageShop();
    if (!can) return { can: false as const, products: [] as Product[] };
    const products = await listAllProducts();
    return { can: true as const, products };
  },
  component: AdminShopPage,
  head: () => ({
    meta: [{ title: "Shop Admin | H.O.P.E. Foundation" }],
  }),
});

type FormState = {
  id?: string;
  name: string;
  description: string;
  priceDollars: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
  stockQty: string;
  lowStockThreshold: string;
  sortOrder: string;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  priceDollars: "0.00",
  imageUrl: "/images/product-legacy-tumbler.webp",
  category: "merchandise",
  isActive: true,
  stockQty: "0",
  lowStockThreshold: "5",
  sortOrder: "0",
});

function productToForm(p: Product): FormState {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    priceDollars: (p.priceCents / 100).toFixed(2),
    imageUrl: p.imageUrl,
    category: p.category,
    isActive: p.isActive,
    stockQty: String(p.stockQty),
    lowStockThreshold: String(p.lowStockThreshold),
    sortOrder: String(p.sortOrder),
  };
}

function AdminShopPage() {
  const { user, isPending } = useCurrentUserState();
  const { can, products: initial } = Route.useLoaderData();
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  if (!can) {
    return (
      <>
        <PageHero
          eyebrow="Staff"
          title="Shop access required"
          description="Staff accounts can manage products and inventory."
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
    const next = await listAllProducts();
    setProducts(next);
    await router.invalidate();
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const priceCents = Math.round(parseFloat(form.priceDollars || "0") * 100);
      if (!Number.isFinite(priceCents) || priceCents < 0) {
        throw new Error("Enter a valid price");
      }
      await saveProduct({
        data: {
          id: form.id,
          name: form.name.trim(),
          description: form.description.trim(),
          priceCents,
          imageUrl: form.imageUrl.trim() || "/images/product-legacy-tumbler.webp",
          category: form.category.trim() || "merchandise",
          isActive: form.isActive,
          stockQty: Math.max(0, parseInt(form.stockQty || "0", 10) || 0),
          lowStockThreshold:
            Math.max(0, parseInt(form.lowStockThreshold || "5", 10) || 0),
          sortOrder: Math.max(0, parseInt(form.sortOrder || "0", 10) || 0),
        },
      });
      setOpen(false);
      setForm(emptyForm());
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDeactivate(id: string) {
    if (!window.confirm("Remove this product from the storefront?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteProduct({ data: { id } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  async function onStock(id: string, stockQty: number) {
    setBusy(true);
    setError(null);
    try {
      await adjustStock({ data: { id, stockQty } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stock update failed");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";

  return (
    <>
      <PageHero
        eyebrow="Staff tools"
        title="Product & inventory"
        description="Add products, set stock, publish or archive items for the Legacy Collection storefront."
      />
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
                <Link to="/admin/orders">Orders</Link>
              </Button>
            </div>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={() => {
                setForm(emptyForm());
                setOpen(true);
                setError(null);
              }}
            >
              <Plus className="size-4" aria-hidden />
              New product
            </Button>
          </div>

          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {open ? (
            <form
              onSubmit={(e) => void onSave(e)}
              className="mb-8 grid gap-3 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:grid-cols-2"
            >
              <h2 className="font-display text-xl font-semibold text-navy sm:col-span-2">
                {form.id ? "Edit product" : "New product"}
              </h2>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-navy">Name</span>
                <input
                  className={input}
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-navy">Description</span>
                <textarea
                  className={cn(input, "min-h-20")}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-navy">Price (USD)</span>
                <input
                  className={input}
                  required
                  value={form.priceDollars}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceDollars: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-navy">Category</span>
                <input
                  className={input}
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-navy">Image URL</span>
                <input
                  className={input}
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-navy">Stock qty</span>
                <input
                  className={input}
                  value={form.stockQty}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stockQty: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-navy">Low stock at</span>
                <input
                  className={input}
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      lowStockThreshold: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-navy">Sort order</span>
                <input
                  className={input}
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: e.target.value }))
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                Active on storefront
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save product"}
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
            {products.map((p) => {
              const low = p.stockQty <= p.lowStockThreshold;
              return (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center"
                >
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-navy">{p.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase",
                          p.isActive
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-stone-100 text-stone-600",
                        )}
                      >
                        {p.isActive ? "active" : "archived"}
                      </span>
                      {low ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-amber-900">
                          low stock
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted">
                      {formatMoney(p.priceCents)} · {p.category} · stock{" "}
                      {p.stockQty}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="number"
                      min={0}
                      className="w-20 rounded-md border border-border bg-ivory px-2 py-1.5 text-sm"
                      defaultValue={p.stockQty}
                      key={`${p.id}-${p.stockQty}`}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (Number.isFinite(n) && n !== p.stockQty) {
                          void onStock(p.id, Math.max(0, n));
                        }
                      }}
                      aria-label={`Stock for ${p.name}`}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setForm(productToForm(p));
                        setOpen(true);
                        setError(null);
                      }}
                    >
                      Edit
                    </Button>
                    {p.isActive ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void onDeactivate(p.id)}
                      >
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
            {products.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
                <Package className="mx-auto mb-2 size-6 opacity-50" />
                No products yet. Create the first one.
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </>
  );
}
