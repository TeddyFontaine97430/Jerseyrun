"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

function revalidateHomeGalleryPaths() {
  revalidatePath("/");
  revalidatePath("/admin/contenu");
}

export type HomeGalleryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const homeGalleryImageSchema = z.object({
  imageUrl: z.string().min(1, "Merci de choisir une image."),
  link: z.string().min(1, "Merci d'indiquer un lien."),
});

export async function addHomeGalleryImage(
  _prevState: HomeGalleryFormState,
  formData: FormData,
): Promise<HomeGalleryFormState> {
  if (!(await requireAdmin())) return { status: "error", message: "Accès non autorisé." };

  const parsed = homeGalleryImageSchema.safeParse({
    imageUrl: formData.get("imageUrl"),
    link: formData.get("link"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.homeGalleryImage.create({ data: parsed.data });

  revalidateHomeGalleryPaths();
  return { status: "success", message: "Image ajoutée." };
}

export async function updateHomeGalleryImageLink(id: string, link: string) {
  if (!(await requireAdmin())) return;
  const trimmed = link.trim();
  if (!trimmed) return;

  await prisma.homeGalleryImage.update({ where: { id }, data: { link: trimmed } });
  revalidateHomeGalleryPaths();
}

export async function deleteHomeGalleryImage(id: string) {
  if (!(await requireAdmin())) return;
  await prisma.homeGalleryImage.delete({ where: { id } });
  revalidateHomeGalleryPaths();
}
