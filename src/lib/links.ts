// Rend un lien saisi à la main exploitable tel quel dans un <a href>.
// - "https://x.fr", "http://x.fr", "mailto:", "tel:" et "/page" sont conservés ;
// - "www.x.fr" ou "x.fr" deviennent "https://www.x.fr" (sinon le navigateur les
//   prendrait pour une page interne du site) ;
// - "clubs/mon-club" devient "/clubs/mon-club".
export function normalizeLink(raw: string): string {
  const value = raw.trim();
  if (!value) return value;
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(value)) return value;
  if (/^[^\s/]+\.[^\s/]{2,}(\/.*)?$/.test(value)) return `https://${value}`;
  return `/${value}`;
}

export function isExternalLink(link: string): boolean {
  return /^https?:\/\//i.test(link);
}
