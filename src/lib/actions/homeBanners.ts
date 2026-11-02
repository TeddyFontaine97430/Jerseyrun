"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeLink } from "@/lib/links";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

function revalidateHomeBannerPaths() {
  revalidatePath("/");
  revalidatePath("/admin/contenu");
}

export type HomeBannerFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const homeBannerSchema = z.object({
  imageUrl: z.string().min(1, "Merci de choisir une image."),
  link: z.string().min(1, "Merci d'indiquer un lien."),
});

export async function addHomeBanner(
  _prevState: HomeBannerFormState,
  formData: FormData,
): Promise<HomeBannerFormState> {
  if (!(await requireAdmin())) return { status: "error", message: "Accès non autorisé." };

  const parsed = homeBannerSchema.safeParse({
    imageUrl: formData.get("imageUrl"),
    link: formData.get("link"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const last = await prisma.homeBanner.findFirst({ orderBy: { position: "desc" } });
  const position = (last?.position ?? -1) + 1;

  await prisma.homeBanner.create({
    data: { imageUrl: parsed.data.imageUrl, link: normalizeLink(parsed.data.link), position },
  });

  revalidateHomeBannerPaths();
  return { status: "success", message: "Bannière ajoutée." };
}

export async function updateHomeBannerLink(id: string, link: string) {
  if (!(await requireAdmin())) return;
  const normalized = normalizeLink(link);
  if (!normalized) return;

  await prisma.homeBanner.update({ where: { id }, data: { link: normalized } });
  revalidateHomeBannerPaths();
}

// Affiche (ou retire, si clubSlug est vide) un carrousel des articles d'un club sous la
// bannière, centré par défaut sur l'article centerProductId.
export async function updateHomeBannerCarousel(id: string, clubSlug: string, centerProductId: string) {
  if (!(await requireAdmin())) return;

  const slug = clubSlug.trim();
  if (!slug) {
    await prisma.homeBanner.update({
      where: { id },
      data: { carouselClubSlug: null, carouselCenterProductId: null },
    });
    revalidateHomeBannerPaths();
    return;
  }

  const center = centerProductId
    ? await prisma.product.findFirst({ where: { id: centerProductId, club: { slug } }, select: { id: true } })
    : null;

  await prisma.homeBanner.update({
    where: { id },
    data: { carouselClubSlug: slug, carouselCenterProductId: center?.id ?? null },
  });
  revalidateHomeBannerPaths();
}

export async function deleteHomeBanner(id: string) {
  if (!(await requireAdmin())) return;
  await prisma.homeBanner.delete({ where: { id } });
  revalidateHomeBannerPaths();
}

export async function moveHomeBanner(id: string, direction: "up" | "down") {
  if (!(await requireAdmin())) return;

  const banners = await prisma.homeBanner.findMany({ orderBy: { position: "asc" } });
  const index = banners.findIndex((banner) => banner.id === id);
  if (index === -1) return;

  const swapWithIndex = direction === "up" ? index - 1 : index + 1;
  if (swapWithIndex < 0 || swapWithIndex >= banners.length) return;

  const current = banners[index];
  const swapWith = banners[swapWithIndex];

  await prisma.$transaction([
    prisma.homeBanner.update({ where: { id: current.id }, data: { position: swapWith.position } }),
    prisma.homeBanner.update({ where: { id: swapWith.id }, data: { position: current.position } }),
  ]);

  revalidateHomeBannerPaths();
}
