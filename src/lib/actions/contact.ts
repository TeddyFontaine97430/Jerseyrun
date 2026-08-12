"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, notifyAdmin } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().min(2, "Merci d'indiquer votre nom."),
  email: z.string().email("Adresse email invalide."),
  message: z.string().min(10, "Votre message est un peu court."),
});

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function submitContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  // Un message envoyé depuis la boutique d'un club lui est adressé directement,
  // avec une simple copie à l'administrateur. Sans club (ex : page d'accueil),
  // le message va uniquement à l'administrateur, comme avant.
  const clubSlug = (formData.get("clubSlug") as string | null)?.trim();
  const club = clubSlug
    ? await prisma.club.findFirst({ where: { slug: clubSlug, status: "APPROVED" } })
    : null;

  await prisma.contactMessage.create({ data: { ...parsed.data, clubId: club?.id } });

  const messageHtml = `
    <ul>
      <li><strong>Nom :</strong> ${parsed.data.name}</li>
      <li><strong>Email :</strong> ${parsed.data.email}</li>
    </ul>
    <p><strong>Message :</strong></p>
    <p>${parsed.data.message.replace(/\n/g, "<br />")}</p>
  `;

  if (club) {
    await sendEmail({
      to: club.email,
      subject: `Nouveau message via votre boutique Jersey Run — de ${parsed.data.name}`,
      html: `
        <p>Un visiteur vous a écrit depuis votre boutique Jersey Run.</p>
        ${messageHtml}
        <p>Vous pouvez lui répondre directement à ${parsed.data.email}.</p>
      `,
    });

    await notifyAdmin({
      subject: `Copie — message pour ${club.name} de ${parsed.data.name}`,
      html: `
        <p>Copie d'un message envoyé au club <strong>${club.name}</strong> via sa boutique Jersey Run.</p>
        ${messageHtml}
      `,
    });
  } else {
    await notifyAdmin({
      subject: `Nouveau message de contact de ${parsed.data.name}`,
      html: `
        <p>Nouveau message reçu via le formulaire de contact du site.</p>
        ${messageHtml}
      `,
    });
  }

  return { status: "success", message: "Votre message a bien été envoyé, merci !" };
}
