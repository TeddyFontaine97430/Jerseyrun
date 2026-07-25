"use client";

import { useActionState, useState } from "react";
import { addToCart, type CartActionState } from "@/lib/actions/cart";
import { formatPrice } from "@/lib/money";

const initialState: CartActionState = { status: "idle" };

type OptionData = { id: string; name: string; values: { value: string; stock: number }[] };

export function AddToCartButton({
  productId,
  disabled,
  options = [],
  personalizationEnabled,
  personalizationFeeCents,
}: {
  productId: string;
  disabled?: boolean;
  options?: OptionData[];
  personalizationEnabled?: boolean;
  personalizationFeeCents?: number;
}) {
  const [state, formAction, pending] = useActionState(addToCart, initialState);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [personalize, setPersonalize] = useState(false);

  let maxQuantity: number | undefined;
  if (options.length > 0) {
    const stocks = options.map((option) => {
      const found = option.values.find((v) => v.value === selected[option.id]);
      return found ? found.stock : undefined;
    });
    maxQuantity = stocks.every((s) => s !== undefined) ? Math.min(...(stocks as number[])) : undefined;
  }

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="productId" value={productId} />
      {options.map((option) => (
        <div key={option.id}>
          <label className="mb-1 block text-xs font-medium text-neutral-400">{option.name}</label>
          <select
            name={`option_${option.id}`}
            required
            value={selected[option.id] ?? ""}
            onChange={(e) => setSelected((prev) => ({ ...prev, [option.id]: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          >
            <option value="" disabled>
              Choisir...
            </option>
            {option.values.map((v) => (
              <option key={v.value} value={v.value} disabled={v.stock <= 0}>
                {v.value}
                {v.stock <= 0 ? " (rupture)" : ""}
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
          max={maxQuantity && maxQuantity > 0 ? maxQuantity : undefined}
          defaultValue={1}
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
      </div>
      {personalizationEnabled && (
        <div className="rounded-lg border border-white/10 bg-neutral-800/50 p-2">
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-300">
            <input
              type="checkbox"
              name="personalize"
              checked={personalize}
              onChange={(e) => setPersonalize(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-accent focus:ring-accent"
            />
            Personnaliser cet article
            {personalizationFeeCents ? ` (+${formatPrice(personalizationFeeCents)})` : ""}
          </label>
          {personalize && (
            <input
              type="text"
              name="personalizationText"
              required
              placeholder="Précisez votre personnalisation (nom, numéro...)"
              className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          )}
        </div>
      )}
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
