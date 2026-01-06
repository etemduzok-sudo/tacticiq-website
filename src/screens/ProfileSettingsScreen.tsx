import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ProfileSettingsScreenProps {
  onBack: () => void;
  onNavigateToFavoriteTeams: () => void;
  onNavigateToLanguage: () => void;
  onLogout: () => void;
  onNavigateToChangePassword: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToDeleteAccount: () => void;
  onNavigateToProUpgrade: () => void;
}

type Theme = 'dark' | 'light' | 'system';

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  onBack, 
  onNavigateToFavoriteTeams, 
  onNavigateToLanguage, 
  onLogout,
  onNavigateToChangePassword,
  onNavigateToNotifications,
  onNavigateToDeleteAccount,
  onNavigateToProUpgrade,
}) => {
  const [name, setName] = useState('Ahmet Yılmaz');
  const [username, setUsername] = useState('ahmetyilmaz');
  const [theme, setTheme] = useState<Theme>('dark');
  const [hasChanges, setHasChanges] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const isPro = false;

  const favoriteClubs = ['Galatasaray'];
  const favoriteNational = 'Türkiye';
  const currentLanguage = 'Türkçe';

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(true);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setHasChanges(true);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setHasChanges(true);
    Alert.alert('Tema Değişti', `${newTheme} tema uygulandı`);
  };

  const handleSave = () => {
    setHasChanges(false);
    Alert.alert('Başarılı', 'Değişiklikler kaydedildi! ✓');
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    // Direkt çıkış yap - modal'da zaten onay alındı
    setTimeout(() => {
      onLogout();
    }, 100);
  };

  const handleBackPress = () => {
    if (hasChanges) {
      Alert.alert(
        'Kaydedilmemiş Değişiklikler',
        'Değişiklikleriniz kaydedilmedi. Çıkmak istediğinize emin misiniz?',
        [
          { text: 'Hayır', style: 'cancel' },
          { text: 'Evet', onPress: () => onBack() },
        ]
      );
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil Ayarları</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Info Card */}
          <Animated.View entering={FadeInDown.delay(0)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Temel Bilgiler</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>İsim Soy İsim</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={handleNameChange}
                placeholder="Adınız ve soyadınız"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kullanıcı Adı</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="Kullanıcı adınız"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />
            </View>
          </Animated.View>

          {/* Favorite Teams Card */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Favori Takımlar</Text>
      </View>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={onNavigateToFavoriteTeams}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="trophy" size={20} color="#9CA3AF" />
                <View style={styles.settingItemText}>
                  <Text style={styles.settingItemTitle}>Kulüpler</Text>
                  <Text style={styles.settingItemSubtitle}>
                    {favoriteClubs.join(', ')}
                  </Text>
                </View>
              </View>
              <View style={styles.settingItemRight}>
                <Text style={styles.limitText}>
                  {favoriteClubs.length}/{isPro ? 3 : 1}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={onNavigateToFavoriteTeams}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="flag" size={20} color="#9CA3AF" />
                <View style={styles.settingItemText}>
                  <Text style={styles.settingItemTitle}>Milli Takım</Text>
                  <Text style={styles.settingItemSubtitle}>
                    {favoriteNational || 'Opsiyonel'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color="#3B82F6" />
              <Text style={styles.infoText}>
                Takım limitleri planınıza göre uygulanır. PRO kullanıcılar 3 kulüp seçebilir.
              </Text>
            </View>
          </Animated.View>

          {/* Language Card */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="globe-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Dil</Text>
            </View>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={onNavigateToLanguage}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="globe" size={20} color="#9CA3AF" />
                <View style={styles.settingItemText}>
                  <Text style={styles.settingItemTitle}>Uygulama Dili</Text>
                  <Text style={styles.settingItemSubtitle}>{currentLanguage}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={[styles.infoBox, styles.infoBoxYellow]}>
              <Ionicons name="information-circle" size={16} color="#F59E0B" />
              <Text style={styles.infoText}>
                Dil değişikliği uygulamayı yeniden başlatır.
              </Text>
            </View>
          </Animated.View>

          {/* Theme Card */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="color-palette-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Tema</Text>
            </View>

            <View style={styles.themeGrid}>
              {[
                { id: 'dark', name: 'Koyu', icon: 'moon' },
                { id: 'light', name: 'Açık', icon: 'sunny' },
                { id: 'system', name: 'Otomatik', icon: 'desktop' },
              ].map((themeOption) => {
                const isSelected = theme === themeOption.id;
                return (
                  <TouchableOpacity
                    key={themeOption.id}
                    style={[
                      styles.themeOption,
                      isSelected && styles.themeOptionSelected,
                    ]}
                    onPress={() => handleThemeChange(themeOption.id as Theme)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={themeOption.icon as any}
                      size={24}
                      color={isSelected ? '#059669' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.themeName,
                        isSelected && styles.themeNameSelected,
                      ]}
                    >
                      {themeOption.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#059669" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* PRO Membership Card */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <LinearGradient
              colors={
                isPro
                  ? ['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)', 'transparent']
                  : ['rgba(245, 158, 11, 0.1)', 'transparent']
              }
              style={[styles.proCard, isPro && styles.proCardActive]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="crown" size={20} color="#F59E0B" />
                <Text style={styles.cardTitle}>PRO Üyelik</Text>
              </View>

              {isPro ? (
                <>
                  <View style={styles.proHeaderActive}>
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      style={styles.proIconActive}
                    >
                      <Ionicons name="crown" size={24} color="#FFFFFF" />
                    </LinearGradient>
                    <View>
                      <Text style={styles.proTitleActive}>PRO Aktif</Text>
                      <Text style={styles.proSubtitle}>
                        Premium özelliklerin keyfini çıkarın
                      </Text>
                    </View>
                  </View>

                  <View style={styles.proFeatures}>
                    {['3 kulüp takibi', 'Gelişmiş istatistikler', 'Özel rozetler', 'Öncelikli destek'].map(
                      (feature) => (
                        <View key={feature} style={styles.proFeatureItem}>
                          <Ionicons name="checkmark" size={16} color="#F59E0B" />
                          <Text style={styles.proFeatureText}>{feature}</Text>
                        </View>
                      )
                    )}
                  </View>

                  <TouchableOpacity style={styles.manageSubscriptionButton}>
                    <Text style={styles.manageSubscriptionText}>Aboneliği Yönet</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.proHeaderInactive}>
                    <View style={styles.proIconInactive}>
                      <Ionicons name="crown" size={24} color="#F59E0B" />
                    </View>
                    <View>
                      <Text style={styles.proTitleInactive}>PRO'ya Geç</Text>
                      <Text style={styles.proSubtitle}>Premium özellikleri keşfedin</Text>
                    </View>
                  </View>

                  <View style={styles.proFeaturesSimple}>
                    {['• 3 kulüp takibi', '• Gelişmiş istatistikler', '• Özel rozetler'].map(
                      (feature) => (
                        <Text key={feature} style={styles.proFeatureSimple}>
                          {feature}
                        </Text>
                      )
                    )}
                  </View>

                  <TouchableOpacity onPress={onNavigateToProUpgrade} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      style={styles.proUpgradeButton}
                    >
                      <Text style={styles.proUpgradeButtonText}>PRO Aç</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Account Card */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="lock-closed-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Hesap</Text>
            </View>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={onNavigateToChangePassword}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                <View style={styles.settingItemText}>
                  <Text style={styles.settingItemTitle}>Şifre Değiştir</Text>
                  <Text style={styles.settingItemSubtitle}>Güvenliğini artır</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={onNavigateToNotifications}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="notifications" size={20} color="#9CA3AF" />
                <View style={styles.settingItemText}>
                  <Text style={styles.settingItemTitle}>Bildirimler</Text>
                  <Text style={styles.settingItemSubtitle}>Maç uyarıları, haberler</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.logoutButton]}
              onPress={() => setShowLogoutDialog(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="log-out" size={20} color="#EF4444" />
                <View style={styles.settingItemText}>
                  <Text style={styles.logoutText}>Çıkış Yap</Text>
                  <Text style={styles.logoutSubtext}>Oturumu kapat</Text>
                </View>
          </View>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
        </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.deleteButton]}
              onPress={onNavigateToDeleteAccount}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="trash" size={20} color="#EF4444" />
                <View style={styles.settingItemText}>
                  <Text style={styles.deleteText}>Hesabı Sil</Text>
                  <Text style={styles.deleteSubtext}>Kalıcı olarak sil</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Bottom Save Button */}
        {hasChanges && (
          <Animated.View entering={FadeInDown} style={styles.saveButtonContainer}>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
              <LinearGradient
                colors={['#059669', '#047857']}
                style={styles.saveButton}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Logout Confirmation Modal */}
        <Modal
          visible={showLogoutDialog}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInDown} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Çıkış Yap</Text>
              <Text style={styles.modalMessage}>
                Oturumu kapatmak istediğinize emin misiniz?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setShowLogoutDialog(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonCancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonConfirm}
                  onPress={handleLogoutConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonConfirmText}>Çıkış Yap</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },

  // Card
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Input
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  settingItemSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limitText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    marginTop: 12,
  },
  infoBoxYellow: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Theme
  themeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  themeOptionSelected: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  themeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 8,
  },
  themeNameSelected: {
    color: '#059669',
  },

  // PRO Card
  proCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    padding: 24,
    marginBottom: 24,
  },
  proCardActive: {
    borderColor: '#F59E0B',
  },
  proHeaderActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  proIconActive: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTitleActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  proSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  proFeatures: {
    gap: 8,
    marginBottom: 16,
  },
  proFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proFeatureText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  manageSubscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  manageSubscriptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  proHeaderInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  proIconInactive: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTitleInactive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  proFeaturesSimple: {
    gap: 8,
    marginBottom: 16,
  },
  proFeatureSimple: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  proUpgradeButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proUpgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Logout/Delete Buttons
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  logoutSubtext: {
    fontSize: 12,
    color: '#EF4444',
    opacity: 0.8,
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  deleteSubtext: {
    fontSize: 12,
    color: '#EF4444',
    opacity: 0.8,
    marginTop: 2,
  },

  // Save Button
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
