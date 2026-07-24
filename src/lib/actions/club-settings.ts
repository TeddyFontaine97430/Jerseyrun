"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getClubForUser } from "@/lib/clubStats";
import { prisma } from "@/lib/prisma";
import { uploadImage, UploadError } from "@/lib/upload";

export type ClubLogoState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function updateClubLogo(
  _prevState: ClubLogoState,
  formData: FormData,
): Promise<ClubLogoState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLUB") {
    return { status: "error", message: "Accès non autorisé." };
  }

  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") {
    return { status: "error", message: "Accès non autorisé." };
  }

  const file = formData.get("logoFile");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Merci de choisir une image." };
  }

  let logoUrl: string;
  try {
    logoUrl = await uploadImage(file, "club-logos");
  } catch (error) {
    return { status: "error", message: error instanceof UploadError ? error.message : "Échec de l'envoi de l'image." };
  }

  await prisma.club.update({ where: { id: club.id }, data: { logoUrl } });

  revalidatePath("/club/dashboard/parametres");
  revalidatePath("/");
  revalidatePath(`/clubs/${club.slug}`);

  return { status: "success", message: "Logo mis à jour." };
}
