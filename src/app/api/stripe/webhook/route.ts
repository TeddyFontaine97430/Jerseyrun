import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { notifyAdmin } from "@/lib/email";
import { formatPrice } from "@/lib/money";

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
        include: { items: true },
      });

      if (order && order.status === "PENDING") {
        const shipping = checkoutSession.collected_information?.shipping_details;
        const customerDetails = checkoutSession.customer_details;
        const customerName = shipping?.name ?? customerDetails?.name ?? undefined;

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
          ...order.items.map((item) =>
            prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            }),
          ),
        ]);

        const itemsList = order.items
          .map((item) => `<li>${item.quantity} × ${item.productName} — ${formatPrice(item.unitPriceCents * item.quantity)}</li>`)
          .join("");

        await notifyAdmin({
          subject: `Nouvelle vente — ${formatPrice(order.totalCents)}`,
          html: `
            <p>Une nouvelle commande vient d'être payée sur Jersey Run.</p>
            <ul>
              <li><strong>Client :</strong> ${customerName ?? "N/A"}</li>
              <li><strong>Total :</strong> ${formatPrice(order.totalCents)}</li>
            </ul>
            <p><strong>Articles :</strong></p>
            <ul>${itemsList}</ul>
          `,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
