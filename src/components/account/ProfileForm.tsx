"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/lib/actions/profile";

const initialState: ProfileState = { status: "idle" };

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm sm:max-w-md">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-white">
          Nom
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={name}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-white">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={email}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white focus:border-accent focus:outline-none"
        />
      </div>
      <hr className="border-white/10" />
      <div>
        <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-white">
          Nouveau mot de passe <span className="text-neutral-500">(optionnel)</span>
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          minLength={8}
          placeholder="Laisser vide pour ne pas changer"
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-white">
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          minLength={8}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white focus:border-accent focus:outline-none"
        />
      </div>
      <hr className="border-white/10" />
      <div>
        <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-white">
          Mot de passe actuel <span className="text-neutral-500">(pour confirmer)</span>
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
      {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
      {state.status === "success" && <p className="text-sm font-medium text-emerald-400">{state.message}</p>}
    </form>
  );
}
