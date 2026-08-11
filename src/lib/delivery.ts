export type DeliveryZone = "PICKUP" | "DELIVERY_METROPOLE" | "DELIVERY_REUNION";

export type ClubDeliverySettings = {
  deliveryMetropoleEnabled: boolean;
  deliveryMetropoleFeeCents: number;
  deliveryMetropoleExtraItemCents: number;
  deliveryReunionEnabled: boolean;
  deliveryReunionFeeCents: number;
  deliveryReunionExtraItemCents: number;
};

/**
 * A delivery zone (as opposed to pickup) requires paying online: it can only be offered
 * once the club has connected & activated a Stripe account, on top of the club having
 * enabled that specific zone in their settings.
 */
export function isDeliveryZoneAvailable(
  zone: DeliveryZone,
  club: ClubDeliverySettings,
  stripeReady: boolean,
): boolean {
  if (zone === "PICKUP") return true;
  if (!stripeReady) return false;
  if (zone === "DELIVERY_METROPOLE") return club.deliveryMetropoleEnabled;
  return club.deliveryReunionEnabled;
}

export function computeClubDeliveryFeeCents(
  zone: DeliveryZone,
  club: ClubDeliverySettings,
  itemCount: number,
): number {
  if (zone === "PICKUP") return 0;
  const extraItems = Math.max(0, itemCount - 1);
  if (zone === "DELIVERY_METROPOLE") {
    return club.deliveryMetropoleFeeCents + extraItems * club.deliveryMetropoleExtraItemCents;
  }
  return club.deliveryReunionFeeCents + extraItems * club.deliveryReunionExtraItemCents;
}

export function deliveryZoneLabel(zone: DeliveryZone | "DELIVERY"): string {
  switch (zone) {
    case "PICKUP":
      return "Retrait au club";
    case "DELIVERY_METROPOLE":
      return "Livraison France métropolitaine";
    case "DELIVERY_REUNION":
      return "Livraison Île de la Réunion";
    default:
      return "Livraison à domicile";
  }
}

export function shippingCountryForZone(zone: DeliveryZone): string | null {
  if (zone === "DELIVERY_METROPOLE") return "France métropolitaine";
  if (zone === "DELIVERY_REUNION") return "France — La Réunion";
  return null;
}

export function formatShippingAddress(order: {
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
}): string | null {
  const parts = [
    order.shippingLine1,
    order.shippingLine2,
    [order.shippingPostalCode, order.shippingCity].filter(Boolean).join(" "),
    order.shippingCountry,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}
