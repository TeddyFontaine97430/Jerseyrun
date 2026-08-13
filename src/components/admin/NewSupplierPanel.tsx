"use client";

import { useState } from "react";
import { SupplierForm } from "@/components/admin/SupplierForm";

export function NewSupplierPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark"
      >
        + Nouveau fournisseur
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-white">Nouveau fournisseur</h3>
      <SupplierForm onDone={() => setOpen(false)} />
    </div>
  );
}
