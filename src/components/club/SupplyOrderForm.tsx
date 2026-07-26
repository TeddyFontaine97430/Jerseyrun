"use client";

import { useActionState } from "react";
import Image from "next/image";
import { createSupplyOrder, type SupplyOrderFormState } from "@/lib/actions/supply";
import { formatPrice } from "@/lib/money";

const initialState: SupplyOrderFormState = { status: "idle" };

type SupplyProductItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
};

export function SupplyOrderForm({ products }: { products: SupplyProductItem[] }) {
  const [state, formAction, pending] = useActionState(createSupplyOrder, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
            <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-neutral-800">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={96}
                  height={96}
                  className="h-20 w-20 object-contain"
                />
              ) : (
                <span className="text-3xl">📦</span>
              )}
            </div>
            <p className="font-semibold text-white">{product.name}</p>
            {product.description && <p className="mt-1 text-xs text-neutral-400">{product.description}</p>}
            <p className="mt-2 text-sm font-bold text-white">{formatPrice(product.priceCents)}</p>
            <label className="mt-3 block text-xs font-medium text-neutral-400">
              Quantité
              <input
                type="number"
                name={`qty_${product.id}`}
                min={0}
                defaultValue={0}
                className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
              />
            </label>
          </div>
        ))}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-white">Remarque (optionnel)</label>
        <textarea
          name="note"
          rows={3}
          placeholder="Précisions sur votre demande..."
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? "Envoi..." : "Envoyer ma demande de commande"}
        </button>
        {state.status === "success" && <p className="text-sm font-medium text-emerald-400">{state.message}</p>}
        {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
      </div>
    </form>
  );
}
