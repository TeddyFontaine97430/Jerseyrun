import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Paramètres — Espace club Jersey Run" };

export default async function ClubParametresPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Paramètres du compte</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Modifiez l&apos;email et le mot de passe utilisés pour vous connecter.
      </p>
      <div className="mt-4">
        <ProfileForm name={session.user.name ?? ""} email={session.user.email ?? ""} />
      </div>
    </div>
  );
}
