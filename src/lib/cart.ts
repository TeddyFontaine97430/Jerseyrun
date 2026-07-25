import { prisma } from "@/lib/prisma";

export async function getCartForUser(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { club: true, options: { include: { values: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const total = items.reduce((sum, item) => {
    const unitPrice =
      item.product.priceCents + (item.personalizationText ? item.product.personalizationFeeCents : 0);
    return sum + unitPrice * item.quantity;
  }, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, total, count };
}
