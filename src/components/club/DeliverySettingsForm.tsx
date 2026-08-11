"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateDeliverySettings, type DeliverySettingsState } from "@/lib/actions/club-settings";

const initialState: DeliverySettingsState = { status: "idle" };

type ZoneSettings = {
  enabled: boolean;
  feeCents: number;
  extraItemCents: number;
};

export function DeliverySettingsForm({
  metropole,
  reunion,
}: {
  metropole: ZoneSettings;
  reunion: ZoneSettings;
}) {
  const [state, formAction, pending] = useActionState(updateDeliverySettings, initialState);
  const [metropoleEnabled, setMetropoleEnabled] = useState(metropole.enabled);
  const [reunionEnabled, setReunionEnabled] = useState(reunion.enabled);

  return (
    <form
      action={formAction}
      className="grid gap-6 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm sm:grid-cols-2"
    >
      <div className="rounded-lg border border-white/10 bg-black/30 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-white">
          <input
            type="checkbox"
            name="metropoleEnabled"
            checked={metropoleEnabled}
            onChange={(e) => setMetropoleEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-accent focus:ring-accent"
          />
          Livraison France métropolitaine
        </label>
        {metropoleEnabled && (
          <div className="mt-3 grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">
                Tarif pour le 1er article (€)
              </label>
              <input
                name="metropoleFee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(metropole.feeCents / 100).toFixed(2)}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">
                Surcoût par article supplémentaire (€)
              </label>
              <input
                name="metropoleExtraItem"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(metropole.extraItemCents / 100).toFixed(2)}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-black/30 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-white">
          <input
            type="checkbox"
            name="reunionEnabled"
            checked={reunionEnabled}
            onChange={(e) => setReunionEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-accent focus:ring-accent"
          />
          Livraison Île de la Réunion
        </label>
        {reunionEnabled && (
          <div className="mt-3 grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">
                Tarif pour le 1er article (€)
              </label>
              <input
                name="reunionFee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(reunion.feeCents / 100).toFixed(2)}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">
                Surcoût par article supplémentaire (€)
              </label>
              <input
                name="reunionExtraItem"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(reunion.extraItemCents / 100).toFixed(2)}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="sm:col-span-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : "Enregistrer les options de livraison"}
        </button>
        {state.status === "success" && <p className="text-sm font-medium text-emerald-400">{state.message}</p>}
        {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
      </div>
    </form>
  );
}
