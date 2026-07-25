"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";

export async function toggleOrderItemDelivered(orderItemId: string) {
  const session = await auth();
  if (!session?.user) return;

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) return;

  if (session.user.role === "CLUB") {
    const club = await getClubForUser(session.user.id);
    if (!club || club.id !== item.clubId) return;
  } else if (session.user.role !== "ADMIN") {
    return;
  }

  await prisma.orderItem.update({ where: { id: orderItemId }, data: { delivered: !item.delivered } });

  revalidatePath("/club/dashboard");
  revalidatePath(`/admin/clubs/${item.clubId}`);
  revalidatePath("/admin/ventes");
}
