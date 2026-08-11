import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ClubLogoCard } from "@/components/ClubLogoCard";
import { ProductMarquee } from "@/components/ProductMarquee";
import { getSiteContentMap } from "@/lib/siteContent";

// Ce club doit toujours apparaître en premier, aussi bien dans la grille des clubs
// que dans la bande "fraîchement mis en ligne par nos clubs".
const PINNED_CLUB_SLUG = "jeunesse-sportive-saint-pierroise";

export default async function Home() {
  const [clubs, pinnedProducts, otherProducts, content] = await Promise.all([
    prisma.club.findMany({
      where: { status: "APPROVED", active: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: {
        active: true,
        imageUrl: { not: null },
        club: { slug: PINNED_CLUB_SLUG, status: "APPROVED", active: true },
      },
      include: { club: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: {
        active: true,
        imageUrl: { not: null },
        club: { slug: { not: PINNED_CLUB_SLUG }, status: "APPROVED", active: true },
      },
      include: { club: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getSiteContentMap(),
  ]);

  const marqueeProducts = [...pinnedProducts, ...otherProducts];

  const pinnedClub = clubs.find((club) => club.slug === PINNED_CLUB_SLUG);
  const sortedClubs = pinnedClub
    ? [pinnedClub, ...clubs.filter((club) => club.slug !== PINNED_CLUB_SLUG)]
    : clubs;

  return (
    <div>
      <section className="relative overflow-hidden bg-black">
        <Image
          src={content["home.heroImage"]}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        <div className="container-page relative py-20 lg:py-28">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
              {content["home.badge"]}
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              {content["home.title"]}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-neutral-300">{content["home.subtitle"]}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#clubs"
                className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark"
              >
                Découvrir les clubs
              </a>
              <Link
                href="/concept?tab=inscription"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent"
              >
                Inscrire mon club
              </Link>
              <a
                href="https://www.jerseyrun.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-gold/40 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold/15"
              >
                Découvrez la boutique Jersey Run
              </a>
            </div>
          </div>
        </div>
      </section>

      <Link
        href="/clubs/jeunesse-sportive-saint-pierroise"
        className="block w-full overflow-hidden border-b border-white/10"
        aria-label="Découvrir la boutique de la Jeunesse Sportive Saint-Pierroise"
      >
        <Image
          src="https://hlgj7olfcqzaeggk.public.blob.vercel-storage.com/site/banner-js-saint-pierroise-q1S8i1gAxEsFwzEfl7DqpO3K7BjXkS.jpg"
          alt="Jeunesse Sportive Saint-Pierroise — Maillot officiel saison 2026"
          width={1536}
          height={862}
          sizes="100vw"
          className="h-auto w-full object-cover transition hover:opacity-90"
        />
      </Link>

      <ProductMarquee
        products={marqueeProducts.map((product) => ({
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl as string,
          clubSlug: product.club.slug,
          clubName: product.club.name,
        }))}
      />

      <section id="clubs" className="container-page scroll-mt-24 py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            Nos partenaires
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-white">{content["home.partnersTitle"]}</h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-400">{content["home.partnersSubtitle"]}</p>
        </div>

        {sortedClubs.length === 0 ? (
          <p className="text-center text-neutral-400">
            Aucun club partenaire pour le moment. Revenez bientôt !
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {sortedClubs.map((club) => (
              <ClubLogoCard
                key={club.id}
                slug={club.slug}
                name={club.name}
                logoUrl={club.logoUrl}
                description={club.description}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
