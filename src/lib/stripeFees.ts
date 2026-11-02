// Les frais de traitement Stripe sont à la charge du club qui encaisse la vente, pas de
// Jersey Run. Les paiements passant par le compte de la plateforme (Stripe Connect), c'est
// Jersey Run qui est débité des frais : on les récupère donc immédiatement via une
// commission d'application qui les compense, retenue sur le versement au club.
//
// Tarif Stripe d'une carte européenne standard : 1,5 % + 0,25 €. Les cartes étrangères ou
// premium coûtent un peu plus ; l'écart éventuel reste à la charge de Jersey Run.
const STRIPE_FEE_PERCENT = 0.015;
const STRIPE_FEE_FIXED_CENTS = 25;

export function computeStripeFeeCents(totalCents: number): number {
  const fee = Math.ceil(totalCents * STRIPE_FEE_PERCENT) + STRIPE_FEE_FIXED_CENTS;
  // Stripe exige une commission strictement inférieure au montant encaissé.
  return Math.max(0, Math.min(fee, totalCents - 1));
}
