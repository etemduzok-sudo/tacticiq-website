// Web için ana giriş noktası
import { Redirect } from 'expo-router';

export default function Index() {
  // Ana uygulama yapısına yönlendir
  return <Redirect href="/" />;
}
