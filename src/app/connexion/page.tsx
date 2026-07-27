import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: { absolute: "Connexion — Jersey Run" } };

export default function ConnexionPage() {
  return (
    <div className="container-page flex flex-col items-center py-16">
      <h1 className="text-3xl font-extrabold text-white">Connexion</h1>
      <p className="mt-2 text-neutral-400">Client, club ou administrateur : connectez-vous ici.</p>
      <div className="mt-8 w-full max-w-md">
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-neutral-400">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-semibold text-accent">
            Créer un compte client
          </Link>{" "}
          ou{" "}
          <Link href="/concept?tab=inscription" className="font-semibold text-accent">
            inscrire votre club
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
