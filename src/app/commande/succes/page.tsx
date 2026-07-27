import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Commande confirmée — Jersey Run" } };

export default function CommandeSuccesPage() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl">
        ✓
      </div>
      <h1 className="mt-6 text-3xl font-extrabold text-white">Merci pour votre commande !</h1>
      <p className="mt-3 max-w-md text-neutral-400">
        Votre paiement a bien été enregistré. Vous pouvez suivre l&apos;état de
        votre commande depuis votre espace client.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/compte" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white">
          Voir mes commandes
        </Link>
        <Link href="/" className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
