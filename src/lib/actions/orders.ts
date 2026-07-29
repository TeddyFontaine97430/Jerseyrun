"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { notifyAdmin, sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/money";
import { decodeSelectedOptions } from "@/lib/productOptions";
import { getNextInvoiceNumber, generateInvoicePdf } from "@/lib/invoice";

export async function toggleOrderItemDelivered(orderItemId: string) {
  const session = await auth();
  if (!session?.user) return;

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) return;

  if (session.user.role === "CLUB") {
    const club = await getClubForUser(session.user.id);
    if (!club || club.id !== item.clubId) return;
  } else if (session.user.role !== "ADMIN") {
    return;
  }

  await prisma.orderItem.update({ where: { id: orderItemId }, data: { delivered: !item.delivered } });

  revalidatePath("/club/dashboard");
  revalidatePath(`/admin/clubs/${item.clubId}`);
  revalidatePath("/admin/ventes");
}

export type MarkOrderPaidState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function markOrderPaidOnSite(orderId: string): Promise<MarkOrderPaidState> {
  const session = await auth();
  if (!session?.user) return { status: "error", message: "Accès non autorisé." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { club: true } }, user: true },
  });
  if (!order) return { status: "error", message: "Commande introuvable." };

  if (session.user.role === "CLUB") {
    const club = await getClubForUser(session.user.id);
    if (!club || !order.items.some((item) => item.clubId === club.id)) {
      return { status: "error", message: "Accès non autorisé." };
    }
  } else if (session.user.role !== "ADMIN") {
    return { status: "error", message: "Accès non autorisé." };
  }

  if (order.paymentMethod !== "ON_SITE" || order.status !== "PENDING") {
    return { status: "error", message: "Cette commande n'est pas en attente de paiement sur place." };
  }

  const invoiceNumber = await getNextInvoiceNumber();
  const invoicedAt = new Date();

  const stockUpdates: Prisma.PrismaPromise<unknown>[] = [];
  for (const item of order.items) {
    const selections = decodeSelectedOptions(item.selectedOptions);
    for (const sel of selections) {
      stockUpdates.push(
        prisma.productOptionValue.updateMany({
          where: { value: sel.value, option: { name: sel.name, productId: item.productId } },
          data: { stock: { decrement: item.quantity } },
        }),
      );
    }
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID", invoiceNumber, invoicedAt },
    }),
    ...stockUpdates,
  ]);

  const itemsList = order.items
    .map(
      (item) =>
        `<li>${item.quantity} × ${item.productName}${
          item.personalizationText ? ` (Personnalisé : ${item.personalizationText})` : ""
        } — ${formatPrice(item.unitPriceCents * item.quantity)}</li>`,
    )
    .join("");

  const customerName = order.customerName ?? order.user.name ?? undefined;

  await notifyAdmin({
    subject: `Nouvelle vente (paiement sur place) — ${formatPrice(order.totalCents)}`,
    html: `
      <p>Une commande à régler sur place vient d'être marquée comme payée.</p>
      <ul>
        <li><strong>Client :</strong> ${customerName ?? "N/A"}</li>
        <li><strong>Total :</strong> ${formatPrice(order.totalCents)}</li>
      </ul>
      <p><strong>Articles :</strong></p>
      <ul>${itemsList}</ul>
    `,
  });

  const sellerClub = order.items[0].club;

  const invoicePdf = await generateInvoicePdf({
    invoiceNumber,
    invoiceDate: invoicedAt,
    sellerName: sellerClub.name,
    sellerPhone: sellerClub.phone,
    sellerEmail: sellerClub.email,
    customerName: customerName ?? null,
    customerEmail: order.user.email,
    customerPhone: order.customerPhone,
    deliveryMethod: order.deliveryMethod,
    deliveryFeeCents: order.deliveryFeeCents,
    shippingLine1: null,
    shippingLine2: null,
    shippingCity: null,
    shippingPostalCode: null,
    shippingCountry: null,
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      selectedOptions: item.selectedOptions,
      personalizationText: item.personalizationText,
    })),
    totalCents: order.totalCents,
  });

  await sendEmail({
    to: order.user.email,
    subject: `Votre commande Jersey Run — Facture N° ${invoiceNumber}`,
    html: `
      <p>Bonjour${customerName ? ` ${customerName}` : ""},</p>
      <p>Merci pour votre commande sur Jersey Run ! Votre paiement sur place a bien été enregistré.</p>
      <ul>
        <li><strong>Livraison :</strong> Retrait au club</li>
        <li><strong>Total :</strong> ${formatPrice(order.totalCents)}</li>
      </ul>
      <p><strong>Articles :</strong></p>
      <ul>${itemsList}</ul>
      <p>Vous trouverez votre facture N° ${invoiceNumber} en pièce jointe de cet email.</p>
      <p>À bientôt sur Jersey Run !</p>
    `,
    attachments: [{ filename: `facture-${invoiceNumber}.pdf`, content: invoicePdf }],
  });

  revalidatePath("/club/dashboard");
  revalidatePath(`/admin/clubs/${sellerClub.id}`);
  revalidatePath("/admin/ventes");

  return { status: "success", message: "Commande marquée comme payée." };
}
