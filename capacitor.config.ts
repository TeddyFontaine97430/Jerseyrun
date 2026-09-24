import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "re.jerseyrun.app",
  appName: "Jersey Run",
  webDir: "mobile-shell",
  server: {
    // L'app charge directement le site en production : toute mise à jour
    // du site est immédiatement visible dans l'app, sans re-publication
    // sur les stores.
    url: "https://jerseyrun.re",
    androidScheme: "https",
    // Si le chargement échoue au lancement (ex : réseau pas encore prêt),
    // Capacitor affiche cette page locale au lieu d'un écran blanc, et elle
    // retente la connexion toute seule (voir mobile-shell/error.html).
    // Refus Apple du 2026-09-24 : Guideline 2.1(a), App Completeness.
    errorPath: "error.html",
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
