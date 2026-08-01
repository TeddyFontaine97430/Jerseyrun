import Link from "next/link";
import { auth } from "@/auth";
import { getClubForUser } from "@/lib/clubStats";

export default async function ClubDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return null;

  const club = await getClubForUser(session.user.id);

  if (!club) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-neutral-400">Aucun club associé à ce compte.</p>
      </div>
    );
  }

  if (club.status === "PENDING") {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-3xl">⏳</div>
        <h1 className="mt-6 text-2xl font-bold text-white">Inscription en attente de validation</h1>
        <p className="mt-3 max-w-md text-neutral-400">
          La demande d&apos;inscription de <strong>{club.name}</strong> est en
          cours d&apos;examen par l&apos;administrateur du site. Vous recevrez
          un accès complet dès validation.
        </p>
      </div>
    );
  }

  if (club.status === "REJECTED") {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-3xl">✕</div>
        <h1 className="mt-6 text-2xl font-bold text-white">Inscription refusée</h1>
        <p className="mt-3 max-w-md text-neutral-400">
          La demande d&apos;inscription de <strong>{club.name}</strong> n&apos;a
          pas été validée. Contactez-nous pour plus d&apos;informations.
        </p>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-white">{club.name}</h1>
        <nav className="flex gap-2 rounded-full bg-white/10 p-1.5">
          <Link
            href="/club/dashboard"
            className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white"
          >
            Vue d&apos;ensemble
          </Link>
          <Link
            href="/club/dashboard/produits"
            className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white"
          >
            Mes articles
          </Link>
          <Link
            href="/club/dashboard/commande-manuelle"
            className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white"
          >
            Commande manuelle
          </Link>
          <Link
            href="/club/dashboard/boutique-fournisseur"
            className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white"
          >
            Boutique fournisseur
          </Link>
          <Link
            href="/club/dashboard/parametres"
            className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white"
          >
            Paramètres
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
