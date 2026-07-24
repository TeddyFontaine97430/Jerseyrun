import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Mot de passe oublié — Jersey Run" };

export default function MotDePasseOubliePage() {
  return (
    <div className="container-page flex flex-col items-center py-16">
      <h1 className="text-3xl font-extrabold text-white">Mot de passe oublié</h1>
      <p className="mt-2 max-w-md text-center text-neutral-400">
        Indiquez votre email, nous vous enverrons un lien pour choisir un nouveau mot de passe.
      </p>
      <div className="mt-8 w-full max-w-md">
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-neutral-400">
          <Link href="/connexion" className="font-semibold text-accent">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
