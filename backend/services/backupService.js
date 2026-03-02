/**
 * DB yedekleme servisi - hem script hem API tarafından kullanılır.
 * Tablo tablo okur/yükler; tüm tabloları aynı anda bellekte tutmaz (512MB limit için).
 */

const TABLES_TO_BACKUP = [
  'leagues',
  'teams',
  'static_teams',
  'team_squads',
  'players',
  'matches',
  'profiles',
  'predictions',
  'squad_predictions',
  'user_badges',
];

async function fetchAllRows(supabase, tableName) {
  const allRows = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`❌ ${tableName} okuma hatası:`, error.message);
      return null;
    }

    if (!data || data.length === 0) break;

    allRows.push(...data);
    offset += limit;

    if (data.length < limit) break;
  }

  return allRows;
}

/**
 * Eski API: Tüm tabloları bellekte toplar (script için; bellek riski var).
 */
async function runBackup(supabase) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const folderName = `backup-${timestamp}`;
  const tables = {};
  const results = [];

  for (const tableName of TABLES_TO_BACKUP) {
    const data = await fetchAllRows(supabase, tableName);
    if (data === null) {
      results.push({ table: tableName, success: false, count: 0 });
      continue;
    }
    tables[tableName] = data;
    results.push({ table: tableName, success: true, count: data.length });
  }

  const summary = {
    timestamp: new Date().toISOString(),
    folderName,
    tables: results,
    totalRecords: results.reduce((sum, r) => sum + (r.count || 0), 0),
  };

  return { timestamp, folderName, tables, summary };
}

/**
 * Tek tablo okur; API tarafında tablo tablo yedek alırken bellek tasarrufu için kullanılır.
 */
async function fetchOneTable(supabase, tableName) {
  return fetchAllRows(supabase, tableName);
}

module.exports = {
  TABLES_TO_BACKUP,
  runBackup,
  fetchOneTable,
};
