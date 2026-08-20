import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { sendPushToAdmins } from "@/lib/push";

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED", "PREORDER"] as const;

// Appelé une fois par jour par Vercel Cron (voir vercel.json) pour envoyer à
// l'administrateur un résumé push de l'activité de la veille.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const now = new Date();
  const startOfYesterday = new Date(now);
  startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1);
  startOfYesterday.setUTCHours(0, 0, 0, 0);
  const endOfYesterday = new Date(startOfYesterday);
  endOfYesterday.setUTCDate(endOfYesterday.getUTCDate() + 1);

  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        status: { in: [...PAID_STATUSES] },
        createdAt: { gte: startOfYesterday, lt: endOfYesterday },
      },
    },
    select: { orderId: true, unitPriceCents: true, quantity: true },
  });

  const revenueCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const ordersCount = new Set(items.map((item) => item.orderId)).size;

  const newCustomers = await prisma.user.count({
    where: { role: "CUSTOMER", createdAt: { gte: startOfYesterday, lt: endOfYesterday } },
  });

  const dateLabel = startOfYesterday.toLocaleDateString("fr-FR", { timeZone: "Indian/Reunion" });
  const parts = [
    `${ordersCount} commande${ordersCount > 1 ? "s" : ""}`,
    formatPrice(revenueCents),
  ];
  if (newCustomers > 0) {
    parts.push(`${newCustomers} nouveau${newCustomers > 1 ? "x" : ""} client${newCustomers > 1 ? "s" : ""}`);
  }

  await sendPushToAdmins({
    title: `Résumé du ${dateLabel}`,
    body: parts.join(" — "),
  });

  return NextResponse.json({ ok: true, ordersCount, revenueCents, newCustomers });
}
