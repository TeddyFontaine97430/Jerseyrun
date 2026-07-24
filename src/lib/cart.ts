import { prisma } from "@/lib/prisma";

export async function getCartForUser(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { club: true } } },
    orderBy: { createdAt: "asc" },
  });
  const total = items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, total, count };
}
