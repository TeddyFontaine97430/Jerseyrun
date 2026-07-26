"use client";

import { useTransition } from "react";
import { updateSupplyOrderStatus } from "@/lib/actions/supply";
import {
  SUPPLY_ORDER_STATUS_LABELS,
  SUPPLY_ORDER_STATUS_ORDER,
  SUPPLY_ORDER_STATUS_STYLES,
} from "@/lib/supplyOrderStatus";
import type { SupplyOrderStatus } from "@prisma/client";

export function SupplyOrderStatusSelect({ orderId, status }: { orderId: string; status: SupplyOrderStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => startTransition(() => updateSupplyOrderStatus(orderId, e.target.value as SupplyOrderStatus))}
      className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold focus:outline-none disabled:opacity-50 ${
        SUPPLY_ORDER_STATUS_STYLES[status] ?? "bg-white/10 text-neutral-300"
      }`}
    >
      {SUPPLY_ORDER_STATUS_ORDER.map((value) => (
        <option key={value} value={value} className="bg-neutral-900 text-white">
          {SUPPLY_ORDER_STATUS_LABELS[value]}
        </option>
      ))}
    </select>
  );
}
