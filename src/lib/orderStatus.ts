export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de paiement",
  PAID: "Payée",
  PROCESSING: "En cours",
  SHIPPED: "Expédiée",
  COMPLETED: "Livrée",
  CANCELLED: "Annulée",
  PREORDER: "Pré-commande",
};

export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-300",
  PAID: "bg-blue-500/15 text-blue-300",
  PROCESSING: "bg-indigo-500/15 text-indigo-300",
  SHIPPED: "bg-purple-500/15 text-purple-300",
  COMPLETED: "bg-emerald-500/15 text-emerald-300",
  CANCELLED: "bg-red-500/15 text-red-300",
  PREORDER: "bg-gold/15 text-gold",
};

export const ORDER_STATUS_ORDER = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "PREORDER",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

// Les 3 états qu'un club peut choisir lui-même pour une vente enregistrée manuellement.
export const MANUAL_ORDER_STATUS_OPTIONS = [
  { value: "PROCESSING", label: "En cours" },
  { value: "PREORDER", label: "Pré-commande" },
  { value: "COMPLETED", label: "Livré" },
] as const;

export const MANUAL_PAYMENT_METHOD_LABELS: Record<string, string> = {
  ESPECES: "Espèces",
  CARTE: "Carte bleue",
  CHEQUE: "Chèque",
};
