import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedDocDef = LEGAL_DOCUMENTS.find((d) => d.id === selectedDoc);

  // Load document content
  useEffect(() => {
    if (selectedDoc) {
      const loadContent = async () => {
        setLoading(true);
        try {
          const doc = await getLegalContent(selectedDoc, t, language);
          if (doc) {
            setCurrentDoc(doc);
          } else {
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

  useEffect(() => {
    if (!selectedDoc && LEGAL_DOCUMENTS.length > 0) {
      setSelectedDoc(LEGAL_DOCUMENTS[0].id);
    }
  }, []);

  useEffect(() => {
    if (documentType && documentType !== selectedDoc) {
      setSelectedDoc(documentType);
    }
  }, [documentType]);

  const onSelectDoc = (id: string) => {
    setSelectedDoc(id);
    setDropdownOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.gridPattern} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#1FA2A6" />
            <Text style={styles.backText}>{t('legalScreen.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('legalScreen.documents')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.mainContent}>
          {/* Tek satır dropdown */}
          <View style={styles.dropdownWrap}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setDropdownOpen((o) => !o)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownTriggerIcon}>{selectedDocDef?.icon ?? '📋'}</Text>
              <Text style={styles.dropdownTriggerLabel} numberOfLines={1}>
                {selectedDocDef?.titleKey ?? 'Belge seçin'}
              </Text>
              <Ionicons
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            <Modal
              visible={dropdownOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setDropdownOpen(false)}
            >
              <Pressable style={styles.dropdownBackdrop} onPress={() => setDropdownOpen(false)}>
                <View style={styles.dropdownList} onStartShouldSetResponder={() => true}>
                  <ScrollView
                    style={styles.dropdownListScroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                  >
                    {LEGAL_DOCUMENTS.map((doc) => (
                      <TouchableOpacity
                        key={doc.id}
                        style={[
                          styles.dropdownItem,
                          selectedDoc === doc.id && styles.dropdownItemActive,
                        ]}
                        onPress={() => onSelectDoc(doc.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemIcon}>{doc.icon}</Text>
                        <Text
                          style={[
                            styles.dropdownItemTitle,
                            selectedDoc === doc.id && styles.dropdownItemTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {doc.titleKey}
                        </Text>
                        {selectedDoc === doc.id && (
                          <Ionicons name="checkmark" size={18} color="#1FA2A6" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>
          </View>

          {/* Geniş okuma alanı */}
          <View style={styles.readingArea}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('legalScreen.loading')}</Text>
              </View>
            ) : currentDoc ? (
              <ScrollView
                style={styles.readingScroll}
                contentContainerStyle={styles.readingScrollContent}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.readingTitle}>{currentDoc.title}</Text>
                <Text style={styles.readingMeta}>{t('legalScreen.lastUpdated')}</Text>
                <Text style={styles.readingText}>{currentDoc.content}</Text>
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('legalScreen.selectDocument')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
            <LinearGradient
              colors={['#1FA2A6', '#168688']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>{t('legalScreen.close')}</Text>
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
    color: '#1FA2A6',
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

  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    overflow: 'hidden',
    zIndex: 1,
    minHeight: 0,
  },

  dropdownWrap: {
    zIndex: 10,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.4)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  dropdownTriggerIcon: {
    fontSize: 20,
  },
  dropdownTriggerLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 100,
  },
  dropdownList: {
    backgroundColor: 'rgba(15, 42, 36, 0.98)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.4)',
    overflow: 'hidden',
    maxHeight: 360,
  },
  dropdownListScroll: {
    maxHeight: 360,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.15)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.12)',
  },
  dropdownItemIcon: {
    fontSize: 18,
  },
  dropdownItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
  },
  dropdownItemTitleActive: {
    color: '#1FA2A6',
    fontWeight: '600',
  },

  readingArea: {
    flex: 1,
    backgroundColor: 'rgba(15, 42, 36, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 0,
  },
  readingScroll: {
    flex: 1,
  },
  readingScrollContent: {
    padding: 24,
    paddingBottom: 32,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  readingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  readingMeta: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  readingText: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 26,
    letterSpacing: 0.2,
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
