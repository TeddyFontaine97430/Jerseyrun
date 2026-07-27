"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/money";

export function OrderSummary({
  subtotalCents,
  singleClub,
}: {
  subtotalCents: number;
  singleClub: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryMethod: "PICKUP" }),
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
        {pending ? "Redirection..." : "Passer commande et payer"}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-400">{error}</p>}
    </div>
  );
}
