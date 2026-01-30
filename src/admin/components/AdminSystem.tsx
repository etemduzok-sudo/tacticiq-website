import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK_MODE } from '../../theme/theme';
import { useAdmin } from '../AdminContext';

interface SystemStatus {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  latency?: number;
  uptime?: string;
  lastCheck: string;
}

interface LogEntry {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  source: string;
}

export default function AdminSystem() {
  const { addSessionChange } = useAdmin();
  const [refreshing, setRefreshing] = useState(false);
  const [systems, setSystems] = useState<SystemStatus[]>([
    { name: 'API Server', status: 'online', latency: 45, uptime: '99.9%', lastCheck: 'Az önce' },
    { name: 'Database (Supabase)', status: 'online', latency: 32, uptime: '99.99%', lastCheck: 'Az önce' },
    { name: 'Football API', status: 'online', latency: 120, uptime: '99.5%', lastCheck: 'Az önce' },
    { name: 'Redis Cache', status: 'online', latency: 5, uptime: '99.9%', lastCheck: 'Az önce' },
    { name: 'CDN (Cloudflare)', status: 'online', latency: 15, uptime: '100%', lastCheck: 'Az önce' },
    { name: 'Push Notifications', status: 'online', latency: 89, uptime: '99.7%', lastCheck: 'Az önce' },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', level: 'info', message: 'Sistem başlatıldı', timestamp: '00:15', source: 'System' },
    { id: '2', level: 'info', message: 'Maç verileri güncellendi', timestamp: '00:12', source: 'Football API' },
    { id: '3', level: 'warning', message: 'Cache yenilendi (hafıza %85)', timestamp: '00:08', source: 'Redis' },
    { id: '4', level: 'info', message: '150 yeni tahmin işlendi', timestamp: '00:05', source: 'Prediction Service' },
    { id: '5', level: 'error', message: 'Rate limit aşıldı (user: 12345)', timestamp: '00:02', source: 'API Gateway' },
    { id: '6', level: 'info', message: 'Günlük yedekleme tamamlandı', timestamp: 'Dün 23:45', source: 'Backup Service' },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'online': return DARK_MODE.success;
      case 'degraded': return DARK_MODE.warning;
      case 'offline': return DARK_MODE.error;
    }
  };

  const getLogIcon = (level: LogEntry['level']): keyof typeof Ionicons.glyphMap => {
    switch (level) {
      case 'info': return 'information-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return DARK_MODE.accent;
      case 'warning': return DARK_MODE.warning;
      case 'error': return DARK_MODE.error;
    }
  };

  const handleClearCache = () => {
    Alert.alert('Cache Temizle', 'Tüm önbellek temizlenecek. Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Temizle',
        style: 'destructive',
        onPress: () => {
          addSessionChange({ type: 'update', section: 'Sistem', description: 'Cache temizlendi' });
          Alert.alert('Başarılı', 'Önbellek temizlendi');
        }
      }
    ]);
  };

  const handleRestartServices = () => {
    Alert.alert('Servisleri Yeniden Başlat', 'Tüm servisler yeniden başlatılacak. Bu işlem birkaç saniye sürebilir.', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Yeniden Başlat',
        style: 'destructive',
        onPress: () => {
          addSessionChange({ type: 'update', section: 'Sistem', description: 'Servisler yeniden başlatıldı' });
          Alert.alert('Başarılı', 'Servisler yeniden başlatıldı');
        }
      }
    ]);
  };

  const onlineCount = systems.filter(s => s.status === 'online').length;
  const avgLatency = Math.round(systems.reduce((sum, s) => sum + (s.latency || 0), 0) / systems.length);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={DARK_MODE.accent}
        />
      }
    >
      {/* Overall Status */}
      <View style={styles.overallStatus}>
        <View style={styles.statusIndicator}>
          <View style={[styles.bigDot, { backgroundColor: onlineCount === systems.length ? DARK_MODE.success : DARK_MODE.warning }]} />
          <Text style={styles.overallStatusText}>
            {onlineCount === systems.length ? 'Tüm Sistemler Çalışıyor' : 'Bazı Sistemlerde Sorun Var'}
          </Text>
        </View>
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{onlineCount}/{systems.length}</Text>
            <Text style={styles.quickStatLabel}>Aktif Servis</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{avgLatency}ms</Text>
            <Text style={styles.quickStatLabel}>Ort. Gecikme</Text>
          </View>
        </View>
      </View>

      {/* System Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servis Durumu</Text>
        <View style={styles.systemsCard}>
          {systems.map((system, index) => (
            <View key={index} style={styles.systemRow}>
              <View style={styles.systemInfo}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(system.status) }]} />
                <View>
                  <Text style={styles.systemName}>{system.name}</Text>
                  <Text style={styles.systemMeta}>
                    {system.latency}ms • {system.uptime} uptime
                  </Text>
                </View>
              </View>
              <Text style={styles.lastCheck}>{system.lastCheck}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={handleClearCache}>
            <Ionicons name="trash" size={24} color={DARK_MODE.warning} />
            <Text style={styles.actionLabel}>Cache Temizle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleRestartServices}>
            <Ionicons name="refresh" size={24} color={DARK_MODE.accent} />
            <Text style={styles.actionLabel}>Servisleri Yeniden Başlat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="download" size={24} color={DARK_MODE.accent} />
            <Text style={styles.actionLabel}>Log İndir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Logs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Son Loglar</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.logsCard}>
          {logs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Ionicons name={getLogIcon(log.level)} size={20} color={getLogColor(log.level)} />
              <View style={styles.logContent}>
                <Text style={styles.logMessage}>{log.message}</Text>
                <Text style={styles.logMeta}>
                  {log.source} • {log.timestamp}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uygulama Bilgisi</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versiyon</Text>
            <Text style={styles.infoValue}>2.1.0 (build 142)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>{Platform.OS} {Platform.Version}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ortam</Text>
            <Text style={styles.infoValue}>Production</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>API Endpoint</Text>
            <Text style={styles.infoValue}>api.tacticiq.app</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Son Güncelleme</Text>
            <Text style={styles.infoValue}>29 Ocak 2026, 23:45</Text>
          </View>
        </View>
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
  overallStatus: {
    margin: 16,
    backgroundColor: DARK_MODE.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bigDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  overallStatusText: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: DARK_MODE.border,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_MODE.text,
  },
  quickStatLabel: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_MODE.text,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: DARK_MODE.accent,
  },
  systemsCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    overflow: 'hidden',
  },
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  systemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  systemName: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  systemMeta: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 2,
  },
  lastCheck: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  actionLabel: {
    fontSize: 12,
    color: DARK_MODE.text,
    textAlign: 'center',
  },
  logsCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  logContent: {
    flex: 1,
  },
  logMessage: {
    fontSize: 14,
    color: DARK_MODE.text,
  },
  logMeta: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  infoLabel: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: DARK_MODE.text,
    fontWeight: '500',
  },
});
