"use client";

import { useActionState } from "react";
import { updateClubLogo, type ClubLogoState } from "@/lib/actions/club-settings";

const initialState: ClubLogoState = { status: "idle" };

export function ClubLogoForm({ logoUrl }: { logoUrl: string | null }) {
  const [state, formAction, pending] = useActionState(updateClubLogo, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm sm:max-w-md">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-neutral-800">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo du club" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-neutral-500">Aucun</span>
          )}
        </div>
        <input
          name="logoFile"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          required
          className="w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60 sm:w-fit"
      >
        {pending ? "Envoi..." : "Mettre à jour le logo"}
      </button>
      {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
      {state.status === "success" && <p className="text-sm font-medium text-emerald-400">{state.message}</p>}
    </form>
  );
}
