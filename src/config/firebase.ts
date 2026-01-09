// Firebase Configuration
import { Platform } from 'react-native';

// Firebase config (Web)
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fan-manager-2026.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "fan-manager-2026",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fan-manager-2026.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
};

// Initialize Firebase based on platform
let analytics: any = null;
let performance: any = null;

if (Platform.OS === 'web') {
  // Web Firebase (lazy load)
  import('firebase/app').then(({ initializeApp }) => {
    const app = initializeApp(firebaseConfig);
    
    import('firebase/analytics').then(({ getAnalytics }) => {
      analytics = getAnalytics(app);
      console.log('✅ Firebase Analytics initialized (Web)');
    });
    
    import('firebase/performance').then(({ getPerformance }) => {
      performance = getPerformance(app);
      console.log('✅ Firebase Performance initialized (Web)');
    });
  });
} else {
  // React Native Firebase
  // Note: Requires native setup (google-services.json / GoogleService-Info.plist)
  console.log('📱 Firebase will be initialized natively');
}

export { analytics, performance };
