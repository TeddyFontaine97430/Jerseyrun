import Image from "next/image";

export function Gallery({
  images,
}: {
  images: { id: string; url: string; caption: string | null }[];
}) {
  if (images.length === 0) return null;

  return (
    <section id="galerie" className="container-page scroll-mt-24 py-20">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          En images
        </p>
        <h2 className="mt-2 text-3xl font-extrabold text-white">Galerie photo</h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-400">
          Entraînements, matchs, célébrations : l&apos;énergie des clubs partenaires.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {images.map((image, i) => (
          <div
            key={image.id}
            className={`relative aspect-square overflow-hidden rounded-xl bg-white/10 ${
              i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : ""
            }`}
          >
            <Image
              src={image.url}
              alt={image.caption ?? "Photo Jersey Run"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
