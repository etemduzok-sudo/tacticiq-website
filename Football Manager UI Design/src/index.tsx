// This file is a placeholder for Figma Make compatibility
// This React Native project does NOT run in the browser

console.error(`
⚠️ WARNING: This is a React Native project!

This application cannot run in a web browser or Figma Make.
It requires React Native runtime (iOS/Android).

To run this project:
1. Download the entire project
2. Run: npm install
3. Run: npm start
4. Use Expo Go app on your phone to scan the QR code

See README.md for detailed instructions.
`);

// Redirect to info page
if (typeof window !== 'undefined') {
  window.location.href = '/index.html';
}

export default {};
