"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/money";
import { computeDeliveryFeeCents, type DeliveryMethod } from "@/lib/delivery";

export function OrderSummary({
  subtotalCents,
  itemCount,
  singleClub,
}: {
  subtotalCents: number;
  itemCount: number;
  singleClub: boolean;
}) {
  const [method, setMethod] = useState<DeliveryMethod>("DELIVERY");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryFeeCents = computeDeliveryFeeCents(method, itemCount);
  const totalCents = subtotalCents + deliveryFeeCents;

  async function handleCheckout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryMethod: method }),
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

      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-neutral-300">Livraison</p>
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 has-[:checked]:border-accent">
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name="deliveryMethod"
              checked={method === "DELIVERY"}
              onChange={() => setMethod("DELIVERY")}
            />
            Livraison à domicile (Île de la Réunion)
          </span>
          <span className="font-medium text-white">{formatPrice(computeDeliveryFeeCents("DELIVERY", itemCount))}</span>
        </label>
        <label
          className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
            singleClub
              ? "cursor-pointer border-white/10 text-neutral-300 has-[:checked]:border-accent"
              : "cursor-not-allowed border-white/5 text-neutral-600"
          }`}
        >
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name="deliveryMethod"
              disabled={!singleClub}
              checked={method === "PICKUP"}
              onChange={() => setMethod("PICKUP")}
            />
            Retrait au club
          </span>
          <span className="font-medium">Gratuit</span>
        </label>
        {!singleClub && (
          <p className="text-xs text-neutral-500">
            Le retrait au club n&apos;est disponible que si votre panier ne contient des articles que d&apos;un
            seul club.
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-between text-sm text-neutral-300">
        <span>Sous-total</span>
        <span>{formatPrice(subtotalCents)}</span>
      </div>
      <div className="mt-1 flex justify-between text-sm text-neutral-300">
        <span>Livraison</span>
        <span>{deliveryFeeCents === 0 ? "Gratuit" : formatPrice(deliveryFeeCents)}</span>
      </div>
      <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
        <span>Total</span>
        <span>{formatPrice(totalCents)}</span>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={pending}
        className="mt-6 w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Redirection..." : "Passer commande et payer"}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-400">{error}</p>}
    </div>
  );
}
