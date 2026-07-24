"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/money";
import { deleteProduct, toggleProductActive } from "@/lib/actions/products";
import { ProductForm } from "@/components/club/ProductForm";

export function ProductRow({
  product,
  clubId,
}: {
  product: {
    id: string;
    name: string;
    description: string | null;
    priceCents: number;
    stock: number;
    imageUrl: string | null;
    active: boolean;
    options?: { name: string; values: string }[];
  };
  clubId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="border-b border-white/10 p-5 last:border-0">
        <ProductForm product={product} clubId={clubId} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 border-b border-white/10 p-5 last:border-0">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-800">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="h-12 w-12 object-contain" />
        ) : (
          <span className="text-2xl">🎽</span>
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white">{product.name}</p>
        <p className="text-sm text-neutral-400">
          {formatPrice(product.priceCents)} · Stock : {product.stock}
        </p>
        {product.options && product.options.length > 0 && (
          <p className="mt-0.5 text-xs text-neutral-500">
            {product.options.map((o) => o.name).join(" · ")}
          </p>
        )}
      </div>
      {!product.active && (
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-400">Masqué</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent"
      >
        Modifier
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => toggleProductActive(product.id))}
        className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-white/20 hover:text-white disabled:opacity-50"
      >
        {product.active ? "Masquer" : "Réactiver"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm(`Supprimer "${product.name}" ?`)) {
            startTransition(() => deleteProduct(product.id));
          }
        }}
        className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-red-400 hover:text-red-400 disabled:opacity-50"
      >
        Supprimer
      </button>
    </div>
  );
}
