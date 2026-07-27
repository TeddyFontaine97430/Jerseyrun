"use client";

import { useTransition } from "react";
import { connectStripeAccount } from "@/lib/actions/stripe-connect";

export function StripeConnectCard({
  stripeAccountId,
  stripePayoutsEnabled,
}: {
  stripeAccountId: string | null;
  stripePayoutsEnabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (stripePayoutsEnabled) {
    return (
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm sm:max-w-md">
        <p className="flex items-center gap-2 font-semibold text-emerald-400">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs">✓ Connecté</span>
        </p>
        <p className="mt-2 text-sm text-neutral-400">
          Votre compte Stripe est actif. Vous recevez directement le paiement de vos ventes sur votre compte
          bancaire, sans passer par Jersey Run.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm sm:max-w-md">
      {stripeAccountId ? (
        <p className="text-sm font-medium text-amber-400">Configuration en cours de vérification par Stripe.</p>
      ) : (
        <p className="text-sm text-neutral-400">
          Connectez votre compte Stripe pour recevoir directement le paiement de vos ventes sur votre compte
          bancaire.
        </p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => connectStripeAccount())}
        className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Redirection..." : stripeAccountId ? "Continuer la configuration" : "Connecter mon compte Stripe"}
      </button>
    </div>
  );
}
