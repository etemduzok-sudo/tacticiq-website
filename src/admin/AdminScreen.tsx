import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from './AdminContext';
import { DARK_MODE } from '../theme/theme';

// Admin Components
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';
import AdminContent from './components/AdminContent';
import AdminAds from './components/AdminAds';
import AdminTeam from './components/AdminTeam';
import AdminPartners from './components/AdminPartners';
import AdminSettings from './components/AdminSettings';
import AdminSystem from './components/AdminSystem';

type AdminSection = 
  | 'dashboard' 
  | 'users' 
  | 'content' 
  | 'ads' 
  | 'team' 
  | 'partners' 
  | 'settings' 
  | 'system';

interface MenuItem {
  id: AdminSection;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Gösterge Paneli', icon: 'grid-outline', description: 'Genel bakış' },
  { id: 'users', label: 'Kullanıcılar', icon: 'people-outline', description: 'Kullanıcı yönetimi' },
  { id: 'content', label: 'İçerik', icon: 'document-text-outline', description: 'İçerik yönetimi' },
  { id: 'ads', label: 'Reklamlar', icon: 'megaphone-outline', description: 'Reklam yönetimi' },
  { id: 'team', label: 'Ekip', icon: 'person-outline', description: 'Ekip üyeleri' },
  { id: 'partners', label: 'Partnerler', icon: 'handshake-outline', description: 'Partner yönetimi' },
  { id: 'settings', label: 'Ayarlar', icon: 'settings-outline', description: 'Sistem ayarları' },
  { id: 'system', label: 'Sistem', icon: 'server-outline', description: 'Sistem durumu' },
];

export default function AdminScreen() {
  const { isAdmin, isLoading, login, logout, sessionChanges } = useAdmin();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleLogin = async () => {
    setLoginError('');
    const success = await login(password);
    if (success) {
      setShowLoginModal(false);
      setPassword('');
    } else {
      setLoginError('Geçersiz şifre');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      sessionChanges.length > 0 
        ? `Bu oturumda ${sessionChanges.length} değişiklik yaptınız. Çıkmak istediğinize emin misiniz?`
        : 'Admin panelinden çıkmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <AdminUsers />;
      case 'content':
        return <AdminContent />;
      case 'ads':
        return <AdminAds />;
      case 'team':
        return <AdminTeam />;
      case 'partners':
        return <AdminPartners />;
      case 'settings':
        return <AdminSettings />;
      case 'system':
        return <AdminSystem />;
      default:
        return <AdminDashboard />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="shield-checkmark" size={48} color={DARK_MODE.accent} />
        <Text style={styles.loadingText}>Admin Panel Yükleniyor...</Text>
      </View>
    );
  }

  // Not logged in - show login button
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loginPromptContainer}>
          <Ionicons name="shield-outline" size={64} color={DARK_MODE.textSecondary} />
          <Text style={styles.loginPromptTitle}>Admin Panel</Text>
          <Text style={styles.loginPromptSubtitle}>
            Yönetim paneline erişmek için giriş yapın
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => setShowLoginModal(true)}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFF" />
            <Text style={styles.loginButtonText}>Admin Girişi</Text>
          </TouchableOpacity>
        </View>

        {/* Login Modal */}
        <Modal
          visible={showLoginModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLoginModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="shield-checkmark" size={32} color={DARK_MODE.accent} />
                <Text style={styles.modalTitle}>Admin Girişi</Text>
              </View>
              
              <TextInput
                style={styles.passwordInput}
                placeholder="Admin şifresi"
                placeholderTextColor={DARK_MODE.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoFocus
              />
              
              {loginError ? (
                <Text style={styles.errorText}>{loginError}</Text>
              ) : null}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowLoginModal(false);
                    setPassword('');
                    setLoginError('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleLogin}
                >
                  <Text style={styles.confirmButtonText}>Giriş</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Logged in - show admin panel
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Ionicons name={showMenu ? 'close' : 'menu'} size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Ionicons name="shield-checkmark" size={20} color={DARK_MODE.accent} />
          <Text style={styles.headerTitleText}>Admin Panel</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={DARK_MODE.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {/* Sidebar Menu - Visible when showMenu is true or on large screens */}
        {showMenu && (
          <View style={styles.sidebar}>
            <ScrollView style={styles.sidebarScroll}>
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    activeSection === item.id && styles.menuItemActive,
                  ]}
                  onPress={() => {
                    setActiveSection(item.id);
                    setShowMenu(false);
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={activeSection === item.id ? DARK_MODE.accent : DARK_MODE.textSecondary}
                  />
                  <View style={styles.menuItemText}>
                    <Text
                      style={[
                        styles.menuItemLabel,
                        activeSection === item.id && styles.menuItemLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Session changes indicator */}
            {sessionChanges.length > 0 && (
              <View style={styles.changesIndicator}>
                <Ionicons name="git-commit-outline" size={16} color={DARK_MODE.warning} />
                <Text style={styles.changesText}>
                  {sessionChanges.length} değişiklik
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {MENU_ITEMS.find(m => m.id === activeSection)?.label}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {MENU_ITEMS.find(m => m.id === activeSection)?.description}
            </Text>
          </View>
          
          {/* Content */}
          <ScrollView style={styles.contentScroll}>
            {renderContent()}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_MODE.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: DARK_MODE.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: DARK_MODE.textSecondary,
    fontSize: 16,
  },
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_MODE.text,
    marginTop: 16,
  },
  loginPromptSubtitle: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DARK_MODE.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_MODE.text,
  },
  passwordInput: {
    backgroundColor: DARK_MODE.background,
    borderRadius: 8,
    padding: 16,
    color: DARK_MODE.text,
    fontSize: 16,
    marginBottom: 16,
  },
  errorText: {
    color: DARK_MODE.error,
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: DARK_MODE.background,
  },
  cancelButtonText: {
    color: DARK_MODE.textSecondary,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: DARK_MODE.accent,
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DARK_MODE.card,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_MODE.text,
  },
  logoutButton: {
    padding: 8,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    backgroundColor: DARK_MODE.card,
    borderRightWidth: 1,
    borderRightColor: DARK_MODE.border,
    ...Platform.select({
      web: {
        width: 280,
      },
      default: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      },
    }),
  },
  sidebarScroll: {
    flex: 1,
    padding: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  menuItemLabelActive: {
    color: DARK_MODE.accent,
  },
  menuItemDescription: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 2,
  },
  changesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(241, 196, 15, 0.1)',
    borderTopWidth: 1,
    borderTopColor: DARK_MODE.border,
  },
  changesText: {
    fontSize: 12,
    color: DARK_MODE.warning,
  },
  contentArea: {
    flex: 1,
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: DARK_MODE.card,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_MODE.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  contentScroll: {
    flex: 1,
  },
});
