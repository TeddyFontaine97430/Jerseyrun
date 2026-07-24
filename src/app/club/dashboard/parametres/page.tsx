import type { Metadata } from "next";
import { auth } from "@/auth";
import { getClubForUser } from "@/lib/clubStats";
import { ProfileForm } from "@/components/account/ProfileForm";
import { ClubLogoForm } from "@/components/club/ClubLogoForm";

export const metadata: Metadata = { title: "Paramètres — Espace club Jersey Run" };

export default async function ClubParametresPage() {
  const session = await auth();
  if (!session?.user) return null;
  const club = await getClubForUser(session.user.id);

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Logo du club</h2>
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
