"use client";

import { useTransition } from "react";
import { toggleOrderItemDelivered } from "@/lib/actions/orders";

export function DeliveryStatusToggle({
  orderItemId,
  delivered,
}: {
  orderItemId: string;
  delivered: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={delivered}
        disabled={isPending}
        onChange={() => startTransition(() => toggleOrderItemDelivered(orderItemId))}
        className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
      />
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
          delivered ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
        }`}
      >
        {delivered ? "Livrée" : "En cours"}
      </span>
    </label>
  );
}
