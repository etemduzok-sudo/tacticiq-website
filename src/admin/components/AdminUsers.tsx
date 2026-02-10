import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK_MODE } from '../../theme/theme';
import { useAdmin } from '../AdminContext';

interface User {
  id: string;
  email: string;
  name: string;
  isPro: boolean;
  createdAt: string;
  lastActive: string;
  predictions: number;
  points: number;
  status: 'active' | 'suspended' | 'banned';
}

const MOCK_USERS: User[] = [
  { id: '1', email: 'user1@example.com', name: 'Ahmet Yılmaz', isPro: true, createdAt: '2025-01-15', lastActive: '2 saat önce', predictions: 245, points: 12500, status: 'active' },
  { id: '2', email: 'user2@example.com', name: 'Mehmet Demir', isPro: false, createdAt: '2025-02-20', lastActive: '1 gün önce', predictions: 89, points: 3200, status: 'active' },
  { id: '3', email: 'user3@example.com', name: 'Ayşe Kaya', isPro: true, createdAt: '2024-12-10', lastActive: '3 saat önce', predictions: 512, points: 28000, status: 'active' },
  { id: '4', email: 'user4@example.com', name: 'Fatma Öz', isPro: false, createdAt: '2025-03-01', lastActive: '1 hafta önce', predictions: 15, points: 450, status: 'suspended' },
  { id: '5', email: 'user5@example.com', name: 'Ali Çelik', isPro: false, createdAt: '2025-01-28', lastActive: '5 gün önce', predictions: 67, points: 2100, status: 'active' },
];

export default function AdminUsers() {
  const { addSessionChange } = useAdmin();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pro' | 'suspended'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'pro') return matchesSearch && user.isPro;
    if (filter === 'suspended') return matchesSearch && user.status !== 'active';
    return matchesSearch;
  });

  const handleUserAction = (user: User, action: 'suspend' | 'activate' | 'delete' | 'upgrade') => {
    Alert.alert(
      action === 'suspend' ? 'Kullanıcıyı Askıya Al' :
      action === 'activate' ? 'Kullanıcıyı Aktifleştir' :
      action === 'delete' ? 'Kullanıcıyı Sil' : 'Pro\'ya Yükselt',
      `${user.name} için bu işlemi yapmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => {
            if (action === 'suspend') {
              setUsers(users.map(u => u.id === user.id ? { ...u, status: 'suspended' } : u));
              addSessionChange({ type: 'update', section: 'Kullanıcılar', description: `${user.name} askıya alındı` });
            } else if (action === 'activate') {
              setUsers(users.map(u => u.id === user.id ? { ...u, status: 'active' } : u));
              addSessionChange({ type: 'update', section: 'Kullanıcılar', description: `${user.name} aktifleştirildi` });
            } else if (action === 'delete') {
              setUsers(users.filter(u => u.id !== user.id));
              addSessionChange({ type: 'delete', section: 'Kullanıcılar', description: `${user.name} silindi` });
            } else if (action === 'upgrade') {
              setUsers(users.map(u => u.id === user.id ? { ...u, isPro: true } : u));
              addSessionChange({ type: 'update', section: 'Kullanıcılar', description: `${user.name} Pro'ya yükseltildi` });
            }
            setShowUserModal(false);
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setShowUserModal(true);
      }}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.userDetails}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{item.name}</Text>
            {item.isPro && (
              <View style={styles.proBadge}>
                <Ionicons name="star" size={12} color="#FFF" />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
            {item.status !== 'active' && (
              <View style={[styles.statusBadge, item.status === 'suspended' ? styles.suspendedBadge : styles.bannedBadge]}>
                <Text style={styles.statusBadgeText}>{item.status === 'suspended' ? 'Askıda' : 'Yasaklı'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userStats}>
            {item.predictions} tahmin • {item.points.toLocaleString()} puan
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={DARK_MODE.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search & Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={DARK_MODE.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kullanıcı ara..."
            placeholderTextColor={DARK_MODE.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'pro', 'suspended'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'Tümü' : f === 'pro' ? 'Pro Üyeler' : 'Askıdakiler'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={DARK_MODE.textSecondary} />
            <Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>
          </View>
        }
      />

      {/* User Detail Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>{selectedUser.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                  <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setShowUserModal(false)}
                  >
                    <Ionicons name="close" size={24} color={DARK_MODE.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedUser.predictions}</Text>
                    <Text style={styles.modalStatLabel}>Tahmin</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedUser.points.toLocaleString()}</Text>
                    <Text style={styles.modalStatLabel}>Puan</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedUser.isPro ? 'Pro' : 'Ücretsiz'}</Text>
                    <Text style={styles.modalStatLabel}>Plan</Text>
                  </View>
                </View>

                <View style={styles.modalInfo}>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Kayıt Tarihi</Text>
                    <Text style={styles.modalInfoValue}>{selectedUser.createdAt}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Son Aktivite</Text>
                    <Text style={styles.modalInfoValue}>{selectedUser.lastActive}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Durum</Text>
                    <Text style={[
                      styles.modalInfoValue,
                      selectedUser.status === 'active' ? styles.statusActive : styles.statusSuspended
                    ]}>
                      {selectedUser.status === 'active' ? 'Aktif' : 'Askıda'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  {!selectedUser.isPro && (
                    <TouchableOpacity
                      style={[styles.modalButton, styles.upgradeButton]}
                      onPress={() => handleUserAction(selectedUser, 'upgrade')}
                    >
                      <Ionicons name="star" size={20} color="#FFF" />
                      <Text style={styles.modalButtonText}>Pro'ya Yükselt</Text>
                    </TouchableOpacity>
                  )}
                  {selectedUser.status === 'active' ? (
                    <TouchableOpacity
                      style={[styles.modalButton, styles.suspendButton]}
                      onPress={() => handleUserAction(selectedUser, 'suspend')}
                    >
                      <Ionicons name="pause-circle" size={20} color="#FFF" />
                      <Text style={styles.modalButtonText}>Askıya Al</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.modalButton, styles.activateButton]}
                      onPress={() => handleUserAction(selectedUser, 'activate')}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                      <Text style={styles.modalButtonText}>Aktifleştir</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => handleUserAction(selectedUser, 'delete')}
                  >
                    <Ionicons name="trash" size={20} color="#FFF" />
                    <Text style={styles.modalButtonText}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: DARK_MODE.text,
    fontSize: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DARK_MODE.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1c40f',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  suspendedBadge: {
    backgroundColor: DARK_MODE.warning,
  },
  bannedBadge: {
    backgroundColor: DARK_MODE.error,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userEmail: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
    marginTop: 2,
  },
  userStats: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
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
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400, // ✅ STANDART popup genişliği
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DARK_MODE.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_MODE.text,
  },
  modalUserEmail: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  modalClose: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: DARK_MODE.background,
    borderRadius: 12,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_MODE.text,
  },
  modalStatLabel: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
  },
  modalInfo: {
    marginBottom: 24,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: DARK_MODE.textSecondary,
  },
  modalInfoValue: {
    fontSize: 14,
    color: DARK_MODE.text,
  },
  statusActive: {
    color: DARK_MODE.success,
  },
  statusSuspended: {
    color: DARK_MODE.warning,
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  upgradeButton: {
    backgroundColor: '#f1c40f',
  },
  suspendButton: {
    backgroundColor: DARK_MODE.warning,
  },
  activateButton: {
    backgroundColor: DARK_MODE.success,
  },
  deleteButton: {
    backgroundColor: DARK_MODE.error,
  },
});
