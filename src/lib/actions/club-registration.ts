"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { notifyAdmin } from "@/lib/email";

const clubSchema = z.object({
  name: z.string().min(2, "Merci d'indiquer le nom du club."),
  sport: z.string().min(1, "Merci de sélectionner un sport."),
  phone: z.string().min(6, "Numéro de téléphone invalide."),
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  termsAccepted: z.literal("on", {
    message: "Vous devez accepter les conditions d'utilisation pour les clubs.",
  }),
});

export type ClubRegistrationState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function slugify(name: string) {
  const diacritics = /[̀-ͯ]/g;
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(diacritics, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function registerClub(
  _prevState: ClubRegistrationState,
  formData: FormData,
): Promise<ClubRegistrationState> {
  const parsed = clubSchema.safeParse({
    name: formData.get("name"),
    sport: formData.get("sport"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    termsAccepted: formData.get("termsAccepted"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const { name, sport, phone, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return { status: "error", message: "Un compte existe déjà avec cet email." };
  }

  const baseSlug = slugify(name) || "club";
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.club.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: passwordHash,
      name,
      role: "CLUB",
      club: {
        create: {
          name,
          slug,
          sport,
          phone,
          email: normalizedEmail,
          status: "PENDING",
          termsAcceptedAt: new Date(),
        },
      },
    },
  });

  await notifyAdmin({
    subject: `Nouvelle demande d'inscription de club : ${name}`,
    html: `
      <p>Un nouveau club souhaite rejoindre Jersey Run.</p>
      <ul>
        <li><strong>Nom :</strong> ${name}</li>
        <li><strong>Sport :</strong> ${sport}</li>
        <li><strong>Email :</strong> ${normalizedEmail}</li>
        <li><strong>Téléphone :</strong> ${phone}</li>
      </ul>
      <p>Rendez-vous dans l'administration pour valider ou refuser cette demande.</p>
    `,
  });

  return {
    status: "success",
    message:
      "Votre demande d'inscription a bien été envoyée. L'administrateur du site va l'examiner et vous serez averti par email dès sa validation.",
  };
}
