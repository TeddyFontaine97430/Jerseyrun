"use server";

import bcrypt from "bcryptjs";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export type DeleteAccountState = {
  status: "idle" | "error";
  message?: string;
};

// Suppression du compte par l'utilisateur lui-même (exigée par l'App Store, règle 5.1.1(v)).
// Les commandes sont conservées sans lien avec le compte (obligations comptables) ; tout le
// reste des données personnelles rattachées au compte est supprimé.
export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const session = await auth();
  if (!session?.user) {
    return { status: "error", message: "Vous devez être connecté." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return { status: "error", message: "Merci d'indiquer votre mot de passe pour confirmer." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { club: { select: { id: true } }, supplier: { select: { id: true } } },
  });
  if (!user) {
    return { status: "error", message: "Compte introuvable." };
  }

  if (user.role !== "CUSTOMER" || user.club || user.supplier) {
    return {
      status: "error",
      message:
        "Les comptes club, fournisseur et administrateur sont supprimés par notre équipe. Écrivez-nous via le formulaire de contact en bas de page.",
    };
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return { status: "error", message: "Mot de passe incorrect." };
  }

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.pushDevice.deleteMany({ where: { userId: user.id } }),
    prisma.order.updateMany({ where: { userId: user.id }, data: { userId: null } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  await signOut({ redirectTo: "/?compte=supprime" });
  return { status: "idle" };
}
