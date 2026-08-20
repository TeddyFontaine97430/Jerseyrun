"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, OrderStatus, ManualPaymentMethod } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { notifyAdmin, sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/money";
import { decodeSelectedOptions, encodeSelectedOptions } from "@/lib/productOptions";
import { getNextInvoiceNumber, generateInvoicePdf } from "@/lib/invoice";
import { MANUAL_PAYMENT_METHOD_LABELS, ORDER_STATUS_LABELS } from "@/lib/orderStatus";

function revalidateOrderPaths(orderId: string, clubId: string) {
  revalidatePath("/club/dashboard");
  revalidatePath(`/club/dashboard/commandes/${orderId}`);
  revalidatePath(`/admin/clubs/${clubId}`);
  revalidatePath("/admin/ventes");
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath("/compte");
}

async function getOrderForManage(orderId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Accès non autorisé." as const };

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { error: "Commande introuvable." as const };
  if (order.status === "CANCELLED") return { error: "Cette commande est annulée et ne peut plus être modifiée." as const };

  if (session.user.role === "ADMIN") return { order };

  if (session.user.role === "CLUB") {
    const club = await getClubForUser(session.user.id);
    if (!club || !order.items.some((item) => item.clubId === club.id)) {
      return { error: "Accès non autorisé." as const };
    }
    return { order };
  }

  return { error: "Accès non autorisé." as const };
}

async function recalcOrderTotal(tx: Prisma.TransactionClient, orderId: string) {
  const [items, order] = await Promise.all([
    tx.orderItem.findMany({ where: { orderId } }),
    tx.order.findUniqueOrThrow({ where: { id: orderId } }),
  ]);
  const itemsTotal = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  await tx.order.update({ where: { id: orderId }, data: { totalCents: itemsTotal + order.deliveryFeeCents } });
}

export type OrderEditState = { status: "idle" | "success" | "error"; message?: string };

export async function updateOrderItemQuantity(orderItemId: string, quantity: number): Promise<OrderEditState> {
  if (!Number.isFinite(quantity) || quantity < 1) {
    return { status: "error", message: "Quantité invalide." };
  }

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) return { status: "error", message: "Article introuvable." };

  const access = await getOrderForManage(item.orderId);
  if ("error" in access) return { status: "error", message: access.error };

  const delta = quantity - item.quantity;
  const selections = decodeSelectedOptions(item.selectedOptions);

  if (delta > 0 && selections.length > 0) {
    for (const sel of selections) {
      const optionValue = await prisma.productOptionValue.findFirst({
        where: { value: sel.value, option: { name: sel.name, productId: item.productId } },
      });
      if (!optionValue || optionValue.stock < delta) {
        return { status: "error", message: `Stock insuffisant pour augmenter la quantité de "${item.productName}".` };
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.update({ where: { id: orderItemId }, data: { quantity } });
    if (delta !== 0 && selections.length > 0) {
      for (const sel of selections) {
        await tx.productOptionValue.updateMany({
          where: { value: sel.value, option: { name: sel.name, productId: item.productId } },
          data: { stock: { decrement: delta } },
        });
      }
    }
    await recalcOrderTotal(tx, item.orderId);
  });

  revalidateOrderPaths(item.orderId, item.clubId);
  return { status: "success", message: "Quantité mise à jour." };
}

export async function removeOrderItem(orderItemId: string): Promise<OrderEditState> {
  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) return { status: "error", message: "Article introuvable." };

  const access = await getOrderForManage(item.orderId);
  if ("error" in access) return { status: "error", message: access.error };

  const itemCount = await prisma.orderItem.count({ where: { orderId: item.orderId } });
  if (itemCount <= 1) {
    return {
      status: "error",
      message: "Impossible de retirer le dernier article d'une commande : annulez-la plutôt.",
    };
  }

  const selections = decodeSelectedOptions(item.selectedOptions);

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.delete({ where: { id: orderItemId } });
    for (const sel of selections) {
      await tx.productOptionValue.updateMany({
        where: { value: sel.value, option: { name: sel.name, productId: item.productId } },
        data: { stock: { increment: item.quantity } },
      });
    }
    await recalcOrderTotal(tx, item.orderId);
  });

  revalidateOrderPaths(item.orderId, item.clubId);
  return { status: "success", message: "Article retiré de la commande." };
}

export async function addOrderItem(
  _prevState: OrderEditState,
  formData: FormData,
): Promise<OrderEditState> {
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string" || !orderId) return { status: "error", message: "Commande introuvable." };

  const access = await getOrderForManage(orderId);
  if ("error" in access) return { status: "error", message: access.error };
  const { order } = access;

  const clubId = order.items[0]?.clubId;
  if (!clubId) return { status: "error", message: "Commande invalide." };

  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) {
    return { status: "error", message: "Sélectionnez un article." };
  }

  const quantityRaw = Number(formData.get("quantity"));
  const quantity = Number.isFinite(quantityRaw) ? Math.floor(quantityRaw) : 0;
  if (quantity < 1) return { status: "error", message: "La quantité doit être d'au moins 1." };

  const personalizationText = ((formData.get("personalizationText") as string) ?? "").trim() || null;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { options: { include: { values: true } } },
  });
  if (!product || product.clubId !== clubId) {
    return { status: "error", message: "Article introuvable." };
  }

  const selections: { name: string; value: string }[] = [];
  for (const option of product.options) {
    const chosen = formData.get(`option_${option.id}`);
    if (typeof chosen !== "string" || !chosen) {
      return { status: "error", message: `Choisissez une valeur pour "${option.name}".` };
    }
    const optionValue = option.values.find((v) => v.value === chosen);
    if (!optionValue) return { status: "error", message: `Valeur invalide pour "${option.name}".` };
    if (optionValue.stock < quantity) {
      return { status: "error", message: `Stock insuffisant pour "${product.name}" (${option.name} : ${chosen}).` };
    }
    selections.push({ name: option.name, value: chosen });
  }

  const unitPriceCents = product.priceCents + (personalizationText ? product.personalizationFeeCents : 0);
  const selectedOptions = encodeSelectedOptions(selections);

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.create({
      data: {
        orderId,
        productId: product.id,
        clubId,
        quantity,
        unitPriceCents,
        productName: product.name,
        selectedOptions,
        personalizationText,
      },
    });
    for (const sel of selections) {
      await tx.productOptionValue.updateMany({
        where: { value: sel.value, option: { name: sel.name, productId: product.id } },
        data: { stock: { decrement: quantity } },
      });
    }
    await recalcOrderTotal(tx, orderId);
  });

  revalidateOrderPaths(orderId, clubId);
  return { status: "success", message: "Article ajouté à la commande." };
}

export async function toggleOrderItemDelivered(orderItemId: string) {
  const session = await auth();
  if (!session?.user) return;

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: { include: { items: true } } },
  });
  if (!item) return;

  if (session.user.role === "CLUB") {
    const club = await getClubForUser(session.user.id);
    if (!club || club.id !== item.clubId) return;
  } else if (session.user.role !== "ADMIN") {
    return;
  }

  const newDelivered = !item.delivered;
  await prisma.orderItem.update({ where: { id: orderItemId }, data: { delivered: newDelivered } });

  // Une fois que tous les articles d'une commande sont marqués livrés, on fait passer
  // son état à "Livrée" pour qu'il reste cohérent avec les cases cochées individuellement.
  if (newDelivered && item.order.status !== "CANCELLED") {
    const allDelivered = item.order.items.every((i) => (i.id === orderItemId ? true : i.delivered));
    if (allDelivered) {
      await prisma.order.update({ where: { id: item.orderId }, data: { status: "COMPLETED" } });
    }
  }

  revalidatePath("/club/dashboard");
  revalidatePath(`/admin/clubs/${item.clubId}`);
  revalidatePath("/admin/ventes");
}

export async function toggleOrderItemReadyForPickup(orderItemId: string) {
  const session = await auth();
  if (!session?.user) return;

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: { include: { user: true } }, club: true },
  });
  if (!item) return;

  if (session.user.role === "CLUB") {
    const club = await getClubForUser(session.user.id);
    if (!club || club.id !== item.clubId) return;
  } else if (session.user.role !== "ADMIN") {
    return;
  }

  const newValue = !item.readyForPickup;
  await prisma.orderItem.update({ where: { id: orderItemId }, data: { readyForPickup: newValue } });

  if (newValue) {
    const customerEmail = item.order.user?.email ?? item.order.customerEmail;
    if (customerEmail) {
      const customerName = item.order.customerName ?? item.order.user?.name ?? undefined;
      await sendEmail({
        to: customerEmail,
        subject: `Votre commande chez ${item.club.name} est prête à être récupérée`,
        html: `
          <p>Bonjour${customerName ? ` ${customerName}` : ""},</p>
          <p>Bonne nouvelle : votre article <strong>${item.quantity} × ${item.productName}</strong> est prêt et vous attend au club <strong>${item.club.name}</strong> !</p>
          <p>Vous pouvez venir le récupérer dès que possible.</p>
          <p>À bientôt sur Jersey Run !</p>
        `,
      });
    }
  }

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

  if (!order.user) {
    return { status: "error", message: "Cette commande n'a pas de client associé." };
  }
  const orderUser = order.user;

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

  const customerName = order.customerName ?? orderUser.name ?? undefined;

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
    customerEmail: orderUser.email,
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
    to: orderUser.email,
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

export type ManualOrderState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createManualOrder(
  _prevState: ManualOrderState,
  formData: FormData,
): Promise<ManualOrderState> {
  const session = await auth();
  if (!session?.user) return { status: "error", message: "Accès non autorisé." };

  let club;
  if (session.user.role === "CLUB") {
    club = await getClubForUser(session.user.id);
    if (!club || club.status !== "APPROVED") return { status: "error", message: "Accès non autorisé." };
  } else if (session.user.role === "ADMIN") {
    const clubId = formData.get("clubId");
    if (typeof clubId !== "string" || !clubId) return { status: "error", message: "Accès non autorisé." };
    club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return { status: "error", message: "Club introuvable." };
  } else {
    return { status: "error", message: "Accès non autorisé." };
  }

  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) {
    return { status: "error", message: "Sélectionnez un article." };
  }

  const quantityRaw = Number(formData.get("quantity"));
  const quantity = Number.isFinite(quantityRaw) ? Math.floor(quantityRaw) : 0;
  if (quantity < 1) return { status: "error", message: "La quantité doit être d'au moins 1." };

  const customerName = ((formData.get("customerName") as string) ?? "").trim();
  if (!customerName) return { status: "error", message: "Le nom du client est requis." };
  const customerEmail = ((formData.get("customerEmail") as string) ?? "").trim() || null;
  const customerPhone = ((formData.get("customerPhone") as string) ?? "").trim() || null;
  const personalizationText = ((formData.get("personalizationText") as string) ?? "").trim() || null;

  const manualPaymentMethod = formData.get("manualPaymentMethod");
  if (
    typeof manualPaymentMethod !== "string" ||
    !["ESPECES", "CARTE", "CHEQUE"].includes(manualPaymentMethod)
  ) {
    return { status: "error", message: "Choisissez le moyen de paiement." };
  }

  const manualStatus = formData.get("manualStatus");
  if (
    typeof manualStatus !== "string" ||
    !["PROCESSING", "PREORDER", "COMPLETED"].includes(manualStatus)
  ) {
    return { status: "error", message: "Choisissez l'état de la commande." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { options: { include: { values: true } } },
  });
  if (!product || product.clubId !== club.id) {
    return { status: "error", message: "Article introuvable." };
  }

  const selections: { name: string; value: string }[] = [];
  for (const option of product.options) {
    const chosen = formData.get(`option_${option.id}`);
    if (typeof chosen !== "string" || !chosen) {
      return { status: "error", message: `Choisissez une valeur pour "${option.name}".` };
    }
    const optionValue = option.values.find((v) => v.value === chosen);
    if (!optionValue) {
      return { status: "error", message: `Valeur invalide pour "${option.name}".` };
    }
    if (optionValue.stock < quantity) {
      return {
        status: "error",
        message: `Stock insuffisant pour "${product.name}" (${option.name} : ${chosen}).`,
      };
    }
    selections.push({ name: option.name, value: chosen });
  }

  const unitPriceCents = product.priceCents + (personalizationText ? product.personalizationFeeCents : 0);
  const totalCents = unitPriceCents * quantity;
  const invoiceNumber = await getNextInvoiceNumber();
  const invoicedAt = new Date();
  const selectedOptions = encodeSelectedOptions(selections);

  const stockUpdates: Prisma.PrismaPromise<unknown>[] = selections.map((sel) =>
    prisma.productOptionValue.updateMany({
      where: { value: sel.value, option: { name: sel.name, productId: product.id } },
      data: { stock: { decrement: quantity } },
    }),
  );

  const [order] = await prisma.$transaction([
    prisma.order.create({
      data: {
        userId: null,
        isManualOrder: true,
        status: manualStatus as OrderStatus,
        totalCents,
        deliveryMethod: "PICKUP",
        paymentMethod: "ON_SITE",
        manualPaymentMethod: manualPaymentMethod as ManualPaymentMethod,
        customerName,
        customerEmail,
        customerPhone,
        invoiceNumber,
        invoicedAt,
        items: {
          create: [
            {
              productId: product.id,
              clubId: club.id,
              quantity,
              unitPriceCents,
              productName: product.name,
              selectedOptions,
              personalizationText,
              delivered: manualStatus === "COMPLETED",
            },
          ],
        },
      },
    }),
    ...stockUpdates,
  ]);

  const details = [
    selections.map((s) => `${s.name} : ${s.value}`).join(", "),
    personalizationText ? `Personnalisé : ${personalizationText}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  await notifyAdmin({
    subject: `Vente manuelle enregistrée par ${club.name} — ${formatPrice(totalCents)}`,
    html: `
      <p>Le club <strong>${club.name}</strong> vient d'enregistrer une vente manuelle (hors site).</p>
      <ul>
        <li><strong>Client :</strong> ${customerName}</li>
        <li><strong>Paiement :</strong> ${MANUAL_PAYMENT_METHOD_LABELS[manualPaymentMethod]}</li>
        <li><strong>État :</strong> ${ORDER_STATUS_LABELS[manualStatus]}</li>
        <li><strong>Article :</strong> ${quantity} × ${product.name}${details ? ` (${details})` : ""}</li>
        <li><strong>Total :</strong> ${formatPrice(totalCents)}</li>
      </ul>
    `,
  });

  if (customerEmail) {
    const invoicePdf = await generateInvoicePdf({
      invoiceNumber,
      invoiceDate: invoicedAt,
      sellerName: club.name,
      sellerPhone: club.phone,
      sellerEmail: club.email,
      customerName,
      customerEmail,
      customerPhone,
      deliveryMethod: "PICKUP",
      deliveryFeeCents: 0,
      shippingLine1: null,
      shippingLine2: null,
      shippingCity: null,
      shippingPostalCode: null,
      shippingCountry: null,
      items: [
        {
          productName: product.name,
          quantity,
          unitPriceCents,
          selectedOptions,
          personalizationText,
        },
      ],
      totalCents,
    });

    await sendEmail({
      to: customerEmail,
      subject: `Votre achat auprès de ${club.name} — Facture N° ${invoiceNumber}`,
      html: `
        <p>Bonjour ${customerName},</p>
        <p>Merci pour votre achat auprès de ${club.name} !</p>
        <ul>
          <li><strong>Article :</strong> ${quantity} × ${product.name}${details ? ` (${details})` : ""}</li>
          <li><strong>Total :</strong> ${formatPrice(totalCents)}</li>
        </ul>
        <p>Vous trouverez votre facture N° ${invoiceNumber} en pièce jointe de cet email.</p>
      `,
      attachments: [{ filename: `facture-${invoiceNumber}.pdf`, content: invoicePdf }],
    });
  }

  revalidatePath("/club/dashboard");
  revalidatePath(`/admin/clubs/${club.id}`);
  revalidatePath("/admin/ventes");

  return { status: "success", message: `Vente enregistrée. Facture N° ${order.invoiceNumber}.` };
}
