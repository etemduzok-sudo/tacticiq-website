import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK_MODE } from '../../theme/theme';
import { useAdmin } from '../AdminContext';

export default function AdminSettings() {
  const { addSessionChange } = useAdmin();
  
  // App Settings
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(true);
  const [maxFreeTeams, setMaxFreeTeams] = useState('3');
  
  // Feature Flags
  const [liveMatchEnabled, setLiveMatchEnabled] = useState(true);
  const [proFeaturesEnabled, setProFeaturesEnabled] = useState(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  
  // API Settings
  const [apiRateLimit, setApiRateLimit] = useState('100');
  const [cacheTimeout, setCacheTimeout] = useState('300');

  const handleSaveSettings = () => {
    Alert.alert(
      'Ayarları Kaydet',
      'Değişiklikler kaydedilsin mi?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaydet',
          onPress: () => {
            addSessionChange({ type: 'update', section: 'Ayarlar', description: 'Sistem ayarları güncellendi' });
            Alert.alert('Başarılı', 'Ayarlar kaydedildi');
          }
        }
      ]
    );
  };

  const handleToggleMaintenance = () => {
    const newValue = !maintenanceMode;
    setMaintenanceMode(newValue);
    Alert.alert(
      newValue ? 'Bakım Modu Açılıyor' : 'Bakım Modu Kapatılıyor',
      newValue
        ? 'Uygulama bakım moduna alınacak. Kullanıcılar erişemeyecek.'
        : 'Uygulama normal çalışma moduna dönecek.',
      [
        { text: 'İptal', style: 'cancel', onPress: () => setMaintenanceMode(!newValue) },
        {
          text: 'Onayla',
          style: newValue ? 'destructive' : 'default',
          onPress: () => {
            addSessionChange({
              type: 'update',
              section: 'Ayarlar',
              description: `Bakım modu ${newValue ? 'açıldı' : 'kapatıldı'}`
            });
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uygulama Ayarları</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="construct" size={20} color={maintenanceMode ? DARK_MODE.error : DARK_MODE.textSecondary} />
                <Text style={styles.settingLabel}>Bakım Modu</Text>
              </View>
              <Text style={styles.settingDescription}>
                Aktif olduğunda kullanıcılar uygulamaya erişemez
              </Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={handleToggleMaintenance}
              trackColor={{ false: DARK_MODE.border, true: `${DARK_MODE.error}80` }}
              thumbColor={maintenanceMode ? DARK_MODE.error : DARK_MODE.textSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="person-add" size={20} color={DARK_MODE.textSecondary} />
                <Text style={styles.settingLabel}>Yeni Kayıt</Text>
              </View>
              <Text style={styles.settingDescription}>Yeni kullanıcı kaydına izin ver</Text>
            </View>
            <Switch
              value={registrationEnabled}
              onValueChange={(value) => {
                setRegistrationEnabled(value);
                addSessionChange({ type: 'update', section: 'Ayarlar', description: `Yeni kayıt ${value ? 'açıldı' : 'kapatıldı'}` });
              }}
              trackColor={{ false: DARK_MODE.border, true: `${DARK_MODE.accent}80` }}
              thumbColor={registrationEnabled ? DARK_MODE.accent : DARK_MODE.textSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="mail-open" size={20} color={DARK_MODE.textSecondary} />
                <Text style={styles.settingLabel}>E-posta Doğrulama</Text>
              </View>
              <Text style={styles.settingDescription}>Kayıtta e-posta doğrulaması gereksin</Text>
            </View>
            <Switch
              value={emailVerificationRequired}
              onValueChange={setEmailVerificationRequired}
              trackColor={{ false: DARK_MODE.border, true: `${DARK_MODE.accent}80` }}
              thumbColor={emailVerificationRequired ? DARK_MODE.accent : DARK_MODE.textSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="football" size={20} color={DARK_MODE.textSecondary} />
                <Text style={styles.settingLabel}>Ücretsiz Takım Limiti</Text>
              </View>
              <Text style={styles.settingDescription}>Ücretsiz kullanıcıların takım sayısı</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              value={maxFreeTeams}
              onChangeText={setMaxFreeTeams}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
        </View>
      </View>

      {/* Feature Flags */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Özellik Bayrakları</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="pulse" size={20} color={DARK_MODE.textSecondary} />
                <Text style={styles.settingLabel}>Canlı Maç Takibi</Text>
              </View>
              <Text style={styles.settingDescription}>Canlı maç verilerini göster</Text>
            </View>
            <Switch
              value={liveMatchEnabled}
              onValueChange={setLiveMatchEnabled}
              trackColor={{ false: DARK_MODE.border, true: `${DARK_MODE.accent}80` }}
              thumbColor={liveMatchEnabled ? DARK_MODE.accent : DARK_MODE.textSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="star" size={20} color={DARK_MODE.textSecondary} />
                <Text style={styles.settingLabel}>Pro Özellikleri</Text>
              </View>
              <Text style={styles.settingDescription}>Pro üyelik özelliklerini etkinleştir</Text>
            </View>
            <Switch
              value={proFeaturesEnabled}
              onValueChange={setProFeaturesEnabled}
              trackColor={{ false: DARK_MODE.border, true: `${DARK_MODE.accent}80` }}
              thumbColor={proFeaturesEnabled ? DARK_MODE.accent : DARK_MODE.textSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="notifications" size={20} color={DARK_MODE.textSecondary} />
                <Text style={styles.settingLabel}>Push Bildirimleri</Text>
              </View>
              <Text style={styles.settingDescription}>Push bildirim gönderme özelliği</Text>
            </View>
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={setPushNotificationsEnabled}
              trackColor={{ false: DARK_MODE.border, true: `${DARK_MODE.accent}80` }}
              thumbColor={pushNotificationsEnabled ? DARK_MODE.accent : DARK_MODE.textSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="analytics" size={20} color={DARK_MODE.textSecondary} />
                <Text style={styles.settingLabel}>Analitik</Text>
              </View>
              <Text style={styles.settingDescription}>Kullanıcı analitiklerini topla</Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={setAnalyticsEnabled}
              trackColor={{ false: DARK_MODE.border, true: `${DARK_MODE.accent}80` }}
              thumbColor={analyticsEnabled ? DARK_MODE.accent : DARK_MODE.textSecondary}
            />
          </View>
        </View>
      </View>

      {/* API Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Ayarları</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="speedometer" size={20} color={DARK_MODE.textSecondary} />
                <Text style={styles.settingLabel}>Rate Limit (istek/dk)</Text>
              </View>
              <Text style={styles.settingDescription}>Dakika başı maksimum istek sayısı</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              value={apiRateLimit}
              onChangeText={setApiRateLimit}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="time" size={20} color={DARK_MODE.textSecondary} />
                <Text style={styles.settingLabel}>Cache Timeout (saniye)</Text>
              </View>
              <Text style={styles.settingDescription}>Önbellek geçerlilik süresi</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              value={cacheTimeout}
              onChangeText={setCacheTimeout}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
          <Ionicons name="save" size={20} color="#FFF" />
          <Text style={styles.saveButtonText}>Ayarları Kaydet</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_MODE.background,
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_MODE.text,
    marginBottom: 16,
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
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  settingDescription: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginLeft: 28,
  },
  numberInput: {
    backgroundColor: DARK_MODE.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: DARK_MODE.text,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK_MODE.accent,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
