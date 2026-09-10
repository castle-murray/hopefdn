export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PackingStatus = "unfulfilled" | "packing" | "packed";
export type ShippingStatus = "not_shipped" | "shipped" | "delivered";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  category: string;
  isActive: boolean;
  stockQty: number;
  lowStockThreshold: number;
  sortOrder: number;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type OrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shipLine1: string;
  shipLine2: string;
  shipCity: string;
  shipState: string;
  shipPostal: string;
  shipCountry: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  cardBrand: string;
  cardLast4: string;
  packingStatus: PackingStatus;
  shippingStatus: ShippingStatus;
  trackingNumber: string | null;
  carrier: string | null;
  notes: string;
  isDemo: boolean;
  createdAt: string;
  items: OrderItem[];
};

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
