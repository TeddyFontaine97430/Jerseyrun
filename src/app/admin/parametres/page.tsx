import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: { absolute: "Mon profil — Administration Jersey Run" } };

export default async function AdminParametresPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Mon profil</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Modifiez l&apos;email et le mot de passe de votre compte administrateur.
      </p>
      <div className="mt-4">
        <ProfileForm name={session.user.name ?? ""} email={session.user.email ?? ""} />
      </div>
    </div>
  );
}
