// Setup Test User Script
// Sets up "oro" user for testing

const fs = require('fs');
const path = require('path');

// This script will be run manually or via a command
// It creates a test user data structure

const testUser = {
  id: 'oro-test-user-id',
  username: 'oro',
  email: 'oro@test.com',
  authenticated: true,
  createdAt: new Date().toISOString(),
};

console.log('✅ Test user data structure:');
console.log(JSON.stringify(testUser, null, 2));

// Note: This will be set in AsyncStorage when app starts
// Or you can manually set it in the app
