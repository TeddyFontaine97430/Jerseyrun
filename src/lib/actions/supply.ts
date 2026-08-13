"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { notifyAdmin, sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/money";
import type { SupplyOrderStatus } from "@prisma/client";

const supplyProductSchema = z.object({
  name: z.string().min(2, "Le nom est requis."),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Le prix doit être supérieur à 0."),
  sizes: z.string().optional(),
  personalizationEnabled: z.union([z.literal("on"), z.null()]).optional(),
  clubId: z.string().min(1, "Choisissez un club (ou « Tous les clubs »)."),
});

const GENERIC_CLUB_VALUE = "__all__";

function parseSizes(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const value = part.trim();
    if (value) seen.add(value);
  }
  return Array.from(seen);
}

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
    sizes: formData.get("sizes"),
    personalizationEnabled: formData.get("personalizationEnabled"),
    clubId: formData.get("clubId"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const imageUrlInput = formData.get("imageUrl");
  const imageUrl = typeof imageUrlInput === "string" && imageUrlInput ? imageUrlInput : null;

  const { name, description, price, sizes, personalizationEnabled, clubId: clubIdRaw } = parsed.data;
  const clubId = clubIdRaw === GENERIC_CLUB_VALUE ? null : clubIdRaw;
  if (clubId) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return { status: "error", message: "Club introuvable." };
  }

  await prisma.supplyProduct.create({
    data: {
      name,
      description: description || null,
      priceCents: Math.round(price * 100),
      imageUrl,
      sizes: parseSizes(sizes),
      personalizationEnabled: personalizationEnabled === "on",
      clubId,
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
    sizes: formData.get("sizes"),
    personalizationEnabled: formData.get("personalizationEnabled"),
    clubId: formData.get("clubId"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const imageUrlInput = formData.get("imageUrl");
  const imageUrl = typeof imageUrlInput === "string" && imageUrlInput ? imageUrlInput : product.imageUrl;

  const { name, description, price, sizes, personalizationEnabled, clubId: clubIdRaw } = parsed.data;
  const clubId = clubIdRaw === GENERIC_CLUB_VALUE ? null : clubIdRaw;
  if (clubId) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return { status: "error", message: "Club introuvable." };
  }

  await prisma.supplyProduct.update({
    where: { id: productId },
    data: {
      name,
      description: description || null,
      priceCents: Math.round(price * 100),
      imageUrl,
      sizes: parseSizes(sizes),
      personalizationEnabled: personalizationEnabled === "on",
      clubId,
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

type ParsedLine = {
  productId: string;
  size: string;
  quantity: number;
  text: string;
};

function parseOrderLines(formData: FormData): ParsedLine[] {
  const ids = new Set<string>();
  for (const key of formData.keys()) {
    const match = /^line_(.+)_productId$/.exec(key);
    if (match) ids.add(match[1]);
  }

  const lines: ParsedLine[] = [];
  for (const id of ids) {
    const productId = (formData.get(`line_${id}_productId`) as string) ?? "";
    const size = ((formData.get(`line_${id}_size`) as string) ?? "").trim();
    const text = ((formData.get(`line_${id}_text`) as string) ?? "").trim();
    const quantity = Math.floor(Number(formData.get(`line_${id}_qty`)));
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) continue;
    lines.push({ productId, size, quantity, text });
  }
  return lines;
}

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

  const lines = parseOrderLines(formData);
  if (lines.length === 0) {
    return { status: "error", message: "Sélectionnez au moins un article." };
  }

  const products = await prisma.supplyProduct.findMany({
    where: {
      id: { in: lines.map((line) => line.productId) },
      active: true,
      OR: [{ clubId: null }, { clubId: club.id }],
    },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const orderItemsData: {
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    size: string | null;
    personalizationText: string | null;
  }[] = [];

  for (const line of lines) {
    const product = productById.get(line.productId);
    if (!product) continue;

    if (product.sizes.length > 0 && !product.sizes.includes(line.size)) continue;
    if (product.personalizationEnabled && !line.text) continue;

    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      quantity: line.quantity,
      unitPriceCents: product.priceCents,
      size: product.sizes.length > 0 ? line.size : null,
      personalizationText: product.personalizationEnabled ? line.text : null,
    });
  }

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
    .map((item) => {
      const details = [item.size ? `taille ${item.size}` : null, item.personalizationText].filter(Boolean).join(" — ");
      return `<li>${item.quantity} × ${item.productName}${details ? ` (${details})` : ""} — ${formatPrice(item.unitPriceCents * item.quantity)}</li>`;
    })
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

export type SendToSupplierResult = { status: "success" | "error"; message: string };

export async function sendSupplyOrderGroupToSupplier(
  orderId: string,
  productId: string,
  supplierId: string,
): Promise<SendToSupplierResult> {
  if (!(await requireAdmin())) return { status: "error", message: "Accès non autorisé." };

  const [order, supplier] = await Promise.all([
    prisma.supplyOrder.findUnique({
      where: { id: orderId },
      include: { club: true, items: { where: { productId } } },
    }),
    prisma.supplier.findUnique({ where: { id: supplierId } }),
  ]);

  if (!order) return { status: "error", message: "Commande introuvable." };
  if (!supplier) return { status: "error", message: "Fournisseur introuvable." };
  if (order.items.length === 0) return { status: "error", message: "Aucune ligne à envoyer pour cet article." };

  const productName = order.items[0].productName;
  const itemsList = order.items
    .map((item) => {
      const details = [item.size ? `taille ${item.size}` : null, item.personalizationText].filter(Boolean).join(" — ");
      return `<li>${item.quantity} × ${item.productName}${details ? ` (${details})` : ""}</li>`;
    })
    .join("");

  await sendEmail({
    to: supplier.email,
    subject: `Commande à préparer — ${order.club.name} — ${productName}`,
    html: `
      <p>Nouvelle commande pour le club <strong>${order.club.name}</strong> (Jersey Run).</p>
      <ul>${itemsList}</ul>
      ${order.note ? `<p><strong>Remarque du club :</strong> ${order.note}</p>` : ""}
      <p>Merci de confirmer la prise en charge de cette commande.</p>
    `,
  });

  await prisma.supplyOrderItem.updateMany({
    where: { orderId, productId },
    data: { supplierId, sentToSupplierAt: new Date() },
  });

  revalidateSupplyPaths();
  return { status: "success", message: `Envoyé à ${supplier.name}.` };
}
