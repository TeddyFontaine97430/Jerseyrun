"use client";

import { useState, useTransition } from "react";
import { closeClub, reopenClub } from "@/lib/actions/admin";

export function ClubStatusToggle({ clubId, active }: { clubId: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const confirmMessage = active
      ? "Fermer cette boutique ? Elle ne sera plus visible ni accessible aux clients jusqu'à ce que vous la rouvriez."
      : "Rouvrir cette boutique aux clients ?";
    if (!confirm(confirmMessage)) return;

    setError(null);
    startTransition(async () => {
      try {
        if (active) {
          await closeClub(clubId);
        } else {
          await reopenClub(clubId);
        }
      } catch {
        setError("Une erreur est survenue.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className={
          active
            ? "rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            : "rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        }
      >
        {isPending ? "..." : active ? "Fermer la boutique" : "Rouvrir la boutique"}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}
