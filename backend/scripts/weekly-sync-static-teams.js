// =====================================================
// Weekly Static Teams Sync Script
// =====================================================
// Haftada 1 kez çalıştırılacak cron job
// Tüm takımları API-Football'dan çekip static_teams DB'sine kaydeder
// 2 ay önceki verileri otomatik temizler
// =====================================================

const staticTeamsService = require('../services/staticTeamsService');
require('dotenv').config();

async function main() {
  console.log('🚀 Starting weekly static teams sync...');
  console.log(`⏰ ${new Date().toISOString()}`);
  
  try {
    const result = await staticTeamsService.syncAllTeams();
    
    console.log('✅ Weekly sync completed successfully!');
    console.log(`📊 Teams added/updated: ${result.teamsAdded}`);
    console.log(`⏱️  Duration: ${result.duration}s`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Weekly sync failed:', error);
    process.exit(1);
  }
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
  main();
}

module.exports = main;
