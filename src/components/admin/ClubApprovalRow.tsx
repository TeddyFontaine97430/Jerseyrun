"use client";

import { useTransition } from "react";
import { approveClub, rejectClub } from "@/lib/actions/admin";

export function ClubApprovalRow({
  club,
}: {
  club: { id: string; name: string; email: string; phone: string; description: string | null };
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5 last:border-0">
      <div>
        <p className="font-semibold text-white">{club.name}</p>
        <p className="text-sm text-neutral-400">{club.email} · {club.phone}</p>
        {club.description && <p className="mt-1 max-w-md text-sm text-neutral-500">{club.description}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => approveClub(club.id))}
          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Valider
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => rejectClub(club.id))}
          className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          Refuser
        </button>
      </div>
    </div>
  );
}
