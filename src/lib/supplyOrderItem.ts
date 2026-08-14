// Formatting shared by every place that displays a supply order line
// (admin, club, supplier dashboards, emails and the PDF).
export function describeSupplyOrderItemDetails(item: {
  size: string | null;
  personalizationNumber: string | null;
  personalizationName: string | null;
}): string {
  return [
    item.size ? `taille ${item.size}` : null,
    item.personalizationNumber ? `n° ${item.personalizationNumber}` : null,
    item.personalizationName ? `prénom ${item.personalizationName}` : null,
  ]
    .filter(Boolean)
    .join(" — ");
}
