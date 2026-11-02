"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getClubForUser } from "@/lib/clubStats";
import { prisma } from "@/lib/prisma";

// Un club modifie ses propres réglages ; l'admin peut modifier ceux de n'importe quel club
// (en précisant son id).
async function resolveSettingsClub(clubId?: string | null) {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.role === "ADMIN") {
    if (!clubId) return null;
    return prisma.club.findUnique({ where: { id: clubId } });
  }

  if (session.user.role === "CLUB") {
    const club = await getClubForUser(session.user.id);
    if (!club || club.status !== "APPROVED") return null;
    return club;
  }

  return null;
}

function revalidateSettingsPaths(club: { id: string; slug: string }) {
  revalidatePath("/club/dashboard/parametres");
  revalidatePath(`/admin/clubs/${club.id}`);
  revalidatePath(`/clubs/${club.slug}`);
  revalidatePath("/panier");
}

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

export async function updatePayOnSiteSetting(enabled: boolean, clubId?: string) {
  const club = await resolveSettingsClub(clubId);
  if (!club) return;

  await prisma.club.update({ where: { id: club.id }, data: { allowPayOnSite: enabled } });

  revalidateSettingsPaths(club);
}

export type DeliverySettingsState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const deliverySettingsSchema = z.object({
  metropoleEnabled: z.coerce.boolean(),
  metropoleFee: z.coerce.number().min(0, "Le tarif ne peut pas être négatif.").optional(),
  metropoleExtraItem: z.coerce.number().min(0, "Le surcoût ne peut pas être négatif.").optional(),
  reunionEnabled: z.coerce.boolean(),
  reunionFee: z.coerce.number().min(0, "Le tarif ne peut pas être négatif.").optional(),
  reunionExtraItem: z.coerce.number().min(0, "Le surcoût ne peut pas être négatif.").optional(),
});

export async function updateDeliverySettings(
  _prevState: DeliverySettingsState,
  formData: FormData,
): Promise<DeliverySettingsState> {
  const clubIdField = formData.get("clubId");
  const club = await resolveSettingsClub(typeof clubIdField === "string" ? clubIdField : null);
  if (!club) {
    return { status: "error", message: "Accès non autorisé." };
  }

  const parsed = deliverySettingsSchema.safeParse({
    metropoleEnabled: formData.get("metropoleEnabled") === "on",
    metropoleFee: formData.get("metropoleFee") || 0,
    metropoleExtraItem: formData.get("metropoleExtraItem") || 0,
    reunionEnabled: formData.get("reunionEnabled") === "on",
    reunionFee: formData.get("reunionFee") || 0,
    reunionExtraItem: formData.get("reunionExtraItem") || 0,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { metropoleEnabled, metropoleFee, metropoleExtraItem, reunionEnabled, reunionFee, reunionExtraItem } =
    parsed.data;

  await prisma.club.update({
    where: { id: club.id },
    data: {
      deliveryMetropoleEnabled: metropoleEnabled,
      deliveryMetropoleFeeCents: Math.round((metropoleFee ?? 0) * 100),
      deliveryMetropoleExtraItemCents: Math.round((metropoleExtraItem ?? 0) * 100),
      deliveryReunionEnabled: reunionEnabled,
      deliveryReunionFeeCents: Math.round((reunionFee ?? 0) * 100),
      deliveryReunionExtraItemCents: Math.round((reunionExtraItem ?? 0) * 100),
    },
  });

  revalidateSettingsPaths(club);

  return { status: "success", message: "Options de livraison mises à jour." };
}
