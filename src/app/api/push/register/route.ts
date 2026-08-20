import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  token: z.string().min(10),
  platform: z.enum(["android", "ios"]),
});

// Appelé depuis l'app mobile (Capacitor) juste après l'obtention du token
// FCM, pour que l'administrateur puisse ensuite envoyer des notifications à
// tous les appareils ayant installé l'app.
export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const { token, platform } = parsed.data;
  const session = await auth();
  const userId = session?.user?.id;

  await prisma.pushDevice.upsert({
    where: { token },
    create: { token, platform: platform === "ios" ? "IOS" : "ANDROID", userId },
    // Remonte lastSeenAt (@updatedAt) à chaque relance de l'app, et rattache l'appareil au
    // compte actuellement connecté (utile si quelqu'un d'autre se connecte sur le même
    // appareil par la suite).
    update: { platform: platform === "ios" ? "IOS" : "ANDROID", userId },
  });

  return NextResponse.json({ ok: true });
}
