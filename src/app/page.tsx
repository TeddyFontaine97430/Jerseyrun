import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ClubLogoCard } from "@/components/ClubLogoCard";

export default async function Home() {
  const clubs = await prisma.club.findMany({
    where: { status: "APPROVED", active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <section className="relative overflow-hidden bg-black">
        <Image
          src="/hero-banner.png"
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
              La boutique officielle des clubs sportifs
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Tous les clubs. Une seule boutique.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-neutral-300">
              Jersey Run réunit les boutiques officielles de plusieurs clubs
              sportifs : maillots, équipements et goodies, commandés en ligne
              et gérés directement par chaque club.
            </p>
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
            </div>
          </div>
        </div>
      </section>

      <section id="clubs" className="container-page scroll-mt-24 py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            Nos partenaires
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-white">Clubs partenaires</h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-400">
            Sélectionnez un club pour découvrir sa boutique officielle.
          </p>
        </div>

        {clubs.length === 0 ? (
          <p className="text-center text-neutral-400">
            Aucun club partenaire pour le moment. Revenez bientôt !
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {clubs.map((club) => (
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
