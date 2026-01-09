import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import iapService, { PremiumProduct } from '../services/iapService';

interface ProUpgradeScreenProps {
  onBack: () => void;
  onUpgradeSuccess: () => void;
}

export default function ProUpgradeScreen({ onBack, onUpgradeSuccess }: ProUpgradeScreenProps) {
  const [products, setProducts] = useState<PremiumProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    initializeIAP();
    
    return () => {
      // Cleanup on unmount
      iapService.disconnect();
    };
  }, []);

  const initializeIAP = async () => {
    setLoading(true);
    
    // Initialize IAP
    await iapService.initialize();
    
    // Get products
    const availableProducts = await iapService.getProducts();
    setProducts(availableProducts);
    
    setLoading(false);
  };

  const handlePurchase = async (productId: string) => {
    setPurchasing(true);
    setSelectedProduct(productId);
    
    const result = await iapService.purchase(productId);
    
    setPurchasing(false);
    setSelectedProduct(null);
    
    if (result.success) {
      onUpgradeSuccess();
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    const result = await iapService.restorePurchases();
    setLoading(false);
    
    if (result.success) {
      onUpgradeSuccess();
    }
  };

  const features = [
    { icon: '⚡', title: 'Sınırsız Tahmin', description: 'Tüm maçlar için sınırsız tahmin yapın' },
    { icon: '📊', title: 'Gelişmiş İstatistikler', description: 'Detaylı analiz ve raporlar' },
    { icon: '🚫', title: 'Reklamsız Deneyim', description: 'Hiç reklam görmeden kullanın' },
    { icon: '🏆', title: 'Özel Rozetler', description: 'Premium kullanıcılara özel rozetler' },
    { icon: '👑', title: 'Liderlik Tablosu Önceliği', description: 'Liderlik tablosunda öne çıkın' },
    { icon: '💬', title: 'Öncelikli Destek', description: '7/24 premium destek hizmeti' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium Üyelik</Text>
          <TouchableOpacity onPress={handleRestorePurchases} style={styles.restoreButton}>
            <Ionicons name="refresh" size={20} color="#059669" />
            <Text style={styles.restoreText}>Geri Yükle</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <LinearGradient
            colors={['rgba(5, 150, 105, 0.2)', 'transparent']}
            style={styles.hero}
          >
            <View style={styles.crownIcon}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
            <Text style={styles.heroTitle}>Premium'a Geç</Text>
            <Text style={styles.heroSubtitle}>
              Tüm özelliklere sınırsız erişim kazanın
            </Text>
          </LinearGradient>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Premium Özellikler</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureEmoji}>{feature.icon}</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Planları Seç</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.loadingText}>Planlar yükleniyor...</Text>
              </View>
            ) : (
              products.map((product, index) => (
                <TouchableOpacity
                  key={product.productId}
                  onPress={() => handlePurchase(product.productId)}
                  disabled={purchasing}
                  activeOpacity={0.8}
                  style={styles.productCard}
                >
                  <LinearGradient
                    colors={
                      product.popular
                        ? ['rgba(5, 150, 105, 0.2)', 'rgba(5, 150, 105, 0.05)']
                        : ['rgba(30, 41, 59, 0.5)', 'transparent']
                    }
                    style={styles.productGradient}
                  >
                    {product.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>🔥 EN POPÜLER</Text>
                      </View>
                    )}
                    
                    {product.discount && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{product.discount}</Text>
                      </View>
                    )}

                    <View style={styles.productHeader}>
                      <Text style={styles.productTitle}>{product.title}</Text>
                      <Text style={styles.productPrice}>{product.price}</Text>
                    </View>

                    <Text style={styles.productDescription}>{product.description}</Text>
                    <Text style={styles.productDuration}>{product.duration}</Text>

                    {purchasing && selectedProduct === product.productId ? (
                      <ActivityIndicator size="small" color="#FFFFFF" style={styles.purchaseLoader} />
                    ) : (
                      <View style={styles.buyButton}>
                        <Text style={styles.buyButtonText}>Satın Al</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              • Abonelik otomatik olarak yenilenir{'\n'}
              • İstediğiniz zaman iptal edebilirsiniz{'\n'}
              • Google Play / App Store üzerinden yönetilir
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5, 150, 105, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFB',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restoreText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  
  // Content
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  
  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  crownIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  crownEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFB',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  
  // Features Section
  featuresSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFB',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.1)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFB',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  
  // Pricing Section
  pricingSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  productCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  productGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFB',
  },
  productPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  productDescription: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
  },
  productDuration: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  purchaseLoader: {
    paddingVertical: 14,
  },
  
  // Info Section
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'center',
  },
});
