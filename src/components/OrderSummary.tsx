"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/money";

export function OrderSummary({
  subtotalCents,
  singleClub,
  stripeReady,
  allowPayOnSite,
}: {
  subtotalCents: number;
  singleClub: boolean;
  stripeReady: boolean;
  allowPayOnSite: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "ON_SITE">(stripeReady ? "STRIPE" : "ON_SITE");

  const showPaymentChoice = stripeReady && allowPayOnSite;

  async function handleCheckout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryMethod: "PICKUP", paymentMethod }),
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

      <div className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-sm">
        <span className="font-medium text-white">Retrait au club</span>
        <p className="mt-1 text-xs text-neutral-500">
          Les commandes sont actuellement à récupérer directement auprès du club.
        </p>
      </div>
      {!singleClub && (
        <p className="mt-2 text-xs font-medium text-red-400">
          Votre panier contient des articles de plusieurs clubs. Le retrait n&apos;étant possible qu&apos;auprès
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
            {stripeReady ? "Paiement par carte bancaire" : "Paiement sur place, au retrait"}
          </span>
        </div>
      )}

      <div className="mt-4 flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
        <span>Total</span>
        <span>{formatPrice(subtotalCents)}</span>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={pending || !singleClub}
        className="mt-6 w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending
          ? "Redirection..."
          : paymentMethod === "ON_SITE"
            ? "Passer commande (paiement sur place)"
            : "Passer commande et payer"}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-400">{error}</p>}
    </div>
  );
}
