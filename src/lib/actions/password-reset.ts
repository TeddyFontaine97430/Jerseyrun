"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

export type RequestResetState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const emailSchema = z.string().email("Adresse email invalide.");

export async function requestPasswordReset(
  _prevState: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: "Adresse email invalide." };
  }

  const email = parsed.data.toLowerCase().trim();
  const genericMessage =
    "Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Ne pas révéler si l'email existe ou non.
    return { status: "success", message: genericMessage };
  }

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reinitialiser-mot-de-passe?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Réinitialisation de votre mot de passe — Jersey Run",
    html: `
      <p>Bonjour${user.name ? ` ${user.name}` : ""},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe sur Jersey Run.</p>
      <p><a href="${resetUrl}">Cliquez ici pour choisir un nouveau mot de passe</a> (lien valable 1 heure).</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
    `,
  });

  return { status: "success", message: genericMessage };
}

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type ResetPasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { status: "error", message: "Ce lien de réinitialisation est invalide ou expiré." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return { status: "success", message: "Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter." };
}
