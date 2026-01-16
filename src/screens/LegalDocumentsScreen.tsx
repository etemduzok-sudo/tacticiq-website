import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../types';
import { BRAND, STADIUM_GRADIENT, DARK_MODE } from '../theme/theme';
import { AUTH_GRADIENT } from '../theme/gradients';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LegalDocuments'>;

type LegalDoc = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

const LEGAL_DOCUMENTS: LegalDoc[] = [
  {
    id: 'terms',
    title: 'Kullanım Koşulları (EULA)',
    description: 'Hizmet şartları, sanal öğeler ve kullanıcı sorumlulukları',
    icon: '📋',
  },
  {
    id: 'privacy',
    title: 'Küresel Gizlilik Politikası',
    description: 'GDPR, CCPA, KVKK uyumlu gizlilik politikası',
    icon: '🔒',
  },
  {
    id: 'cookies',
    title: 'Çerez Politikası',
    description: 'Çerezlerin kullanımı ve yönetimi',
    icon: '🍪',
  },
  {
    id: 'kvkk',
    title: 'KVKK Aydınlatma Metni',
    description: 'Kişisel Verilerin Korunması Kanunu bilgilendirmesi',
    icon: '⚖️',
  },
  {
    id: 'consent',
    title: 'Açık Rıza Metni',
    description: 'KVKK kapsamında açık rıza beyanı',
    icon: '✅',
  },
  {
    id: 'sales',
    title: 'Mesafeli Satış Sözleşmesi',
    description: 'Dijital içerik satış şartları ve cayma hakkı',
    icon: '💳',
  },
  {
    id: 'copyright',
    title: 'Telif Hakkı Bildirimi',
    description: 'Fikri mülkiyet hakları ve DMCA bildirimi',
    icon: '©️',
  },
];

export default function LegalDocumentsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const handleDocumentPress = (docId: string, title: string) => {
    navigation.navigate('LegalDocument', { documentId: docId, title });
  };

  return (
    <LinearGradient
      {...AUTH_GRADIENT} // Design System compliant
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yasal Belgeler</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {LEGAL_DOCUMENTS.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.card}
              onPress={() => handleDocumentPress(doc.id, doc.title)}
              activeOpacity={0.7}
            >
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>{doc.icon}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{doc.title}</Text>
                <Text style={styles.cardDescription}>{doc.description}</Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>
          ))}

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Son güncelleme: 1 Ocak 2026
            </Text>
            <Text style={styles.footerText}>
              Bu belgeler yasal olarak bağlayıcıdır.
            </Text>
            <Text style={styles.footerText}>
              GDPR, CCPA, KVKK, PIPL uyumlu
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: BRAND.emerald,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 60,
  },
  
  // Content
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_MODE.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIconText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    lineHeight: 18,
  },
  cardArrow: {
    color: BRAND.emerald,
    fontSize: 28,
    fontWeight: '300',
  },
  
  // Footer
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },
});
