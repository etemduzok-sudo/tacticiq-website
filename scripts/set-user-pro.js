// Test script to set user as Pro for testing
// This updates AsyncStorage to enable Pro features

const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const { STORAGE_KEYS } = require('../src/config/constants');

async function setUserPro() {
  try {
    console.log('🔄 Setting user as Pro...');
    
    // Get current user data
    const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    
    if (!userDataStr) {
      console.log('❌ No user data found. Please login first.');
      return;
    }
    
    const userData = JSON.parse(userDataStr);
    
    // Update to Pro
    const updatedUser = {
      ...userData,
      isPro: true,
      is_pro: true,
      isPremium: true,
      plan: 'pro',
    };
    
    // Save updated user data
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    
    // Also set Pro status flag
    await AsyncStorage.setItem(STORAGE_KEYS.PRO_STATUS, 'true');
    
    console.log('✅ User successfully set as Pro!');
    console.log('📋 Updated user data:', {
      id: updatedUser.id,
      email: updatedUser.email,
      isPro: updatedUser.isPro,
      is_pro: updatedUser.is_pro,
      plan: updatedUser.plan,
    });
    console.log('');
    console.log('🎉 You can now select club teams (up to 5)!');
    
  } catch (error) {
    console.error('❌ Error setting user as Pro:', error);
  }
}

// For React Native - this would be called from the app
// For now, we'll create a simpler browser-console version
if (typeof window !== 'undefined') {
  window.setUserPro = async () => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const { STORAGE_KEYS } = await import('../src/config/constants');
    
    const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!userDataStr) {
      console.log('❌ No user data found. Please login first.');
      return;
    }
    
    const userData = JSON.parse(userDataStr);
    const updatedUser = {
      ...userData,
      isPro: true,
      is_pro: true,
      isPremium: true,
      plan: 'pro',
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    await AsyncStorage.setItem(STORAGE_KEYS.PRO_STATUS, 'true');
    
    console.log('✅ User set as Pro!');
  };
}

module.exports = { setUserPro };