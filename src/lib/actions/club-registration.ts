"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { notifyAdmin, sendEmail } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";

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
  status: "idle" | "success" | "code_sent" | "error";
  message?: string;
  email?: string;
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

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const CODE_TTL_MINUTES = 15;

async function sendVerificationEmail(email: string, code: string) {
  await sendEmail({
    to: email,
    subject: `Votre code de confirmation Jersey Run : ${code}`,
    html: `
      <p>Bonjour,</p>
      <p>Voici votre code de confirmation pour finaliser l'inscription de votre club sur Jersey Run :</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      <p>Ce code est valable ${CODE_TTL_MINUTES} minutes.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    `,
  });
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

  const passwordHash = await bcrypt.hash(password, 10);
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await prisma.clubRegistrationCode.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, code, name, sport, phone, passwordHash, expiresAt },
    update: { code, name, sport, phone, passwordHash, expiresAt },
  });

  await sendVerificationEmail(normalizedEmail, code);

  return {
    status: "code_sent",
    email: normalizedEmail,
    message: `Un code de confirmation a été envoyé à ${normalizedEmail}.`,
  };
}

export async function resendClubRegistrationCode(email: string): Promise<ClubRegistrationState> {
  const normalizedEmail = email.toLowerCase().trim();
  const pending = await prisma.clubRegistrationCode.findUnique({ where: { email: normalizedEmail } });
  if (!pending) {
    return { status: "error", message: "Aucune demande en cours pour cet email." };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
  await prisma.clubRegistrationCode.update({ where: { email: normalizedEmail }, data: { code, expiresAt } });
  await sendVerificationEmail(normalizedEmail, code);

  return {
    status: "code_sent",
    email: normalizedEmail,
    message: `Un nouveau code a été envoyé à ${normalizedEmail}.`,
  };
}

export async function confirmClubRegistrationCode(
  _prevState: ClubRegistrationState,
  formData: FormData,
): Promise<ClubRegistrationState> {
  const email = ((formData.get("email") as string) ?? "").toLowerCase().trim();
  const code = ((formData.get("code") as string) ?? "").trim();

  if (!email || !code) {
    return { status: "error", email, message: "Merci de renseigner le code reçu par email." };
  }

  const pending = await prisma.clubRegistrationCode.findUnique({ where: { email } });
  if (!pending) {
    return { status: "error", email, message: "Aucune demande en cours pour cet email." };
  }
  if (pending.expiresAt < new Date()) {
    return { status: "error", email, message: "Ce code a expiré. Demandez-en un nouveau." };
  }
  if (pending.code !== code) {
    return { status: "code_sent", email, message: "Code incorrect. Réessayez." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.clubRegistrationCode.delete({ where: { email } });
    return { status: "error", message: "Un compte existe déjà avec cet email." };
  }

  const baseSlug = slugify(pending.name) || "club";
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.club.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  await prisma.user.create({
    data: {
      email,
      password: pending.passwordHash,
      name: pending.name,
      role: "CLUB",
      club: {
        create: {
          name: pending.name,
          slug,
          sport: pending.sport,
          phone: pending.phone,
          email,
          status: "PENDING",
          termsAcceptedAt: new Date(),
        },
      },
    },
  });

  await prisma.clubRegistrationCode.delete({ where: { email } });

  await notifyAdmin({
    subject: `Nouvelle demande d'inscription de club : ${pending.name}`,
    html: `
      <p>Un nouveau club souhaite rejoindre Jersey Run.</p>
      <ul>
        <li><strong>Nom :</strong> ${pending.name}</li>
        <li><strong>Sport :</strong> ${pending.sport}</li>
        <li><strong>Email :</strong> ${email}</li>
        <li><strong>Téléphone :</strong> ${pending.phone}</li>
      </ul>
      <p>Rendez-vous dans l'administration pour valider ou refuser cette demande.</p>
    `,
  });

  await sendPushToAdmins({
    title: "Nouveau club à valider",
    body: `${pending.name} (${pending.sport}) souhaite rejoindre Jersey Run.`,
  });

  return {
    status: "success",
    message:
      "Votre email est confirmé et votre demande d'inscription a bien été envoyée. L'administrateur du site va l'examiner et vous serez averti par email dès sa validation.",
  };
}
