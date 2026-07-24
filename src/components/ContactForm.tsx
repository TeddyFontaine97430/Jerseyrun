"use client";

import { useActionState } from "react";
import { submitContactMessage, type ContactFormState } from "@/lib/actions/contact";

const initialState: ContactFormState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactMessage, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-1">
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-200">
          Nom
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          placeholder="Votre nom"
        />
      </div>
      <div className="sm:col-span-1">
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-200">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          placeholder="vous@exemple.fr"
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-200">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          placeholder="Votre message..."
        />
      </div>
      <div className="sm:col-span-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? "Envoi..." : "Envoyer le message"}
        </button>
        {state.status === "success" && (
          <p className="text-sm font-medium text-emerald-400">{state.message}</p>
        )}
        {state.status === "error" && (
          <p className="text-sm font-medium text-red-400">{state.message}</p>
        )}
      </div>
    </form>
  );
}
