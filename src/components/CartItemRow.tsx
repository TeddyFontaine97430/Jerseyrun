"use client";

import Image from "next/image";
import { useTransition } from "react";
import { formatPrice } from "@/lib/money";
import { removeFromCart, updateCartQuantity } from "@/lib/actions/cart";
import { formatSelectedOptions } from "@/lib/productOptions";

export function CartItemRow({
  id,
  name,
  clubName,
  imageUrl,
  priceCents,
  quantity,
  stock,
  selectedOptions,
}: {
  id: string;
  name: string;
  clubName: string;
  imageUrl: string | null;
  priceCents: number;
  quantity: number;
  stock: number;
  selectedOptions?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const optionsLabel = formatSelectedOptions(selectedOptions);

  return (
    <div className="flex items-center gap-4 border-b border-white/10 py-5 last:border-0">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-800">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} width={56} height={56} className="h-14 w-14 object-contain" />
        ) : (
          <span className="text-2xl">🎽</span>
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white">{name}</p>
        <p className="text-xs text-neutral-400">{clubName}</p>
        {optionsLabel && <p className="mt-0.5 text-xs text-neutral-300">{optionsLabel}</p>}
        <p className="mt-1 text-sm font-medium text-white">{formatPrice(priceCents)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => updateCartQuantity(id, quantity - 1))}
          className="h-8 w-8 rounded-full border border-white/10 text-neutral-300 hover:border-accent hover:text-accent disabled:opacity-50"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-medium">{quantity}</span>
        <button
          type="button"
          disabled={isPending || quantity >= stock}
          onClick={() => startTransition(() => updateCartQuantity(id, quantity + 1))}
          className="h-8 w-8 rounded-full border border-white/10 text-neutral-300 hover:border-accent hover:text-accent disabled:opacity-50"
        >
          +
        </button>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => removeFromCart(id))}
        className="text-xs font-medium text-neutral-500 hover:text-red-400"
      >
        Retirer
      </button>
    </div>
  );
}
