// Web için özel entry point - Expo Router olmadan
import { registerRootComponent } from 'expo';
import App from './App';

// Web için doğrudan App.tsx'i kullan (Expo Router bypass)
registerRootComponent(App);
