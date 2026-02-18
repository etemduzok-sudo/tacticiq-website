require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env.local' });

const footballApi = require('./services/footballApi');
footballApi.clearCache();
console.log('Cache temizlendi');

const squadSyncService = require('./services/squadSyncService');
squadSyncService.syncAllSquads().then((stats) => {
  console.log('Sync tamamlandi:', JSON.stringify(stats));
  process.exit(0);
}).catch(err => {
  console.error('Hata:', err.message);
  process.exit(1);
});
