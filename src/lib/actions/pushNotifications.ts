"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPushConfigured, sendPushToTokens } from "@/lib/push";

export type SendPushFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function sendPushNotification(
  _prevState: SendPushFormState,
  formData: FormData,
): Promise<SendPushFormState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { status: "error", message: "Accès non autorisé." };
  }

  if (!isPushConfigured()) {
    return {
      status: "error",
      message:
        "Firebase n'est pas encore configuré sur le serveur (variables FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY manquantes).",
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!title || !body) {
    return { status: "error", message: "Le titre et le message sont obligatoires." };
  }

  const devices = await prisma.pushDevice.findMany({ select: { token: true } });
  const tokens = devices.map((d) => d.token);

  if (tokens.length === 0) {
    return {
      status: "error",
      message: "Aucun appareil n'est encore enregistré (personne n'a l'app installée pour l'instant).",
    };
  }

  const result = await sendPushToTokens(tokens, {
    title,
    body,
    imageUrl: imageUrl || null,
  });

  if (result.invalidTokens.length > 0) {
    await prisma.pushDevice.deleteMany({ where: { token: { in: result.invalidTokens } } });
  }

  await prisma.pushNotification.create({
    data: {
      title,
      body,
      imageUrl: imageUrl || null,
      sentCount: result.sentCount,
      failCount: result.failCount,
      sentByName: session.user.name ?? session.user.email ?? null,
    },
  });

  revalidatePath("/admin/notifications");

  return {
    status: "success",
    message: `Notification envoyée à ${result.sentCount} appareil${result.sentCount > 1 ? "s" : ""}${
      result.failCount > 0 ? ` (${result.failCount} échec${result.failCount > 1 ? "s" : ""})` : ""
    }.`,
  };
}
