import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { notifyAdmin, sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/money";
import { formatSelectedOptions, decodeSelectedOptions } from "@/lib/productOptions";
import {
  computeClubDeliveryFeeCents,
  deliveryZoneLabel,
  isDeliveryZoneAvailable,
  shippingCountryForZone,
  type DeliveryZone,
} from "@/lib/delivery";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedPaymentMethod = body?.paymentMethod === "ON_SITE" ? "ON_SITE" : "STRIPE";

  const requestedDeliveryMethod: DeliveryZone =
    body?.deliveryMethod === "DELIVERY_METROPOLE" || body?.deliveryMethod === "DELIVERY_REUNION"
      ? body.deliveryMethod
      : "PICKUP";

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { club: true, options: { include: { values: true } } } } },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Votre panier est vide." }, { status: 400 });
  }

  const distinctClubIds = new Set(cartItems.map((item) => item.product.clubId));
  if (distinctClubIds.size > 1) {
    return NextResponse.json(
      {
        error:
          "Une commande ne peut concerner qu'un seul club à la fois. Merci de commander séparément pour chaque club.",
      },
      { status: 400 },
    );
  }

  const club = cartItems[0].product.club;
  const stripeReady = Boolean(club.stripeAccountId && club.stripePayoutsEnabled);

  const deliveryMethod = requestedDeliveryMethod;
  if (!isDeliveryZoneAvailable(deliveryMethod, club, stripeReady)) {
    return NextResponse.json(
      { error: `"${club.name}" ne propose pas ce mode de livraison pour le moment.` },
      { status: 400 },
    );
  }

  let shippingLine1: string | undefined;
  let shippingLine2: string | undefined;
  let shippingCity: string | undefined;
  let shippingPostalCode: string | undefined;
  let shippingCountry: string | undefined;

  if (deliveryMethod !== "PICKUP") {
    shippingLine1 = typeof body?.shippingLine1 === "string" ? body.shippingLine1.trim() : "";
    shippingLine2 = typeof body?.shippingLine2 === "string" ? body.shippingLine2.trim() : "";
    shippingCity = typeof body?.shippingCity === "string" ? body.shippingCity.trim() : "";
    shippingPostalCode = typeof body?.shippingPostalCode === "string" ? body.shippingPostalCode.trim() : "";
    shippingCountry = shippingCountryForZone(deliveryMethod) ?? undefined;

    if (!shippingLine1 || !shippingCity || !shippingPostalCode) {
      return NextResponse.json(
        { error: "Merci de renseigner votre adresse de livraison complète." },
        { status: 400 },
      );
    }
  }

  // Seul le retrait au club peut être réglé sur place ; la livraison (métropole ou
  // Réunion) doit obligatoirement être payée en ligne avant expédition. Un club sans
  // compte Stripe connecté ne peut de toute façon pas encaisser en ligne : le paiement
  // sur place devient alors automatiquement le seul mode disponible pour le retrait.
  const paymentMethod =
    deliveryMethod !== "PICKUP" ? "STRIPE" : stripeReady ? requestedPaymentMethod : "ON_SITE";

  if (paymentMethod === "ON_SITE") {
    if (stripeReady && !club.allowPayOnSite) {
      return NextResponse.json(
        { error: `"${club.name}" n'accepte pas le paiement sur place pour le moment.` },
        { status: 400 },
      );
    }
  } else if (!stripeConfigured) {
    return NextResponse.json(
      { error: "Le paiement en ligne n'est pas encore configuré (clés Stripe manquantes)." },
      { status: 503 },
    );
  }

  for (const item of cartItems) {
    if (!item.product.active) {
      return NextResponse.json(
        { error: `"${item.product.name}" n'est plus disponible.` },
        { status: 400 },
      );
    }
    if (!item.product.club.active) {
      return NextResponse.json(
        { error: `La boutique "${item.product.club.name}" est actuellement fermée.` },
        { status: 400 },
      );
    }

    const selections = decodeSelectedOptions(item.selectedOptions);
    if (selections.length > 0) {
      let available = Infinity;
      for (const sel of selections) {
        const option = item.product.options.find((o) => o.name === sel.name);
        const optionValue = option?.values.find((v) => v.value === sel.value);
        available = Math.min(available, optionValue?.stock ?? 0);
      }
      if (available < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour "${item.product.name}".` },
          { status: 400 },
        );
      }
    }
  }

  const unitPriceFor = (item: (typeof cartItems)[number]) =>
    item.product.priceCents + (item.personalizationText ? item.product.personalizationFeeCents : 0);

  const itemsTotalCents = cartItems.reduce((sum, item) => sum + unitPriceFor(item) * item.quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFeeCents = computeClubDeliveryFeeCents(deliveryMethod, club, itemCount);
  const totalCents = itemsTotalCents + deliveryFeeCents;

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
      totalCents,
      deliveryMethod,
      deliveryFeeCents,
      paymentMethod,
      customerName: paymentMethod === "ON_SITE" ? session.user.name ?? undefined : undefined,
      shippingLine1,
      shippingLine2: shippingLine2 || undefined,
      shippingCity,
      shippingPostalCode,
      shippingCountry,
      items: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          clubId: item.product.clubId,
          quantity: item.quantity,
          unitPriceCents: unitPriceFor(item),
          productName: item.product.name,
          selectedOptions: item.selectedOptions,
          personalizationText: item.personalizationText,
        })),
      },
    },
  });

  await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const deliveryLabel = deliveryZoneLabel(deliveryMethod);
  const shippingAddressHtml =
    deliveryMethod !== "PICKUP"
      ? `<p><strong>Adresse de livraison :</strong><br>
          ${shippingLine1}${shippingLine2 ? `<br>${shippingLine2}` : ""}<br>
          ${[shippingPostalCode, shippingCity].filter(Boolean).join(" ")}<br>
          ${shippingCountry ?? ""}</p>`
      : "";

  if (paymentMethod === "ON_SITE") {
    const itemsList = cartItems
      .map(
        (item) =>
          `<li>${item.quantity} × ${item.product.name}${
            item.personalizationText ? ` (Personnalisé : ${item.personalizationText})` : ""
          } — ${formatPrice(unitPriceFor(item) * item.quantity)}</li>`,
      )
      .join("");

    await notifyAdmin({
      subject: `Nouvelle commande à régler sur place — ${formatPrice(order.totalCents)}`,
      html: `
        <p>Une nouvelle commande à régler sur place vient d'être passée sur Jersey Run.</p>
        <ul>
          <li><strong>Client :</strong> ${session.user.name ?? session.user.email}</li>
          <li><strong>Club :</strong> ${club.name}</li>
          <li><strong>Livraison :</strong> ${deliveryLabel}</li>
          <li><strong>Total :</strong> ${formatPrice(order.totalCents)}</li>
        </ul>
        <p><strong>Articles :</strong></p>
        <ul>${itemsList}</ul>
        ${shippingAddressHtml}
      `,
    });

    await sendEmail({
      to: club.email,
      subject: `Nouvelle commande à régler sur place — ${formatPrice(order.totalCents)}`,
      html: `
        <p>Bonjour,</p>
        <p>Un client a passé une commande sur votre boutique Jersey Run avec paiement sur place.</p>
        <ul>
          <li><strong>Client :</strong> ${session.user.name ?? session.user.email}</li>
          <li><strong>Livraison :</strong> ${deliveryLabel}</li>
          <li><strong>Total à encaisser au retrait :</strong> ${formatPrice(order.totalCents)}</li>
        </ul>
        <p><strong>Articles :</strong></p>
        <ul>${itemsList}</ul>
        ${shippingAddressHtml}
        <p>Connectez-vous à votre espace club pour marquer la commande comme payée une fois le règlement reçu.</p>
      `,
    });

    return NextResponse.json({ url: `${baseUrl}/commande/succes?method=onsite` });
  }

  const lineItems = cartItems.map((item) => {
    const optionsLabel = formatSelectedOptions(item.selectedOptions);
    const personalizationLabel = item.personalizationText ? `Personnalisé : ${item.personalizationText}` : null;
    const details = [optionsLabel, personalizationLabel].filter(Boolean).join(", ");
    return {
      quantity: item.quantity,
      price_data: {
        currency: "eur",
        unit_amount: unitPriceFor(item),
        product_data: {
          name: `${item.product.name}${details ? ` (${details})` : ""} — ${item.product.club.name}`,
        },
      },
    };
  });

  if (deliveryFeeCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: deliveryFeeCents,
        product_data: { name: deliveryLabel },
      },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: lineItems,
    phone_number_collection: { enabled: true },
    payment_intent_data: {
      transfer_data: { destination: club.stripeAccountId! },
    },
    metadata: { orderId: order.id, deliveryMethod },
    success_url: `${baseUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/panier`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
