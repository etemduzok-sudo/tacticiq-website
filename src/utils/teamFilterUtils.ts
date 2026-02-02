/**
 * Takım arama/filtreleme - tüm uygulama genelinde tutarlı mantık
 * Relevans: prefix eşleşme önce, sonra contains, sonra alfabetik
 */

const NORMALIZE_MAP: Record<string, string> = {
  'ı': 'i', 'İ': 'i', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u',
  'ş': 's', 'Ş': 's', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c',
};

/** Metni normalize et (Türkçe karakterler, lowercase) */
export function normalizeText(s: string): string {
  if (!s || typeof s !== 'string') return '';
  let t = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  Object.entries(NORMALIZE_MAP).forEach(([from, to]) => {
    t = t.replace(new RegExp(from, 'gi'), to);
  });
  return t;
}

/** İsmin sorguyu içerip içermediğini kontrol et (contains + kelime başı) */
export function matchesQuery(name: string, query: string): boolean {
  const n = normalizeText(name);
  const q = normalizeText(query);
  if (!q) return true;
  if (n.includes(q)) return true;
  const words = n.split(/\s+/);
  return words.some(w => w.startsWith(q) || q.startsWith(w));
}

/** Relevans sıralaması: prefix > contains > alfabetik */
export function sortByRelevance<T>(items: T[], query: string, getName: (item: T) => string): T[] {
  const q = normalizeText(query);
  if (!q) return [...items];
  return [...items].sort((a, b) => {
    const na = normalizeText(getName(a));
    const nb = normalizeText(getName(b));
    const aStarts = na.startsWith(q);
    const bStarts = nb.startsWith(q);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    if (na === q && nb !== q) return -1;
    if (na !== q && nb === q) return 1;
    return na.localeCompare(nb);
  });
}

/** String listesi filtrele + sırala (örn: "🇹🇷 Türkiye") */
export function filterAndSortStringList(items: string[], query: string, getName?: (s: string) => string): string[] {
  const extractName = getName || (s => s.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*|🏴[^\s]*\s*/u, '').trim());
  const q = normalizeText(query);
  if (!q) return items;
  const filtered = items.filter(s => matchesQuery(extractName(s), query));
  return sortByRelevance(filtered, query, extractName);
}
