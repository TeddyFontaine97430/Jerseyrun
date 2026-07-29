"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getClubForUser } from "@/lib/clubStats";
import { prisma } from "@/lib/prisma";

export type ClubLogoState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function updateClubLogo(
  _prevState: ClubLogoState,
  formData: FormData,
): Promise<ClubLogoState> {
  const session = await auth();
  if (!session?.user) {
    return { status: "error", message: "Accès non autorisé." };
  }

  let club: { id: string; slug: string } | null = null;

  if (session.user.role === "CLUB") {
    const ownClub = await getClubForUser(session.user.id);
    if (!ownClub || ownClub.status !== "APPROVED") {
      return { status: "error", message: "Accès non autorisé." };
    }
    club = ownClub;
  } else if (session.user.role === "ADMIN") {
    const clubId = formData.get("clubId");
    if (typeof clubId !== "string" || !clubId) {
      return { status: "error", message: "Accès non autorisé." };
    }
    club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      return { status: "error", message: "Club introuvable." };
    }
  } else {
    return { status: "error", message: "Accès non autorisé." };
  }

  const logoUrl = formData.get("logoUrl");
  if (typeof logoUrl !== "string" || !logoUrl) {
    return { status: "error", message: "Merci de choisir une image." };
  }

  await prisma.club.update({ where: { id: club.id }, data: { logoUrl } });

  revalidatePath("/club/dashboard/parametres");
  revalidatePath(`/admin/clubs/${club.id}`);
  revalidatePath("/");
  revalidatePath(`/clubs/${club.slug}`);

  return { status: "success", message: "Logo mis à jour." };
}

export async function updatePayOnSiteSetting(enabled: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLUB") return;

  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") return;

  await prisma.club.update({ where: { id: club.id }, data: { allowPayOnSite: enabled } });

  revalidatePath("/club/dashboard/parametres");
}
