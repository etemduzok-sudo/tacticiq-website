// TacticIQ - Sohbet Sekmesi (Yakında)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChatScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const colors = isLight ? COLORS.light : COLORS.dark;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, isLight && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('chat.title')}</Text>
        <View style={[styles.comingSoonBadge, isLight && { backgroundColor: 'rgba(201, 164, 76, 0.15)', borderColor: colors.border }]}>
          <Text style={[styles.comingSoonBadgeText, isLight && { color: '#B45309' }]}>{t('chat.comingSoon')}</Text>
        </View>
      </View>
      
      <View style={styles.comingSoonContainer}>
        {isLight ? (
          <View style={[
            styles.comingSoonCard,
            {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}>
            <View style={[styles.iconContainer, isLight && { backgroundColor: colors.muted, borderRadius: 60, padding: 4 }]}>
              <Ionicons name="chatbubbles-outline" size={60} color="#1FA2A6" />
            </View>
            <Text style={[styles.comingSoonTitle, { color: colors.foreground }]}>{t('chat.roomTitle')}</Text>
            <Text style={[styles.comingSoonSubtitle, { color: '#047857' }]}>{t('chat.comingSoonSubtitle')}</Text>
            <Text style={[styles.comingSoonDescription, { color: colors.mutedForeground }]}>
              {t('chat.comingSoonDescription')}
            </Text>
            <View style={styles.featuresContainer}>
              {[t('chat.featureLiveChat'), t('chat.featureTeamRooms'), t('chat.featureEmoji'), t('chat.featureModeration')].map((label) => (
                <View key={label} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#1FA2A6" />
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{label}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.betaInfoContainer, isLight && { backgroundColor: 'rgba(201, 164, 76, 0.12)', borderColor: colors.border }]}>
              <Ionicons name="rocket-outline" size={16} color="#C9A44C" />
              <Text style={[styles.betaInfoText, isLight && { color: '#B45309' }]}>
                {t('chat.betaAccessInfo')}
              </Text>
            </View>
          </View>
        ) : (
          <LinearGradient
            colors={['#1A2E2A', '#0F2420']}
            style={[styles.comingSoonCard, { borderWidth: 1, borderColor: 'rgba(31, 162, 166, 0.25)' }]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(31, 162, 166, 0.3)', 'rgba(31, 162, 166, 0.1)']}
                style={styles.iconGradient}
              >
                <Ionicons name="chatbubbles-outline" size={60} color="#1FA2A6" />
              </LinearGradient>
            </View>
            <Text style={styles.comingSoonTitle}>{t('chat.roomTitle')}</Text>
            <Text style={styles.comingSoonSubtitle}>{t('chat.comingSoonSubtitle')}</Text>
            <Text style={styles.comingSoonDescription}>
              {t('chat.comingSoonDescription')}
            </Text>
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#1FA2A6" />
                <Text style={styles.featureText}>{t('chat.featureLiveChat')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#1FA2A6" />
                <Text style={styles.featureText}>{t('chat.featureTeamRooms')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#1FA2A6" />
                <Text style={styles.featureText}>{t('chat.featureEmoji')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#1FA2A6" />
                <Text style={styles.featureText}>{t('chat.featureModeration')}</Text>
              </View>
            </View>
            <View style={styles.betaInfoContainer}>
              <Ionicons name="rocket-outline" size={16} color="#C9A44C" />
              <Text style={styles.betaInfoText}>
                {t('chat.betaAccessInfo')}
              </Text>
            </View>
          </LinearGradient>
        )}
        
        <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
          {t('chat.footerNote')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(201, 164, 76, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9A44C',
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C9A44C',
  },
  comingSoonContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonCard: {
    width: '100%',
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: '#1FA2A6',
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  betaInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 164, 76, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.3)',
  },
  betaInfoText: {
    fontSize: 12,
    color: '#C9A44C',
    fontWeight: '500',
  },
  footerNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 18,
  },
});
