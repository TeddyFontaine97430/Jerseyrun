// Compare deux textes en ignorant la casse et les espaces en trop (début, fin, doubles).
// Utile pour les confirmations « tapez le nom » : certains noms enregistrés contiennent
// des espaces invisibles qu'il est impossible de retaper.
export function sameText(a: string, b: string): boolean {
  const clean = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();
  return clean(a) === clean(b);
}

export function cleanLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
