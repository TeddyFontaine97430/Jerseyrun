import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Créer un compte — Jersey Run" };

export default function InscriptionPage() {
  return (
    <div className="container-page flex flex-col items-center py-16">
      <h1 className="text-3xl font-extrabold text-white">Créer un compte client</h1>
      <p className="mt-2 max-w-md text-center text-neutral-400">
        Créez votre compte pour suivre votre panier, vos commandes et leur état de livraison.
      </p>
      <div className="mt-8 w-full max-w-md">
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-neutral-400">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-semibold text-accent">
            Connectez-vous
          </Link>
          . Vous représentez un club ?{" "}
          <Link href="/concept?tab=inscription" className="font-semibold text-accent">
            Inscrivez-le ici
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
