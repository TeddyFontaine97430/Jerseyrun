import { prisma } from "@/lib/prisma";

export const SITE_CONTENT_DEFAULTS = {
  "home.badge": "La boutique officielle des clubs sportifs",
  "home.title": "La boutique 100% clubs péi.",
  "home.subtitle":
    "Soutenez votre club péi en un clic : maillots, équipements et goodies officiels, livrés chez vous ou à récupérer sur place.",
  "home.heroImage": "/hero-banner.png",
  "home.partnersTitle": "Clubs partenaires",
  "home.partnersSubtitle": "Sélectionnez un club pour découvrir sa boutique officielle.",
  "concept.intro1":
    "Jersey Run est la boutique en ligne qui réunit plusieurs clubs sportifs sous un même toit. Chaque club dispose de sa propre vitrine pour vendre maillots, équipements et goodies officiels à ses supporters.",
  "concept.intro2":
    "Chaque club garde le contrôle total : il gère son catalogue d'articles, suit ses ventes et son chiffre d'affaires depuis un espace privé et sécurisé, accessible uniquement après validation par l'administrateur du site.",
  "concept.intro3":
    "Les visiteurs et clients parcourent librement les clubs partenaires, créent un compte pour suivre leur panier et leurs commandes, et soutiennent ainsi directement leur club favori.",
} as const;

export type SiteContentKey = keyof typeof SITE_CONTENT_DEFAULTS;

export async function getSiteContentMap(): Promise<Record<SiteContentKey, string>> {
  const rows = await prisma.siteContent.findMany();
  const saved = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return Object.fromEntries(
    (Object.keys(SITE_CONTENT_DEFAULTS) as SiteContentKey[]).map((key) => [
      key,
      saved[key] ?? SITE_CONTENT_DEFAULTS[key],
    ]),
  ) as Record<SiteContentKey, string>;
}
