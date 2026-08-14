import Image from "next/image";

type GalleryImage = { id: string; imageUrl: string; link: string };

export function HomeGallery({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null;

  return (
    <section className="-mt-12 border-b border-white/10 bg-black py-10 sm:-mt-16">
      <div className="container-page flex flex-wrap justify-center gap-4">
        {images.map((image) => {
          const isExternal = image.link.startsWith("http");
          return (
            <a
              key={image.id}
              href={image.link}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="block h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 transition hover:opacity-90 sm:h-32 sm:w-32"
            >
              <Image
                src={image.imageUrl}
                alt=""
                width={160}
                height={160}
                className="h-full w-full object-cover"
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}
