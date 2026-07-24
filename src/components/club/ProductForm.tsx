"use client";

import { useActionState } from "react";
import { createProduct, updateProduct, type ProductFormState } from "@/lib/actions/products";

const initialState: ProductFormState = { status: "idle" };

type ProductOptionInitial = {
  name: string;
  values: string;
};

type ProductInitial = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  stock: number;
  imageUrl: string | null;
  options?: ProductOptionInitial[];
};

export function ProductForm({
  product,
  clubId,
  onDone,
}: {
  product?: ProductInitial;
  clubId?: string;
  onDone?: () => void;
}) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, initialState);

  const sizeGroup = product?.options?.find((o) => o.name === "Taille");
  const shoeSizeGroup = product?.options?.find((o) => o.name === "Pointure");
  const customGroup = product?.options?.find((o) => o.name !== "Taille" && o.name !== "Pointure");

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {product && <input type="hidden" name="productId" value={product.id} />}
      {clubId && <input type="hidden" name="clubId" value={clubId} />}
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
      <div>
        <label className="mb-1 block text-sm font-medium text-white">Stock</label>
        <input
          name="stock"
          type="number"
          step="1"
          min="0"
          required
          defaultValue={product?.stock ?? 0}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-white">Image (URL, optionnel)</label>
        <input
          name="imageUrl"
          defaultValue={product?.imageUrl ?? ""}
          placeholder="https://..."
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
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

      <div className="sm:col-span-2 rounded-lg border border-white/10 bg-black/30 p-4">
        <p className="mb-1 text-sm font-semibold text-white">Options de l&apos;article (facultatif)</p>
        <p className="mb-3 text-xs text-neutral-500">
          Si vous renseignez une option, le client devra choisir une valeur avant d&apos;ajouter l&apos;article à son panier.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-200">
              Tailles disponibles
            </label>
            <input
              name="sizeValues"
              defaultValue={sizeGroup?.values ?? ""}
              placeholder="S, M, L, XL"
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-200">
              Pointures disponibles
            </label>
            <input
              name="shoeSizeValues"
              defaultValue={shoeSizeGroup?.values ?? ""}
              placeholder="38, 39, 40, 41, 42"
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-200">
              Autre option — nom
            </label>
            <input
              name="customOptionName"
              defaultValue={customGroup?.name ?? ""}
              placeholder="ex: Couleur"
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-200">
              Autre option — valeurs
            </label>
            <input
              name="customOptionValues"
              defaultValue={customGroup?.values ?? ""}
              placeholder="Bleu, Rouge, Noir"
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
        </div>
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
