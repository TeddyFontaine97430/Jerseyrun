"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z
  .object({
    name: z.string().min(2, "Merci d'indiquer votre nom."),
    email: z.string().email("Adresse email invalide."),
    currentPassword: z.string().min(1, "Merci d'indiquer votre mot de passe actuel."),
    newPassword: z.string().min(0),
    confirmPassword: z.string().min(0),
  })
  .refine((data) => !data.newPassword || data.newPassword.length >= 8, {
    message: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type ProfileState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user) {
    return { status: "error", message: "Vous devez être connecté." };
  }

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { name, email, currentPassword, newPassword } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { status: "error", message: "Compte introuvable." };
  }

  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) {
    return { status: "error", message: "Mot de passe actuel incorrect." };
  }

  if (normalizedEmail !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return { status: "error", message: "Un autre compte utilise déjà cet email." };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      email: normalizedEmail,
      ...(newPassword ? { password: await bcrypt.hash(newPassword, 10) } : {}),
    },
  });

  revalidatePath("/compte");
  revalidatePath("/club/dashboard");
  revalidatePath("/admin");

  return {
    status: "success",
    message:
      normalizedEmail !== user.email
        ? "Profil mis à jour. Reconnectez-vous avec votre nouvel email."
        : "Profil mis à jour.",
  };
}
