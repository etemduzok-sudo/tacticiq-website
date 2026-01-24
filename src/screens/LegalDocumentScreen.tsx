import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '../hooks/useTranslation';
import { LEGAL_DOCUMENTS, getLegalContent, getLegalContentSync } from '../data/legalContent';

interface LegalDocumentScreenProps {
  documentType?: string;
  onBack: () => void;
}

export const LegalDocumentScreen: React.FC<LegalDocumentScreenProps> = ({
  documentType,
  onBack,
}) => {
  const { t, i18n } = useTranslation();
  const language = i18n?.language || 'tr';
  const [selectedDoc, setSelectedDoc] = useState<string | null>(documentType || 'terms');
  const [currentDoc, setCurrentDoc] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Load document content
  useEffect(() => {
    if (selectedDoc) {
      // Pre-load admin documents if cache is empty
      const loadContent = async () => {
        setLoading(true);
        try {
          // Try async first (will populate cache)
          const doc = await getLegalContent(selectedDoc, t, language);
          if (doc) {
            setCurrentDoc(doc);
          } else {
            // Fallback to sync
            const syncDoc = getLegalContentSync(selectedDoc, t, language);
            setCurrentDoc(syncDoc);
          }
        } catch (error) {
          console.warn('Failed to load legal content:', error);
          const syncDoc = getLegalContentSync(selectedDoc, t, language);
          setCurrentDoc(syncDoc);
        } finally {
          setLoading(false);
        }
      };
      loadContent();
    }
  }, [selectedDoc, language, t]);

  // Initialize with first document if none selected
  useEffect(() => {
    if (!selectedDoc && LEGAL_DOCUMENTS.length > 0) {
      setSelectedDoc(LEGAL_DOCUMENTS[0].id);
    }
  }, []);

  // Initial load from prop
  useEffect(() => {
    if (documentType && documentType !== selectedDoc) {
      setSelectedDoc(documentType);
    }
  }, [documentType]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Grid Pattern Background */}
        <View style={styles.gridPattern} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#059669" />
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yasal Belgeler</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Main Content - Split View */}
        <View style={styles.mainContent}>
          {/* Document List - Left Side */}
          <View style={styles.menuContainer}>
            <ScrollView
              style={styles.menuScroll}
              contentContainerStyle={styles.menuScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {LEGAL_DOCUMENTS.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => setSelectedDoc(doc.id)}
                  style={[
                    styles.menuItem,
                    selectedDoc === doc.id && styles.menuItemActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemIcon}>{doc.icon}</Text>
                  <View style={styles.menuItemContent}>
                    <Text style={[
                      styles.menuItemTitle,
                      selectedDoc === doc.id && styles.menuItemTitleActive,
                    ]}>
                      {doc.titleKey}
                    </Text>
                    <Text style={styles.menuItemDescription} numberOfLines={2}>
                      {doc.descriptionKey}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Document Content - Right Side */}
          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Yükleniyor...</Text>
              </View>
            ) : currentDoc ? (
              <View style={styles.contentWrapper}>
                <View style={styles.contentHeader}>
                  <Text style={styles.contentTitle}>{currentDoc.title}</Text>
                </View>
                <ScrollView
                  style={styles.contentScroll}
                  contentContainerStyle={styles.contentScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.contentText}>{currentDoc.content}</Text>
                </ScrollView>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Bir belge seçin</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F2A24',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F2A24',
    position: 'relative',
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#059669',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 80, // Balance with back button
  },

  // Main Content - Split View
  mainContent: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
    overflow: 'hidden',
    zIndex: 1,
    minHeight: 0, // Important for ScrollView to work properly
  },

  // Menu Container (Left)
  menuContainer: {
    ...Platform.select({
      web: {
        width: 140,
      },
      default: {
        height: 120,
        marginBottom: 12,
      },
    }),
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  menuItemActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    borderColor: 'rgba(5, 150, 105, 0.5)',
  },
  menuItemIcon: {
    fontSize: 20,
    ...Platform.select({
      web: {
        marginRight: 8,
        marginTop: 2,
      },
      default: {
        marginRight: 8,
        marginTop: 2,
      },
    }),
  },
  menuItemContent: {
    flex: 1,
    ...Platform.select({
      web: {},
      default: {
        flex: 1,
      },
    }),
  },
  menuItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  menuItemTitleActive: {
    color: '#059669',
  },
  menuItemDescription: {
    fontSize: 10,
    color: '#9CA3AF',
    lineHeight: 14,
  },

  // Content Container (Right)
  contentContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
  },
  contentHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5, 150, 105, 0.2)',
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContent: {
    padding: 20,
  },
  contentText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 22,
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 1,
  },
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
