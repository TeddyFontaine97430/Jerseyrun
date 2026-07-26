export const SUPPLY_ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PROCESSING: "En préparation",
  COMPLETED: "Traitée",
  CANCELLED: "Annulée",
};

export const SUPPLY_ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-300",
  PROCESSING: "bg-indigo-500/15 text-indigo-300",
  COMPLETED: "bg-emerald-500/15 text-emerald-300",
  CANCELLED: "bg-red-500/15 text-red-300",
};

export const SUPPLY_ORDER_STATUS_ORDER = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"] as const;
