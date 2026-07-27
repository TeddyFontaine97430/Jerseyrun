import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = { title: { absolute: "Réinitialiser le mot de passe — Jersey Run" } };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ReinitialiserMotDePassePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="container-page flex flex-col items-center py-16 text-center">
        <h1 className="text-3xl font-extrabold text-white">Lien invalide</h1>
        <p className="mt-3 max-w-md text-neutral-400">
          Ce lien de réinitialisation est incomplet. Faites une nouvelle demande.
        </p>
        <Link
          href="/mot-de-passe-oublie"
          className="mt-6 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col items-center py-16">
      <h1 className="text-3xl font-extrabold text-white">Nouveau mot de passe</h1>
      <p className="mt-2 max-w-md text-center text-neutral-400">Choisissez un nouveau mot de passe.</p>
      <div className="mt-8 w-full max-w-md">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
