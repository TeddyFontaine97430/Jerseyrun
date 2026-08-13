"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2, "Merci d'indiquer votre nom."),
  email: z.string().email("Adresse email invalide."),
  phone: z.string().min(6, "Merci d'indiquer un numéro de téléphone valide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export type RegisterState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function registerCustomer(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { name, email, phone, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { status: "error", message: "Un compte existe déjà avec cet email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email: normalizedEmail, phone: phone.trim(), password: passwordHash, role: "CUSTOMER" },
  });

  return { status: "success", message: "Votre compte a été créé. Vous pouvez maintenant vous connecter." };
}
