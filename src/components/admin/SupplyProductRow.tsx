"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/money";
import { deleteSupplyProduct, toggleSupplyProductActive } from "@/lib/actions/supply";
import { SupplyProductForm } from "@/components/admin/SupplyProductForm";

export function SupplyProductRow({
  product,
  clubs,
}: {
  product: {
    id: string;
    name: string;
    description: string | null;
    priceCents: number;
    imageUrl: string | null;
    active: boolean;
    sizes: string[];
    personalizationEnabled: boolean;
    clubId: string | null;
  };
  clubs: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="border-b border-white/10 p-5 last:border-0">
        <SupplyProductForm product={product} clubs={clubs} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 border-b border-white/10 p-5 last:border-0">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-800">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="h-12 w-12 object-contain" />
        ) : (
          <span className="text-2xl">📦</span>
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white">{product.name}</p>
        <p className="text-sm text-neutral-400">{formatPrice(product.priceCents)}</p>
        {product.description && <p className="mt-0.5 text-xs text-neutral-500">{product.description}</p>}
        {(product.sizes.length > 0 || product.personalizationEnabled) && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {product.sizes.length > 0 && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-neutral-300">
                Tailles : {product.sizes.join(", ")}
              </span>
            )}
            {product.personalizationEnabled && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-neutral-300">
                Personnalisable (n° joueur)
              </span>
            )}
          </div>
        )}
      </div>
      {!product.active && (
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
        onClick={() => startTransition(() => toggleSupplyProductActive(product.id))}
        className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-white/20 hover:text-white disabled:opacity-50"
      >
        {product.active ? "Masquer" : "Réactiver"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm(`Supprimer "${product.name}" ?`)) {
            startTransition(() => deleteSupplyProduct(product.id));
          }
        }}
        className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-red-400 hover:text-red-400 disabled:opacity-50"
      >
        Supprimer
      </button>
    </div>
  );
}
