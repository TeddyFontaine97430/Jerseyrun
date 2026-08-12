import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let app: App | null = null;

/**
 * Initialise Firebase Admin à partir des variables d'environnement
 * (voir .env.example). Retourne null si elles ne sont pas configurées,
 * pour que le site continue de fonctionner sans notifications tant que
 * Firebase n'a pas été branché.
 */
function getFirebaseApp(): App | null {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  const existing = getApps();
  app =
    existing[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // La clé privée est stockée avec des "\n" échappés dans .env.
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });

  return app;
}

export function isPushConfigured(): boolean {
  return getFirebaseApp() !== null;
}

export type PushSendResult = {
  sentCount: number;
  failCount: number;
  invalidTokens: string[];
};

/**
 * Envoie une notification (titre + texte + image optionnelle) à une liste
 * de tokens d'appareils. Traite par lots de 500 (limite FCM) et remonte les
 * tokens invalides (désinstallations, etc.) pour nettoyage.
 */
export async function sendPushToTokens(
  tokens: string[],
  notification: { title: string; body: string; imageUrl?: string | null },
): Promise<PushSendResult> {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    throw new Error(
      "Firebase n'est pas configuré (variables FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY manquantes).",
    );
  }
  if (tokens.length === 0) {
    return { sentCount: 0, failCount: 0, invalidTokens: [] };
  }

  const messaging = getMessaging(firebaseApp);
  const result: PushSendResult = { sentCount: 0, failCount: 0, invalidTokens: [] };
  const BATCH_SIZE = 500;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    const response = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl ? { imageUrl: notification.imageUrl } : {}),
      },
      android: {
        notification: {
          ...(notification.imageUrl ? { imageUrl: notification.imageUrl } : {}),
        },
      },
      apns: notification.imageUrl
        ? { fcmOptions: { imageUrl: notification.imageUrl } }
        : undefined,
    });

    result.sentCount += response.successCount;
    result.failCount += response.failureCount;

    response.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = r.error?.code ?? "";
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          result.invalidTokens.push(batch[idx]);
        }
      }
    });
  }

  return result;
}
