"use client";

import { useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/money";
import { AddToCartButton } from "@/components/AddToCartButton";

export function ProductCard({
  id,
  name,
  description,
  priceCents,
  imageUrl,
  images,
  options,
  availability,
  personalizationEnabled,
  personalizationFeeCents,
}: {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  images?: string[];
  options?: { id: string; name: string; values: { value: string; stock: number }[] }[];
  availability?: "IN_STOCK" | "PREORDER";
  personalizationEnabled?: boolean;
  personalizationFeeCents?: number;
}) {
  const hasOptions = Boolean(options && options.length > 0);
  const inStock = hasOptions ? options!.every((o) => o.values.some((v) => v.stock > 0)) : true;

  const gallery = images && images.length > 0 ? images : imageUrl ? [imageUrl] : [];
  const [activeImage, setActiveImage] = useState(0);
  const current = gallery[activeImage] ?? gallery[0];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
      <div className="flex aspect-square items-center justify-center bg-neutral-800">
        {current ? (
          <Image src={current} alt={name} width={160} height={160} className="h-24 w-24 object-contain" />
        ) : (
          <span className="text-4xl">🎽</span>
        )}
      </div>
      {gallery.length > 1 && (
        <div className="flex justify-center gap-1.5 border-t border-white/10 bg-neutral-900 px-2 py-2">
          {gallery.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActiveImage(i)}
              className={`h-1.5 w-1.5 rounded-full transition ${
                i === activeImage ? "bg-accent" : "bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">{name}</h3>
          {availability === "PREORDER" && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
              Précommande
            </span>
          )}
        </div>
        {description && <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{description}</p>}
        <div className="mt-3">
          <span className="text-lg font-bold text-white">{formatPrice(priceCents)}</span>
        </div>
        <div className="mt-auto pt-3">
          <AddToCartButton
            productId={id}
            disabled={!inStock}
            options={options}
            personalizationEnabled={personalizationEnabled}
            personalizationFeeCents={personalizationFeeCents}
          />
        </div>
      </div>
    </div>
  );
}
