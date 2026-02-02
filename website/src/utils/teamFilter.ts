/**
 * Takım filtreleme - tüm filtreleme mantığında tutarlı relevans
 */

const NORMALIZE_MAP: Record<string, string> = {
  'ı': 'i', 'İ': 'i', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u',
  'ş': 's', 'Ş': 's', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c',
};

function normalize(s: string): string {
  if (!s || typeof s !== 'string') return '';
  let t = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  Object.entries(NORMALIZE_MAP).forEach(([from, to]) => {
    t = t.replace(new RegExp(from, 'gi'), to);
  });
  return t;
}

function matchesQuery(name: string, query: string): boolean {
  const n = normalize(name);
  const q = normalize(query);
  if (!q) return true;
  if (n.includes(q)) return true;
  const words = n.split(/\s+/);
  return words.some(w => w.startsWith(q) || q.startsWith(w));
}

function sortByRelevance<T>(items: T[], query: string, getName: (item: T) => string): T[] {
  const q = normalize(query);
  if (!q) return [...items];
  return [...items].sort((a, b) => {
    const na = normalize(getName(a));
    const nb = normalize(getName(b));
    const aStarts = na.startsWith(q);
    const bStarts = nb.startsWith(q);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return na.localeCompare(nb);
  });
}

/** String listesi filtrele + sırala (örn: "🇹🇷 Türkiye", "Boca Juniors") */
export function filterAndSortStringList(
  items: string[],
  query: string,
  getName?: (s: string) => string
): string[] {
  const extractName = getName ?? (s => s.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*|🏴[^\s]*\s*/u, '').trim());
  const q = normalize(query);
  if (!q) return items;
  const filtered = items.filter(s => matchesQuery(extractName(s), query));
  return sortByRelevance(filtered, query, extractName);
}
