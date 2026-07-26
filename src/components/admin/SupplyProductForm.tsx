"use client";

import { useActionState } from "react";
import {
  createSupplyProduct,
  updateSupplyProduct,
  type SupplyProductFormState,
} from "@/lib/actions/supply";

const initialState: SupplyProductFormState = { status: "idle" };

type SupplyProductInitial = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
};

export function SupplyProductForm({
  product,
  onDone,
}: {
  product?: SupplyProductInitial;
  onDone?: () => void;
}) {
  const action = product ? updateSupplyProduct : createSupplyProduct;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {product && <input type="hidden" name="productId" value={product.id} />}
      <div>
        <label className="mb-1 block text-sm font-medium text-white">Nom de l&apos;article</label>
        <input
          name="name"
          required
          defaultValue={product?.name}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-white">Prix (€)</label>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={product ? (product.priceCents / 100).toFixed(2) : undefined}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-white">Image (optionnel)</label>
        <div className="flex items-center gap-3">
          {product?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover"
            />
          )}
          <input
            name="imageFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
          />
        </div>
        {product?.imageUrl && (
          <p className="mt-1 text-xs text-neutral-500">Laissez vide pour conserver l&apos;image actuelle.</p>
        )}
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-white">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={product?.description ?? ""}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : product ? "Mettre à jour" : "Ajouter l'article"}
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className="text-sm font-medium text-neutral-400 hover:text-white">
            Annuler
          </button>
        )}
        {state.status === "success" && <p className="text-sm font-medium text-emerald-400">{state.message}</p>}
        {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
      </div>
    </form>
  );
}
