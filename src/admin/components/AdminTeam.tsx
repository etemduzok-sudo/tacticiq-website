import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK_MODE } from '../../theme/theme';
import { useAdmin } from '../AdminContext';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  isActive: boolean;
}

const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'Etem Demirer', role: 'Founder & CEO', department: 'Yönetim', email: 'etem@tacticiq.app', joinedAt: '2024-01-01', isActive: true },
  { id: '2', name: 'Ahmet Yılmaz', role: 'Lead Developer', department: 'Geliştirme', email: 'ahmet@tacticiq.app', joinedAt: '2024-03-15', isActive: true },
  { id: '3', name: 'Zeynep Kaya', role: 'UI/UX Designer', department: 'Tasarım', email: 'zeynep@tacticiq.app', joinedAt: '2024-06-01', isActive: true },
  { id: '4', name: 'Mehmet Demir', role: 'Backend Developer', department: 'Geliştirme', email: 'mehmet@tacticiq.app', joinedAt: '2024-08-20', isActive: true },
  { id: '5', name: 'Ayşe Öz', role: 'Marketing Manager', department: 'Pazarlama', email: 'ayse@tacticiq.app', joinedAt: '2024-10-01', isActive: false },
];

export default function AdminTeam() {
  const { addSessionChange } = useAdmin();
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
  });

  const departments = [...new Set(team.map(m => m.department))];

  const handleAddMember = () => {
    if (!newMember.name || !newMember.role || !newMember.email) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return;
    }

    const member: TeamMember = {
      id: Date.now().toString(),
      ...newMember,
      joinedAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    setTeam([...team, member]);
    addSessionChange({ type: 'create', section: 'Ekip', description: `${member.name} ekibe eklendi` });
    setShowAddModal(false);
    setNewMember({ name: '', role: '', department: '', email: '' });
  };

  const handleToggleStatus = (member: TeamMember) => {
    setTeam(team.map(m => m.id === member.id ? { ...m, isActive: !m.isActive } : m));
    addSessionChange({
      type: 'update',
      section: 'Ekip',
      description: `${member.name} ${!member.isActive ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`
    });
  };

  const handleRemoveMember = (member: TeamMember) => {
    Alert.alert('Ekip Üyesini Kaldır', `${member.name} ekipten kaldırılacak. Emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: () => {
          setTeam(team.filter(m => m.id !== member.id));
          addSessionChange({ type: 'delete', section: 'Ekip', description: `${member.name} ekipten kaldırıldı` });
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{team.length}</Text>
          <Text style={styles.statLabel}>Toplam Üye</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{team.filter(m => m.isActive).length}</Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{departments.length}</Text>
          <Text style={styles.statLabel}>Departman</Text>
        </View>
      </View>

      {/* Add Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="person-add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Yeni Ekip Üyesi</Text>
        </TouchableOpacity>
      </View>

      {/* Team List by Department */}
      {departments.map((dept) => (
        <View key={dept} style={styles.section}>
          <Text style={styles.departmentTitle}>{dept}</Text>
          {team.filter(m => m.department === dept).map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberCard}
              onPress={() => setSelectedMember(member)}
            >
              <View style={[styles.avatar, !member.isActive && styles.avatarInactive]}>
                <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={[styles.memberName, !member.isActive && styles.memberNameInactive]}>
                    {member.name}
                  </Text>
                  {!member.isActive && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>Pasif</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberRole}>{member.role}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              <View style={styles.memberActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleStatus(member)}
                >
                  <Ionicons
                    name={member.isActive ? 'pause' : 'play'}
                    size={18}
                    color={member.isActive ? DARK_MODE.warning : DARK_MODE.success}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleRemoveMember(member)}
                >
                  <Ionicons name="trash" size={18} color={DARK_MODE.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Add Member Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Ekip Üyesi</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={DARK_MODE.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Ad Soyad</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Örn: Ahmet Yılmaz"
              placeholderTextColor={DARK_MODE.textSecondary}
              value={newMember.name}
              onChangeText={(text) => setNewMember({ ...newMember, name: text })}
            />

            <Text style={styles.inputLabel}>Rol / Pozisyon</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Örn: Frontend Developer"
              placeholderTextColor={DARK_MODE.textSecondary}
              value={newMember.role}
              onChangeText={(text) => setNewMember({ ...newMember, role: text })}
            />

            <Text style={styles.inputLabel}>Departman</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Örn: Geliştirme"
              placeholderTextColor={DARK_MODE.textSecondary}
              value={newMember.department}
              onChangeText={(text) => setNewMember({ ...newMember, department: text })}
            />

            <Text style={styles.inputLabel}>E-posta</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ornek@tacticiq.app"
              placeholderTextColor={DARK_MODE.textSecondary}
              keyboardType="email-address"
              value={newMember.email}
              onChangeText={(text) => setNewMember({ ...newMember, email: text })}
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
                onPress={handleAddMember}
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
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_MODE.text,
  },
  statLabel: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 4,
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
  departmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_MODE.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
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
  avatarInactive: {
    backgroundColor: DARK_MODE.textSecondary,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_MODE.text,
  },
  memberNameInactive: {
    color: DARK_MODE.textSecondary,
  },
  inactiveBadge: {
    backgroundColor: DARK_MODE.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  memberRole: {
    fontSize: 14,
    color: DARK_MODE.accent,
    marginTop: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: DARK_MODE.textSecondary,
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: DARK_MODE.background,
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
