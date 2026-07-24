"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
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
