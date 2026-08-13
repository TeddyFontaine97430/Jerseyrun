"use client";

import { useState, useTransition } from "react";
import { deleteSupplier, toggleSupplierActive } from "@/lib/actions/suppliers";
import { SupplierForm } from "@/components/admin/SupplierForm";

export function SupplierRow({
  supplier,
}: {
  supplier: { id: string; name: string; email: string; phone: string | null; notes: string | null; active: boolean };
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="border-b border-white/10 p-5 last:border-0">
        <SupplierForm supplier={supplier} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 border-b border-white/10 p-5 last:border-0">
      <div className="flex-1">
        <p className="font-semibold text-white">{supplier.name}</p>
        <p className="text-sm text-neutral-400">
          {supplier.email}
          {supplier.phone ? ` · ${supplier.phone}` : ""}
        </p>
        {supplier.notes && <p className="mt-0.5 text-xs text-neutral-500">{supplier.notes}</p>}
      </div>
      {!supplier.active && (
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-400">Masqué</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent"
      >
        Modifier
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => toggleSupplierActive(supplier.id))}
        className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-white/20 hover:text-white disabled:opacity-50"
      >
        {supplier.active ? "Masquer" : "Réactiver"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm(`Supprimer "${supplier.name}" ?`)) {
            startTransition(() => deleteSupplier(supplier.id));
          }
        }}
        className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-red-400 hover:text-red-400 disabled:opacity-50"
      >
        Supprimer
      </button>
    </div>
  );
}
