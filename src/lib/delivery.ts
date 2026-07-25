export const DELIVERY_BASE_FEE_CENTS = 700;
export const DELIVERY_EXTRA_PER_ITEM_CENTS = 200;

export type DeliveryMethod = "DELIVERY" | "PICKUP";

export function computeDeliveryFeeCents(method: DeliveryMethod, itemCount: number): number {
  if (method === "PICKUP") return 0;
  return DELIVERY_BASE_FEE_CENTS + Math.max(0, itemCount - 1) * DELIVERY_EXTRA_PER_ITEM_CENTS;
}
