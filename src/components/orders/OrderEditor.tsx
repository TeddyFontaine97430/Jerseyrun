"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import {
  addOrderItem,
  removeOrderItem,
  updateOrderItemQuantity,
  type OrderEditState,
} from "@/lib/actions/orders";
import { formatPrice } from "@/lib/money";
import { formatItemDetails } from "@/lib/productOptions";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/orderStatus";

const initialState: OrderEditState = { status: "idle" };

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  selectedOptions: string | null;
  personalizationText: string | null;
};

type EditableOrder = {
  id: string;
  status: string;
  totalCents: number;
  deliveryFeeCents: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  createdAt: Date;
  items: OrderItem[];
};

type AddableProduct = {
  id: string;
  name: string;
  priceCents: number;
  personalizationEnabled: boolean;
  personalizationFeeCents: number;
  options: { id: string; name: string; values: { value: string; stock: number }[] }[];
};

function ItemRow({ item, locked }: { item: OrderItem; locked: boolean }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const details = formatItemDetails(item.selectedOptions, item.personalizationText);

  function handleSaveQuantity() {
    setError(null);
    startTransition(async () => {
      const res = await updateOrderItemQuantity(item.id, quantity);
      if (res.status === "error") setError(res.message ?? "Erreur.");
    });
  }

  function handleRemove() {
    if (!confirm(`Retirer "${item.productName}" de la commande ?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await removeOrderItem(item.id);
      if (res.status === "error") setError(res.message ?? "Erreur.");
    });
  }

  return (
    <tr className="border-b border-white/5 align-top last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium text-white">{item.productName}</p>
        {details && <p className="text-xs text-neutral-500">{details}</p>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={quantity}
            disabled={locked || isPending}
            onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
            className="w-16 rounded-lg border border-white/10 bg-neutral-800 px-2 py-1.5 text-sm text-white focus:border-accent focus:outline-none disabled:opacity-50"
          />
          {!locked && quantity !== item.quantity && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveQuantity}
              className="rounded-full border border-accent px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              {isPending ? "..." : "Valider"}
            </button>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-neutral-300">{formatPrice(item.unitPriceCents)}</td>
      <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
        {formatPrice(item.unitPriceCents * item.quantity)}
      </td>
      <td className="px-4 py-3">
        {!locked && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleRemove}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-neutral-300 hover:border-red-400 hover:text-red-400 disabled:opacity-50"
          >
            Retirer
          </button>
        )}
        {error && <p className="mt-1 text-xs font-medium text-red-400">{error}</p>}
      </td>
    </tr>
  );
}

function AddItemPanel({ orderId, products }: { orderId: string; products: AddableProduct[] }) {
  const [state, formAction, pending] = useActionState(addOrderItem, initialState);
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

  if (products.length === 0) return null;

  return (
    <form ref={formRef} action={formAction} className="mt-4 grid gap-3 rounded-lg border border-dashed border-white/20 p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-sm font-semibold text-white">Ajouter un article</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">Article</label>
          <select
            name="productId"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setSelected({});
              setPersonalize(false);
            }}
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatPrice(p.priceCents)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">Quantité</label>
          <input
            type="number"
            name="quantity"
            min={1}
            defaultValue={1}
            required
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {product?.options.map((option) => (
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
                {v.value} (stock : {v.stock})
              </option>
            ))}
          </select>
        </div>
      ))}

      {product?.personalizationEnabled && (
        <div className="rounded-lg border border-white/10 bg-neutral-800/50 p-3">
          <label className="flex items-center gap-2 text-sm text-neutral-200">
            <input
              type="checkbox"
              checked={personalize}
              onChange={(e) => setPersonalize(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-accent focus:ring-accent"
            />
            Personnalisé
            {product.personalizationFeeCents ? ` (+${formatPrice(product.personalizationFeeCents)})` : ""}
          </label>
          {personalize && (
            <input
              type="text"
              name="personalizationText"
              required
              placeholder="Nom, numéro..."
              className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? "Ajout..." : "Ajouter à la commande"}
        </button>
        {state.status === "error" && <p className="text-xs font-medium text-red-400">{state.message}</p>}
        {state.status === "success" && <p className="text-xs font-medium text-emerald-400">{state.message}</p>}
      </div>
    </form>
  );
}

export function OrderEditor({ order, products }: { order: EditableOrder; products: AddableProduct[] }) {
  const locked = order.status === "CANCELLED";
  const itemsTotal = order.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-400">
            Commande du {order.createdAt.toLocaleDateString("fr-FR")} — #{order.id.slice(-8)}
          </p>
          <p className="mt-1 font-medium text-white">
            {order.customerName ?? order.customerEmail ?? "Client"}
            {order.customerEmail && order.customerName && (
              <span className="ml-2 text-sm text-neutral-500">{order.customerEmail}</span>
            )}
            {order.customerPhone && <span className="ml-2 text-sm text-neutral-500">{order.customerPhone}</span>}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            ORDER_STATUS_STYLES[order.status] ?? "bg-white/10 text-neutral-300"
          }`}
        >
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {locked && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          Cette commande est annulée : elle n&apos;est plus modifiable.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Article</th>
              <th className="px-4 py-3 font-medium">Quantité</th>
              <th className="px-4 py-3 font-medium">Prix unit.</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <ItemRow key={item.id} item={item} locked={locked} />
            ))}
          </tbody>
        </table>
      </div>

      {!locked && <AddItemPanel orderId={order.id} products={products} />}

      <div className="mt-6 max-w-xs space-y-1 border-t border-white/10 pt-4 text-sm sm:ml-auto">
        <div className="flex justify-between text-neutral-400">
          <span>Sous-total articles</span>
          <span>{formatPrice(itemsTotal)}</span>
        </div>
        {order.deliveryFeeCents > 0 && (
          <div className="flex justify-between text-neutral-400">
            <span>Livraison</span>
            <span>{formatPrice(order.deliveryFeeCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-white">
          <span>Total à régler</span>
          <span>{formatPrice(order.totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
