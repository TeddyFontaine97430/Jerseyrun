"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SITE_CONTENT_DEFAULTS, type SiteContentKey } from "@/lib/siteContent";

export type SiteContentFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const TEXT_KEYS = Object.keys(SITE_CONTENT_DEFAULTS).filter(
  (key) => key !== "home.heroImage" && key !== "home.bannerImage",
) as SiteContentKey[];

export async function updateSiteContent(
  _prevState: SiteContentFormState,
  formData: FormData,
): Promise<SiteContentFormState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { status: "error", message: "Accès non autorisé." };
  }

  const updates: { key: string; value: string }[] = [];

  for (const key of TEXT_KEYS) {
    const value = formData.get(key);
    if (typeof value === "string") {
      updates.push({ key, value: value.trim() });
    }
  }

  const heroImageUrl = formData.get("home.heroImageUrl");
  if (typeof heroImageUrl === "string" && heroImageUrl) {
    updates.push({ key: "home.heroImage", value: heroImageUrl });
  }

  const bannerImageUrl = formData.get("home.bannerImageUrl");
  if (typeof bannerImageUrl === "string" && bannerImageUrl) {
    updates.push({ key: "home.bannerImage", value: bannerImageUrl });
  }

  await prisma.$transaction(
    updates.map((update) =>
      prisma.siteContent.upsert({
        where: { key: update.key },
        create: { key: update.key, value: update.value },
        update: { value: update.value },
      }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/concept");
  revalidatePath("/admin/contenu");

  return { status: "success", message: "Contenu mis à jour." };
}
