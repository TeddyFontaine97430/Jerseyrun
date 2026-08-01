"use client";

import { useTransition } from "react";
import { toggleOrderItemReadyForPickup } from "@/lib/actions/orders";

export function ReadyForPickupToggle({
  orderItemId,
  readyForPickup,
}: {
  orderItemId: string;
  readyForPickup: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    if (!readyForPickup && !confirm("Un email va être envoyé au client pour le prévenir. Continuer ?")) return;
    startTransition(() => toggleOrderItemReadyForPickup(orderItemId));
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={readyForPickup}
        disabled={isPending}
        onChange={handleChange}
        className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-gold focus:ring-gold disabled:opacity-50"
      />
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
          readyForPickup ? "bg-gold/15 text-gold" : "bg-white/10 text-neutral-400"
        }`}
      >
        Prête à récupérer
      </span>
    </label>
  );
}
