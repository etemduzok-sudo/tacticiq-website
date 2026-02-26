// UpgradeToProScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { PaymentOptionsModal } from './PaymentOptionsModal';
import { useTranslation } from '../hooks/useTranslation';

interface UpgradeToProScreenProps {
  onClose: () => void;
  onUpgradeSuccess: () => void;
}

const proFeatureKeys = [
  { id: '1', icon: 'flash', titleKey: 'upgrade.unlimitedPredictions', descKey: 'upgrade.unlimitedPredictionsDesc', color: '#F59E0B' },
  { id: '2', icon: 'trophy', titleKey: 'upgrade.specialTournaments', descKey: 'upgrade.specialTournamentsDesc', color: '#F59E0B' },
  { id: '3', icon: 'analytics', titleKey: 'upgrade.detailedStats', descKey: 'upgrade.detailedStatsDesc', color: '#F59E0B' },
  { id: '4', icon: 'shield-checkmark', titleKey: 'upgrade.adFree', descKey: 'upgrade.adFreeDesc', color: '#F59E0B' },
  { id: '5', icon: 'star', titleKey: 'upgrade.specialBadges', descKey: 'upgrade.specialBadgesDesc', color: '#F59E0B' },
  { id: '6', icon: 'people', titleKey: 'upgrade.prioritySupport', descKey: 'upgrade.prioritySupportDesc', color: '#F59E0B' },
];

const pricingPlans = [
  { id: 'monthly', titleKey: 'upgrade.monthly', price: '49,99', periodKey: 'upgrade.periodMonth', badgeKey: null, savingsKey: null, color: ['#059669', '#047857'] },
  { id: 'yearly', titleKey: 'upgrade.yearly', price: '399,99', periodKey: 'upgrade.periodYear', badgeKey: 'upgrade.discountBadge', savingsKey: 'upgrade.savingsText', color: ['#F59E0B', '#D97706'], popular: true },
];

const getComparisonFeatures = (t: (k: string) => string) => [
  { feature: t('upgrade.comparisonDailyLimit'), free: t('upgrade.comparisonFree3'), pro: t('upgrade.comparisonUnlimited') },
  { feature: t('upgrade.comparisonSpecialTournaments'), free: '❌', pro: '✅' },
  { feature: t('upgrade.comparisonDetailedStats'), free: '❌', pro: '✅' },
  { feature: t('upgrade.comparisonAdFree'), free: '❌', pro: '✅' },
  { feature: t('upgrade.comparisonBadges'), free: '❌', pro: '✅' },
  { feature: t('upgrade.comparisonSupport'), free: '❌', pro: '✅' },
];

export const UpgradeToProScreen: React.FC<UpgradeToProScreenProps> = ({
  onClose,
  onUpgradeSuccess,
}) => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const handleUpgrade = () => {
    setPaymentModalVisible(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalVisible(false);
    onUpgradeSuccess();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.delay(0)} style={styles.heroSection}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.proIconContainer}
            >
              <Ionicons name="trophy" size={48} color="#FFFFFF" />
            </LinearGradient>

            <Text style={styles.heroTitle}>{t('upgrade.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>
              {t('upgrade.heroSubtitle')}
            </Text>
          </Animated.View>

          {/* Pricing Plans */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>{t('upgrade.choosePlan')}</Text>

            <View style={styles.pricingCards}>
              {pricingPlans.map((plan, index) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.pricingCard,
                    selectedPlan === plan.id && styles.pricingCardSelected,
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                  activeOpacity={0.8}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>{t('upgrade.mostPopular')}</Text>
                    </View>
                  )}

                  {plan.badgeKey && (
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      style={styles.discountBadge}
                    >
                      <Text style={styles.discountBadgeText}>{t(plan.badgeKey)}</Text>
                    </LinearGradient>
                  )}

                  <View style={styles.pricingCardContent}>
                    <Text style={styles.planTitle}>{t(plan.titleKey)}</Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.price}>₺{plan.price}</Text>
                      <Text style={styles.period}>{plan.periodKey ? t(plan.periodKey) : ''}</Text>
                    </View>

                    {plan.savingsKey && (
                      <Text style={styles.savings}>{t(plan.savingsKey)}</Text>
                    )}

                    {selectedPlan === plan.id && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={24} color="#059669" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Pro Features */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>{t('upgrade.premiumFeatures')}</Text>

            <View style={styles.featuresList}>
              {proFeatureKeys.map((feature, index) => (
                <Animated.View
                  key={feature.id}
                  entering={FadeInDown.delay(250 + index * 50)}
                  style={styles.featureItem}
                >
                  <View
                    style={[
                      styles.featureIcon,
                      { backgroundColor: `${feature.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={feature.icon as any}
                      size={20}
                      color={feature.color}
                    />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
                    <Text style={styles.featureDescription}>
                      {t(feature.descKey)}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Comparison Table */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.comparisonSection}>
            <Text style={styles.sectionTitle}>{t('upgrade.freeVsPro')}</Text>

            <View style={styles.comparisonTable}>
              {/* Header */}
              <View style={styles.comparisonHeader}>
                <Text style={styles.comparisonHeaderCell}>{t('upgrade.feature')}</Text>
                <Text style={styles.comparisonHeaderCell}>{t('upgrade.free')}</Text>
                <Text style={[styles.comparisonHeaderCell, styles.proHeaderCell]}>
                  {t('upgrade.pro').toUpperCase()}
                </Text>
              </View>

              {/* Rows */}
              {getComparisonFeatures(t).map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.comparisonRow,
                    index % 2 === 0 && styles.comparisonRowEven,
                  ]}
                >
                  <Text style={styles.comparisonFeature}>{item.feature}</Text>
                  <Text style={styles.comparisonValue}>{item.free}</Text>
                  <Text style={[styles.comparisonValue, styles.proValue]}>
                    {item.pro}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomCTA}>
          <View style={styles.ctaContent}>
            <View style={styles.ctaLeft}>
              <Text style={styles.ctaPrice}>
                ₺{pricingPlans.find((p) => p.id === selectedPlan)?.price}
              </Text>
              <Text style={styles.ctaPeriod}>
                {pricingPlans.find((p) => p.id === selectedPlan)?.period}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeButtonGradient}
              >
                <Text style={styles.upgradeButtonText}>{t('upgrade.upgradeToPro')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            {t('upgrade.disclaimer')}
          </Text>
        </View>

        {/* Payment Modal */}
        <PaymentOptionsModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          onSuccess={handlePaymentSuccess}
          selectedPlan={pricingPlans.find((p) => p.id === selectedPlan)!}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  proIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Pricing Section
  pricingSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  pricingCards: {
    gap: 16,
  },
  pricingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  pricingCardSelected: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pricingCardContent: {
    padding: 20,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  period: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  savings: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: 20,
    right: 20,
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },

  // Comparison Section
  comparisonSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  comparisonTable: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  comparisonHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    padding: 12,
    textAlign: 'center',
  },
  proHeaderCell: {
    color: '#F59E0B',
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  comparisonRowEven: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  comparisonFeature: {
    flex: 1,
    fontSize: 12,
    color: '#FFFFFF',
    padding: 12,
  },
  comparisonValue: {
    flex: 1,
    fontSize: 12,
    color: '#9CA3AF',
    padding: 12,
    textAlign: 'center',
  },
  proValue: {
    color: '#F59E0B',
    fontWeight: '600',
  },

  // Bottom CTA
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ctaPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ctaPeriod: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
