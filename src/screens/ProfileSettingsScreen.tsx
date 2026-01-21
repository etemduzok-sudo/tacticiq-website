import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenLayout, StandardHeader } from '../components/layouts';
import { textStyles, inputStyles, cardStyles, buttonStyles } from '../utils/styleHelpers';
import { SPACING, COLORS, BRAND, SIZES, TYPOGRAPHY } from '../theme/theme';
import { authApi } from '../services/api';
import { STORAGE_KEYS } from '../config/constants';
import { profileService } from '../services/profileService';

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
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [initialUsername, setInitialUsername] = useState(''); // Başlangıç kullanıcı adı
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ Kullanıcı bilgilerini Unified Profile Service'den yükle (Web ile senkronize)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // 🆕 Unified Profile Service kullan
        const profile = await profileService.getProfile();
        
        if (profile) {
          if (profile.name) setName(profile.name);
          if (profile.nickname) {
            setUsername(profile.nickname);
            setInitialUsername(profile.nickname);
          }
          // Pro durumu
          setIsPro(profile.plan === 'pro');
          // Tema
          if (profile.theme) setTheme(profile.theme as Theme);
          // Favori takımlar
          if (profile.favoriteTeams && profile.favoriteTeams.length > 0) {
            setFavoriteClubs(profile.favoriteTeams);
          }
          console.log('✅ Profile loaded from unified service:', profile.email);
        } else {
          // Fallback: AsyncStorage'dan yükle
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (userData.name) setName(userData.name);
            if (userData.username) {
              setUsername(userData.username);
              setInitialUsername(userData.username);
            }
            const storedIsPro = userData?.is_pro === true || userData?.isPro === true || userData?.isPremium === true || userData?.plan === 'pro' || userData?.plan === 'premium';
            setIsPro(storedIsPro);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);
  const [theme, setTheme] = useState<Theme>('dark');
  const [hasChanges, setHasChanges] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [favoriteClubs, setFavoriteClubs] = useState<string[]>([]);
  const [isPro, setIsPro] = useState(false);

  const favoriteNational = 'Türkiye';
  const currentLanguage = 'Türkçe';

  // Load favorite teams from AsyncStorage
  useEffect(() => {
    const loadFavoriteTeams = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const favoriteTeamsStr = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_TEAMS);
        if (favoriteTeamsStr) {
          const teams = JSON.parse(favoriteTeamsStr);
          const teamNames = teams.map((team: any) => team.name);
          setFavoriteClubs(teamNames);
          console.log('✅ Loaded favorite teams in settings:', teamNames);
        }
      } catch (error) {
        console.error('Error loading favorite teams:', error);
      }
    };
    
    loadFavoriteTeams();
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(true);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setHasChanges(true);
    
    // Kullanıcı adı kontrolü (debounce ile)
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }
    
    // Eğer boşsa veya değişiklik yoksa kontrol etme
    if (!value || value === initialUsername) {
      setUsernameStatus('idle');
      return;
    }
    
    // Minimum 3 karakter kontrolü
    if (value.length < 3) {
      setUsernameStatus('unavailable'); // ✅ Hemen kırmızı x göster
      return;
    }
    
    // Format kontrolü
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(value)) {
      setUsernameStatus('unavailable'); // ✅ Geçersiz formatta hemen kırmızı x göster
      return;
    }
    
    setUsernameStatus('checking'); // ✅ Kontrol ediliyor spinner
    
    // 500ms sonra kontrol et
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const result = await authApi.checkUsername(value);
        if (result.success) {
          setUsernameStatus(result.available ? 'available' : 'unavailable');
        } else {
          setUsernameStatus('unavailable');
        }
      } catch (error) {
        console.error('Username check error:', error);
        setUsernameStatus('unavailable');
      }
    }, 500);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setHasChanges(true);
    Alert.alert('Tema Değişti', `${newTheme} tema uygulandı`);
  };

  const handleSave = async () => {
    try {
      // ✅ Kullanıcı adı kontrolü: Mutlaka available olmalı
      if (username && username !== initialUsername && usernameStatus !== 'available') {
        Alert.alert('Uyarı', 'Lütfen kullanılabilir bir kullanıcı adı seçin');
        return;
      }

      // 🆕 Unified Profile Service ile kaydet (Web ile senkronize)
      const result = await profileService.updateProfile({
        name: name,
        nickname: username,
        theme: theme,
      });
      
      if (result.success) {
        // ✅ Başlangıç username'i güncelle (bir sonraki değişiklik için)
        setInitialUsername(username);
        
        setHasChanges(false);
        setUsernameStatus('idle'); // Durumu sıfırla
        Alert.alert('Başarılı', 'Değişiklikler kaydedildi! ✓\n\nWeb ve mobil senkronize edildi.');
        console.log('✅ Profile updated via unified service:', { name, username, theme });
      } else {
        Alert.alert('Hata', 'Değişiklikler kaydedilemedi: ' + result.error);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Hata', 'Değişiklikler kaydedilirken bir hata oluştu');
    }
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
    <ScreenLayout safeArea>
      {/* ✅ Header Sabit */}
      <StandardHeader
        title="Profil Ayarları"
        onBack={handleBackPress}
      />

      {/* ✅ İçerik Scroll Edilebilir */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          {/* Basic Info Card */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(0)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Temel Bilgiler</Text>
              
              {/* PRO/Free Badge */}
              {isPro ? (
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.proBadgeInline}
                >
                  <Text style={styles.proBadgeTextInline}>👑 PRO</Text>
                </LinearGradient>
              ) : (
                <View style={styles.freeBadgeInline}>
                  <Text style={styles.freeBadgeTextInline}>Free</Text>
                </View>
              )}
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
              <View style={styles.usernameInputContainer}>
                <TextInput
                  style={[styles.input, styles.usernameInput]}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="Kullanıcı adınız"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                />
                {/* ✅ MUTLAKA görünür olmalı (idle hariç) */}
                {username && username !== initialUsername && usernameStatus !== 'idle' && (
                  <View style={styles.usernameStatusIcon}>
                    {usernameStatus === 'checking' && (
                      <ActivityIndicator size="small" color="#059669" />
                    )}
                    {usernameStatus === 'available' && (
                      <Ionicons name="checkmark-circle" size={24} color="#059669" />
                    )}
                    {usernameStatus === 'unavailable' && (
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    )}
                  </View>
                )}
              </View>
              {/* Mesajlar */}
              {usernameStatus === 'available' && (
                <Text style={styles.usernameHelperSuccess}>✓ Kullanıcı adı kullanılabilir</Text>
              )}
              {usernameStatus === 'unavailable' && username && username.length < 3 && (
                <Text style={styles.usernameHelperError}>✗ Minimum 3 karakter gerekli</Text>
              )}
              {usernameStatus === 'unavailable' && username && username.length >= 3 && (
                <Text style={styles.usernameHelperError}>✗ Bu kullanıcı adı zaten alınmış veya geçersiz</Text>
              )}
            </View>
          </Animated.View>

          {/* Favorite Teams Card */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(100)} style={styles.card}>
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

          {/* PRO Membership Card */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(200)}>
            <LinearGradient
              colors={
                isPro
                  ? ['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)', 'transparent']
                  : ['rgba(245, 158, 11, 0.1)', 'transparent']
              }
              style={[styles.proCard, isPro && styles.proCardActive]}
            >
              <View style={styles.cardHeader}>
                <Text style={{ fontSize: 20 }}>👑</Text>
                <Text style={styles.cardTitle}>PRO Üyelik</Text>
              </View>

              {isPro ? (
                <>
                  <View style={styles.proHeaderActive}>
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      style={styles.proIconActive}
                    >
                      <Text style={{ fontSize: 24, color: '#FFFFFF' }}>👑</Text>
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
                      <Text style={{ fontSize: 24, color: '#F59E0B' }}>👑</Text>
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

          {/* Language Card */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(300)} style={styles.card}>
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
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(400)} style={styles.card}>
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

          {/* Account Card */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(500)} style={styles.card}>
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

      {/* Bottom Save Button - ScrollView dışında, sabit */}
      {hasChanges && (
        <Animated.View entering={FadeInDown} style={styles.saveButtonContainer}>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
            <LinearGradient
              colors={[BRAND.emerald, BRAND.emeraldDark]}
              style={styles.saveButton}
            >
              <Ionicons name="checkmark" size={SIZES.iconSm} color={BRAND.white} />
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
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16, // ✅ Header ile ilk kart arası boşluk (STANDART: 10 → 16px)
    paddingBottom: 100, // ✅ Save button için alan
  },
  // Card
  card: {
    ...cardStyles.card,
    backgroundColor: COLORS.dark.card,
    padding: SPACING.lg,
    marginBottom: SPACING.base, // ✅ STANDART boşluk (SPACING.lg=24 → SPACING.base=16)
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  cardTitle: {
    ...textStyles.label,
    color: COLORS.dark.foreground,
    flex: 1,
  },
  proBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  proBadgeTextInline: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  freeBadgeInline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  freeBadgeTextInline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Input
  inputGroup: {
    marginBottom: SPACING.base,
  },
  label: {
    ...textStyles.body,
    color: COLORS.dark.mutedForeground,
    marginBottom: SPACING.sm,
  },
  input: {
    ...inputStyles.inputContainer,
    height: SIZES.inputAuthHeight,
    backgroundColor: COLORS.dark.input,
    borderColor: COLORS.dark.primary,
    color: COLORS.dark.foreground, // ✅ Yazı rengi beyaz
  },
  usernameInputContainer: {
    position: 'relative',
    width: '100%',
  },
  usernameInput: {
    paddingRight: 48, // İkon için alan
  },
  usernameStatusIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12, // İkon yüksekliğinin yarısı
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  usernameHelperSuccess: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  usernameHelperError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
    backgroundColor: `${COLORS.dark.foreground}10`,
    borderRadius: SPACING.md,
    marginBottom: SPACING.md,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    ...textStyles.body,
    fontWeight: '500',
    color: COLORS.dark.foreground,
  },
  settingItemSubtitle: {
    ...textStyles.secondary,
    marginTop: 2,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  limitText: {
    ...textStyles.secondary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.dark.border,
    marginVertical: SPACING.md,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: `${COLORS.dark.info}20`,
    borderWidth: 1,
    borderColor: `${COLORS.dark.info}40`,
    borderRadius: SPACING.sm,
    marginTop: SPACING.md,
  },
  infoBoxYellow: {
    backgroundColor: `${BRAND.gold}20`,
    borderColor: `${BRAND.gold}40`,
  },
  infoText: {
    flex: 1,
    ...textStyles.secondary,
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
    padding: SPACING.base,
    backgroundColor: `${COLORS.dark.background}95`,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: SIZES.buttonAuthHeight + 6,
    borderRadius: SIZES.radiusLg,
  },
  saveButtonText: {
    ...buttonStyles.primaryButtonText,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
  },
  modalContent: {
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  modalTitle: {
    ...textStyles.title,
    fontSize: TYPOGRAPHY.h3.fontSize,
    marginBottom: SPACING.sm,
  },
  modalMessage: {
    ...textStyles.body,
    color: COLORS.dark.mutedForeground,
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalButtonCancel: {
    flex: 1,
    height: SIZES.buttonLgHeight + 8,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancelText: {
    ...buttonStyles.secondaryButtonText,
  },
  modalButtonConfirm: {
    flex: 1,
    height: SIZES.buttonLgHeight + 8,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.dark.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonConfirmText: {
    ...buttonStyles.primaryButtonText,
  },
});
