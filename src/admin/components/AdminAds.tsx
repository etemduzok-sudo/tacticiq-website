import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK_MODE } from '../../theme/theme';
import { useAdmin } from '../AdminContext';

interface AdPlacement {
  id: string;
  name: string;
  location: string;
  isEnabled: boolean;
  impressions: number;
  clicks: number;
  revenue: string;
}

const MOCK_ADS: AdPlacement[] = [
  { id: '1', name: 'Ana Sayfa Banner', location: 'dashboard_top', isEnabled: true, impressions: 45230, clicks: 1250, revenue: '₺3,450' },
  { id: '2', name: 'Maç Listesi Arası', location: 'match_list', isEnabled: true, impressions: 38420, clicks: 890, revenue: '₺2,180' },
  { id: '3', name: 'Profil Altı', location: 'profile_bottom', isEnabled: false, impressions: 12300, clicks: 320, revenue: '₺780' },
  { id: '4', name: 'Tahmin Sonrası', location: 'prediction_result', isEnabled: true, impressions: 28900, clicks: 1450, revenue: '₺4,120' },
  { id: '5', name: 'Tam Ekran (Interstitial)', location: 'interstitial', isEnabled: true, impressions: 8500, clicks: 680, revenue: '₺1,890' },
];

export default function AdminAds() {
  const { addSessionChange } = useAdmin();
  const [ads, setAds] = useState<AdPlacement[]>(MOCK_ADS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdPlacement | null>(null);

  const totalRevenue = ads.reduce((sum, ad) => {
    const value = parseFloat(ad.revenue.replace('₺', '').replace(',', ''));
    return sum + value;
  }, 0);

  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);

  const handleToggleAd = (ad: AdPlacement) => {
    setAds(ads.map(a => a.id === ad.id ? { ...a, isEnabled: !a.isEnabled } : a));
    addSessionChange({
      type: 'update',
      section: 'Reklamlar',
      description: `"${ad.name}" ${!ad.isEnabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`
    });
  };

  const handleEditAd = (ad: AdPlacement) => {
    setSelectedAd(ad);
    setShowSettingsModal(true);
  };

  const handleSaveSettings = () => {
    if (selectedAd) {
      addSessionChange({
        type: 'update',
        section: 'Reklamlar',
        description: `"${selectedAd.name}" ayarları güncellendi`
      });
    }
    setShowSettingsModal(false);
    setSelectedAd(null);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Revenue Overview */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueHeader}>
          <Ionicons name="cash" size={24} color={DARK_MODE.accent} />
          <Text style={styles.revenueTitle}>Bu Ay Reklam Geliri</Text>
        </View>
        <Text style={styles.revenueValue}>₺{totalRevenue.toLocaleString('tr-TR')}</Text>
        <View style={styles.revenueStats}>
          <View style={styles.revenueStat}>
            <Text style={styles.revenueStatValue}>{totalImpressions.toLocaleString()}</Text>
            <Text style={styles.revenueStatLabel}>Gösterim</Text>
          </View>
          <View style={styles.revenueStat}>
            <Text style={styles.revenueStatValue}>{totalClicks.toLocaleString()}</Text>
            <Text style={styles.revenueStatLabel}>Tıklama</Text>
          </View>
          <View style={styles.revenueStat}>
            <Text style={styles.revenueStatValue}>
              {((totalClicks / totalImpressions) * 100).toFixed(2)}%
            </Text>
            <Text style={styles.revenueStatLabel}>CTR</Text>
          </View>
        </View>
      </View>

      {/* Ad Placements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reklam Yerleşimleri</Text>
        {ads.map((ad) => (
          <View key={ad.id} style={styles.adCard}>
            <View style={styles.adHeader}>
              <View style={styles.adInfo}>
                <Text style={styles.adName}>{ad.name}</Text>
                <Text style={styles.adLocation}>{ad.location}</Text>
              </View>
              <Switch
                value={ad.isEnabled}
                onValueChange={() => handleToggleAd(ad)}
                trackColor={{ false: DARK_MODE.border, true: `${DARK_MODE.accent}80` }}
                thumbColor={ad.isEnabled ? DARK_MODE.accent : DARK_MODE.textSecondary}
              />
            </View>
            <View style={styles.adStats}>
              <View style={styles.adStat}>
                <Ionicons name="eye" size={16} color={DARK_MODE.textSecondary} />
                <Text style={styles.adStatValue}>{ad.impressions.toLocaleString()}</Text>
              </View>
              <View style={styles.adStat}>
                <Ionicons name="hand-left" size={16} color={DARK_MODE.textSecondary} />
                <Text style={styles.adStatValue}>{ad.clicks.toLocaleString()}</Text>
              </View>
              <View style={styles.adStat}>
                <Ionicons name="cash" size={16} color={DARK_MODE.success} />
                <Text style={[styles.adStatValue, { color: DARK_MODE.success }]}>{ad.revenue}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEditAd(ad)}>
              <Ionicons name="settings-outline" size={18} color={DARK_MODE.accent} />
              <Text style={styles.editButtonText}>Ayarları Düzenle</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Quick Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hızlı Ayarlar</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Pro Kullanıcılara Reklam Gösterme</Text>
              <Text style={styles.settingDescription}>Pro üyeler reklamsız deneyim yaşar</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: DARK_MODE.border, true: `${DARK_MODE.accent}80` }}
              thumbColor={DARK_MODE.accent}
            />
          </View>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Interstitial Frekansı</Text>
              <Text style={styles.settingDescription}>Her 5 maç detayında bir göster</Text>
            </View>
            <TouchableOpacity style={styles.settingValue}>
              <Text style={styles.settingValueText}>5 maç</Text>
              <Ionicons name="chevron-forward" size={16} color={DARK_MODE.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Test Modu</Text>
              <Text style={styles.settingDescription}>Geliştirme için test reklamları göster</Text>
            </View>
            <Switch
              value={false}
              trackColor={{ false: DARK_MODE.border, true: `${DARK_MODE.accent}80` }}
              thumbColor={DARK_MODE.textSecondary}
            />
          </View>
        </View>
      </View>

      {/* Ad Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedAd?.name} Ayarları</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={DARK_MODE.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Reklam ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ca-app-pub-xxx/xxx"
              placeholderTextColor={DARK_MODE.textSecondary}
              value={selectedAd?.location}
            />

            <Text style={styles.inputLabel}>Minimum Gösterim Süresi (saniye)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="5"
              placeholderTextColor={DARK_MODE.textSecondary}
              keyboardType="numeric"
              defaultValue="5"
            />

            <Text style={styles.inputLabel}>Günlük Gösterim Limiti</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0 = Sınırsız"
              placeholderTextColor={DARK_MODE.textSecondary}
              keyboardType="numeric"
              defaultValue="0"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSettings}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
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
  revenueCard: {
    margin: 16,
    backgroundColor: DARK_MODE.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  revenueTitle: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
  },
  revenueValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: DARK_MODE.text,
    marginBottom: 16,
  },
  revenueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: DARK_MODE.border,
  },
  revenueStat: {
    alignItems: 'center',
  },
  revenueStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  revenueStatLabel: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_MODE.text,
    marginBottom: 16,
  },
  adCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adInfo: {
    flex: 1,
  },
  adName: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  adLocation: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 2,
  },
  adStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  adStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adStatValue: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: DARK_MODE.background,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: DARK_MODE.accent,
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  settingDescription: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 2,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValueText: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
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
