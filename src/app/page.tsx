import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ClubLogoCard } from "@/components/ClubLogoCard";

export default async function Home() {
  const clubs = await prisma.club.findMany({
    where: { status: "APPROVED", active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-900 to-black">
        <div className="container-page grid gap-10 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 h-40 rounded-2xl bg-navy/95 p-6 text-white shadow-lg">
              <p className="text-3xl font-extrabold">{clubs.length}+</p>
              <p className="mt-1 text-sm text-slate-300">clubs partenaires actifs</p>
            </div>
            <div className="h-32 rounded-2xl bg-accent p-6 text-white shadow-lg">
              <p className="text-2xl font-extrabold">100%</p>
              <p className="mt-1 text-sm">reversé aux clubs</p>
            </div>
            <div className="h-32 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
              <p className="text-2xl font-extrabold text-white">1 site</p>
              <p className="mt-1 text-sm text-neutral-400">pour tout gérer</p>
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
