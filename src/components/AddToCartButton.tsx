"use client";

import { useActionState } from "react";
import { addToCart, type CartActionState } from "@/lib/actions/cart";
import { parseOptionValues } from "@/lib/productOptions";

const initialState: CartActionState = { status: "idle" };

export function AddToCartButton({
  productId,
  disabled,
  options = [],
  stock,
}: {
  productId: string;
  disabled?: boolean;
  options?: { id: string; name: string; values: string }[];
  stock?: number;
}) {
  const [state, formAction, pending] = useActionState(addToCart, initialState);

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="productId" value={productId} />
      {options.map((option) => (
        <div key={option.id}>
          <label className="mb-1 block text-xs font-medium text-neutral-400">{option.name}</label>
          <select
            name={`option_${option.id}`}
            required
            defaultValue=""
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          >
            <option value="" disabled>
              Choisir...
            </option>
            {parseOptionValues(option.values).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-400">Quantité</label>
        <input
          type="number"
          name="quantity"
          min={1}
          max={stock && stock > 0 ? stock : undefined}
          defaultValue={1}
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || pending}
        className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? "Rupture de stock" : pending ? "Ajout..." : "Ajouter au panier"}
      </button>
      {state.status === "error" && (
        <p className="mt-2 text-xs font-medium text-red-400">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="mt-2 text-xs font-medium text-emerald-400">{state.message}</p>
      )}
    </form>
  );
}
