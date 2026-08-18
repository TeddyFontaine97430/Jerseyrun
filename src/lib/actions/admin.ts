"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { generateTempPassword } from "@/lib/passwords";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Non autorisé");
  }
}

// Mode d'emploi "Espace club", envoyé automatiquement à chaque club validé.
const CLUB_MANUAL_URL =
  "https://hlgj7olfcqzaeggk.public.blob.vercel-storage.com/site/Jersey-Run-Mode-emploi-espace-club.pdf";

async function fetchClubManualAttachment(): Promise<{ filename: string; content: Buffer }[]> {
  try {
    const response = await fetch(CLUB_MANUAL_URL);
    if (!response.ok) return [];
    const buffer = Buffer.from(await response.arrayBuffer());
    return [{ filename: "Jersey-Run-Mode-emploi-espace-club.pdf", content: buffer }];
  } catch {
    return [];
  }
}

export async function approveClub(clubId: string) {
  await requireAdmin();
  const club = await prisma.club.update({ where: { id: clubId }, data: { status: "APPROVED" } });
  revalidatePath("/admin");
  revalidatePath("/admin/clubs");
  revalidatePath("/");

  await sendEmail({
    to: club.email,
    subject: "Votre club a été validé sur Jersey Run",
    html: `
      <p>Bonjour,</p>
      <p>Bonne nouvelle : l'inscription de <strong>${club.name}</strong> sur Jersey Run vient d'être validée.</p>
      <p>Vous pouvez dès à présent vous connecter à votre espace club pour ajouter vos articles et commencer à vendre.</p>
      <p>Vous trouverez en pièce jointe le mode d'emploi de votre espace club : création d'articles, suivi des
      commandes, vente en direct, commande de matériel auprès de Jersey Run, réglages de paiement et de
      livraison...</p>
      <p>À bientôt sur Jersey Run !</p>
    `,
    attachments: await fetchClubManualAttachment(),
  });
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

export type DeleteCustomerResult = { status: "success" } | { status: "error"; message: string };

export async function deleteCustomer(customerId: string): Promise<DeleteCustomerResult> {
  await requireAdmin();

  const customer = await prisma.user.findUnique({ where: { id: customerId } });
  if (!customer || customer.role !== "CUSTOMER") {
    return { status: "error", message: "Client introuvable." };
  }

  // Le compte est supprimé, mais l'historique de commandes est conservé (détaché du
  // compte) pour ne pas fausser le chiffre d'affaires et les ventes des clubs concernés.
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { userId: customerId } }),
    prisma.order.updateMany({ where: { userId: customerId }, data: { userId: null } }),
    prisma.user.delete({ where: { id: customerId } }),
  ]);

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}
