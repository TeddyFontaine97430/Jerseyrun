import Image from "next/image";
import { formatPrice } from "@/lib/money";
import { AddToCartButton } from "@/components/AddToCartButton";

export function ProductCard({
  id,
  name,
  description,
  priceCents,
  imageUrl,
  stock,
  options,
}: {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
  options?: { id: string; name: string; values: string }[];
}) {
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
        <h3 className="font-semibold text-white">{name}</h3>
        {description && <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{description}</p>}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-white">{formatPrice(priceCents)}</span>
          {stock <= 5 && stock > 0 && (
            <span className="text-xs font-medium text-red-400">Plus que {stock} en stock</span>
          )}
        </div>
        <div className="mt-auto pt-3">
          <AddToCartButton productId={id} disabled={stock <= 0} options={options} stock={stock} />
        </div>
      </div>
    </div>
  );
}
