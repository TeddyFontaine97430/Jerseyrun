"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  createSupplyProduct,
  updateSupplyProduct,
  type SupplyProductFormState,
} from "@/lib/actions/supply";
import { uploadImageClient } from "@/lib/uploadClient";

const initialState: SupplyProductFormState = { status: "idle" };

const GENERIC_CLUB_VALUE = "__all__";

type SupplyProductInitial = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  sizes: string[];
  personalizationEnabled: boolean;
  clubId: string | null;
};

export function SupplyProductForm({
  product,
  clubs,
  onDone,
}: {
  product?: SupplyProductInitial;
  clubs: { id: string; name: string }[];
  onDone?: () => void;
}) {
  const action = product ? updateSupplyProduct : createSupplyProduct;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImageClient(file, "supply-products");
      setImageUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Échec de l'envoi de l'image. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {product && <input type="hidden" name="productId" value={product.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-white">Club propriétaire</label>
        <select
          name="clubId"
          required
          defaultValue={product ? (product.clubId ?? GENERIC_CLUB_VALUE) : ""}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
        >
          <option value="" disabled>
            Choisir un club...
          </option>
          <option value={GENERIC_CLUB_VALUE}>Tous les clubs (article générique)</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-500">
          Seul ce club verra cet article dans sa boutique fournisseur. Choisissez « Tous les clubs » uniquement pour
          un article commun (ex: accessoire générique).
        </p>
      </div>
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
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover"
            />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
          />
        </div>
        {uploading && <p className="mt-1 text-xs text-neutral-400">Envoi de l&apos;image...</p>}
        {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
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
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-white">Tailles disponibles (optionnel)</label>
        <input
          name="sizes"
          defaultValue={product?.sizes.join(", ") ?? ""}
          placeholder="Ex: XS, S, M, L, XL, XXL"
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Séparez les tailles par des virgules. Laissez vide si l&apos;article n&apos;a pas de taille (ex: équipement générique).
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-neutral-200">
          <input
            type="checkbox"
            name="personalizationEnabled"
            defaultChecked={product?.personalizationEnabled ?? false}
            className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-accent focus:ring-accent"
          />
          Article personnalisable (numéro / nom de joueur)
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          Le club pourra alors ajouter une ligne par joueur (taille + numéro) au lieu d&apos;une simple quantité.
        </p>
      </div>
      <div className="sm:col-span-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {uploading ? "Envoi de l'image..." : pending ? "Enregistrement..." : product ? "Mettre à jour" : "Ajouter l'article"}
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
