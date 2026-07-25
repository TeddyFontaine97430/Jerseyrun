"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Non autorisé");
  }
}

export async function approveClub(clubId: string) {
  await requireAdmin();
  await prisma.club.update({ where: { id: clubId }, data: { status: "APPROVED" } });
  revalidatePath("/admin");
  revalidatePath("/admin/clubs");
  revalidatePath("/");
}

export async function rejectClub(clubId: string) {
  await requireAdmin();
  await prisma.club.update({ where: { id: clubId }, data: { status: "REJECTED" } });
  revalidatePath("/admin");
  revalidatePath("/admin/clubs");
  revalidatePath("/");
}

export async function closeClub(clubId: string) {
  await requireAdmin();
  const club = await prisma.club.update({ where: { id: clubId }, data: { active: false } });
  revalidatePath("/admin/clubs");
  revalidatePath(`/admin/clubs/${clubId}`);
  revalidatePath("/");
  revalidatePath(`/clubs/${club.slug}`);
}

export async function reopenClub(clubId: string) {
  await requireAdmin();
  const club = await prisma.club.update({ where: { id: clubId }, data: { active: true } });
  revalidatePath("/admin/clubs");
  revalidatePath(`/admin/clubs/${clubId}`);
  revalidatePath("/");
  revalidatePath(`/clubs/${club.slug}`);
}

export type DeleteClubResult = { status: "success" } | { status: "error"; message: string };

export async function deleteClub(clubId: string): Promise<DeleteClubResult> {
  await requireAdmin();

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: { products: { select: { id: true } } },
  });
  if (!club) {
    return { status: "error", message: "Club introuvable." };
  }

  const hasOrderHistory = await prisma.orderItem.findFirst({ where: { clubId } });
  if (hasOrderHistory) {
    return {
      status: "error",
      message:
        "Impossible de supprimer : ce club a déjà des ventes enregistrées. Fermez la boutique à la place pour la rendre indisponible sans perdre l'historique.",
    };
  }

  const productIds = club.products.map((p) => p.id);

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.product.deleteMany({ where: { id: { in: productIds } } }),
    prisma.club.delete({ where: { id: clubId } }),
    prisma.user.delete({ where: { id: club.ownerId } }),
  ]);

  revalidatePath("/admin/clubs");
  revalidatePath("/");

  redirect("/admin/clubs");
}

function generateTempPassword() {
  return randomBytes(9).toString("base64url");
}

export async function resetClubPassword(clubId: string): Promise<{ email: string; password: string }> {
  await requireAdmin();

  const club = await prisma.club.findUnique({ where: { id: clubId }, include: { owner: true } });
  if (!club) throw new Error("Club introuvable");

  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({ where: { id: club.ownerId }, data: { password: passwordHash } });

  return { email: club.owner.email, password };
}

export async function resetCustomerPassword(userId: string): Promise<{ email: string; password: string }> {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "CUSTOMER") throw new Error("Client introuvable");

  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({ where: { id: userId }, data: { password: passwordHash } });

  return { email: user.email, password };
}
