import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPushConfigured } from "@/lib/push";
import { PushNotificationForm } from "@/components/admin/PushNotificationForm";

export const metadata: Metadata = { title: { absolute: "Notifications — Administration Jersey Run" } };

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return <p className="text-neutral-400">Accès non autorisé.</p>;
  }

  const [deviceCount, history] = await Promise.all([
    prisma.pushDevice.count(),
    prisma.pushNotification.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const configured = isPushConfigured();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Notifications de l&apos;app mobile</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Envoyez un message (avec image en option) qui s&apos;affiche directement sur l&apos;écran des
          personnes ayant installé l&apos;app Jersey Run.
        </p>
      </div>

      {!configured && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Firebase n&apos;est pas encore configuré sur le serveur : l&apos;envoi de notifications ne
          fonctionnera pas tant que les clés Firebase (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
          FIREBASE_PRIVATE_KEY) n&apos;auront pas été ajoutées à l&apos;environnement.
        </div>
      )}

      <PushNotificationForm deviceCount={deviceCount} />

      {history.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-4 font-semibold text-white">Historique</h3>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Titre</th>
                  <th className="px-5 py-3 font-medium">Message</th>
                  <th className="px-5 py-3 font-medium">Envoyée par</th>
                  <th className="px-5 py-3 font-medium">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {history.map((n) => (
                  <tr key={n.id}>
                    <td className="px-5 py-3 text-neutral-400">
                      {n.createdAt.toLocaleDateString("fr-FR")}{" "}
                      {n.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">{n.title}</td>
                    <td className="max-w-xs truncate px-5 py-3 text-neutral-400">{n.body}</td>
                    <td className="px-5 py-3 text-neutral-400">{n.sentByName ?? "—"}</td>
                    <td className="px-5 py-3 text-neutral-400">
                      {n.sentCount} envoyée{n.sentCount > 1 ? "s" : ""}
                      {n.failCount > 0 ? `, ${n.failCount} échec${n.failCount > 1 ? "s" : ""}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
