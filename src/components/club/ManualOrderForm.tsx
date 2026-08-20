"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { createManualOrder, type ManualOrderState } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/money";
import { MANUAL_ORDER_STATUS_OPTIONS, MANUAL_PAYMENT_METHOD_LABELS } from "@/lib/orderStatus";

const initialState: ManualOrderState = { status: "idle" };

type ProductOption = { id: string; name: string; values: { value: string; stock: number }[] };
type ManualOrderProduct = {
  id: string;
  name: string;
  priceCents: number;
  options: ProductOption[];
  personalizationEnabled: boolean;
  personalizationFeeCents: number;
};

export function ManualOrderForm({ products, clubId }: { products: ManualOrderProduct[]; clubId?: string }) {
  const [state, formAction, pending] = useActionState(createManualOrder, initialState);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [personalize, setPersonalize] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setSelected({});
      setPersonalize(false);
    }
  }, [state]);

  if (products.length === 0) {
    return <p className="text-neutral-400">Ajoutez d&apos;abord un article à votre boutique pour pouvoir enregistrer une vente manuelle.</p>;
  }

  return (
    <form ref={formRef} action={formAction} className="grid max-w-lg gap-4">
      {clubId && <input type="hidden" name="clubId" value={clubId} />}
      <div>
        <label className="mb-1 block text-sm font-medium text-white">Article vendu</label>
        <select
          name="productId"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setSelected({});
            setPersonalize(false);
          }}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatPrice(p.priceCents)}
            </option>
          ))}
        </select>
      </div>

      {product?.options.map((option) => (
        <div key={option.id}>
          <label className="mb-1 block text-sm font-medium text-white">{option.name}</label>
          <select
            name={`option_${option.id}`}
            required
            value={selected[option.id] ?? ""}
            onChange={(e) => setSelected((prev) => ({ ...prev, [option.id]: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
          >
            <option value="" disabled>
              Choisir...
            </option>
            {option.values.map((v) => (
              <option key={v.value} value={v.value} disabled={v.stock <= 0}>
                {v.value} (stock : {v.stock})
              </option>
            ))}
          </select>
        </div>
      ))}

      <div>
        <label className="mb-1 block text-sm font-medium text-white">Quantité</label>
        <input
          type="number"
          name="quantity"
          min={1}
          defaultValue={1}
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-white">Moyen de paiement</label>
          <select
            name="manualPaymentMethod"
            required
            defaultValue="ESPECES"
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
          >
            {Object.entries(MANUAL_PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-white">État de la commande</label>
          <select
            name="manualStatus"
            required
            defaultValue="PROCESSING"
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
          >
            {MANUAL_ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {product?.personalizationEnabled && (
        <div className="rounded-lg border border-white/10 bg-neutral-800/50 p-3">
          <label className="flex items-center gap-2 text-sm text-neutral-200">
            <input
              type="checkbox"
              checked={personalize}
              onChange={(e) => setPersonalize(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-accent focus:ring-accent"
            />
            Article personnalisé
            {product.personalizationFeeCents ? ` (+${formatPrice(product.personalizationFeeCents)})` : ""}
          </label>
          {personalize && (
            <input
              type="text"
              name="personalizationText"
              required
              placeholder="Nom, numéro..."
              className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          )}
        </div>
      )}

      <div className="border-t border-white/10 pt-4">
        <p className="mb-3 text-sm font-semibold text-white">Coordonnées du client</p>
        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">Nom du client *</label>
            <input
              name="customerName"
              required
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">
              Email (optionnel — la facture y sera envoyée)
            </label>
            <input
              type="email"
              name="customerEmail"
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">Téléphone (optionnel)</label>
            <input
              name="customerPhone"
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer la vente"}
      </button>
      {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
      {state.status === "success" && <p className="text-sm font-medium text-emerald-400">{state.message}</p>}
    </form>
  );
}
