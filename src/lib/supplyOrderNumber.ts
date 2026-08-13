import { prisma } from "@/lib/prisma";

export async function getNextSupplyOrderNumber(): Promise<string> {
  const result = await prisma.$queryRaw<{ n: bigint }[]>`SELECT nextval('supply_order_number_seq') AS n`;
  const n = result[0].n;
  return `CF-${n.toString().padStart(6, "0")}`;
}
