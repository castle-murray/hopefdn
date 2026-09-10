/**
 * Shop data access + business logic — server-only.
 * Imported only from createServerFn handlers in `./server.ts` (never from client modules).
 */
import { getSql } from "@/lib/db";
import {
  ensureStaffAccess,
  isAdminUser,
  requireAdmin,
  requireStaff,
} from "@/lib/auth/staff.server";
import { getSessionUser } from "@/lib/auth/verify.server";
import type {
  Order,
  OrderItem,
  PaymentStatus,
  PackingStatus,
  Product,
  ShippingStatus,
} from "./types";

export const SHIPPING_CENTS = 599;
export const FREE_SHIPPING_AT = 7500;
const SHOP_PUBLIC_KEY = "shop_public";

export class ShopAccessDeniedError extends Error {
  readonly status = 403;
  constructor(message = "The shop is not available") {
    super(message);
    this.name = "ShopAccessDeniedError";
  }
}

async function readShopPublicFlag(): Promise<boolean> {
  const sql = await getSql();
  try {
    const rows = await sql.query<{ value: string }>(
      `select value from site_settings where key = $1 limit 1`,
      [SHOP_PUBLIC_KEY],
    );
    const raw = rows[0]?.value?.trim().toLowerCase();
    if (raw === undefined) return true;
    return raw === "true" || raw === "1" || raw === "yes";
  } catch {
    return true;
  }
}

async function writeShopPublicFlag(enabled: boolean): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `insert into site_settings (key, value, updated_at)
     values ($1, $2, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [SHOP_PUBLIC_KEY, enabled ? "true" : "false"],
  );
}

export async function isShopPublicEnabled(): Promise<boolean> {
  return readShopPublicFlag();
}

export async function canAccessStorefront(): Promise<boolean> {
  if (await readShopPublicFlag()) return true;
  try {
    const user = await getSessionUser();
    if (!user) return false;
    return isAdminUser(user.id);
  } catch {
    return false;
  }
}

async function assertStorefrontAccess(): Promise<void> {
  if (!(await canAccessStorefront())) {
    throw new ShopAccessDeniedError(
      "The shop is currently hidden. Only administrators can access it.",
    );
  }
}

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  category: string;
  is_active: boolean | number;
  stock_qty: number;
  low_stock_threshold: number;
  sort_order: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  ship_line1: string;
  ship_line2: string;
  ship_city: string;
  ship_state: string;
  ship_postal: string;
  ship_country: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  payment_status: PaymentStatus;
  payment_method: string;
  card_brand: string;
  card_last4: string;
  packing_status: PackingStatus;
  shipping_status: ShippingStatus;
  tracking_number: string | null;
  carrier: string | null;
  notes: string;
  is_demo: boolean | number;
  created_at: string | Date;
};

type ItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: Number(row.price_cents),
    imageUrl: row.image_url,
    category: row.category,
    isActive: Boolean(row.is_active),
    stockQty: Number(row.stock_qty),
    lowStockThreshold: Number(row.low_stock_threshold),
    sortOrder: Number(row.sort_order),
  };
}

function mapItem(row: ItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    unitPriceCents: Number(row.unit_price_cents),
    quantity: Number(row.quantity),
    lineTotalCents: Number(row.line_total_cents),
  };
}

function mapOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shipLine1: row.ship_line1,
    shipLine2: row.ship_line2,
    shipCity: row.ship_city,
    shipState: row.ship_state,
    shipPostal: row.ship_postal,
    shipCountry: row.ship_country,
    subtotalCents: Number(row.subtotal_cents),
    shippingCents: Number(row.shipping_cents),
    totalCents: Number(row.total_cents),
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    cardBrand: row.card_brand,
    cardLast4: row.card_last4,
    packingStatus: row.packing_status,
    shippingStatus: row.shipping_status,
    trackingNumber: row.tracking_number,
    carrier: row.carrier,
    notes: row.notes,
    isDemo: Boolean(row.is_demo),
    createdAt: toIso(row.created_at),
    items,
  };
}

async function loadOrderItems(
  orderIds: string[],
): Promise<Map<string, OrderItem[]>> {
  const map = new Map<string, OrderItem[]>();
  if (orderIds.length === 0) return map;
  const sql = await getSql();
  const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await sql.query<ItemRow & { order_id: string }>(
    `select id, order_id, product_id, product_name, product_sku,
            unit_price_cents, quantity, line_total_cents
     from order_items
     where order_id in (${placeholders})
     order by product_name`,
    orderIds,
  );
  for (const row of rows) {
    const list = map.get(row.order_id) ?? [];
    list.push(mapItem(row));
    map.set(row.order_id, list);
  }
  return map;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "product";
}

async function uniqueProductSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const sql = await getSql();
  let candidate = base;
  for (let i = 0; i < 40; i += 1) {
    const rows = await sql.query<{ id: string }>(
      excludeId
        ? `select id from products where slug = $1 and id <> $2 limit 1`
        : `select id from products where slug = $1 limit 1`,
      excludeId ? [candidate, excludeId] : [candidate],
    );
    if (rows.length === 0) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

function detectCardBrand(digits: string): string {
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(?:011|5)/.test(digits)) return "Discover";
  return "Demo Card";
}

// ── Public / storefront ──────────────────────────────────────────────────────

export async function getShopVisibilityImpl(): Promise<{
  publicEnabled: boolean;
  canAccess: boolean;
}> {
  const publicEnabled = await readShopPublicFlag();
  const canAccess = await canAccessStorefront();
  return { publicEnabled, canAccess };
}

export async function setShopPublicImpl(
  userId: string,
  enabled: boolean,
): Promise<{ publicEnabled: boolean }> {
  await requireAdmin(userId);
  await writeShopPublicFlag(enabled);
  return { publicEnabled: enabled };
}

export async function listStoreProductsImpl(): Promise<Product[]> {
  await assertStorefrontAccess();
  const sql = await getSql();
  const rows = await sql.query<ProductRow>(
    `select id, slug, name, description, price_cents, image_url, category,
            is_active, stock_qty, low_stock_threshold, sort_order
     from products
     where is_active = true and stock_qty > 0
     order by sort_order asc, name asc`,
  );
  return rows.map(mapProduct);
}

export type CheckoutInput = {
  items: { productId: string; quantity: number }[];
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

export async function placeDemoOrderImpl(data: CheckoutInput): Promise<Order> {
  await assertStorefrontAccess();
  const sql = await getSql();
  const productIds = data.items.map((i) => i.productId);
  const placeholders = productIds.map((_, i) => `$${i + 1}`).join(", ");
  const products = await sql.query<ProductRow>(
    `select id, slug, name, description, price_cents, image_url, category,
            is_active, stock_qty, low_stock_threshold, sort_order
     from products
     where id in (${placeholders})`,
    productIds,
  );
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const lines: {
    product: ProductRow;
    quantity: number;
    unit: number;
    line: number;
  }[] = [];

  for (const item of data.items) {
    const product = byId.get(item.productId);
    if (!product || !product.is_active) {
      throw new Error("One or more products are unavailable");
    }
    if (Number(product.stock_qty) < item.quantity) {
      throw new Error(`Not enough stock for ${product.name}`);
    }
    const unit = Number(product.price_cents);
    const line = unit * item.quantity;
    subtotal += line;
    lines.push({ product, quantity: item.quantity, unit, line });
  }

  const shipping = subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_CENTS;
  const total = subtotal + shipping;

  const digits = data.cardNumber.replace(/\D/g, "");
  if (digits.length < 4) {
    throw new Error("Enter a card number (any demo number works)");
  }
  const last4 = digits.slice(-4);
  const brand = detectCardBrand(digits);

  const orderId = crypto.randomUUID();
  const seqRows = await sql.query<{ n: number }>(
    `select count(*)::int as n from orders`,
  );
  const seq = Number(seqRows[0]?.n ?? 0) + 1001;
  const orderNumber = `HOPE-${seq}`;

  await sql.query(
    `insert into orders (
       id, order_number, customer_name, customer_email, customer_phone,
       ship_line1, ship_line2, ship_city, ship_state, ship_postal, ship_country,
       subtotal_cents, shipping_cents, total_cents,
       payment_status, payment_method, card_brand, card_last4,
       packing_status, shipping_status, notes, is_demo
     ) values (
       $1, $2, $3, $4, $5,
       $6, $7, $8, $9, $10, $11,
       $12, $13, $14,
       'paid', 'card', $15, $16,
       'unfulfilled', 'not_shipped', $17, true
     )`,
    [
      orderId,
      orderNumber,
      data.customerName,
      data.customerEmail.toLowerCase(),
      data.customerPhone,
      data.shipLine1,
      data.shipLine2,
      data.shipCity,
      data.shipState,
      data.shipPostal,
      data.shipCountry,
      subtotal,
      shipping,
      total,
      brand,
      last4,
      "Demo order — no real payment processed",
    ],
  );

  for (const line of lines) {
    await sql.query(
      `insert into order_items (
         id, order_id, product_id, product_name, product_sku,
         unit_price_cents, quantity, line_total_cents
       ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        crypto.randomUUID(),
        orderId,
        line.product.id,
        line.product.name,
        line.product.slug,
        line.unit,
        line.quantity,
        line.line,
      ],
    );
    await sql.query(
      `update products
       set stock_qty = stock_qty - $2, updated_at = now()
       where id = $1 and stock_qty >= $2`,
      [line.product.id, line.quantity],
    );
  }

  const orderRows = await sql.query<OrderRow>(
    `select * from orders where id = $1 limit 1`,
    [orderId],
  );
  const items = await loadOrderItems([orderId]);
  return mapOrder(orderRows[0]!, items.get(orderId) ?? []);
}

// ── Staff: products ──────────────────────────────────────────────────────────

export async function listAllProductsImpl(userId: string): Promise<Product[]> {
  await requireStaff(userId);
  const sql = await getSql();
  const rows = await sql.query<ProductRow>(
    `select id, slug, name, description, price_cents, image_url, category,
            is_active, stock_qty, low_stock_threshold, sort_order
     from products
     order by sort_order asc, name asc`,
  );
  return rows.map(mapProduct);
}

export type ProductUpsertInput = {
  id?: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  category: string;
  isActive: boolean;
  stockQty: number;
  lowStockThreshold: number;
  sortOrder: number;
  slug?: string;
};

export async function saveProductImpl(
  userId: string,
  data: ProductUpsertInput,
): Promise<Product> {
  await requireStaff(userId);
  const sql = await getSql();
  const slug = await uniqueProductSlug(data.slug ?? slugify(data.name), data.id);

  if (data.id) {
    const rows = await sql.query<ProductRow>(
      `update products set
         slug = $2, name = $3, description = $4, price_cents = $5,
         image_url = $6, category = $7, is_active = $8, stock_qty = $9,
         low_stock_threshold = $10, sort_order = $11, updated_at = now()
       where id = $1
       returning id, slug, name, description, price_cents, image_url, category,
                 is_active, stock_qty, low_stock_threshold, sort_order`,
      [
        data.id,
        slug,
        data.name,
        data.description,
        data.priceCents,
        data.imageUrl,
        data.category,
        data.isActive,
        data.stockQty,
        data.lowStockThreshold,
        data.sortOrder,
      ],
    );
    if (!rows[0]) throw new Error("Product not found");
    return mapProduct(rows[0]);
  }

  const id = crypto.randomUUID();
  const rows = await sql.query<ProductRow>(
    `insert into products (
       id, slug, name, description, price_cents, image_url, category,
       is_active, stock_qty, low_stock_threshold, sort_order
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     returning id, slug, name, description, price_cents, image_url, category,
               is_active, stock_qty, low_stock_threshold, sort_order`,
    [
      id,
      slug,
      data.name,
      data.description,
      data.priceCents,
      data.imageUrl,
      data.category,
      data.isActive,
      data.stockQty,
      data.lowStockThreshold,
      data.sortOrder,
    ],
  );
  return mapProduct(rows[0]!);
}

export async function deleteProductImpl(
  userId: string,
  id: string,
): Promise<{ ok: true }> {
  await requireStaff(userId);
  const sql = await getSql();
  await sql.query(
    `update products set is_active = false, stock_qty = 0, updated_at = now()
     where id = $1`,
    [id],
  );
  return { ok: true };
}

export async function adjustStockImpl(
  userId: string,
  id: string,
  stockQty: number,
): Promise<Product> {
  await requireStaff(userId);
  const sql = await getSql();
  const rows = await sql.query<ProductRow>(
    `update products set stock_qty = $2, updated_at = now()
     where id = $1
     returning id, slug, name, description, price_cents, image_url, category,
               is_active, stock_qty, low_stock_threshold, sort_order`,
    [id, stockQty],
  );
  if (!rows[0]) throw new Error("Product not found");
  return mapProduct(rows[0]);
}

// ── Staff: orders ────────────────────────────────────────────────────────────

export async function listOrdersImpl(userId: string): Promise<Order[]> {
  await requireStaff(userId);
  const sql = await getSql();
  const rows = await sql.query<OrderRow>(
    `select * from orders order by created_at desc limit 200`,
  );
  const items = await loadOrderItems(rows.map((r) => r.id));
  return rows.map((r) => mapOrder(r, items.get(r.id) ?? []));
}

export async function getOrderImpl(
  userId: string,
  id: string,
): Promise<Order | null> {
  await requireStaff(userId);
  const sql = await getSql();
  const rows = await sql.query<OrderRow>(
    `select * from orders where id = $1 or order_number = $1 limit 1`,
    [id],
  );
  if (!rows[0]) return null;
  const items = await loadOrderItems([rows[0].id]);
  return mapOrder(rows[0], items.get(rows[0].id) ?? []);
}

export type UpdateOrderInput = {
  id: string;
  paymentStatus?: PaymentStatus;
  packingStatus?: PackingStatus;
  shippingStatus?: ShippingStatus;
  trackingNumber?: string | null;
  carrier?: string | null;
  notes?: string;
};

export async function updateOrderStatusImpl(
  userId: string,
  data: UpdateOrderInput,
): Promise<Order> {
  await requireStaff(userId);
  const sql = await getSql();
  const existing = await sql.query<OrderRow>(
    `select * from orders where id = $1 limit 1`,
    [data.id],
  );
  if (!existing[0]) throw new Error("Order not found");
  const cur = existing[0];

  const rows = await sql.query<OrderRow>(
    `update orders set
       payment_status = $2,
       packing_status = $3,
       shipping_status = $4,
       tracking_number = $5,
       carrier = $6,
       notes = $7,
       updated_at = now()
     where id = $1
     returning *`,
    [
      data.id,
      data.paymentStatus ?? cur.payment_status,
      data.packingStatus ?? cur.packing_status,
      data.shippingStatus ?? cur.shipping_status,
      data.trackingNumber === undefined
        ? cur.tracking_number
        : data.trackingNumber,
      data.carrier === undefined ? cur.carrier : data.carrier,
      data.notes ?? cur.notes,
    ],
  );
  const items = await loadOrderItems([data.id]);
  return mapOrder(rows[0]!, items.get(data.id) ?? []);
}

export async function canManageShopImpl(): Promise<boolean> {
  try {
    const user = await getSessionUser();
    if (!user) return false;
    return ensureStaffAccess(user.id);
  } catch {
    return false;
  }
}
