import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK_MODE } from '../../theme/theme';
import { useAdmin } from '../AdminContext';

interface Partner {
  id: string;
  name: string;
  type: 'media' | 'technology' | 'sponsor' | 'affiliate';
  website: string;
  contactEmail: string;
  status: 'active' | 'pending' | 'inactive';
  startDate: string;
  commission?: string;
}

const MOCK_PARTNERS: Partner[] = [
  { id: '1', name: 'FutbolMedya', type: 'media', website: 'https://futbolmedya.com', contactEmail: 'partner@futbolmedya.com', status: 'active', startDate: '2024-06-01' },
  { id: '2', name: 'SportsTech Inc', type: 'technology', website: 'https://sportstech.io', contactEmail: 'biz@sportstech.io', status: 'active', startDate: '2024-08-15' },
  { id: '3', name: 'BetAnalytics', type: 'affiliate', website: 'https://betanalytics.com', contactEmail: 'affiliates@betanalytics.com', status: 'pending', startDate: '2025-01-10', commission: '%15' },
  { id: '4', name: 'Spor Markası', type: 'sponsor', website: 'https://spormarkasi.com', contactEmail: 'sponsor@spormarkasi.com', status: 'active', startDate: '2024-11-01' },
];

export default function AdminPartners() {
  const { addSessionChange } = useAdmin();
  const [partners, setPartners] = useState<Partner[]>(MOCK_PARTNERS);
  const [filter, setFilter] = useState<'all' | Partner['type'] | 'pending'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    type: 'media' as Partner['type'],
    website: '',
    contactEmail: '',
  });

  const getTypeLabel = (type: Partner['type']) => {
    switch (type) {
      case 'media': return 'Medya';
      case 'technology': return 'Teknoloji';
      case 'sponsor': return 'Sponsor';
      case 'affiliate': return 'Affiliate';
    }
  };

  const getTypeIcon = (type: Partner['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'media': return 'newspaper';
      case 'technology': return 'code-slash';
      case 'sponsor': return 'gift';
      case 'affiliate': return 'link';
    }
  };

  const filteredPartners = partners.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.status === 'pending';
    return p.type === filter;
  });

  const handleAddPartner = () => {
    if (!newPartner.name || !newPartner.website || !newPartner.contactEmail) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return;
    }

    const partner: Partner = {
      id: Date.now().toString(),
      ...newPartner,
      status: 'pending',
      startDate: new Date().toISOString().split('T')[0],
    };

    setPartners([...partners, partner]);
    addSessionChange({ type: 'create', section: 'Partnerler', description: `${partner.name} eklendi` });
    setShowAddModal(false);
    setNewPartner({ name: '', type: 'media', website: '', contactEmail: '' });
  };

  const handleStatusChange = (partner: Partner, newStatus: Partner['status']) => {
    setPartners(partners.map(p => p.id === partner.id ? { ...p, status: newStatus } : p));
    addSessionChange({
      type: 'update',
      section: 'Partnerler',
      description: `${partner.name} durumu "${newStatus}" olarak güncellendi`
    });
  };

  const handleRemovePartner = (partner: Partner) => {
    Alert.alert('Partneri Kaldır', `${partner.name} kaldırılacak. Emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: () => {
          setPartners(partners.filter(p => p.id !== partner.id));
          addSessionChange({ type: 'delete', section: 'Partnerler', description: `${partner.name} kaldırıldı` });
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{partners.filter(p => p.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Aktif Partner</Text>
        </View>
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statValue}>{partners.filter(p => p.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <View style={styles.filterTabs}>
          {(['all', 'pending', 'media', 'technology', 'sponsor', 'affiliate'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyen' : getTypeLabel(f as Partner['type'])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Yeni Partner Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Partners List */}
      <View style={styles.section}>
        {filteredPartners.map((partner) => (
          <View key={partner.id} style={styles.partnerCard}>
            <View style={styles.partnerHeader}>
              <View style={[styles.typeIcon, { backgroundColor: `${DARK_MODE.accent}20` }]}>
                <Ionicons name={getTypeIcon(partner.type)} size={24} color={DARK_MODE.accent} />
              </View>
              <View style={styles.partnerInfo}>
                <View style={styles.partnerNameRow}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    partner.status === 'active' && styles.activeBadge,
                    partner.status === 'pending' && styles.pendingBadge,
                    partner.status === 'inactive' && styles.inactiveBadge,
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {partner.status === 'active' ? 'Aktif' : partner.status === 'pending' ? 'Bekliyor' : 'Pasif'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.partnerType}>{getTypeLabel(partner.type)}</Text>
                {partner.commission && (
                  <Text style={styles.partnerCommission}>Komisyon: {partner.commission}</Text>
                )}
              </View>
            </View>

            <View style={styles.partnerDetails}>
              <TouchableOpacity
                style={styles.detailRow}
                onPress={() => Linking.openURL(partner.website)}
              >
                <Ionicons name="globe" size={16} color={DARK_MODE.textSecondary} />
                <Text style={styles.detailText}>{partner.website}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailRow}
                onPress={() => Linking.openURL(`mailto:${partner.contactEmail}`)}
              >
                <Ionicons name="mail" size={16} color={DARK_MODE.textSecondary} />
                <Text style={styles.detailText}>{partner.contactEmail}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.partnerActions}>
              {partner.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleStatusChange(partner, 'active')}
                >
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={styles.actionBtnText}>Onayla</Text>
                </TouchableOpacity>
              )}
              {partner.status === 'active' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.pauseBtn]}
                  onPress={() => handleStatusChange(partner, 'inactive')}
                >
                  <Ionicons name="pause" size={18} color="#FFF" />
                  <Text style={styles.actionBtnText}>Duraklat</Text>
                </TouchableOpacity>
              )}
              {partner.status === 'inactive' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.activateBtn]}
                  onPress={() => handleStatusChange(partner, 'active')}
                >
                  <Ionicons name="play" size={18} color="#FFF" />
                  <Text style={styles.actionBtnText}>Aktifleştir</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, styles.removeBtn]}
                onPress={() => handleRemovePartner(partner)}
              >
                <Ionicons name="trash" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Add Partner Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Partner Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={DARK_MODE.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Partner Adı</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Örn: Şirket Adı"
              placeholderTextColor={DARK_MODE.textSecondary}
              value={newPartner.name}
              onChangeText={(text) => setNewPartner({ ...newPartner, name: text })}
            />

            <Text style={styles.inputLabel}>Partner Türü</Text>
            <View style={styles.typeSelector}>
              {(['media', 'technology', 'sponsor', 'affiliate'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, newPartner.type === type && styles.typeOptionActive]}
                  onPress={() => setNewPartner({ ...newPartner, type })}
                >
                  <Ionicons
                    name={getTypeIcon(type)}
                    size={18}
                    color={newPartner.type === type ? '#FFF' : DARK_MODE.textSecondary}
                  />
                  <Text style={[styles.typeOptionText, newPartner.type === type && styles.typeOptionTextActive]}>
                    {getTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Website</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://example.com"
              placeholderTextColor={DARK_MODE.textSecondary}
              keyboardType="url"
              value={newPartner.website}
              onChangeText={(text) => setNewPartner({ ...newPartner, website: text })}
            />

            <Text style={styles.inputLabel}>İletişim E-postası</Text>
            <TextInput
              style={styles.textInput}
              placeholder="contact@example.com"
              placeholderTextColor={DARK_MODE.textSecondary}
              keyboardType="email-address"
              value={newPartner.contactEmail}
              onChangeText={(text) => setNewPartner({ ...newPartner, contactEmail: text })}
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
                onPress={handleAddPartner}
              >
                <Text style={styles.saveButtonText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_MODE.background,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  pendingCard: {
    borderColor: DARK_MODE.warning,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DARK_MODE.text,
  },
  statLabel: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  filterContainer: {
    paddingBottom: 16,
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK_MODE.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  partnerCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  partnerHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: DARK_MODE.success,
  },
  pendingBadge: {
    backgroundColor: DARK_MODE.warning,
  },
  inactiveBadge: {
    backgroundColor: DARK_MODE.textSecondary,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  partnerType: {
    fontSize: 14,
    color: DARK_MODE.accent,
    marginTop: 2,
  },
  partnerCommission: {
    fontSize: 12,
    color: DARK_MODE.success,
    marginTop: 2,
  },
  partnerDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DARK_MODE.border,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  approveBtn: {
    backgroundColor: DARK_MODE.success,
  },
  pauseBtn: {
    backgroundColor: DARK_MODE.warning,
  },
  activateBtn: {
    backgroundColor: DARK_MODE.success,
  },
  removeBtn: {
    backgroundColor: DARK_MODE.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DARK_MODE.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
