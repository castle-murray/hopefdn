import { useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import {
  Check,
  Heart,
  HeartHandshake,
  Megaphone,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import {
  canManageShop,
  getShopVisibility,
  listStoreProducts,
  placeDemoOrder,
  shopConfig,
} from "@/lib/shop/server";
import type { Order, Product } from "@/lib/shop/types";
import { formatMoney } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

type Step = "shop" | "cart" | "checkout" | "done";

type CartMap = Record<string, number>;

export const Route = createFileRoute("/legacy")({
  loader: async () => {
    const visibility = await getShopVisibility();
    if (!visibility.canAccess) {
      throw redirect({ to: "/" });
    }
    const [products, staff] = await Promise.all([
      listStoreProducts(),
      canManageShop().catch(() => false),
    ]);
    return {
      products,
      staff,
      shopHiddenFromPublic: !visibility.publicEnabled,
    };
  },
  component: LegacyShopPage,
  head: () => ({
    meta: [{ title: "The Legacy Collection | H.O.P.E. Foundation" }],
  }),
});

function LegacyShopPage() {
  const {
    products: initialProducts,
    staff,
    shopHiddenFromPublic,
  } = Route.useLoaderData();
  const [products] = useState(initialProducts);
  const [step, setStep] = useState<Step>("shop");
  const [cart, setCart] = useState<CartMap>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const [checkout, setCheckout] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shipLine1: "",
    shipLine2: "",
    shipCity: "",
    shipState: "VA",
    shipPostal: "",
    shipCountry: "US",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvc: "",
  });

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const lines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const product = productById.get(productId);
        if (!product) return null;
        return {
          product,
          quantity,
          lineTotal: product.priceCents * quantity,
        };
      })
      .filter(Boolean) as {
      product: Product;
      quantity: number;
      lineTotal: number;
    }[];
  }, [cart, productById]);

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shipping =
    subtotal === 0
      ? 0
      : subtotal >= shopConfig.freeShippingAt
        ? 0
        : shopConfig.shippingCents;
  const total = subtotal + shipping;
  const cartCount = lines.reduce((s, l) => s + l.quantity, 0);
  const hash = useRouterState({ select: (s) => s.location.hash });

  // Land on the shop step and scroll when opening /legacy#why from the nav.
  useEffect(() => {
    if (hash !== "#why") return;
    setStep("shop");
    const id = window.setTimeout(() => {
      document.getElementById("why")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
    return () => window.clearTimeout(id);
  }, [hash]);

  function setQty(productId: string, quantity: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  }

  function addToCart(product: Product) {
    const current = cart[product.id] ?? 0;
    if (current >= product.stockQty) return;
    setQty(product.id, current + 1);
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Your cart is empty");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await placeDemoOrder({
        data: {
          items: lines.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
          })),
          ...checkout,
        },
      });
      setOrder(result);
      setCart({});
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="The Legacy Collection"
        title="Wear the mission. Carry the legacy."
        description="Demo storefront — browse, cart, and checkout with any card number. No real payment is processed."
      />

      {shopHiddenFromPublic ? (
        <div className="border-b border-amber-200 bg-amber-50">
          <p className="mx-auto max-w-7xl px-4 py-2 text-center text-xs font-semibold text-amber-950 sm:px-6 lg:px-8">
            Admin preview — the public shop is hidden. Visitors cannot open this
            page until you enable it in the admin panel.
          </p>
        </div>
      ) : null}

      <section className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap gap-1" aria-label="Shop steps">
            {(
              [
                ["shop", "Shop"],
                ["cart", "Cart"],
                ["checkout", "Checkout"],
                ["done", "Confirmation"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                disabled={key === "done" && step !== "done"}
                onClick={() => {
                  if (key === "done" && step !== "done") return;
                  if (key === "checkout" && cartCount === 0) {
                    setStep("cart");
                    return;
                  }
                  setStep(key);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition",
                  step === key
                    ? "gradient-navy text-cream"
                    : "text-muted hover:bg-cream hover:text-navy",
                )}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {staff ? (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/shop">Manage shop</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/orders">Orders</Link>
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant={step === "cart" ? "default" : "outline"}
              size="sm"
              onClick={() => setStep("cart")}
            >
              <ShoppingCart className="size-4" aria-hidden />
              Cart{cartCount > 0 ? ` (${cartCount})` : ""}
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        </div>
      ) : null}

      {step === "shop" ? (
        <ShopGrid
          products={products}
          cart={cart}
          onAdd={addToCart}
          onOpenCart={() => setStep("cart")}
        />
      ) : null}

      {step === "cart" ? (
        <CartPanel
          lines={lines}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          onSetQty={setQty}
          onContinue={() => setStep("shop")}
          onCheckout={() => setStep("checkout")}
        />
      ) : null}

      {step === "checkout" ? (
        <CheckoutForm
          lines={lines}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          checkout={checkout}
          setCheckout={setCheckout}
          busy={busy}
          onBack={() => setStep("cart")}
          onSubmit={(e) => void submitOrder(e)}
        />
      ) : null}

      {step === "done" && order ? (
        <Confirmation order={order} onShopAgain={() => setStep("shop")} />
      ) : null}
    </>
  );
}

function ShopGrid({
  products,
  cart,
  onAdd,
  onOpenCart,
}: {
  products: Product[];
  cart: CartMap;
  onAdd: (p: Product) => void;
  onOpenCart: () => void;
}) {
  return (
    <>
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl bg-cream shadow-[var(--shadow-elevated)]">
              <img
                src="/images/product-legacy-tumbler.jpg"
                alt="HOPE Legacy Collection gold tumbler"
                className="mx-auto aspect-[3/4] max-h-[480px] w-full object-cover object-center"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Shop with purpose
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
                Every purchase fuels dignity
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted">
                The Legacy Collection turns everyday items into ambassadors for
                compassion. This is a full demo checkout — use any card number
                and address. Nothing is charged.
              </p>
              <p className="mt-4 text-sm text-muted">
                Free shipping on orders over{" "}
                {formatMoney(shopConfig.freeShippingAt)}.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button type="button" variant="gold" size="lg" onClick={onOpenCart}>
                  <ShoppingBag className="size-4" aria-hidden />
                  View cart
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#why">Why merchandise matters</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="scroll-mt-28 bg-cream/70 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Carry the legacy
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
            Why merchandise matters
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
            Every Legacy Collection piece is more than a product—it is a
            conversation starter, a fundraiser, and a visible reminder that
            dignity belongs to every neighbor in {site.region}.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                {
                  icon: Megaphone,
                  title: "Mission in motion",
                  body: "Hats, tees, and tumblers take the H.O.P.E. story into workplaces, schools, and events where a brochure never goes.",
                },
                {
                  icon: HeartHandshake,
                  title: "Funding that multiplies",
                  body: "Proceeds from the collection help underwrite shelter, meals, IDs, training, and counseling for the guests we serve.",
                },
                {
                  icon: Users,
                  title: "Community ownership",
                  body: "Wearing the brand says you are part of the work—partners, volunteers, and neighbors building legacy together.",
                },
              ] as const
            ).map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold text-navy-deep shadow">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-navy">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="collection" className="scroll-mt-28 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            Shop the collection
          </h2>
          {products.length === 0 ? (
            <p className="mt-8 text-muted">
              No products are available right now. Check back soon.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const inCart = cart[product.id] ?? 0;
                return (
                  <article
                    key={product.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-cream">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-xl font-semibold text-navy">
                          {product.name}
                        </h3>
                        <span className="text-sm font-bold text-gold-dark">
                          {formatMoney(product.priceCents)}
                        </span>
                      </div>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                        {product.description}
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        {product.stockQty} in stock
                        {inCart > 0 ? ` · ${inCart} in cart` : ""}
                      </p>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="mt-4"
                        disabled={inCart >= product.stockQty}
                        onClick={() => onAdd(product)}
                      >
                        <Plus className="size-4" aria-hidden />
                        Add to cart
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-14 text-center sm:py-16">
        <div className="mx-auto max-w-2xl px-4">
          <p className="font-display text-2xl italic text-gold-dark">
            {site.motto}
          </p>
          <p className="mt-4 text-muted">
            Prefer a direct gift? 100% of donations go to mission programs.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/donate">
              <Heart className="size-4 fill-current" aria-hidden />
              Donate Instead
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function CartPanel({
  lines,
  subtotal,
  shipping,
  total,
  onSetQty,
  onContinue,
  onCheckout,
}: {
  lines: { product: Product; quantity: number; lineTotal: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  onSetQty: (id: string, qty: number) => void;
  onContinue: () => void;
  onCheckout: () => void;
}) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-semibold text-navy">
          Your cart
        </h2>
        {lines.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted">Your cart is empty.</p>
            <Button type="button" className="mt-4" onClick={onContinue}>
              Continue shopping
            </Button>
          </div>
        ) : (
          <>
            <ul className="mt-8 grid gap-4">
              {lines.map(({ product, quantity, lineTotal }) => (
                <li
                  key={product.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
                >
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy">{product.name}</p>
                    <p className="text-sm text-muted">
                      {formatMoney(product.priceCents)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-md border border-border"
                      onClick={() => onSetQty(product.id, quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-md border border-border"
                      disabled={quantity >= product.stockQty}
                      onClick={() => onSetQty(product.id, quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="ml-2 grid h-9 w-9 place-items-center rounded-md border border-border text-muted hover:text-navy"
                      onClick={() => onSetQty(product.id, 0)}
                      aria-label="Remove"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-navy sm:w-20 sm:text-right">
                    {formatMoney(lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-xl border border-border bg-surface p-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold text-navy">
                  {formatMoney(subtotal)}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted">Shipping</span>
                <span className="font-semibold text-navy">
                  {shipping === 0 ? "Free" : formatMoney(shipping)}
                </span>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3">
                <span className="font-semibold text-navy">Total</span>
                <span className="font-bold text-gold-dark">
                  {formatMoney(total)}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={onContinue}>
                  Continue shopping
                </Button>
                <Button type="button" variant="gold" onClick={onCheckout}>
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function CheckoutForm({
  lines,
  subtotal,
  shipping,
  total,
  checkout,
  setCheckout,
  busy,
  onBack,
  onSubmit,
}: {
  lines: { product: Product; quantity: number; lineTotal: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  checkout: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shipLine1: string;
    shipLine2: string;
    shipCity: string;
    shipState: string;
    shipPostal: string;
    shipCountry: string;
    cardNumber: string;
    cardName: string;
    cardExpiry: string;
    cardCvc: string;
  };
  setCheckout: React.Dispatch<React.SetStateAction<typeof checkout>>;
  busy: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const field =
    "w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";

  function set<K extends keyof typeof checkout>(key: K, value: string) {
    setCheckout((c) => ({ ...c, [key]: value }));
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8"
        >
          <p className="rounded-lg bg-cream px-3 py-2 text-xs text-muted">
            <strong className="text-navy">Demo mode:</strong> any card number
            and address are accepted. No payment is processed.
          </p>

          <h2 className="mt-6 font-display text-2xl font-semibold text-navy">
            Contact
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-navy">Full name</span>
              <input
                className={field}
                required
                value={checkout.customerName}
                onChange={(e) => set("customerName", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-navy">Email</span>
              <input
                type="email"
                className={field}
                required
                value={checkout.customerEmail}
                onChange={(e) => set("customerEmail", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-navy">Phone</span>
              <input
                className={field}
                value={checkout.customerPhone}
                onChange={(e) => set("customerPhone", e.target.value)}
              />
            </label>
          </div>

          <h2 className="mt-8 font-display text-2xl font-semibold text-navy">
            Shipping address
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-navy">Address line 1</span>
              <input
                className={field}
                required
                value={checkout.shipLine1}
                onChange={(e) => set("shipLine1", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-navy">Address line 2</span>
              <input
                className={field}
                value={checkout.shipLine2}
                onChange={(e) => set("shipLine2", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-navy">City</span>
              <input
                className={field}
                required
                value={checkout.shipCity}
                onChange={(e) => set("shipCity", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-navy">State</span>
              <input
                className={field}
                required
                value={checkout.shipState}
                onChange={(e) => set("shipState", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-navy">ZIP</span>
              <input
                className={field}
                required
                value={checkout.shipPostal}
                onChange={(e) => set("shipPostal", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-navy">Country</span>
              <input
                className={field}
                required
                value={checkout.shipCountry}
                onChange={(e) => set("shipCountry", e.target.value)}
              />
            </label>
          </div>

          <h2 className="mt-8 font-display text-2xl font-semibold text-navy">
            Payment
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-navy">Name on card</span>
              <input
                className={field}
                required
                value={checkout.cardName}
                onChange={(e) => set("cardName", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-navy">
                Card number{" "}
                <span className="font-normal text-muted">(any digits)</span>
              </span>
              <input
                className={field}
                required
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                value={checkout.cardNumber}
                onChange={(e) => set("cardNumber", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-navy">Expiry</span>
              <input
                className={field}
                required
                placeholder="MM/YY"
                value={checkout.cardExpiry}
                onChange={(e) => set("cardExpiry", e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-navy">CVC</span>
              <input
                className={field}
                required
                placeholder="123"
                value={checkout.cardCvc}
                onChange={(e) => set("cardCvc", e.target.value)}
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onBack} disabled={busy}>
              Back to cart
            </Button>
            <Button type="submit" variant="gold" disabled={busy || lines.length === 0}>
              {busy ? "Placing order…" : `Pay ${formatMoney(total)} (demo)`}
            </Button>
          </div>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold text-navy">Order summary</h3>
          <ul className="mt-4 space-y-3">
            {lines.map(({ product, quantity, lineTotal }) => (
              <li key={product.id} className="flex justify-between gap-3 text-sm">
                <span className="text-muted">
                  {product.name} × {quantity}
                </span>
                <span className="font-medium text-navy">
                  {formatMoney(lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatMoney(shipping)}</span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-navy">
              <span>Total</span>
              <span className="text-gold-dark">{formatMoney(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Confirmation({
  order,
  onShopAgain,
}: {
  order: Order;
  onShopAgain: () => void;
}) {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-800">
          <Check className="size-7" aria-hidden />
        </div>
        <h2 className="mt-5 font-display text-3xl font-semibold text-navy">
          Order confirmed
        </h2>
        <p className="mt-2 text-muted">
          Demo order <strong className="text-navy">{order.orderNumber}</strong>{" "}
          is saved. Payment was simulated — no charge was made.
        </p>
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-left shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted">
            <Package className="mr-1 inline size-4 text-gold-dark" aria-hidden />
            Payment: <strong className="text-navy">{order.paymentStatus}</strong>
            {" · "}
            Packing: <strong className="text-navy">{order.packingStatus}</strong>
            {" · "}
            Shipping:{" "}
            <strong className="text-navy">{order.shippingStatus}</strong>
          </p>
          <p className="mt-3 text-sm text-muted">
            Card: {order.cardBrand} ···· {order.cardLast4}
          </p>
          <p className="mt-1 text-sm text-muted">
            Ship to: {order.customerName}, {order.shipLine1}, {order.shipCity},{" "}
            {order.shipState} {order.shipPostal}
          </p>
          <ul className="mt-4 space-y-2 border-t border-border pt-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span className="font-medium">
                  {formatMoney(item.lineTotalCents)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right font-bold text-gold-dark">
            Total {formatMoney(order.totalCents)}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button type="button" variant="gold" onClick={onShopAgain}>
            Shop again
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
