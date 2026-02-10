import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK_MODE } from '../../theme/theme';
import { useAdmin } from '../AdminContext';

interface ContentItem {
  id: string;
  type: 'feature' | 'faq' | 'changelog' | 'press';
  title: string;
  description: string;
  status: 'published' | 'draft';
  updatedAt: string;
}

const MOCK_CONTENT: ContentItem[] = [
  { id: '1', type: 'feature', title: 'Kadro Kurma', description: '26 farklı formasyon ile kadronuzu kurun', status: 'published', updatedAt: '2 gün önce' },
  { id: '2', type: 'feature', title: 'Stratejik Odak', description: 'En güvendiğiniz 3 tahmini seçin', status: 'published', updatedAt: '1 hafta önce' },
  { id: '3', type: 'faq', title: 'Nasıl puan kazanırım?', description: 'Tahminleriniz doğru çıktığında puan kazanırsınız', status: 'published', updatedAt: '3 gün önce' },
  { id: '4', type: 'changelog', title: 'v2.1.0', description: 'Yeni özellikler ve hata düzeltmeleri', status: 'draft', updatedAt: '1 saat önce' },
  { id: '5', type: 'press', title: 'TacticIQ 10.000 kullanıcıya ulaştı', description: 'Basın bülteni', status: 'published', updatedAt: '5 gün önce' },
];

export default function AdminContent() {
  const { addSessionChange } = useAdmin();
  const [content, setContent] = useState<ContentItem[]>(MOCK_CONTENT);
  const [filter, setFilter] = useState<'all' | 'feature' | 'faq' | 'changelog' | 'press'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState({ type: 'feature' as ContentItem['type'], title: '', description: '' });

  const filteredContent = content.filter(item => filter === 'all' || item.type === filter);

  const getTypeLabel = (type: ContentItem['type']) => {
    switch (type) {
      case 'feature': return 'Özellik';
      case 'faq': return 'SSS';
      case 'changelog': return 'Değişiklik';
      case 'press': return 'Basın';
    }
  };

  const getTypeIcon = (type: ContentItem['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'feature': return 'star';
      case 'faq': return 'help-circle';
      case 'changelog': return 'git-commit';
      case 'press': return 'newspaper';
    }
  };

  const handleAddContent = () => {
    if (!newContent.title.trim() || !newContent.description.trim()) {
      Alert.alert('Hata', 'Başlık ve açıklama zorunludur');
      return;
    }

    const newItem: ContentItem = {
      id: Date.now().toString(),
      ...newContent,
      status: 'draft',
      updatedAt: 'Az önce',
    };

    setContent([newItem, ...content]);
    addSessionChange({ type: 'create', section: 'İçerik', description: `"${newContent.title}" oluşturuldu` });
    setShowAddModal(false);
    setNewContent({ type: 'feature', title: '', description: '' });
  };

  const handleToggleStatus = (item: ContentItem) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    setContent(content.map(c => c.id === item.id ? { ...c, status: newStatus } : c));
    addSessionChange({ 
      type: 'update', 
      section: 'İçerik', 
      description: `"${item.title}" ${newStatus === 'published' ? 'yayınlandı' : 'taslağa alındı'}` 
    });
  };

  const handleDelete = (item: ContentItem) => {
    Alert.alert('İçeriği Sil', `"${item.title}" silinecek. Emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          setContent(content.filter(c => c.id !== item.id));
          addSessionChange({ type: 'delete', section: 'İçerik', description: `"${item.title}" silindi` });
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <View style={styles.filterTabs}>
          {(['all', 'feature', 'faq', 'changelog', 'press'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f === 'all' ? 'Tümü' : getTypeLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Yeni İçerik</Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      <ScrollView style={styles.contentList}>
        {filteredContent.map((item) => (
          <View key={item.id} style={styles.contentCard}>
            <View style={styles.contentHeader}>
              <View style={[styles.typeIcon, { backgroundColor: `${DARK_MODE.accent}20` }]}>
                <Ionicons name={getTypeIcon(item.type)} size={20} color={DARK_MODE.accent} />
              </View>
              <View style={styles.contentInfo}>
                <View style={styles.contentTitleRow}>
                  <Text style={styles.contentTitle}>{item.title}</Text>
                  <View style={[
                    styles.statusBadge,
                    item.status === 'published' ? styles.publishedBadge : styles.draftBadge
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {item.status === 'published' ? 'Yayında' : 'Taslak'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.contentDescription} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.contentMeta}>
                  {getTypeLabel(item.type)} • {item.updatedAt}
                </Text>
              </View>
            </View>
            <View style={styles.contentActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleToggleStatus(item)}
              >
                <Ionicons
                  name={item.status === 'published' ? 'eye-off' : 'eye'}
                  size={20}
                  color={item.status === 'published' ? DARK_MODE.warning : DARK_MODE.success}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="create" size={20} color={DARK_MODE.accent} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
                <Ionicons name="trash" size={20} color={DARK_MODE.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Content Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni İçerik Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={DARK_MODE.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>İçerik Türü</Text>
            <View style={styles.typeSelector}>
              {(['feature', 'faq', 'changelog', 'press'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, newContent.type === type && styles.typeOptionActive]}
                  onPress={() => setNewContent({ ...newContent, type })}
                >
                  <Ionicons
                    name={getTypeIcon(type)}
                    size={20}
                    color={newContent.type === type ? '#FFF' : DARK_MODE.textSecondary}
                  />
                  <Text style={[styles.typeOptionText, newContent.type === type && styles.typeOptionTextActive]}>
                    {getTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Başlık</Text>
            <TextInput
              style={styles.textInput}
              placeholder="İçerik başlığı"
              placeholderTextColor={DARK_MODE.textSecondary}
              value={newContent.title}
              onChangeText={(text) => setNewContent({ ...newContent, title: text })}
            />

            <Text style={styles.inputLabel}>Açıklama</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="İçerik açıklaması"
              placeholderTextColor={DARK_MODE.textSecondary}
              value={newContent.description}
              onChangeText={(text) => setNewContent({ ...newContent, description: text })}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddContent}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_MODE.background,
  },
  filterContainer: {
    paddingVertical: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DARK_MODE.card,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  filterTabActive: {
    backgroundColor: DARK_MODE.accent,
    borderColor: DARK_MODE.accent,
  },
  filterTabText: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK_MODE.accent,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  contentList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  contentHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  publishedBadge: {
    backgroundColor: DARK_MODE.success,
  },
  draftBadge: {
    backgroundColor: DARK_MODE.textSecondary,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  contentDescription: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  contentMeta: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 8,
  },
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DARK_MODE.border,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: DARK_MODE.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    alignItems: 'center', // ✅ Yatay ortala
  },
  modalContent: {
    backgroundColor: DARK_MODE.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 400, // ✅ STANDART popup genişliği
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_MODE.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_MODE.text,
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: DARK_MODE.background,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  typeOptionActive: {
    backgroundColor: DARK_MODE.accent,
    borderColor: DARK_MODE.accent,
  },
  typeOptionText: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
  },
  typeOptionTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: DARK_MODE.background,
    borderRadius: 12,
    padding: 16,
    color: DARK_MODE.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: DARK_MODE.background,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_MODE.textSecondary,
  },
  saveButton: {
    backgroundColor: DARK_MODE.accent,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
