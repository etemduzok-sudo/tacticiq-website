/**
 * Takım filtreleme - tüm filtreleme mantığında tutarlı relevans
 */

function normalize(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function matchesQuery(name, query) {
  const n = normalize(name);
  const q = normalize(query);
  if (!q) return true;
  if (n.includes(q)) return true;
  const words = n.split(/\s+/);
  return words.some(w => w.startsWith(q) || q.startsWith(w));
}

function sortByRelevance(items, query, getName = t => t.name) {
  const q = normalize(query);
  if (!q) return items;
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

function filterAndSortTeams(teams, query, getName = t => t.name) {
  if (!query || !query.trim()) return teams;
  const filtered = teams.filter(t => matchesQuery(getName(t), query) || matchesQuery(t.country || '', query));
  return sortByRelevance(filtered, query, getName);
}

module.exports = { normalize, matchesQuery, sortByRelevance, filterAndSortTeams };
