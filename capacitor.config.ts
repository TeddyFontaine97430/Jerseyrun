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
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
