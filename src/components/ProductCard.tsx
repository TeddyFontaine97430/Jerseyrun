import Image from "next/image";
import { formatPrice } from "@/lib/money";
import { AddToCartButton } from "@/components/AddToCartButton";

export function ProductCard({
  id,
  name,
  description,
  priceCents,
  imageUrl,
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
  options?: { id: string; name: string; values: { value: string; stock: number }[] }[];
  availability?: "IN_STOCK" | "PREORDER";
  personalizationEnabled?: boolean;
  personalizationFeeCents?: number;
}) {
  const hasOptions = Boolean(options && options.length > 0);
  const inStock = hasOptions ? options!.every((o) => o.values.some((v) => v.stock > 0)) : true;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
      <div className="flex aspect-square items-center justify-center bg-neutral-800">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} width={160} height={160} className="h-24 w-24 object-contain" />
        ) : (
          <span className="text-4xl">🎽</span>
        )}
      </div>
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
