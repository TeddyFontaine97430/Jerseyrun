"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createProduct, updateProduct, type ProductFormState } from "@/lib/actions/products";
import { OptionValuesEditor, type OptionValueRow } from "@/components/club/OptionValuesEditor";
import { uploadImageClient } from "@/lib/uploadClient";

const initialState: ProductFormState = { status: "idle" };

type ProductOptionInitial = {
  name: string;
  values: { value: string; stock: number }[];
};

type ProductInitial = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  availability?: "IN_STOCK" | "PREORDER";
  personalizationEnabled?: boolean;
  personalizationFeeCents?: number;
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

  const [sizeRows, setSizeRows] = useState<OptionValueRow[]>(sizeGroup?.values ?? []);
  const [shoeSizeRows, setShoeSizeRows] = useState<OptionValueRow[]>(shoeSizeGroup?.values ?? []);
  const [customOptionName, setCustomOptionName] = useState(customGroup?.name ?? "");
  const [customRows, setCustomRows] = useState<OptionValueRow[]>(customGroup?.values ?? []);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(product?.personalizationEnabled ?? false);
  const [availability, setAvailability] = useState<"IN_STOCK" | "PREORDER">(product?.availability ?? "IN_STOCK");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImageClient(file, "products");
      setImageUrl(url);
    } catch {
      setUploadError("Échec de l'envoi de l'image. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {product && <input type="hidden" name="productId" value={product.id} />}
      {clubId && <input type="hidden" name="clubId" value={clubId} />}
      <input type="hidden" name="sizeValuesJson" value={JSON.stringify(sizeRows)} />
      <input type="hidden" name="shoeSizeValuesJson" value={JSON.stringify(shoeSizeRows)} />
      <input type="hidden" name="customOptionValuesJson" value={JSON.stringify(customRows)} />
      <input type="hidden" name="imageUrl" value={imageUrl} />
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
        <label className="mb-1 block text-sm font-medium text-white">Image de l&apos;article (optionnel)</label>
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
        <label className="mb-1 block text-sm font-medium text-white">Disponibilité</label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-200">
            <input
              type="radio"
              name="availability"
              value="IN_STOCK"
              checked={availability === "IN_STOCK"}
              onChange={() => setAvailability("IN_STOCK")}
              className="h-4 w-4 border-white/20 bg-neutral-800 text-accent focus:ring-accent"
            />
            Article en stock
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-200">
            <input
              type="radio"
              name="availability"
              value="PREORDER"
              checked={availability === "PREORDER"}
              onChange={() => setAvailability("PREORDER")}
              className="h-4 w-4 border-white/20 bg-neutral-800 text-accent focus:ring-accent"
            />
            Précommande
          </label>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Indiquez au client si l&apos;article est disponible immédiatement ou en précommande.
        </p>
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
          Si vous renseignez une option, le client devra choisir une valeur avant d&apos;ajouter l&apos;article à
          son panier. Indiquez le stock disponible pour chaque valeur pour un meilleur suivi de l&apos;inventaire.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-200">Tailles disponibles</label>
            <OptionValuesEditor rows={sizeRows} onChange={setSizeRows} valuePlaceholder="ex: M" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-200">Pointures disponibles</label>
            <OptionValuesEditor rows={shoeSizeRows} onChange={setShoeSizeRows} valuePlaceholder="ex: 42" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-neutral-200">Autre option — nom</label>
            <input
              name="customOptionName"
              value={customOptionName}
              onChange={(e) => setCustomOptionName(e.target.value)}
              placeholder="ex: Couleur"
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none sm:max-w-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-neutral-200">Autre option — valeurs</label>
            <OptionValuesEditor rows={customRows} onChange={setCustomRows} valuePlaceholder="ex: Rouge" />
          </div>
        </div>
      </div>

      <div className="sm:col-span-2 rounded-lg border border-white/10 bg-black/30 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-white">
          <input
            type="checkbox"
            name="personalizationEnabled"
            checked={personalizationEnabled}
            onChange={(e) => setPersonalizationEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-accent focus:ring-accent"
          />
          Proposer une option de personnalisation (facultatif)
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          Le client pourra cocher cette option et préciser lui-même ce qu&apos;il souhaite (ex : nom, numéro).
        </p>
        {personalizationEnabled && (
          <div className="mt-3 max-w-xs">
            <label className="mb-1 block text-sm font-medium text-neutral-200">Coût supplémentaire (€)</label>
            <input
              name="personalizationFee"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                product?.personalizationFeeCents ? (product.personalizationFeeCents / 100).toFixed(2) : "0"
              }
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
        )}
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
