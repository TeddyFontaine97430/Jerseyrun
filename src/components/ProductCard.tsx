"use client";

import { useEffect, useState } from "react";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const current = gallery[activeImage] ?? gallery[0];

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveImage((i) => (i + 1) % gallery.length);
      if (e.key === "ArrowLeft") setActiveImage((i) => (i - 1 + gallery.length) % gallery.length);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, gallery.length]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
      <button
        type="button"
        onClick={() => current && setLightboxOpen(true)}
        disabled={!current}
        className="flex aspect-square items-center justify-center bg-neutral-800 disabled:cursor-default"
        aria-label={current ? `Agrandir la photo de ${name}` : undefined}
      >
        {current ? (
          <Image
            src={current}
            alt={name}
            width={160}
            height={160}
            className="h-24 w-24 object-contain transition hover:scale-105"
          />
        ) : (
          <span className="text-4xl">🎽</span>
        )}
      </button>
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

      {lightboxOpen && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Fermer"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage((i) => (i - 1 + gallery.length) % gallery.length);
                }}
                aria-label="Photo précédente"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage((i) => (i + 1) % gallery.length);
                }}
                aria-label="Photo suivante"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}

          <Image
            src={current}
            alt={name}
            width={900}
            height={900}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-auto max-w-[90vw] cursor-default rounded-lg object-contain"
          />

          {gallery.length > 1 && (
            <div
              className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {gallery.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-2 w-2 rounded-full transition ${
                    i === activeImage ? "bg-accent" : "bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
