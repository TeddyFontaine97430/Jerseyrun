"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { notifyAdmin } from "@/lib/email";
import { formatPrice } from "@/lib/money";
import type { SupplyOrderStatus } from "@prisma/client";

const supplyProductSchema = z.object({
  name: z.string().min(2, "Le nom est requis."),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Le prix doit être supérieur à 0."),
});

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

function revalidateSupplyPaths() {
  revalidatePath("/admin/boutique-clubs");
  revalidatePath("/club/dashboard/boutique-fournisseur");
}

export type SupplyProductFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createSupplyProduct(
  _prevState: SupplyProductFormState,
  formData: FormData,
): Promise<SupplyProductFormState> {
  if (!(await requireAdmin())) return { status: "error", message: "Accès non autorisé." };

  const parsed = supplyProductSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const imageUrlInput = formData.get("imageUrl");
  const imageUrl = typeof imageUrlInput === "string" && imageUrlInput ? imageUrlInput : null;

  const { name, description, price } = parsed.data;
  await prisma.supplyProduct.create({
    data: {
      name,
      description: description || null,
      priceCents: Math.round(price * 100),
      imageUrl,
    },
  });

  revalidateSupplyPaths();
  return { status: "success", message: "Article ajouté au catalogue." };
}

export async function updateSupplyProduct(
  _prevState: SupplyProductFormState,
  formData: FormData,
): Promise<SupplyProductFormState> {
  if (!(await requireAdmin())) return { status: "error", message: "Accès non autorisé." };

  const productId = formData.get("productId") as string;
  const product = await prisma.supplyProduct.findUnique({ where: { id: productId } });
  if (!product) return { status: "error", message: "Article introuvable." };

  const parsed = supplyProductSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const imageUrlInput = formData.get("imageUrl");
  const imageUrl = typeof imageUrlInput === "string" && imageUrlInput ? imageUrlInput : product.imageUrl;

  const { name, description, price } = parsed.data;
  await prisma.supplyProduct.update({
    where: { id: productId },
    data: {
      name,
      description: description || null,
      priceCents: Math.round(price * 100),
      imageUrl,
    },
  });

  revalidateSupplyPaths();
  return { status: "success", message: "Article mis à jour." };
}

export async function toggleSupplyProductActive(productId: string) {
  if (!(await requireAdmin())) return;
  const product = await prisma.supplyProduct.findUnique({ where: { id: productId } });
  if (!product) return;

  await prisma.supplyProduct.update({ where: { id: productId }, data: { active: !product.active } });
  revalidateSupplyPaths();
}

export async function deleteSupplyProduct(productId: string) {
  if (!(await requireAdmin())) return;
  const product = await prisma.supplyProduct.findUnique({ where: { id: productId } });
  if (!product) return;

  const usedInOrder = await prisma.supplyOrderItem.findFirst({ where: { productId } });
  if (usedInOrder) {
    await prisma.supplyProduct.update({ where: { id: productId }, data: { active: false } });
  } else {
    await prisma.supplyProduct.delete({ where: { id: productId } });
  }

  revalidateSupplyPaths();
}

export async function updateSupplyOrderStatus(orderId: string, status: SupplyOrderStatus) {
  if (!(await requireAdmin())) return;
  await prisma.supplyOrder.update({ where: { id: orderId }, data: { status } });
  revalidateSupplyPaths();
}

export type SupplyOrderFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createSupplyOrder(
  _prevState: SupplyOrderFormState,
  formData: FormData,
): Promise<SupplyOrderFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLUB") {
    return { status: "error", message: "Accès non autorisé." };
  }

  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") {
    return { status: "error", message: "Accès non autorisé." };
  }

  const requestedItems: { productId: string; quantity: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const quantity = Math.floor(Number(value));
    if (Number.isFinite(quantity) && quantity > 0) {
      requestedItems.push({ productId: key.slice(4), quantity });
    }
  }

  if (requestedItems.length === 0) {
    return { status: "error", message: "Sélectionnez au moins un article." };
  }

  const products = await prisma.supplyProduct.findMany({
    where: { id: { in: requestedItems.map((item) => item.productId) }, active: true },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const orderItemsData = requestedItems
    .filter((item) => productById.has(item.productId))
    .map((item) => {
      const product = productById.get(item.productId)!;
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
      };
    });

  if (orderItemsData.length === 0) {
    return { status: "error", message: "Les articles sélectionnés ne sont plus disponibles." };
  }

  const note = ((formData.get("note") as string) ?? "").trim() || null;

  await prisma.supplyOrder.create({
    data: {
      clubId: club.id,
      note,
      items: { create: orderItemsData },
    },
  });

  const totalCents = orderItemsData.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const itemsList = orderItemsData
    .map((item) => `<li>${item.quantity} × ${item.productName} — ${formatPrice(item.unitPriceCents * item.quantity)}</li>`)
    .join("");

  await notifyAdmin({
    subject: `Nouvelle demande de commande — ${club.name}`,
    html: `
      <p>Le club <strong>${club.name}</strong> vient de passer une demande de commande sur la boutique fournisseur.</p>
      <ul>
        <li><strong>Total :</strong> ${formatPrice(totalCents)}</li>
      </ul>
      <p><strong>Articles :</strong></p>
      <ul>${itemsList}</ul>
      ${note ? `<p><strong>Note du club :</strong> ${note}</p>` : ""}
      <p>Connectez-vous à l&apos;espace admin pour traiter cette demande.</p>
    `,
  });

  revalidateSupplyPaths();
  return {
    status: "success",
    message: "Votre demande de commande a bien été envoyée à l'administrateur.",
  };
}
