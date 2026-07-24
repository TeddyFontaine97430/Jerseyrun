"use client";

import { useActionState } from "react";
import { requestPasswordReset, type RequestResetState } from "@/lib/actions/password-reset";

const initialState: RequestResetState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
        <p className="font-medium text-emerald-300">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-sm">
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
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Envoi..." : "Envoyer le lien de réinitialisation"}
      </button>
      {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
    </form>
  );
}
