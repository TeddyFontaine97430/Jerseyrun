import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://jerseyrun.re";

type Props = { params: Promise<{ slug: string }> };

async function getClub(slug: string) {
  return prisma.club.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      products: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        include: { options: { include: { values: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const club = await getClub(slug);
  if (!club) return { title: "Club introuvable" };

  const description =
    club.description ??
    `Découvrez la boutique officielle de ${club.name} sur Jersey Run : maillots, équipements et goodies.`;

  return {
    title: club.name,
    description,
    alternates: { canonical: `/clubs/${club.slug}` },
    openGraph: {
      title: club.name,
      description,
      url: `/clubs/${club.slug}`,
      images: club.logoUrl ? [{ url: club.logoUrl }] : undefined,
    },
  };
}

export default async function ClubShopPage({ params }: Props) {
  const { slug } = await params;
  const club = await getClub(slug);
  if (!club) notFound();

  const clubUrl = `${siteUrl}/clubs/${club.slug}`;

  const clubJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: club.name,
    url: clubUrl,
    telephone: club.phone,
    email: club.email,
    ...(club.sport ? { sport: club.sport } : {}),
    ...(club.logoUrl ? { logo: club.logoUrl } : {}),
    ...(club.description ? { description: club.description } : {}),
  };

  const productsJsonLd = club.products.map((product) => {
    const inStock = product.options.length > 0
      ? product.options.every((o) => o.values.some((v) => v.stock > 0))
      : true;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description ?? `${product.name} — ${club.name}`,
      ...(product.imageUrl ? { image: product.imageUrl } : {}),
      brand: { "@type": "Brand", name: club.name },
      offers: {
        "@type": "Offer",
        url: clubUrl,
        priceCurrency: "EUR",
        price: (product.priceCents / 100).toFixed(2),
        availability:
          product.availability === "PREORDER"
            ? "https://schema.org/PreOrder"
            : inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
      },
    };
  });

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clubJsonLd) }}
      />
      {productsJsonLd.map((json, i) => (
        <script
          key={club.products[i].id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
        />
      ))}
      <section className="border-b border-white/10 bg-gradient-to-b from-neutral-900 to-black">
        <div className="container-page flex flex-col items-center gap-6 py-14 text-center sm:flex-row sm:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
            {club.logoUrl ? (
              <Image src={club.logoUrl} alt={club.name} width={96} height={96} className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl font-bold text-slate-300">{club.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">{club.name}</h1>
            {club.sport && (
              <span className="mt-2 inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                {club.sport}
              </span>
            )}
            {club.description && <p className="mt-2 max-w-2xl text-neutral-300">{club.description}</p>}
            <p className="mt-3 text-sm text-neutral-400">
              Tél : {club.phone} · Email : {club.email}
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        {!club.active ? (
          <p className="text-center text-neutral-400">
            Cette boutique est actuellement fermée. Revenez plus tard !
          </p>
        ) : club.products.length === 0 ? (
          <p className="text-center text-neutral-400">
            Ce club n&apos;a pas encore ajouté d&apos;articles à sa boutique.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {club.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                priceCents={product.priceCents}
                imageUrl={product.imageUrl}
                options={product.options}
                availability={product.availability}
                personalizationEnabled={product.personalizationEnabled}
                personalizationFeeCents={product.personalizationFeeCents}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
