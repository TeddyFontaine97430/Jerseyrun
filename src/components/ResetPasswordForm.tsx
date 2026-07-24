"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type ResetPasswordState } from "@/lib/actions/password-reset";

const initialState: ResetPasswordState = { status: "idle" };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
        <p className="font-medium text-emerald-300">{state.message}</p>
        <Link
          href="/connexion"
          className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-sm">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-white">
          Nouveau mot de passe
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
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-white">
          Confirmer le mot de passe
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Réinitialiser le mot de passe"}
      </button>
      {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
    </form>
  );
}
