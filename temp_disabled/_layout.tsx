// Expo Router için minimal layout (web için gerekli)
// Gerçek navigation App.tsx'te yönetiliyor
import App from '../App';

export default function RootLayout() {
  // App.tsx'i render et (gerçek navigation orada)
  return <App />;
}
