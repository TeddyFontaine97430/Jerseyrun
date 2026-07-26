import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { notifyAdmin, sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/money";
import { decodeSelectedOptions } from "@/lib/productOptions";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const orderId = checkoutSession.metadata?.orderId;

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { club: true } } },
      });

      if (order && order.status === "PENDING") {
        const shipping = checkoutSession.collected_information?.shipping_details;
        const customerDetails = checkoutSession.customer_details;
        const customerName = shipping?.name ?? customerDetails?.name ?? undefined;

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
            data: {
              status: "PAID",
              customerName,
              customerPhone: customerDetails?.phone ?? undefined,
              shippingLine1: shipping?.address?.line1 ?? customerDetails?.address?.line1 ?? undefined,
              shippingLine2: shipping?.address?.line2 ?? customerDetails?.address?.line2 ?? undefined,
              shippingCity: shipping?.address?.city ?? customerDetails?.address?.city ?? undefined,
              shippingPostalCode:
                shipping?.address?.postal_code ?? customerDetails?.address?.postal_code ?? undefined,
              shippingCountry: shipping?.address?.country ?? customerDetails?.address?.country ?? undefined,
            },
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

        const deliveryLabel =
          order.deliveryMethod === "PICKUP"
            ? "Retrait au club"
            : `Livraison à domicile${order.deliveryFeeCents > 0 ? ` (${formatPrice(order.deliveryFeeCents)})` : ""}`;

        const shippingLine1 = shipping?.address?.line1 ?? customerDetails?.address?.line1 ?? "";
        const shippingLine2 = shipping?.address?.line2 ?? customerDetails?.address?.line2 ?? "";
        const shippingCity = shipping?.address?.city ?? customerDetails?.address?.city ?? "";
        const shippingPostalCode = shipping?.address?.postal_code ?? customerDetails?.address?.postal_code ?? "";
        const shippingCountry = shipping?.address?.country ?? customerDetails?.address?.country ?? "";
        const customerPhone = customerDetails?.phone ?? "";

        const shippingAddressHtml =
          order.deliveryMethod === "DELIVERY"
            ? `
              <p><strong>Adresse de livraison :</strong><br>
              ${customerName ?? ""}<br>
              ${shippingLine1}${shippingLine2 ? `<br>${shippingLine2}` : ""}<br>
              ${[shippingPostalCode, shippingCity].filter(Boolean).join(" ")}<br>
              ${shippingCountry}${customerPhone ? `<br>Tél : ${customerPhone}` : ""}</p>
            `
            : "";

        await notifyAdmin({
          subject: `Nouvelle vente — ${formatPrice(order.totalCents)}`,
          html: `
            <p>Une nouvelle commande vient d'être payée sur Jersey Run.</p>
            <ul>
              <li><strong>Client :</strong> ${customerName ?? "N/A"}</li>
              <li><strong>Livraison :</strong> ${deliveryLabel}</li>
              <li><strong>Total :</strong> ${formatPrice(order.totalCents)}</li>
            </ul>
            <p><strong>Articles :</strong></p>
            <ul>${itemsList}</ul>
          `,
        });

        const itemsByClub = new Map<string, { email: string; name: string; items: typeof order.items }>();
        for (const item of order.items) {
          const existing = itemsByClub.get(item.clubId);
          if (existing) {
            existing.items.push(item);
          } else {
            itemsByClub.set(item.clubId, { email: item.club.email, name: item.club.name, items: [item] });
          }
        }

        for (const { email, items } of itemsByClub.values()) {
          const clubItemsList = items
            .map(
              (item) =>
                `<li>${item.quantity} × ${item.productName}${
                  item.personalizationText ? ` (Personnalisé : ${item.personalizationText})` : ""
                } — ${formatPrice(item.unitPriceCents * item.quantity)}</li>`,
            )
            .join("");
          const clubTotal = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

          await sendEmail({
            to: email,
            subject: `Nouvelle vente sur votre boutique — ${formatPrice(clubTotal)}`,
            html: `
              <p>Bonjour,</p>
              <p>Vous venez de réaliser une nouvelle vente sur votre boutique Jersey Run !</p>
              <ul>
                <li><strong>Client :</strong> ${customerName ?? "N/A"}</li>
                <li><strong>Livraison :</strong> ${deliveryLabel}</li>
                <li><strong>Total pour votre boutique :</strong> ${formatPrice(clubTotal)}</li>
              </ul>
              <p><strong>Articles :</strong></p>
              <ul>${clubItemsList}</ul>
              ${shippingAddressHtml}
              <p>Connectez-vous à votre espace club pour suivre cette commande.</p>
            `,
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
