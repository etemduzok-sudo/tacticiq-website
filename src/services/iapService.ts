// src/services/iapService.ts
import { Platform, Alert } from 'react-native';
import authService from './authService';

// Web için IAP mock
let RNIap: any = null;
if (Platform.OS !== 'web') {
  try {
    RNIap = require('react-native-iap');
  } catch (e) {
    console.warn('react-native-iap not available');
  }
}

// Product IDs (Google Play ve App Store'da aynı olmalı)
export const PREMIUM_PRODUCTS = {
  MONTHLY: 'fan_manager_premium_monthly',
  QUARTERLY: 'fan_manager_premium_quarterly',
  YEARLY: 'fan_manager_premium_yearly',
};

// Product bilgileri
export interface PremiumProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  duration: string;
  discount?: string;
  popular?: boolean;
}

class IAPService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isInitialized = false;

  // IAP sistemini başlat
  async initialize() {
    if (this.isInitialized) return;

    // Web'de IAP yok
    if (Platform.OS === 'web' || !RNIap) {
      console.log('⚠️ IAP not available on web platform');
      this.isInitialized = true;
      return { success: true };
    }

    try {
      await RNIap.initConnection();
      console.log('✅ IAP Connection initialized');

      // Purchase listener'ları ayarla
      this.setupListeners();

      // Pending purchases'ları kontrol et
      await this.checkPendingPurchases();

      this.isInitialized = true;
      return { success: true };
    } catch (error: any) {
      console.error('❌ IAP initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  // Listener'ları ayarla
  private setupListeners() {
    if (Platform.OS === 'web' || !RNIap) return;

    // Purchase başarılı
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: any) => {
        console.log('📦 Purchase received:', purchase);
        const receipt = purchase.transactionReceipt || purchase.purchaseToken;

        if (receipt) {
          try {
            // Backend'e gönder ve doğrula
            await this.verifyPurchase(purchase);

            // iOS için transaction'ı bitir
            if (Platform.OS === 'ios') {
              await RNIap.finishTransaction({ purchase, isConsumable: false });
            } else {
              // Android için acknowledge et
              await RNIap.acknowledgePurchaseAndroid({ 
                token: purchase.purchaseToken,
                developerPayload: purchase.developerPayloadAndroid,
              });
            }

            console.log('✅ Purchase verified and finished');
          } catch (error) {
            console.error('❌ Purchase verification failed:', error);
          }
        }
      }
    );

    // Purchase hatası
    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: any) => {
        console.warn('⚠️ Purchase error:', error);
        if (error.code !== 'E_USER_CANCELLED') {
          Alert.alert('Satın Alma Hatası', error.message);
        }
      }
    );
  }

  // Pending purchases'ları kontrol et
  private async checkPendingPurchases() {
    if (Platform.OS === 'web' || !RNIap) return;

    try {
      const purchases = await RNIap.getAvailablePurchases();
      console.log('📋 Available purchases:', purchases);

      for (const purchase of purchases) {
        await this.verifyPurchase(purchase);
      }
    } catch (error) {
      console.error('❌ Error checking pending purchases:', error);
    }
  }

  // Ürünleri getir
  async getProducts(): Promise<PremiumProduct[]> {
    // Web'de mock products döndür
    if (Platform.OS === 'web' || !RNIap) {
      return this.getMockProducts();
    }

    try {
      const productIds = Object.values(PREMIUM_PRODUCTS);
      
      if (Platform.OS === 'ios') {
        const products = await RNIap.getProducts({ skus: productIds });
        return this.formatProducts(products);
      } else {
        const products = await RNIap.getSubscriptions({ skus: productIds });
        return this.formatProducts(products);
      }
    } catch (error: any) {
      console.error('❌ Error getting products:', error);
      return this.getMockProducts(); // Fallback mock data
    }
  }

  // Ürünleri formatla
  private formatProducts(products: any[]): PremiumProduct[] {
    return products.map((product) => {
      const formatted: PremiumProduct = {
        productId: product.productId,
        title: product.title,
        description: product.description,
        price: product.localizedPrice || product.price,
        currency: product.currency,
        duration: this.getDuration(product.productId),
      };

      // Popular badge
      if (product.productId === PREMIUM_PRODUCTS.YEARLY) {
        formatted.popular = true;
        formatted.discount = '50% İndirim';
      }

      return formatted;
    });
  }

  // Mock products (test için)
  private getMockProducts(): PremiumProduct[] {
    return [
      {
        productId: PREMIUM_PRODUCTS.MONTHLY,
        title: 'Aylık Premium',
        description: '1 ay boyunca tüm premium özellikler',
        price: '₺29.99',
        currency: 'TRY',
        duration: '1 Ay',
      },
      {
        productId: PREMIUM_PRODUCTS.QUARTERLY,
        title: '3 Aylık Premium',
        description: '3 ay boyunca tüm premium özellikler',
        price: '₺69.99',
        currency: 'TRY',
        duration: '3 Ay',
        discount: '20% İndirim',
      },
      {
        productId: PREMIUM_PRODUCTS.YEARLY,
        title: 'Yıllık Premium',
        description: '1 yıl boyunca tüm premium özellikler',
        price: '₺179.99',
        currency: 'TRY',
        duration: '1 Yıl',
        discount: '50% İndirim',
        popular: true,
      },
    ];
  }

  // Duration string'i al
  private getDuration(productId: string): string {
    switch (productId) {
      case PREMIUM_PRODUCTS.MONTHLY:
        return '1 Ay';
      case PREMIUM_PRODUCTS.QUARTERLY:
        return '3 Ay';
      case PREMIUM_PRODUCTS.YEARLY:
        return '1 Yıl';
      default:
        return '1 Ay';
    }
  }

  // Satın alma işlemi başlat
  async purchase(productId: string) {
    // Web'de mock purchase
    if (Platform.OS === 'web' || !RNIap) {
      Alert.alert('Bilgi', 'Web platformunda satın alma işlemi yapılamaz. Mobil uygulamayı kullanın.');
      return { success: false, error: 'Web platform not supported' };
    }

    try {
      if (Platform.OS === 'ios') {
        await RNIap.requestPurchase({ sku: productId });
      } else {
        await RNIap.requestSubscription({ sku: productId });
      }
      return { success: true };
    } catch (error: any) {
      console.error('❌ Purchase request failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Satın almayı doğrula (Backend'e gönder)
  private async verifyPurchase(purchase: any) {
    try {
      const receipt = purchase.transactionReceipt || purchase.purchaseToken;
      
      // Backend'e doğrulama isteği gönder
      // Bu kısım backend'inizde /api/verify-purchase endpoint'i olmalı
      // Şimdilik Supabase'de user'ı premium yap
      
      const premiumUntil = this.calculatePremiumExpiry(purchase.productId);
      
      await authService.updateProfile({
        is_premium: true,
        premium_until: premiumUntil,
      });

      Alert.alert(
        '🎉 Premium Aktif!',
        'Premium üyeliğiniz başarıyla etkinleştirildi!'
      );

      return { success: true };
    } catch (error: any) {
      console.error('❌ Purchase verification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Premium bitiş tarihini hesapla
  private calculatePremiumExpiry(productId: string): string {
    const now = new Date();
    
    switch (productId) {
      case PREMIUM_PRODUCTS.MONTHLY:
        now.setMonth(now.getMonth() + 1);
        break;
      case PREMIUM_PRODUCTS.QUARTERLY:
        now.setMonth(now.getMonth() + 3);
        break;
      case PREMIUM_PRODUCTS.YEARLY:
        now.setFullYear(now.getFullYear() + 1);
        break;
    }
    
    return now.toISOString();
  }

  // Abonelik durumunu kontrol et
  async checkSubscription() {
    if (Platform.OS === 'web' || !RNIap) {
      return { isActive: false };
    }

    try {
      const purchases = await RNIap.getAvailablePurchases();
      
      if (purchases.length > 0) {
        // Aktif abonelik var
        const latestPurchase = purchases[purchases.length - 1];
        return {
          isActive: true,
          productId: latestPurchase.productId,
          expiryDate: latestPurchase.transactionDate,
        };
      }
      
      return { isActive: false };
    } catch (error: any) {
      console.error('❌ Error checking subscription:', error);
      return { isActive: false, error: error.message };
    }
  }

  // Aboneliği iptal et (kullanıcıyı ayarlara yönlendir)
  cancelSubscription() {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Aboneliği İptal Et',
        'App Store ayarlarından aboneliğinizi iptal edebilirsiniz.',
        [
          { text: 'Tamam' },
        ]
      );
    } else {
      Alert.alert(
        'Aboneliği İptal Et',
        'Google Play ayarlarından aboneliğinizi iptal edebilirsiniz.',
        [
          { text: 'Tamam' },
        ]
      );
    }
  }

  // Satın alma geçmişini geri yükle
  async restorePurchases() {
    if (Platform.OS === 'web' || !RNIap) {
      Alert.alert('Bilgi', 'Web platformunda satın alma geri yükleme yapılamaz.');
      return { success: false };
    }

    try {
      const purchases = await RNIap.getAvailablePurchases();
      
      if (purchases.length === 0) {
        Alert.alert('Bilgi', 'Geri yüklenecek satın alma bulunamadı.');
        return { success: false };
      }

      // En son satın almayı doğrula
      const latestPurchase = purchases[purchases.length - 1];
      await this.verifyPurchase(latestPurchase);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error restoring purchases:', error);
      Alert.alert('Hata', 'Satın almalar geri yüklenemedi.');
      return { success: false, error: error.message };
    }
  }

  // Connection'ı kapat
  async disconnect() {
    if (Platform.OS === 'web' || !RNIap) {
      this.isInitialized = false;
      return;
    }

    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }

      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      await RNIap.endConnection();
      this.isInitialized = false;
      console.log('✅ IAP Connection closed');
    } catch (error) {
      console.error('❌ Error disconnecting IAP:', error);
    }
  }
}

export default new IAPService();
