"use client";

import { useEffect } from "react";

/**
 * Enregistre l'appareil pour les notifications push, uniquement quand le
 * site tourne dans l'app mobile (Capacitor). Sans effet dans un navigateur
 * classique. Le token obtenu est envoyé à /api/push/register pour que
 * l'administrateur puisse ensuite envoyer des notifications depuis
 * /admin/notifications.
 */
export function PushRegistration() {
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      // Chargement dynamique : ce module ne doit s'exécuter que dans l'app
      // native, jamais lors du rendu serveur ni dans un navigateur normal.
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || cancelled) return;

      const { PushNotifications } = await import("@capacitor/push-notifications");

      const permission = await PushNotifications.checkPermissions();
      let granted = permission.receive === "granted";
      if (!granted && permission.receive !== "denied") {
        const request = await PushNotifications.requestPermissions();
        granted = request.receive === "granted";
      }
      if (!granted || cancelled) return;

      await PushNotifications.register();

      PushNotifications.addListener("registration", async (token) => {
        try {
          await fetch("/api/push/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: token.value,
              platform: Capacitor.getPlatform() === "ios" ? "ios" : "android",
            }),
          });
        } catch {
          // Pas grave : le token sera renvoyé au prochain lancement de l'app.
        }
      });
    }

    setup();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
