import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions clubs — Jersey Run" };

export default function ConditionsClubPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Espace club</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
          Conditions d&apos;utilisation pour les clubs
        </h1>
        <div className="mt-8 space-y-8 text-neutral-300">
          <section>
            <h2 className="text-lg font-semibold text-white">Paiements et frais Stripe</h2>
            <p className="mt-2">
              Les paiements de vos clients sont traités par Stripe, notre prestataire de paiement. Stripe applique
              des frais de traitement sur chaque paiement encaissé (généralement autour de 1,5 % + 0,25 € pour une
              carte bancaire européenne). Ce taux s&apos;adapte automatiquement selon le moyen de paiement utilisé
              par le client (carte européenne, carte étrangère, portefeuille électronique, etc.). Ces frais sont
              directement déduits par Stripe avant le versement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Moyens de paiement acceptés</h2>
            <p className="mt-2">
              Vos clients peuvent payer par carte bancaire, ainsi que par les moyens de paiement sur smartphone
              (Apple Pay, Google Pay) et d&apos;autres moyens de paiement locaux proposés automatiquement par
              Stripe selon la localisation du client.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Versement direct, sans commission</h2>
            <p className="mt-2">
              Une fois votre compte Stripe connecté à Jersey Run, l&apos;intégralité des paiements de vos ventes
              est versée directement sur votre compte bancaire. Jersey Run ne prélève actuellement{" "}
              <strong className="text-white">aucune commission</strong>{" "}
              sur vos ventes. Cette politique pourra évoluer à l&apos;avenir ; vous en seriez informés à
              l&apos;avance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Gestion et responsabilité du stock</h2>
            <p className="mt-2">
              Vous êtes seul responsable de la gestion du stock de vos articles sur Jersey Run. Si vous vendez des
              articles en dehors du site (en personne, autre canal), vous devez impérativement mettre à jour votre
              stock sur votre espace club pour éviter de vendre un article qui n&apos;est plus disponible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Connexion Stripe obligatoire avant de vendre</h2>
            <p className="mt-2">
              Avant de pouvoir mettre un article en ligne, vous devez obligatoirement créer votre compte Stripe
              lié à Jersey Run, depuis votre espace club (Paramètres → Paiements). Ce n&apos;est qu&apos;une fois
              ce compte connecté que vous pourrez ajouter des articles à votre boutique.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
