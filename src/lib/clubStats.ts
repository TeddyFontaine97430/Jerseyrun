import { prisma } from "@/lib/prisma";

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED", "PREORDER"] as const;

export async function getClubForUser(userId: string) {
  return prisma.club.findUnique({ where: { ownerId: userId } });
}

export async function getClubStats(clubId: string) {
  const paidItems = await prisma.orderItem.findMany({
    where: { clubId, order: { status: { in: [...PAID_STATUSES] } } },
    include: { order: true },
  });

  const revenueCents = paidItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const unitsSold = paidItems.reduce((sum, item) => sum + item.quantity, 0);
  const orderIds = new Set(paidItems.map((item) => item.orderId));

  return { revenueCents, unitsSold, ordersCount: orderIds.size };
}

export async function getClubSales(clubId: string) {
  const items = await prisma.orderItem.findMany({
    where: { clubId, order: { status: { in: [...PAID_STATUSES] } } },
    include: { order: { include: { user: true } } },
    orderBy: { order: { createdAt: "desc" } },
  });
  return items;
}

export async function getClubPendingOnSiteOrders(clubId: string) {
  const items = await prisma.orderItem.findMany({
    where: { clubId, order: { status: "PENDING", paymentMethod: "ON_SITE" } },
    include: { order: { include: { user: true } } },
    orderBy: { order: { createdAt: "desc" } },
  });

  const orders = new Map<string, { order: (typeof items)[number]["order"]; items: typeof items }>();
  for (const item of items) {
    const existing = orders.get(item.orderId);
    if (existing) {
      existing.items.push(item);
    } else {
      orders.set(item.orderId, { order: item.order, items: [item] });
    }
  }
  return Array.from(orders.values());
}
