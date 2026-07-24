"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyAdmin } from "@/lib/email";

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

  await prisma.contactMessage.create({ data: parsed.data });

  await notifyAdmin({
    subject: `Nouveau message de contact de ${parsed.data.name}`,
    html: `
      <p>Nouveau message reçu via le formulaire de contact du site.</p>
      <ul>
        <li><strong>Nom :</strong> ${parsed.data.name}</li>
        <li><strong>Email :</strong> ${parsed.data.email}</li>
      </ul>
      <p><strong>Message :</strong></p>
      <p>${parsed.data.message.replace(/\n/g, "<br />")}</p>
    `,
  });

  return { status: "success", message: "Votre message a bien été envoyé, merci !" };
}
