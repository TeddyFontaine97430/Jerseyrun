"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type CarouselProduct = {
  id: string;
  name: string;
  imageUrl: string;
  priceLabel: string;
};

const arrowClass =
  "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/60 text-xl text-white backdrop-blur transition hover:border-accent hover:bg-accent sm:h-10 sm:w-10";

export function BannerProductCarousel({
  products,
  clubSlug,
  initialId,
}: {
  products: CarouselProduct[];
  clubSlug: string;
  initialId?: string | null;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const initialIndex = Math.max(0, products.findIndex((p) => p.id === initialId));
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const centerOn = useCallback((index: number, smooth: boolean) => {
    const scroller = scrollerRef.current;
    const item = itemRefs.current[index];
    if (!scroller || !item) return;
    const left = item.offsetLeft + item.offsetWidth / 2 - scroller.clientWidth / 2;
    scroller.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Avant tout défilement, l'article choisi est au milieu.
  useLayoutEffect(() => {
    centerOn(initialIndex, false);
  }, [centerOn, initialIndex]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let frame = 0;

    function updateActive() {
      frame = 0;
      if (!scroller) return;
      const middle = scroller.scrollLeft + scroller.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;
      itemRefs.current.forEach((item, i) => {
        if (!item) return;
        const distance = Math.abs(item.offsetLeft + item.offsetWidth / 2 - middle);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      setActiveIndex(best);
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(updateActive);
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  function step(direction: -1 | 1) {
    const next = Math.min(products.length - 1, Math.max(0, activeIndex + direction));
    centerOn(next, true);
  }

  if (products.length === 0) return null;

  return (
    // Posé par-dessus la bande (la bande reste visible en dessous) : toutes les tailles
    // sont exprimées en fonction de la hauteur de la bande (cqh), donc le carrousel
    // s'adapte à l'écran.
    <div className="absolute inset-0" style={{ containerType: "size" }}>
      <button type="button" aria-label="Article précédent" onClick={() => step(-1)} className={`${arrowClass} left-2 sm:left-6`}>
        ‹
      </button>
      <button type="button" aria-label="Article suivant" onClick={() => step(1)} className={`${arrowClass} right-2 sm:right-6`}>
        ›
      </button>
      <div
        ref={scrollerRef}
        className="flex h-full snap-x snap-mandatory items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: "5cqh" }}
      >
        <div aria-hidden className="shrink-0" style={{ width: "calc(50cqw - 27cqh - 5cqh)" }} />
        {products.map((product, index) => {
          const isActive = index === activeIndex;
          return (
            <Link
              key={product.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              href={`/clubs/${clubSlug}`}
              onClick={(e) => {
                // Un clic sur un article de côté le ramène au milieu ; un clic sur celui
                // du milieu ouvre la boutique du club.
                if (!isActive) {
                  e.preventDefault();
                  centerOn(index, true);
                }
              }}
              className={`shrink-0 snap-center text-center transition duration-300 ${
                isActive ? "z-[1] scale-[1.28] opacity-100" : "scale-100 opacity-80 hover:opacity-100"
              }`}
              style={{ width: "54cqh" }}
            >
              <div
                className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-black/55 backdrop-blur-sm"
                style={{ height: "54cqh", width: "54cqh" }}
              >
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={320}
                  height={320}
                  className="h-[92%] w-[92%] object-contain"
                />
              </div>
              {isActive && (
                <p
                  className="mt-1 line-clamp-2 rounded-md bg-black/60 px-1 font-semibold leading-tight text-white"
                  style={{ fontSize: "clamp(9px, 5cqh, 15px)" }}
                >
                  {product.name.trim()} · {product.priceLabel}
                </p>
              )}
            </Link>
          );
        })}
        <div aria-hidden className="shrink-0" style={{ width: "calc(50cqw - 27cqh - 5cqh)" }} />
      </div>
    </div>
  );
}
