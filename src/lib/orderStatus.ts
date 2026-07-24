export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de paiement",
  PAID: "Payée",
  PROCESSING: "En préparation",
  SHIPPED: "Expédiée",
  COMPLETED: "Livrée",
  CANCELLED: "Annulée",
};

export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-300",
  PAID: "bg-blue-500/15 text-blue-300",
  PROCESSING: "bg-indigo-500/15 text-indigo-300",
  SHIPPED: "bg-purple-500/15 text-purple-300",
  COMPLETED: "bg-emerald-500/15 text-emerald-300",
  CANCELLED: "bg-red-500/15 text-red-300",
};

export const ORDER_STATUS_ORDER = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;
