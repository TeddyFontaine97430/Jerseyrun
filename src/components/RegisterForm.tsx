"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCustomer, type RegisterState } from "@/lib/actions/register";

const initialState: RegisterState = { status: "idle" };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerCustomer, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
        <p className="font-medium text-emerald-300">{state.message}</p>
        <Link href="/connexion" className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-sm">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-white">
          Nom
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          placeholder="Votre nom"
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
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          placeholder="vous@exemple.fr"
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-white">
          Téléphone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          placeholder="06 92 XX XX XX"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-white">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          placeholder="8 caractères minimum"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Création..." : "Créer mon compte"}
      </button>
      {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
    </form>
  );
}
