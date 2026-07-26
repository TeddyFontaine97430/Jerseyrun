import Link from "next/link";
import Image from "next/image";

export function ClubLogoCard({
  slug,
  name,
  logoUrl,
  description,
}: {
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
}) {
  return (
    <Link
      href={`/clubs/${slug}`}
      className="group flex flex-col items-center rounded-2xl border border-white/10 bg-neutral-900 p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-neutral-800">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`Logo ${name}`}
            width={96}
            height={96}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-2xl font-bold text-slate-300">{name.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold text-white group-hover:text-accent">
        {name}
      </h3>
      {description && (
        <p className="mt-1 line-clamp-2 text-xs text-neutral-400">{description}</p>
      )}
      <span className="mt-3 text-xs font-semibold uppercase tracking-wide text-accent">
        Voir la boutique →
      </span>
    </Link>
  );
}
