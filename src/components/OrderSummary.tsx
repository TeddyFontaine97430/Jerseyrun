"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/money";

type DeliverySettings = {
  metropoleEnabled: boolean;
  metropoleFeeCents: number;
  metropoleExtraItemCents: number;
  reunionEnabled: boolean;
  reunionFeeCents: number;
  reunionExtraItemCents: number;
};

type DeliveryMethod = "PICKUP" | "DELIVERY_METROPOLE" | "DELIVERY_REUNION";

function feeFor(method: DeliveryMethod, delivery: DeliverySettings | null, itemCount: number): number {
  if (method === "PICKUP" || !delivery) return 0;
  const extraItems = Math.max(0, itemCount - 1);
  if (method === "DELIVERY_METROPOLE") {
    return delivery.metropoleFeeCents + extraItems * delivery.metropoleExtraItemCents;
  }
  return delivery.reunionFeeCents + extraItems * delivery.reunionExtraItemCents;
}

export function OrderSummary({
  subtotalCents,
  itemCount,
  singleClub,
  stripeReady,
  allowPayOnSite,
  delivery,
}: {
  subtotalCents: number;
  itemCount: number;
  singleClub: boolean;
  stripeReady: boolean;
  allowPayOnSite: boolean;
  delivery: DeliverySettings | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "ON_SITE">(stripeReady ? "STRIPE" : "ON_SITE");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP");
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", postalCode: "" });

  const needsAddress = deliveryMethod !== "PICKUP";
  // La livraison à domicile doit obligatoirement être payée en ligne : elle n'est donc
  // proposée que si le club a connecté Stripe, et son choix verrouille le paiement en carte.
  const showMetropole = stripeReady && Boolean(delivery?.metropoleEnabled);
  const showReunion = stripeReady && Boolean(delivery?.reunionEnabled);
  const effectivePaymentMethod: "STRIPE" | "ON_SITE" = needsAddress ? "STRIPE" : paymentMethod;
  const showPaymentChoice = !needsAddress && stripeReady && allowPayOnSite;
  const deliveryFeeCents = feeFor(deliveryMethod, delivery, itemCount);
  const totalCents = subtotalCents + deliveryFeeCents;

  const addressComplete =
    !needsAddress || (address.line1.trim() && address.city.trim() && address.postalCode.trim());

  async function handleCheckout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod,
          paymentMethod: effectivePaymentMethod,
          ...(needsAddress
            ? {
                shippingLine1: address.line1,
                shippingLine2: address.line2,
                shippingCity: address.city,
                shippingPostalCode: address.postalCode,
              }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setPending(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Impossible de contacter le serveur de paiement.");
      setPending(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Récapitulatif</h2>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-white">Mode de récupération</p>
        <div className="space-y-2">
          <label className="flex items-start gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-200">
            <input
              type="radio"
              name="deliveryMethod"
              checked={deliveryMethod === "PICKUP"}
              onChange={() => setDeliveryMethod("PICKUP")}
              className="mt-0.5 h-4 w-4 border-white/20 bg-neutral-800 text-accent focus:ring-accent"
            />
            <span>
              <span className="font-medium text-white">Retrait au club</span>
              <span className="ml-2 text-xs text-neutral-500">Gratuit</span>
            </span>
          </label>
          {showMetropole && (
            <label className="flex items-start gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-200">
              <input
                type="radio"
                name="deliveryMethod"
                checked={deliveryMethod === "DELIVERY_METROPOLE"}
                onChange={() => setDeliveryMethod("DELIVERY_METROPOLE")}
                className="mt-0.5 h-4 w-4 border-white/20 bg-neutral-800 text-accent focus:ring-accent"
              />
              <span>
                <span className="font-medium text-white">Livraison France métropolitaine</span>
                <span className="ml-2 text-xs text-neutral-500">
                  {formatPrice(feeFor("DELIVERY_METROPOLE", delivery, itemCount))}
                </span>
              </span>
            </label>
          )}
          {showReunion && (
            <label className="flex items-start gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-200">
              <input
                type="radio"
                name="deliveryMethod"
                checked={deliveryMethod === "DELIVERY_REUNION"}
                onChange={() => setDeliveryMethod("DELIVERY_REUNION")}
                className="mt-0.5 h-4 w-4 border-white/20 bg-neutral-800 text-accent focus:ring-accent"
              />
              <span>
                <span className="font-medium text-white">Livraison Île de la Réunion</span>
                <span className="ml-2 text-xs text-neutral-500">
                  {formatPrice(feeFor("DELIVERY_REUNION", delivery, itemCount))}
                </span>
              </span>
            </label>
          )}
        </div>
      </div>

      {needsAddress && (
        <div className="mt-4 grid gap-2">
          <p className="text-sm font-medium text-white">Adresse de livraison</p>
          <input
            placeholder="Adresse"
            value={address.line1}
            onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          />
          <input
            placeholder="Complément d'adresse (optionnel)"
            value={address.line2}
            onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Code postal"
              value={address.postalCode}
              onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
            <input
              placeholder="Ville"
              value={address.city}
              onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      )}

      {!singleClub && (
        <p className="mt-2 text-xs font-medium text-red-400">
          Votre panier contient des articles de plusieurs clubs. La commande n&apos;étant possible qu&apos;auprès
          d&apos;un seul club à la fois, merci de commander séparément pour chaque club.
        </p>
      )}

      {showPaymentChoice ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-white">Mode de paiement</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-neutral-200">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "STRIPE"}
                onChange={() => setPaymentMethod("STRIPE")}
                className="h-4 w-4 border-white/20 bg-neutral-800 text-accent focus:ring-accent"
              />
              Carte bancaire (en ligne)
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-200">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "ON_SITE"}
                onChange={() => setPaymentMethod("ON_SITE")}
                className="h-4 w-4 border-white/20 bg-neutral-800 text-accent focus:ring-accent"
              />
              Paiement sur place, au retrait
            </label>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-sm">
          <span className="font-medium text-white">
            {needsAddress
              ? "Paiement par carte bancaire (en ligne)"
              : stripeReady
                ? "Paiement par carte bancaire"
                : "Paiement sur place, au retrait"}
          </span>
          {needsAddress && (
            <p className="mt-1 text-xs text-neutral-500">
              La livraison doit être réglée en ligne avant l&apos;envoi.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 space-y-1 border-t border-white/10 pt-2 text-sm">
        <div className="flex justify-between text-neutral-400">
          <span>Sous-total</span>
          <span>{formatPrice(subtotalCents)}</span>
        </div>
        {deliveryFeeCents > 0 && (
          <div className="flex justify-between text-neutral-400">
            <span>Livraison</span>
            <span>{formatPrice(deliveryFeeCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-white">
          <span>Total</span>
          <span>{formatPrice(totalCents)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={pending || !singleClub || !addressComplete}
        className="mt-6 w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending
          ? "Redirection..."
          : effectivePaymentMethod === "ON_SITE"
            ? "Passer commande (paiement sur place)"
            : "Passer commande et payer"}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-400">{error}</p>}
    </div>
  );
}
