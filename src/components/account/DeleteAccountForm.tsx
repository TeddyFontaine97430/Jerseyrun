"use client";

import { useActionState } from "react";
import { deleteAccount, type DeleteAccountState } from "@/lib/actions/delete-account";

const initialState: DeleteAccountState = { status: "idle" };

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Supprimer définitivement votre compte ? Cette action est irréversible.")) {
          event.preventDefault();
        }
      }}
      className="grid gap-4 rounded-2xl border border-red-500/30 bg-neutral-900 p-6 shadow-sm sm:max-w-md"
    >
      <p className="text-sm text-neutral-400">
        La suppression efface votre compte, votre panier et vos appareils de notification. Vos commandes
        passées sont conservées sans lien avec votre identité, pour les obligations comptables du club.
      </p>
      <div>
        <label htmlFor="deletePassword" className="mb-1 block text-sm font-medium text-white">
          Mot de passe <span className="text-neutral-500">(pour confirmer)</span>
        </label>
        <input
          id="deletePassword"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white focus:border-red-400 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Suppression..." : "Supprimer mon compte"}
      </button>
      {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
    </form>
  );
}
