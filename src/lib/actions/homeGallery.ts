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

  const last = await prisma.homeGalleryImage.findFirst({ orderBy: { position: "desc" } });
  const position = (last?.position ?? -1) + 1;

  await prisma.homeGalleryImage.create({ data: { ...parsed.data, position } });

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

export async function moveHomeGalleryImage(id: string, direction: "up" | "down") {
  if (!(await requireAdmin())) return;

  const images = await prisma.homeGalleryImage.findMany({ orderBy: { position: "asc" } });
  const index = images.findIndex((img) => img.id === id);
  if (index === -1) return;

  const swapWithIndex = direction === "up" ? index - 1 : index + 1;
  if (swapWithIndex < 0 || swapWithIndex >= images.length) return;

  const current = images[index];
  const swapWith = images[swapWithIndex];

  await prisma.$transaction([
    prisma.homeGalleryImage.update({ where: { id: current.id }, data: { position: swapWith.position } }),
    prisma.homeGalleryImage.update({ where: { id: swapWith.id }, data: { position: current.position } }),
  ]);

  revalidateHomeGalleryPaths();
}
