import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { formatSelectedOptions, decodeSelectedOptions } from "@/lib/productOptions";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!stripeConfigured) {
    return NextResponse.json(
      { error: "Le paiement en ligne n'est pas encore configuré (clés Stripe manquantes)." },
      { status: 503 },
    );
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { club: true, options: { include: { values: true } } } } },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Votre panier est vide." }, { status: 400 });
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

    let available = item.product.stock;
    const selections = decodeSelectedOptions(item.selectedOptions);
    if (selections.length > 0) {
      available = Infinity;
      for (const sel of selections) {
        const option = item.product.options.find((o) => o.name === sel.name);
        const optionValue = option?.values.find((v) => v.value === sel.value);
        available = Math.min(available, optionValue?.stock ?? 0);
      }
    }
    if (available < item.quantity) {
      return NextResponse.json(
        { error: `Stock insuffisant pour "${item.product.name}".` },
        { status: 400 },
      );
    }
  }

  const totalCents = cartItems.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
      totalCents,
      items: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          clubId: item.product.clubId,
          quantity: item.quantity,
          unitPriceCents: item.product.priceCents,
          productName: item.product.name,
          selectedOptions: item.selectedOptions,
        })),
      },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: cartItems.map((item) => {
      const optionsLabel = formatSelectedOptions(item.selectedOptions);
      return {
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: item.product.priceCents,
          product_data: {
            name: `${item.product.name}${optionsLabel ? ` (${optionsLabel})` : ""} — ${item.product.club.name}`,
          },
        },
      };
    }),
    phone_number_collection: { enabled: true },
    shipping_address_collection: {
      allowed_countries: ["FR", "BE", "CH", "LU", "MC", "DE", "ES", "IT"],
    },
    metadata: { orderId: order.id },
    success_url: `${baseUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/panier`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: checkoutSession.id },
  });

  await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });

  return NextResponse.json({ url: checkoutSession.url });
}
