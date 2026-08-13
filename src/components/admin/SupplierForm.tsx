"use client";

import { useActionState } from "react";
import { createSupplier, updateSupplier, type SupplierFormState } from "@/lib/actions/suppliers";

const initialState: SupplierFormState = { status: "idle" };

type SupplierInitial = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
};

export function SupplierForm({ supplier, onDone }: { supplier?: SupplierInitial; onDone?: () => void }) {
  const action = supplier ? updateSupplier : createSupplier;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {supplier && <input type="hidden" name="supplierId" value={supplier.id} />}
      <div>
        <label className="mb-1 block text-sm font-medium text-white">Nom du fournisseur</label>
        <input
          name="name"
          required
          defaultValue={supplier?.name}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-white">Email</label>
        <input
          type="email"
          name="email"
          required
          defaultValue={supplier?.email}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-white">Téléphone (optionnel)</label>
        <input
          name="phone"
          defaultValue={supplier?.phone ?? ""}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-white">Notes (optionnel)</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={supplier?.notes ?? ""}
          placeholder="Délais, minimum de commande, articles habituels..."
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : supplier ? "Mettre à jour" : "Ajouter le fournisseur"}
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className="text-sm font-medium text-neutral-400 hover:text-white">
            Annuler
          </button>
        )}
        {state.status === "success" && <p className="text-sm font-medium text-emerald-400">{state.message}</p>}
        {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
      </div>
      {state.status === "success" && state.tempPassword && (
        <div className="sm:col-span-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs">
          <p className="font-semibold text-amber-300">Mot de passe temporaire (déjà envoyé par email) :</p>
          <p className="mt-1 select-all rounded bg-neutral-800 px-2 py-1 font-mono text-sm text-white">
            {state.tempPassword}
          </p>
        </div>
      )}
    </form>
  );
}
