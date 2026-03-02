/**
 * DB yedekleme servisi - hem script hem API tarafından kullanılır.
 * Supabase'den tabloları okur, bellek içi yedek döndürür.
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
 * Yedek verisini üretir (disk veya Storage'a yazmaz).
 * @param {object} supabase - Supabase client
 * @returns {Promise<{ timestamp: string, folderName: string, tables: object, summary: object }>}
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

module.exports = {
  TABLES_TO_BACKUP,
  runBackup,
};
