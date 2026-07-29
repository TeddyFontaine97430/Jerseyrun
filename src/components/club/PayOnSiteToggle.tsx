"use client";

import { useTransition } from "react";
import { updatePayOnSiteSetting } from "@/lib/actions/club-settings";

export function PayOnSiteToggle({ enabled }: { enabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={enabled}
        disabled={isPending}
        onChange={(e) => startTransition(() => updatePayOnSiteSetting(e.target.checked))}
        className="h-5 w-5 rounded border-white/20 bg-neutral-800 text-accent focus:ring-accent disabled:opacity-50"
      />
      <span className="text-sm text-white">
        Autoriser le paiement sur place au retrait
      </span>
    </label>
  );
}
