import type { Metadata } from "next";
import { auth } from "@/auth";
import { getClubForUser } from "@/lib/clubStats";
import { ProfileForm } from "@/components/account/ProfileForm";
import { ClubLogoForm } from "@/components/club/ClubLogoForm";
import { StripeConnectCard } from "@/components/club/StripeConnectCard";
import { PayOnSiteToggle } from "@/components/club/PayOnSiteToggle";
import { refreshStripeAccountStatus } from "@/lib/actions/stripe-connect";

export const metadata: Metadata = { title: { absolute: "Paramètres — Espace club Jersey Run" } };

export default async function ClubParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const params = await searchParams;
  if (params.stripe === "return") {
    await refreshStripeAccountStatus();
  }

  const club = await getClubForUser(session.user.id);

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Paiements</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Connectez votre compte Stripe pour recevoir directement l&apos;argent de vos ventes.
      </p>
      <div className="mt-4">
        <StripeConnectCard
          stripeAccountId={club?.stripeAccountId ?? null}
          stripePayoutsEnabled={club?.stripePayoutsEnabled ?? false}
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-white">Mode de paiement</h2>
      <p className="mt-1 text-sm text-neutral-400">
        En plus du paiement par carte bancaire, vous pouvez autoriser vos clients à régler en espèces ou par tout
        autre moyen directement au club, lors du retrait de leur commande.
      </p>
      <div className="mt-4">
        <PayOnSiteToggle enabled={club?.allowPayOnSite ?? false} />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-white">Logo du club</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Ce logo est affiché sur la page d&apos;accueil et sur la boutique de votre club.
      </p>
      <div className="mt-4">
        <ClubLogoForm logoUrl={club?.logoUrl ?? null} />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-white">Paramètres du compte</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Modifiez l&apos;email et le mot de passe utilisés pour vous connecter.
      </p>
      <div className="mt-4">
        <ProfileForm name={session.user.name ?? ""} email={session.user.email ?? ""} />
      </div>
    </div>
  );
}
