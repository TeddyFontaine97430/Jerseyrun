import { prisma } from "@/lib/prisma";

export async function getSupplierForUser(userId: string) {
  return prisma.supplier.findUnique({ where: { ownerId: userId } });
}
