"use client";

import { useState } from "react";
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
  sizes: string[];
  personalizationEnabled: boolean;
};

type Line = { id: string; productId: string; size: string; qty: number; text: string };

function buildInitialLines(products: SupplyProductItem[]): Line[] {
  const lines: Line[] = [];
  for (const product of products) {
    if (product.personalizationEnabled) continue; // ajoutées à la demande
    if (product.sizes.length > 0) {
      for (const size of product.sizes) {
        lines.push({ id: `${product.id}-${size}`, productId: product.id, size, qty: 0, text: "" });
      }
    } else {
      lines.push({ id: product.id, productId: product.id, size: "", qty: 0, text: "" });
    }
  }
  return lines;
}

export function SupplyOrderForm({ products }: { products: SupplyProductItem[] }) {
  const [state, formAction, pending] = useActionState(createSupplyOrder, initialState);
  const [lines, setLines] = useState<Line[]>(() => buildInitialLines(products));

  // Réinitialise le formulaire une fois la commande envoyée (pattern React recommandé :
  // ajuster l'état pendant le rendu plutôt que dans un effect).
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "success") setLines(buildInitialLines(products));
  }

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function addPersonalizedLine(productId: string) {
    setLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId, size: "", qty: 1, text: "" },
    ]);
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const productLines = lines.filter((line) => line.productId === product.id);

          return (
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

              {product.personalizationEnabled ? (
                <div className="mt-3 space-y-2">
                  {productLines.map((line) => (
                    <div key={line.id} className="rounded-lg border border-white/10 bg-neutral-800 p-2">
                      <input type="hidden" name={`line_${line.id}_productId`} value={product.id} />
                      <input type="hidden" name={`line_${line.id}_qty`} value={1} />
                      <div className="flex items-center gap-2">
                        {product.sizes.length > 0 && (
                          <select
                            name={`line_${line.id}_size`}
                            required
                            value={line.size}
                            onChange={(e) => updateLine(line.id, { size: e.target.value })}
                            className="rounded-md border border-white/10 bg-neutral-900 px-2 py-1.5 text-xs text-white focus:border-accent focus:outline-none"
                          >
                            <option value="" disabled>
                              Taille
                            </option>
                            {product.sizes.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          name={`line_${line.id}_text`}
                          required
                          value={line.text}
                          onChange={(e) => updateLine(line.id, { text: e.target.value })}
                          placeholder="N° et nom du joueur"
                          className="w-full min-w-0 flex-1 rounded-md border border-white/10 bg-neutral-900 px-2 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          aria-label="Retirer ce joueur"
                          className="shrink-0 text-neutral-500 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addPersonalizedLine(product.id)}
                    className="w-full rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent"
                  >
                    + Ajouter un joueur
                  </button>
                </div>
              ) : product.sizes.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {productLines.map((line) => (
                    <label key={line.id} className="text-xs font-medium text-neutral-400">
                      <input type="hidden" name={`line_${line.id}_productId`} value={product.id} />
                      <input type="hidden" name={`line_${line.id}_size`} value={line.size} />
                      {line.size}
                      <input
                        type="number"
                        name={`line_${line.id}_qty`}
                        min={0}
                        value={line.qty}
                        onChange={(e) => updateLine(line.id, { qty: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <label className="mt-3 block text-xs font-medium text-neutral-400">
                  Quantité
                  <input type="hidden" name={`line_${productLines[0].id}_productId`} value={product.id} />
                  <input
                    type="number"
                    name={`line_${productLines[0].id}_qty`}
                    min={0}
                    value={productLines[0].qty}
                    onChange={(e) => updateLine(productLines[0].id, { qty: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
                  />
                </label>
              )}
            </div>
          );
        })}
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
