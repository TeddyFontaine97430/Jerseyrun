import Image from "next/image";
import Link from "next/link";

type MarqueeProduct = {
  id: string;
  name: string;
  imageUrl: string;
  clubSlug: string;
  clubName: string;
};

export function ProductMarquee({ products }: { products: MarqueeProduct[] }) {
  if (products.length === 0) return null;

  const items = [...products, ...products];

  return (
    <section className="border-y border-white/10 bg-neutral-950 py-14">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Nos articles</p>
        <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
          Fraîchement mis en ligne par nos clubs
        </h2>
      </div>
      <div className="overflow-hidden">
        <div className="flex w-max animate-marquee gap-6">
          {items.map((product, index) => (
            <Link
              key={`${product.id}-${index}`}
              href={`/clubs/${product.clubSlug}`}
              aria-hidden={index >= products.length}
              tabIndex={index >= products.length ? -1 : 0}
              className="group w-40 shrink-0 text-center"
            >
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={160}
                  height={160}
                  className="h-28 w-28 object-contain transition group-hover:scale-105"
                />
              </div>
              <p className="mt-2 truncate text-xs font-semibold text-white">{product.name}</p>
              <p className="truncate text-[11px] text-neutral-500">{product.clubName}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
