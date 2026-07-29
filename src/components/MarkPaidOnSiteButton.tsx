"use client";

import { useState, useTransition } from "react";
import { markOrderPaidOnSite } from "@/lib/actions/orders";

export function MarkPaidOnSiteButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("Confirmez-vous avoir reçu le paiement de cette commande ?")) return;
    setError(null);
    startTransition(async () => {
      const result = await markOrderPaidOnSite(orderId);
      if (result.status === "error") {
        setError(result.message ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? "..." : "Marquer comme payée"}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}
