"use client";

import { useState, useTransition } from "react";

export function ResetPasswordButton({
  action,
  label = "Réinitialiser le mot de passe",
}: {
  action: () => Promise<{ email: string; password: string }>;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("Générer un nouveau mot de passe temporaire pour ce compte ? L'ancien mot de passe cessera de fonctionner immédiatement.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await action();
        setResult(res);
      } catch {
        setError("Une erreur est survenue.");
      }
    });
  }

  if (result) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs">
        <p className="font-semibold text-amber-300">
          Nouveau mot de passe pour {result.email} :
        </p>
        <p className="mt-1 select-all rounded bg-neutral-800 px-2 py-1 font-mono text-sm text-white">
          {result.password}
        </p>
        <p className="mt-1 text-amber-300">
          Communiquez-le au club/client par un canal sûr — il ne sera plus affiché ensuite.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {isPending ? "Génération..." : label}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}
