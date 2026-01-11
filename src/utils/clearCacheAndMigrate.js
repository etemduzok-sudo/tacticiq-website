// Utility script to clear cache and migrate team IDs
// Run this in browser console to fix the issue

(async () => {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  
  // Clear matches cache
  await AsyncStorage.removeItem('fan-manager-matches-cache');
  await AsyncStorage.removeItem('fan-manager-matches-cache-timestamp');
  console.log('✅ Matches cache cleared');
  
  // Get favorite teams
  const teamsData = await AsyncStorage.getItem('fan-manager-favorite-clubs');
  if (teamsData) {
    const teams = JSON.parse(teamsData);
    console.log('📋 Current teams:', teams);
    
    // Migrate IDs
    const OLD_TO_NEW = { 2003: 777, 2004: 25, 2005: 6, 2006: 26 };
    const migrated = teams.map(team => {
      if (OLD_TO_NEW[team.id]) {
        console.log(`🔄 Migrating ${team.name}: ${team.id} -> ${OLD_TO_NEW[team.id]}`);
        return {
          ...team,
          id: OLD_TO_NEW[team.id],
          logo: team.logo.replace(`/${team.id}.png`, `/${OLD_TO_NEW[team.id]}.png`),
        };
      }
      return team;
    });
    
    await AsyncStorage.setItem('fan-manager-favorite-clubs', JSON.stringify(migrated));
    console.log('✅ Teams migrated:', migrated);
  }
  
  console.log('🔄 Please refresh the page (Ctrl+Shift+R)');
})();
