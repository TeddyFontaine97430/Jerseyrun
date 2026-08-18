"use client";

import { useState, useTransition } from "react";
import { deleteCustomer } from "@/lib/actions/admin";

export function DeleteCustomerButton({ customerId, customerLabel }: { customerId: string; customerLabel: string }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canConfirm = confirmText.trim() === customerLabel;

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCustomer(customerId);
      if (result?.status === "error") {
        setError(result.message);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
      >
        Supprimer le client
      </button>
    );
  }

  return (
    <div className="w-full max-w-xs rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-right">
      <p className="text-left text-sm font-semibold text-red-300">
        Action irréversible : le compte et le profil du client seront définitivement supprimés. Ses commandes
        passées restent visibles dans les ventes des clubs, mais ne seront plus rattachées à un compte.
      </p>
      <p className="mt-2 text-left text-xs text-neutral-400">
        Pour confirmer, tapez : <span className="font-semibold text-white">{customerLabel}</span>
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={customerLabel}
        className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-red-400 focus:outline-none"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmText("");
            setError(null);
          }}
          className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-neutral-300 hover:border-white/20"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!canConfirm || isPending}
          onClick={handleDelete}
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Suppression..." : "Confirmer la suppression"}
        </button>
      </div>
      {error && <p className="mt-2 text-left text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}
