import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Politique de confidentialité — Jersey Run" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Confidentialité</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
          Politique de confidentialité
        </h1>
        <p className="mt-4 text-sm text-neutral-400">Dernière mise à jour : 12 août 2026.</p>

        <div className="mt-8 space-y-8 text-neutral-300">
          <section>
            <h2 className="text-lg font-semibold text-white">Qui sommes-nous</h2>
            <p className="mt-2">
              Jersey Run (28 chemin Saint Expédit, 97430 Le Tampon, La Réunion, France) édite le site
              jerseyrun.re et l&apos;application mobile Jersey Run, une boutique en ligne réunissant plusieurs
              clubs sportifs. Pour toute question sur vos données, contactez-nous via le formulaire de contact
              du site ou à jerseyruncreation@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Données que nous collectons</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">Compte client</strong> : nom, adresse email, mot de passe
                (chiffré), et lors d&apos;une commande, adresse de livraison et téléphone collectés par notre
                prestataire de paiement Stripe.
              </li>
              <li>
                <strong className="text-white">Compte club</strong> : nom du club, email, téléphone, et
                informations nécessaires au versement des ventes (via Stripe Connect).
              </li>
              <li>
                <strong className="text-white">Commandes</strong> : historique des articles achetés, montants,
                club concerné.
              </li>
              <li>
                <strong className="text-white">Notifications de l&apos;application mobile</strong> : si vous
                autorisez les notifications, un identifiant technique de votre appareil (« token ») est
                enregistré pour pouvoir vous envoyer des messages depuis l&apos;application. Cet identifiant
                n&apos;est pas rattaché à votre identité et peut être supprimé à tout moment en désinstallant
                l&apos;application ou en désactivant les notifications dans les réglages de votre téléphone.
              </li>
              <li>
                <strong className="text-white">Messages de contact</strong> : les informations que vous nous
                transmettez via le formulaire de contact.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Pourquoi nous les utilisons</h2>
            <p className="mt-2">
              Gérer votre compte et vos commandes, permettre aux clubs de gérer leur boutique et de recevoir
              leurs ventes, vous contacter au sujet d&apos;une commande ou d&apos;une demande, vous envoyer des
              notifications ponctuelles depuis l&apos;application mobile (nouveautés, promotions), et assurer la
              sécurité du site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Avec qui nous les partageons</h2>
            <p className="mt-2">
              Nous ne vendons aucune donnée. Certaines données sont transmises à des prestataires
              techniques strictement nécessaires au fonctionnement du service :
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">Stripe</strong> (paiement en ligne et versement aux clubs) ;
              </li>
              <li>
                <strong className="text-white">Google Firebase</strong> (envoi des notifications de
                l&apos;application mobile) ;
              </li>
              <li>
                <strong className="text-white">Resend</strong> (envoi des emails transactionnels) ;
              </li>
              <li>
                <strong className="text-white">Vercel</strong> (hébergement du site et statistiques de
                fréquentation anonymisées).
              </li>
              <li>
                Le club auprès duquel vous passez commande, pour les informations nécessaires à la préparation
                et à la livraison de votre commande.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Vos droits</h2>
            <p className="mt-2">
              Conformément au Règlement général sur la protection des données (RGPD), vous disposez d&apos;un
              droit d&apos;accès, de rectification, de suppression et de portabilité de vos données, ainsi que
              d&apos;un droit d&apos;opposition. Pour exercer ces droits, contactez-nous via le formulaire de
              contact du site ou à jerseyruncreation@gmail.com. Vous pouvez également introduire une réclamation
              auprès de la CNIL (cnil.fr).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Conservation des données</h2>
            <p className="mt-2">
              Vos données sont conservées pendant la durée de votre compte, puis archivées ou supprimées
              conformément aux obligations légales (notamment comptables) une fois le compte clôturé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Application mobile et notifications</h2>
            <p className="mt-2">
              L&apos;application mobile Jersey Run affiche le site jerseyrun.re. Vous pouvez désactiver les
              notifications à tout moment depuis les réglages de votre téléphone (Réglages &gt; Notifications
              &gt; Jersey Run). Aucune notification n&apos;est envoyée si vous n&apos;avez pas donné votre
              autorisation lors de la première ouverture de l&apos;application.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
