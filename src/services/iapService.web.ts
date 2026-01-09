// IAP Service - Web Mock
// Web doesn't support in-app purchases, so this is a mock implementation

import { Platform, Alert } from 'react-native';

class IAPService {
  private static instance: IAPService;

  private constructor() {
    console.log('📱 IAP Service (Web Mock) initialized');
  }

  static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  async initialize() {
    console.log('📱 IAP Service (Web): Skipping initialization on web');
    return true;
  }

  async getProducts() {
    console.log('📱 IAP Service (Web): Mock products');
    return [];
  }

  async purchaseProduct(productId: string) {
    console.log('📱 IAP Service (Web): Mock purchase', productId);
    Alert.alert(
      'Web Sürümü',
      'In-app satın almalar sadece mobil uygulamada çalışır.',
      [{ text: 'Tamam' }]
    );
    return null;
  }

  async restorePurchases() {
    console.log('📱 IAP Service (Web): Mock restore');
    return [];
  }
}

export default IAPService.getInstance();
