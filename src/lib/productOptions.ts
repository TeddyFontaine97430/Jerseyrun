export function encodeSelectedOptions(
  selections: { name: string; value: string }[],
): string | null {
  if (selections.length === 0) return null;
  return selections
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => `${s.name}=${s.value}`)
    .join("|");
}

export function decodeSelectedOptions(
  selectedOptions: string | null | undefined,
): { name: string; value: string }[] {
  if (!selectedOptions) return [];
  return selectedOptions.split("|").map((pair) => {
    const [name, value] = pair.split("=");
    return { name, value };
  });
}

export function formatSelectedOptions(selectedOptions: string | null | undefined): string | null {
  const pairs = decodeSelectedOptions(selectedOptions);
  if (pairs.length === 0) return null;
  return pairs.map((p) => `${p.name} : ${p.value}`).join(", ");
}

export function formatItemDetails(
  selectedOptions: string | null | undefined,
  personalizationText?: string | null,
): string | null {
  const parts: string[] = [];
  const optionsLabel = formatSelectedOptions(selectedOptions);
  if (optionsLabel) parts.push(optionsLabel);
  if (personalizationText) parts.push(`Personnalisé : ${personalizationText}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}
