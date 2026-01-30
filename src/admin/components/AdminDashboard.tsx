import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK_MODE } from '../../theme/theme';

interface StatCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
}

export default function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatCard[]>([
    {
      id: '1',
      title: 'Toplam Kullanıcı',
      value: '12,847',
      change: '+12%',
      changeType: 'up',
      icon: 'people',
      color: '#3498db',
    },
    {
      id: '2',
      title: 'Aktif Kullanıcı',
      value: '3,256',
      change: '+8%',
      changeType: 'up',
      icon: 'pulse',
      color: '#2ecc71',
    },
    {
      id: '3',
      title: 'Tahmin Sayısı',
      value: '156,432',
      change: '+23%',
      changeType: 'up',
      icon: 'analytics',
      color: '#9b59b6',
    },
    {
      id: '4',
      title: 'Pro Üyeler',
      value: '1,024',
      change: '+5%',
      changeType: 'up',
      icon: 'star',
      color: '#f1c40f',
    },
  ]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    { id: '1', type: 'user', description: 'Yeni kullanıcı kaydı: user@example.com', time: '2 dakika önce' },
    { id: '2', type: 'prediction', description: '150 yeni tahmin yapıldı', time: '5 dakika önce' },
    { id: '3', type: 'payment', description: 'Pro üyelik satışı: ₺149', time: '12 dakika önce' },
    { id: '4', type: 'match', description: 'Yeni maç verileri güncellendi', time: '30 dakika önce' },
    { id: '5', type: 'system', description: 'API sağlık kontrolü başarılı', time: '1 saat önce' },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'user': return 'person-add';
      case 'prediction': return 'analytics';
      case 'payment': return 'card';
      case 'match': return 'football';
      case 'system': return 'server';
      default: return 'information-circle';
    }
  };

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
      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hızlı İstatistikler</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <View style={styles.statChangeContainer}>
                <Ionicons
                  name={stat.changeType === 'up' ? 'arrow-up' : stat.changeType === 'down' ? 'arrow-down' : 'remove'}
                  size={14}
                  color={stat.changeType === 'up' ? DARK_MODE.success : stat.changeType === 'down' ? DARK_MODE.error : DARK_MODE.textSecondary}
                />
                <Text
                  style={[
                    styles.statChange,
                    stat.changeType === 'up' && styles.statChangeUp,
                    stat.changeType === 'down' && styles.statChangeDown,
                  ]}
                >
                  {stat.change}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={24} color={DARK_MODE.accent} />
            <Text style={styles.actionText}>Yeni İçerik</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="notifications" size={24} color={DARK_MODE.accent} />
            <Text style={styles.actionText}>Bildirim Gönder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create" size={24} color={DARK_MODE.accent} />
            <Text style={styles.actionText}>Basın Bülteni</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download" size={24} color={DARK_MODE.accent} />
            <Text style={styles.actionText}>Rapor İndir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
        <View style={styles.activityList}>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name={getActivityIcon(activity.type)} size={20} color={DARK_MODE.accent} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* System Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sistem Durumu</Text>
        <View style={styles.systemStatus}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusOnline]} />
            <Text style={styles.statusLabel}>API Server</Text>
            <Text style={styles.statusValue}>Çalışıyor</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusOnline]} />
            <Text style={styles.statusLabel}>Database</Text>
            <Text style={styles.statusValue}>Çalışıyor</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusOnline]} />
            <Text style={styles.statusLabel}>Cache</Text>
            <Text style={styles.statusValue}>Aktif</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusOnline]} />
            <Text style={styles.statusLabel}>CDN</Text>
            <Text style={styles.statusValue}>Çalışıyor</Text>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_MODE.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_MODE.text,
  },
  statTitle: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  statChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  statChange: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
  },
  statChangeUp: {
    color: DARK_MODE.success,
  },
  statChangeDown: {
    color: DARK_MODE.error,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  actionText: {
    fontSize: 12,
    color: DARK_MODE.text,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: DARK_MODE.text,
  },
  activityTime: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  systemStatus: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    overflow: 'hidden',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusOnline: {
    backgroundColor: DARK_MODE.success,
  },
  statusOffline: {
    backgroundColor: DARK_MODE.error,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: DARK_MODE.text,
  },
  statusValue: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
  },
});
