"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { uploadImage, UploadError } from "@/lib/upload";

const productSchema = z.object({
  name: z.string().min(2, "Le nom est requis."),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Le prix doit être supérieur à 0."),
  stock: z.coerce.number().int().min(0, "Le stock ne peut pas être négatif."),
});

async function resolveProductImage(
  formData: FormData,
  currentImageUrl: string | null,
): Promise<string | null> {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    return uploadImage(file, "products");
  }
  return currentImageUrl;
}

type OptionValueRow = { value: string; stock: number };

function parseOptionRowsJson(raw: FormDataEntryValue | null): OptionValueRow[] {
  if (typeof raw !== "string" || !raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const rows: OptionValueRow[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const value = typeof (entry as { value?: unknown }).value === "string" ? (entry as { value: string }).value.trim() : "";
    if (!value || seen.has(value)) continue;
    seen.add(value);
    const stockNumber = Number((entry as { stock?: unknown }).stock);
    const stock = Number.isFinite(stockNumber) ? Math.max(0, Math.trunc(stockNumber)) : 0;
    rows.push({ value, stock });
  }
  return rows;
}

function optionGroupsFromFormData(formData: FormData): { name: string; values: OptionValueRow[] }[] {
  const groups: { name: string; values: OptionValueRow[] }[] = [];

  const sizeValues = parseOptionRowsJson(formData.get("sizeValuesJson"));
  if (sizeValues.length > 0) groups.push({ name: "Taille", values: sizeValues });

  const shoeSizeValues = parseOptionRowsJson(formData.get("shoeSizeValuesJson"));
  if (shoeSizeValues.length > 0) groups.push({ name: "Pointure", values: shoeSizeValues });

  const customName = ((formData.get("customOptionName") as string) ?? "").trim();
  const customValues = parseOptionRowsJson(formData.get("customOptionValuesJson"));
  if (customName && customValues.length > 0) {
    groups.push({ name: customName, values: customValues });
  }

  return groups;
}

export type ProductFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

async function resolveTargetClub(formData: FormData) {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.role === "CLUB") {
    const club = await getClubForUser(session.user.id);
    if (!club || club.status !== "APPROVED") return null;
    return club;
  }

  if (session.user.role === "ADMIN") {
    const clubId = formData.get("clubId");
    if (typeof clubId !== "string" || !clubId) return null;
    return prisma.club.findUnique({ where: { id: clubId } });
  }

  return null;
}

async function canManageClub(clubId: string) {
  const session = await auth();
  if (!session?.user) return false;
  if (session.user.role === "ADMIN") return true;
  if (session.user.role === "CLUB") {
    const club = await getClubForUser(session.user.id);
    return Boolean(club && club.id === clubId && club.status === "APPROVED");
  }
  return false;
}

function revalidateClubPaths(club: { id: string; slug: string }) {
  revalidatePath("/club/dashboard/produits");
  revalidatePath(`/admin/clubs/${club.id}/produits`);
  revalidatePath(`/clubs/${club.slug}`);
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const club = await resolveTargetClub(formData);
  if (!club) return { status: "error", message: "Accès non autorisé." };

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  let imageUrl: string | null;
  try {
    imageUrl = await resolveProductImage(formData, null);
  } catch (error) {
    return { status: "error", message: error instanceof UploadError ? error.message : "Échec de l'envoi de l'image." };
  }

  const { name, description, price, stock } = parsed.data;
  const optionGroups = optionGroupsFromFormData(formData);
  await prisma.product.create({
    data: {
      clubId: club.id,
      name,
      description: description || null,
      priceCents: Math.round(price * 100),
      stock,
      imageUrl,
      options: {
        create: optionGroups.map((group) => ({
          name: group.name,
          values: { create: group.values },
        })),
      },
    },
  });

  revalidateClubPaths(club);
  return { status: "success", message: "Article ajouté." };
}

export async function updateProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const club = await resolveTargetClub(formData);
  if (!club) return { status: "error", message: "Accès non autorisé." };

  const productId = formData.get("productId") as string;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.clubId !== club.id) {
    return { status: "error", message: "Article introuvable." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  let imageUrl: string | null;
  try {
    imageUrl = await resolveProductImage(formData, product.imageUrl);
  } catch (error) {
    return { status: "error", message: error instanceof UploadError ? error.message : "Échec de l'envoi de l'image." };
  }

  const { name, description, price, stock } = parsed.data;
  const optionGroups = optionGroupsFromFormData(formData);
  await prisma.$transaction([
    prisma.productOption.deleteMany({ where: { productId } }),
    prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description: description || null,
        priceCents: Math.round(price * 100),
        stock,
        imageUrl,
        options: {
          create: optionGroups.map((group) => ({
            name: group.name,
            values: { create: group.values },
          })),
        },
      },
    }),
  ]);

  revalidateClubPaths(club);
  return { status: "success", message: "Article mis à jour." };
}

export async function toggleProductActive(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { club: true } });
  if (!product) return;
  if (!(await canManageClub(product.clubId))) return;

  await prisma.product.update({ where: { id: productId }, data: { active: !product.active } });
  revalidateClubPaths(product.club);
}

export async function deleteProduct(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { club: true } });
  if (!product) return;
  if (!(await canManageClub(product.clubId))) return;

  const usedInOrder = await prisma.orderItem.findFirst({ where: { productId } });
  if (usedInOrder) {
    await prisma.product.update({ where: { id: productId }, data: { active: false } });
  } else {
    await prisma.product.delete({ where: { id: productId } });
  }

  revalidateClubPaths(product.club);
}
