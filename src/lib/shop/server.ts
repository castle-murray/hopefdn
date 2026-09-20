/**
 * Shop RPC surface — safe to import from client routes/components.
 *
 * All DB / auth / staff logic lives in `./shop.server.ts` and is only loaded
 * inside createServerFn handlers (server-side). Do not import `*.server` modules
 * from this file at the top level.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { Order, Product } from "./types";

export const SHIPPING_CENTS = 599;
export const FREE_SHIPPING_AT = 7500;

export const shopConfig = {
  shippingCents: SHIPPING_CENTS,
  freeShippingAt: FREE_SHIPPING_AT,
} as const;

/** Public flag + whether this visitor may open the storefront. */
export const getShopVisibility = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ publicEnabled: boolean; canAccess: boolean }> => {
    const { getShopVisibilityImpl } = await import("./shop.server");
    return getShopVisibilityImpl();
  },
);

/** Admin-only: show or hide the public shop (nav + /legacy + checkout). */
export const setShopPublic = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) =>
    z.object({ enabled: z.boolean() }).parse(raw),
  )
  .handler(async ({ data, context }): Promise<{ publicEnabled: boolean }> => {
    const { setShopPublicImpl } = await import("./shop.server");
    return setShopPublicImpl(context.userId, data.enabled);
  });

export const listStoreProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const { listStoreProductsImpl } = await import("./shop.server");
    return listStoreProductsImpl();
  },
);

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(40),
  customerName: z.string().trim().min(1).max(120),
  customerEmail: z.string().email().max(200),
  customerPhone: z.string().trim().max(40).default(""),
  shipLine1: z.string().trim().min(1).max(200),
  shipLine2: z.string().trim().max(200).default(""),
  shipCity: z.string().trim().min(1).max(100),
  shipState: z.string().trim().min(1).max(40),
  shipPostal: z.string().trim().min(1).max(20),
  shipCountry: z.string().trim().min(2).max(40).default("US"),
  cardNumber: z.string().min(4).max(32),
  cardName: z.string().trim().min(1).max(120),
  cardExpiry: z.string().trim().min(3).max(10),
  cardCvc: z.string().trim().min(3).max(4),
});

export const placeDemoOrder = createServerFn({ method: "POST" })
  .validator((raw: unknown) => checkoutSchema.parse(raw))
  .handler(async ({ data }): Promise<Order> => {
    const { placeDemoOrderImpl } = await import("./shop.server");
    return placeDemoOrderImpl(data);
  });

export const listAllProducts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Product[]> => {
    const { listAllProductsImpl } = await import("./shop.server");
    return listAllProductsImpl(context.userId);
  });

const productUpsertSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).default(""),
  priceCents: z.number().int().min(0).max(1_000_000),
  imageUrl: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .default("/images/product-legacy-tumbler.webp"),
  category: z.string().trim().min(1).max(80).default("merchandise"),
  isActive: z.boolean().default(true),
  stockQty: z.number().int().min(0).max(1_000_000).default(0),
  lowStockThreshold: z.number().int().min(0).max(10_000).default(5),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => productUpsertSchema.parse(raw))
  .handler(async ({ data, context }): Promise<Product> => {
    const { saveProductImpl } = await import("./shop.server");
    return saveProductImpl(context.userId, data);
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => z.object({ id: z.string().min(1) }).parse(raw))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { deleteProductImpl } = await import("./shop.server");
    return deleteProductImpl(context.userId, data.id);
  });

export const adjustStock = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().min(1),
        stockQty: z.number().int().min(0).max(1_000_000),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }): Promise<Product> => {
    const { adjustStockImpl } = await import("./shop.server");
    return adjustStockImpl(context.userId, data.id, data.stockQty);
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Order[]> => {
    const { listOrdersImpl } = await import("./shop.server");
    return listOrdersImpl(context.userId);
  });

export const getOrder = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => z.object({ id: z.string().min(1) }).parse(raw))
  .handler(async ({ data, context }): Promise<Order | null> => {
    const { getOrderImpl } = await import("./shop.server");
    return getOrderImpl(context.userId, data.id);
  });

const updateOrderSchema = z.object({
  id: z.string().min(1),
  paymentStatus: z
    .enum(["pending", "paid", "failed", "refunded"])
    .optional(),
  packingStatus: z.enum(["unfulfilled", "packing", "packed"]).optional(),
  shippingStatus: z
    .enum(["not_shipped", "shipped", "delivered"])
    .optional(),
  trackingNumber: z.string().trim().max(80).nullable().optional(),
  carrier: z.string().trim().max(80).nullable().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => updateOrderSchema.parse(raw))
  .handler(async ({ data, context }): Promise<Order> => {
    const { updateOrderStatusImpl } = await import("./shop.server");
    return updateOrderStatusImpl(context.userId, data);
  });

export const canManageShop = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    const { canManageShopImpl } = await import("./shop.server");
    return canManageShopImpl();
  },
);

/** Staff when shop is public; admin/superuser only when shop is hidden. */
export const canManageOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    const { canManageOrdersImpl } = await import("./shop.server");
    return canManageOrdersImpl();
  },
);