import { PressableButton } from '@/components/PressableButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  ThemedCard,
  ThemedInput,
  ThemedText,
  ThemedView
} from '@/components/ThemedComponents';
import { HAITIAN_DEPARTMENTS } from '@/constants/departments';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/languageStore';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput as RNTextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type UserRole = 'agent' | 'hospital' | 'admin';
type UserStatus = 'active' | 'inactive';

interface User {
  id: string;
  lastName: string;
  firstNames: string[];
  email: string; // Utilisé pour l'authentification Firebase
  phone?: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  institutionName?: string;
  createdAt: string;
  lastActivity?: string;
  recordsCount?: number;
  validationsCount?: number;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const currentLanguage = useLanguageStore((state) => state.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showDepartmentPickerModal, setShowDepartmentPickerModal] = useState(false);
  const [formData, setFormData] = useState({
    lastName: '',
    firstNames: [''],
    email: '',
    phone: '',
    role: 'agent' as UserRole,
    department: '',
    institutionName: '',
  });

  // Helper function pour reconstruire le nom complet
  const getFullName = (user: User): string => {
    const firstNamesStr = user.firstNames.filter(fn => fn.trim()).join(' ');
    return firstNamesStr ? `${firstNamesStr} ${user.lastName}` : user.lastName;
  };

  // Données simulées
  const mockUsers: User[] = [
    {
      id: '1',
      lastName: 'Paul',
      firstNames: ['Jean'],
      email: 'jean.paul@example.com',
      phone: '+509 1234-5678',
      role: 'agent',
      status: 'active',
      department: 'Ouest',
      createdAt: '2024-01-15',
      lastActivity: '2025-01-28',
      recordsCount: 45,
    },
    {
      id: '2',
      lastName: 'Général',
      firstNames: ['Hôpital'],
      email: 'contact@hopitalgeneral.ht',
      phone: '+509 2345-6789',
      role: 'hospital',
      status: 'active',
      institutionName: 'Hôpital Général de Port-au-Prince',
      createdAt: '2024-02-10',
      lastActivity: '2025-01-28',
      recordsCount: 128,
    },
    {
      id: '4',
      lastName: 'Laurent',
      firstNames: ['Pierre'],
      email: 'pierre.laurent@example.com',
      phone: '+509 3456-7890',
      role: 'agent',
      status: 'inactive',
      department: 'Artibonite',
      createdAt: '2024-04-05',
      lastActivity: '2025-01-20',
      recordsCount: 12,
    },
  ];

  const filteredUsers = mockUsers.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    // Comparer avec le code du département si l'utilisateur a un département
    const matchesDepartment = departmentFilter === 'all' || 
      (user.department && (
        // Si le filtre est un code, comparer directement
        user.department === departmentFilter || 
        // Si le filtre est un code, trouver le nom correspondant et comparer
        HAITIAN_DEPARTMENTS.find(d => d.code === departmentFilter)?.name === user.department ||
        HAITIAN_DEPARTMENTS.find(d => d.code === departmentFilter)?.nameKr === user.department ||
        // Si l'utilisateur a un nom de département, trouver son code et comparer
        HAITIAN_DEPARTMENTS.find(d => d.name === user.department || d.nameKr === user.department)?.code === departmentFilter
      ));
    const fullName = getFullName(user);
    const matchesSearch = 
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery));
    
    return matchesRole && matchesStatus && matchesDepartment && matchesSearch;
  });

  // Statistiques globales
  const totalUsers = mockUsers.length;
  const activeUsers = mockUsers.filter(u => u.status === 'active').length;
  const inactiveUsers = mockUsers.filter(u => u.status === 'inactive').length;
  const usersByRole = {
    agent: mockUsers.filter(u => u.role === 'agent').length,
    hospital: mockUsers.filter(u => u.role === 'hospital').length,
    admin: mockUsers.filter(u => u.role === 'admin').length,
  };

  // Liste des départements - Utiliser tous les départements haïtiens
  const getDepartmentName = (code: string) => {
    const dept = HAITIAN_DEPARTMENTS.find(d => d.code === code);
    if (!dept) return code;
    // Utiliser le nom selon la langue actuelle
    return currentLanguage === 'ht' ? dept.nameKr : dept.name;
  };

  // Pour le filtre, on utilise tous les départements haïtiens
  const allDepartments = HAITIAN_DEPARTMENTS.map(dept => ({
    code: dept.code,
    name: currentLanguage === 'ht' ? dept.nameKr : dept.name,
  }));

  const handleBack = () => {
    router.back();
  };

  const handleCreate = () => {
    setFormData({
      lastName: '',
      firstNames: [''],
      email: '',
      phone: '',
      role: 'agent',
      department: '',
      institutionName: '',
    });
    setShowCreateModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      lastName: user.lastName,
      firstNames: user.firstNames.length > 0 ? user.firstNames : [''],
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      department: user.department || '',
      institutionName: user.institutionName || '',
    });
    setShowEditModal(true);
  };

  const addFirstName = () => {
    setFormData({
      ...formData,
      firstNames: [...formData.firstNames, ''],
    });
  };

  const removeFirstName = (index: number) => {
    if (formData.firstNames.length > 1) {
      const newFirstNames = formData.firstNames.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        firstNames: newFirstNames,
      });
    }
  };

  const handleSave = () => {
    const hasValidFirstName = formData.firstNames.some(fn => fn.trim().length >= 2);
    // Email est requis pour l'authentification
    if (!formData.lastName || !hasValidFirstName || !formData.email) {
      Alert.alert(t('common.error'), t('admin.users.fillRequiredFields') || 'Veuillez remplir tous les champs requis');
      return;
    }

    // TODO: Appel API pour créer/modifier
    if (showCreateModal) {
      console.log('Créer utilisateur:', formData);
      Alert.alert(t('common.success'), t('admin.users.created') || 'Utilisateur créé avec succès');
    } else {
      console.log('Modifier utilisateur:', selectedUser?.id, formData);
      Alert.alert(t('common.success'), t('admin.users.updated') || 'Utilisateur modifié avec succès');
    }
    
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    Alert.alert(
      newStatus === 'active' 
        ? (t('admin.users.activateTitle') || 'Activer l\'utilisateur')
        : (t('admin.users.deactivateTitle') || 'Désactiver l\'utilisateur'),
      newStatus === 'active'
        ? (t('admin.users.activateMessage') || `Voulez-vous activer ${getFullName(user)} ?`)
        : (t('admin.users.deactivateMessage') || `Voulez-vous désactiver ${getFullName(user)} ?`),
      [
        {
          text: t('common.cancel'),
          style: 'cancel' as const,
        },
        {
          text: t('common.confirm'),
          onPress: () => {
            // TODO: Appel API
            console.log('Changer statut:', user.id, newStatus);
            Alert.alert(t('common.success'), t('admin.users.statusChanged') || 'Statut modifié avec succès');
          },
        },
      ]
    );
  };

  const handleResetPassword = (user: User) => {
    Alert.alert(
      t('admin.users.resetPasswordTitle') || 'Réinitialiser le mot de passe',
      t('admin.users.resetPasswordMessage') || `Voulez-vous réinitialiser le mot de passe de ${getFullName(user)} ?`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel' as const,
        },
        {
          text: t('common.confirm'),
          onPress: () => {
            // TODO: Appel API
            console.log('Réinitialiser mot de passe:', user.id);
            Alert.alert(t('common.success'), t('admin.users.passwordReset') || 'Un email de réinitialisation a été envoyé');
          },
        },
      ]
    );
  };

  const handleViewActivity = (user: User) => {
    // TODO: Naviguer vers la page d'activité
    Alert.alert(
      t('admin.users.activity') || 'Activité',
      `${t('admin.users.recordsCount')}: ${user.recordsCount || 0}\n` +
      `${t('admin.users.validationsCount')}: ${user.validationsCount || 0}\n` +
      `${t('admin.users.lastActivity')}: ${user.lastActivity || 'N/A'}`
    );
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'agent':
        return 'user';
      case 'hospital':
        return 'building';
      case 'admin':
        return 'cog';
      default:
        return 'user';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'agent':
        return theme.colors.primary;
      case 'hospital':
        return theme.colors.info;
      case 'admin':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    return t(`roles.${role}`) || role;
  };

  const renderUser = ({ item }: { item: User }) => (
    <ThemedCard style={styles.userCard}>
      <ThemedView variant="transparent" style={styles.userHeader}>
        <ThemedView 
          variant="transparent" 
          style={StyleSheet.flatten([
            styles.userIconContainer,
            { backgroundColor: getRoleColor(item.role) + '20' }
          ])}
        >
          <FontAwesome 
            name={getRoleIcon(item.role)} 
            size={isTablet ? 28 : 24} 
            color={getRoleColor(item.role)} 
          />
        </ThemedView>
        <ThemedView variant="transparent" style={styles.userInfo}>
          <ThemedText size="base" weight="semibold">
            {getFullName(item)}
          </ThemedText>
          <ThemedView variant="transparent" style={styles.userMeta}>
            <ThemedView 
              variant="transparent" 
              style={StyleSheet.flatten([
                styles.roleBadge,
                { backgroundColor: getRoleColor(item.role) + '20' }
              ])}
            >
              <ThemedText 
                size="xs" 
                weight="medium"
                style={{ color: getRoleColor(item.role) }}
              >
                {getRoleLabel(item.role)}
              </ThemedText>
            </ThemedView>
            <ThemedView 
              variant="transparent" 
              style={StyleSheet.flatten([
                styles.statusBadge,
                { 
                  backgroundColor: item.status === 'active' 
                    ? theme.colors.success + '20' 
                    : theme.colors.error + '20' 
                }
              ])}
            >
              <ThemedText 
                size="xs" 
                weight="medium"
                style={{ 
                  color: item.status === 'active' 
                    ? theme.colors.success 
                    : theme.colors.error 
                }}
              >
                {item.status === 'active' 
                  ? t('admin.users.active') 
                  : t('admin.users.inactive')}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView variant="transparent" style={styles.userDetails}>
        <ThemedView variant="transparent" style={styles.userDetailRow}>
          <FontAwesome name="envelope" size={14} color={theme.colors.textSecondary} />
          <ThemedText variant="secondary" size="sm" style={styles.userDetailText}>
            {item.email}
          </ThemedText>
        </ThemedView>
        {item.phone && (
          <ThemedView variant="transparent" style={styles.userDetailRow}>
            <FontAwesome name="phone" size={14} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" size="sm" style={styles.userDetailText}>
              {item.phone}
            </ThemedText>
          </ThemedView>
        )}
        {item.department && (
          <ThemedView variant="transparent" style={styles.userDetailRow}>
            <FontAwesome name="map-marker" size={14} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" size="sm" style={styles.userDetailText}>
              {(() => {
                // Trouver le code du département si c'est un nom
                const deptCode = HAITIAN_DEPARTMENTS.find(
                  d => d.name === item.department || d.nameKr === item.department
                )?.code || item.department;
                return getDepartmentName(deptCode);
              })()}
            </ThemedText>
          </ThemedView>
        )}
        {item.institutionName && (
          <ThemedView variant="transparent" style={styles.userDetailRow}>
            <FontAwesome name="building" size={14} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" size="sm" style={styles.userDetailText}>
              {item.institutionName}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView variant="transparent" style={styles.userActions}>
        <PressableButton
          onPress={() => handleViewActivity(item)}
          label={t('admin.users.viewActivity') || 'Activité'}
          variant="outline"
          size="sm"
          icon="bar-chart"
          style={styles.actionButton}
        />
        <PressableButton
          onPress={() => handleResetPassword(item)}
          label={t('admin.users.resetPassword') || 'Réinitialiser'}
          variant="outline"
          size="sm"
          icon="key"
          style={styles.actionButton}
        />
        <PressableButton
          onPress={() => handleToggleStatus(item)}
          label={item.status === 'active' 
            ? (t('admin.users.deactivate') || 'Désactiver')
            : (t('admin.users.activate') || 'Activer')}
          variant="outline"
          size="sm"
          icon={item.status === 'active' ? 'ban' : 'check'}
          style={StyleSheet.flatten([
            styles.actionButton,
            { 
              borderColor: item.status === 'active' 
                ? theme.colors.error 
                : theme.colors.success 
            }
          ])}
          labelStyle={{ 
            color: item.status === 'active' 
              ? theme.colors.error 
              : theme.colors.success 
          }}
        />
        <PressableButton
          onPress={() => handleEdit(item)}
          label={t('common.edit')}
          variant="primary"
          size="sm"
          icon="edit"
          style={styles.actionButton}
        />
      </ThemedView>
    </ThemedCard>
  );

  return (
    <ScreenContainer variant="background">
      {/* Header */}
      <ThemedView
        variant="transparent"
        style={StyleSheet.flatten([
          styles.header,
          {
            backgroundColor: theme.colors.primary,
            paddingTop: Math.max(insets.top, 16),
          }
        ])}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 }
          ]}
        >
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <ThemedView variant="transparent" style={styles.headerText}>
          <ThemedText size="xl" weight="bold" style={StyleSheet.flatten([styles.headerTitle, { color: '#fff' }])}>
            {t('admin.users.title') || 'Gestion des Utilisateurs'}
          </ThemedText>
          <ThemedText size="sm" style={StyleSheet.flatten([styles.headerSubtitle, { color: '#fff' }])}>
            {t('admin.users.subtitle') || 'Créer et gérer les utilisateurs'}
          </ThemedText>
        </ThemedView>
        <Pressable
          onPress={handleCreate}
          style={({ pressed }) => [
            styles.createButton,
            pressed && { opacity: 0.8 }
          ]}
        >
          <ThemedView variant="transparent" style={styles.createButtonContent}>
            <FontAwesome name="plus" size={16} color="#fff" />
            <ThemedText size="sm" weight="semibold" style={{ color: '#fff', marginLeft: 6 }}>
              {t('admin.users.create') || 'Créer'}
            </ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedView>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={isTablet && styles.scrollContentTablet}
        showsVerticalScrollIndicator={false}
      >
        {/* Filtres combinés - Une seule ligne */}
        <ThemedCard style={styles.filtersCard}>
          <ThemedView variant="transparent" style={styles.filtersRow}>
            {/* Dropdown Rôle */}
            <ThemedView variant="transparent" style={styles.filterDropdown}>
              <ThemedText size="xs" variant="secondary" style={styles.filterLabel}>
                {t('admin.users.role') || 'Rôle'}
              </ThemedText>
              <Pressable
                style={({ pressed }) => [
                  styles.dropdownButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => setShowRoleModal(true)}
              >
                <ThemedText
                  size="sm"
                  weight="medium"
                  style={{
                    color: theme.colors.text,
                    flex: 1,
                  }}
                >
                  {roleFilter === 'all' 
                    ? t('common.all') || 'Tous'
                    : getRoleLabel(roleFilter)}
                </ThemedText>
                <FontAwesome name="chevron-down" size={14} color={theme.colors.textSecondary} />
              </Pressable>
            </ThemedView>

            {/* Dropdown Statut */}
            <ThemedView variant="transparent" style={styles.filterDropdown}>
              <ThemedText size="xs" variant="secondary" style={styles.filterLabel}>
                {t('admin.users.status') || 'Statut'}
              </ThemedText>
              <Pressable
                style={({ pressed }) => [
                  styles.dropdownButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => setShowStatusModal(true)}
              >
                <ThemedText
                  size="sm"
                  weight="medium"
                  style={{
                    color: theme.colors.text,
                    flex: 1,
                  }}
                >
                  {statusFilter === 'all'
                    ? t('common.all') || 'Tous'
                    : statusFilter === 'active'
                    ? t('admin.users.active') || 'Actifs'
                    : t('admin.users.inactive') || 'Inactifs'}
                </ThemedText>
                <FontAwesome name="chevron-down" size={14} color={theme.colors.textSecondary} />
              </Pressable>
            </ThemedView>

            {/* Dropdown Département */}
            <ThemedView variant="transparent" style={styles.filterDropdown}>
              <ThemedText size="xs" variant="secondary" style={styles.filterLabel}>
                {t('admin.users.department') || 'Département'}
              </ThemedText>
              <Pressable
                style={({ pressed }) => [
                  styles.dropdownButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => setShowDepartmentModal(true)}
              >
                <ThemedText
                  size="sm"
                  weight="medium"
                  style={{
                    color: theme.colors.text,
                    flex: 1,
                  }}
                >
                  {departmentFilter === 'all'
                    ? t('common.all') || 'Tous'
                    : getDepartmentName(departmentFilter)}
                </ThemedText>
                <FontAwesome name="chevron-down" size={14} color={theme.colors.textSecondary} />
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedCard>

        {/* Modal Rôle */}
        <Modal
          visible={showRoleModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRoleModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowRoleModal(false)}
          >
            <View style={StyleSheet.flatten([styles.modalCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg }])} onStartShouldSetResponder={() => true}>
              <ThemedView variant="transparent" style={styles.modalHeader}>
                <ThemedText size="base" weight="semibold">
                  {t('admin.users.role') || 'Sélectionner le rôle'}
                </ThemedText>
                <Pressable onPress={() => setShowRoleModal(false)}>
                  <FontAwesome name="times" size={20} color={theme.colors.textSecondary} />
                </Pressable>
              </ThemedView>
              <FlatList
                data={[
                  { value: 'all', label: t('common.all') || 'Tous' },
                  { value: 'agent', label: getRoleLabel('agent') },
                  { value: 'hospital', label: getRoleLabel('hospital') },
                  { value: 'admin', label: getRoleLabel('admin') },
                ]}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalOption,
                      roleFilter === item.value && {
                        backgroundColor: theme.colors.primary + '20',
                      },
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => {
                      setRoleFilter(item.value as UserRole | 'all');
                      setShowRoleModal(false);
                    }}
                  >
                    <ThemedText
                      size="base"
                      weight={roleFilter === item.value ? 'semibold' : 'normal'}
                      style={{
                        color: roleFilter === item.value ? theme.colors.primary : theme.colors.text,
                      }}
                    >
                      {item.label}
                    </ThemedText>
                    {roleFilter === item.value && (
                      <FontAwesome name="check" size={16} color={theme.colors.primary} />
                    )}
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        {/* Modal Statut */}
        <Modal
          visible={showStatusModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStatusModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowStatusModal(false)}
          >
            <View style={StyleSheet.flatten([styles.modalCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg }])} onStartShouldSetResponder={() => true}>
              <ThemedView variant="transparent" style={styles.modalHeader}>
                <ThemedText size="base" weight="semibold">
                  {t('admin.users.status') || 'Sélectionner le statut'}
                </ThemedText>
                <Pressable onPress={() => setShowStatusModal(false)}>
                  <FontAwesome name="times" size={20} color={theme.colors.textSecondary} />
                </Pressable>
              </ThemedView>
              <FlatList
                data={[
                  { value: 'all', label: t('common.all') || 'Tous' },
                  { value: 'active', label: t('admin.users.active') || 'Actifs' },
                  { value: 'inactive', label: t('admin.users.inactive') || 'Inactifs' },
                ]}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalOption,
                      statusFilter === item.value && {
                        backgroundColor: theme.colors.primary + '20',
                      },
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => {
                      setStatusFilter(item.value as UserStatus | 'all');
                      setShowStatusModal(false);
                    }}
                  >
                    <ThemedText
                      size="base"
                      weight={statusFilter === item.value ? 'semibold' : 'normal'}
                      style={{
                        color: statusFilter === item.value ? theme.colors.primary : theme.colors.text,
                      }}
                    >
                      {item.label}
                    </ThemedText>
                    {statusFilter === item.value && (
                      <FontAwesome name="check" size={16} color={theme.colors.primary} />
                    )}
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        {/* Modal Département */}
        <Modal
          visible={showDepartmentModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDepartmentModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDepartmentModal(false)}
          >
            <View style={StyleSheet.flatten([styles.modalCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg }])} onStartShouldSetResponder={() => true}>
              <ThemedView variant="transparent" style={styles.modalHeader}>
                <ThemedText size="base" weight="semibold">
                  {t('admin.users.department') || 'Sélectionner le département'}
                </ThemedText>
                <Pressable onPress={() => setShowDepartmentModal(false)}>
                  <FontAwesome name="times" size={20} color={theme.colors.textSecondary} />
                </Pressable>
              </ThemedView>
              <FlatList
                data={[
                  { value: 'all', label: t('common.all') || 'Tous' },
                  ...allDepartments.map(dept => ({ value: dept.code, label: dept.name })),
                ]}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalOption,
                      departmentFilter === item.value && {
                        backgroundColor: theme.colors.primary + '20',
                      },
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => {
                      setDepartmentFilter(item.value);
                      setShowDepartmentModal(false);
                    }}
                  >
                    <ThemedText
                      size="base"
                      weight={departmentFilter === item.value ? 'semibold' : 'normal'}
                      style={{
                        color: departmentFilter === item.value ? theme.colors.primary : theme.colors.text,
                      }}
                    >
                      {item.label}
                    </ThemedText>
                    {departmentFilter === item.value && (
                      <FontAwesome name="check" size={16} color={theme.colors.primary} />
                    )}
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        {/* Barre de recherche */}
        <ThemedCard style={styles.searchCard}>
          <ThemedView variant="transparent" style={styles.searchContainer}>
            <FontAwesome name="search" size={18} color={theme.colors.textSecondary} />
            <RNTextInput
              style={styles.searchInput}
              placeholder={t('admin.users.searchPlaceholder') || 'Rechercher par nom, email...'}
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <FontAwesome name="times" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            )}
          </ThemedView>
        </ThemedCard>

        {/* Liste des utilisateurs */}
        {filteredUsers.length === 0 ? (
          <ThemedCard style={styles.emptyCard}>
            <ThemedView variant="transparent" style={styles.emptyContent}>
              <FontAwesome name="users" size={48} color={theme.colors.textSecondary} />
              <ThemedText variant="secondary" size="lg" weight="medium" style={styles.emptyText}>
                {t('admin.users.noUsers') || 'Aucun utilisateur trouvé'}
              </ThemedText>
            </ThemedView>
          </ThemedCard>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </ScrollView>

      {/* Modal de création/modification */}
      <Modal
        visible={showCreateModal || showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
          }}
        >
          <ThemedView style={StyleSheet.flatten([styles.modalContent, { backgroundColor: theme.colors.surface }])}>
            <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
              {showCreateModal 
                ? (t('admin.users.createUser') || 'Créer un Utilisateur')
                : (t('admin.users.editUser') || 'Modifier l\'Utilisateur')}
            </ThemedText>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
              {/* Prénoms */}
              <ThemedView variant="transparent" style={styles.nameSection}>
                <ThemedText size="sm" weight="medium" style={styles.modalLabel}>
                  {t('admin.users.firstNames') || 'Prénom(s)'} *
                </ThemedText>
                {formData.firstNames.map((firstName, index) => (
                  <ThemedView key={index} variant="transparent" style={styles.firstNameRow}>
                    <ThemedInput
                      placeholder={t('admin.users.firstName') || 'Prénom'}
                      value={firstName}
                      onChangeText={(text) => {
                        const newFirstNames = [...formData.firstNames];
                        newFirstNames[index] = text;
                        setFormData({ ...formData, firstNames: newFirstNames });
                      }}
                      style={StyleSheet.flatten([styles.modalInput, styles.firstNameRowInput])}
                    />
                    {index > 0 && (
                      <Pressable
                        onPress={() => removeFirstName(index)}
                        style={styles.removeButton}
                      >
                        <FontAwesome name="times" size={16} color={theme.colors.error} />
                      </Pressable>
                    )}
                  </ThemedView>
                ))}
                <Pressable 
                  onPress={addFirstName} 
                  style={StyleSheet.flatten([styles.addButton, { borderColor: theme.colors.border }])}
                >
                  <FontAwesome name="plus" size={16} color={theme.colors.primary} />
                  <ThemedText size="sm" style={{ color: theme.colors.primary, marginLeft: 8 }}>
                    {t('admin.users.addFirstName') || 'Ajouter un prénom'}
                  </ThemedText>
                </Pressable>
              </ThemedView>

              {/* Nom de famille */}
              <ThemedInput
                placeholder={t('admin.users.lastName') || 'Nom de famille (Siyati)'}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                style={styles.modalInput}
              />
              <ThemedInput
                placeholder={t('admin.users.email') || 'Email'}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                style={styles.modalInput}
              />
              <ThemedInput
                placeholder={t('admin.users.phone') || 'Téléphone (optionnel)'}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                style={styles.modalInput}
              />
              
              {/* Sélection du rôle */}
              <ThemedText size="sm" weight="medium" style={styles.modalLabel}>
                {t('admin.users.role') || 'Rôle'}
              </ThemedText>
              <ThemedView variant="transparent" style={styles.roleSelector}>
                {(['agent', 'hospital', 'admin'] as UserRole[]).map((role) => (
                  <Pressable
                    key={role}
                    style={({ pressed }) => [
                      styles.roleOption,
                      formData.role === role && {
                        backgroundColor: getRoleColor(role) + '20',
                        borderColor: getRoleColor(role),
                      },
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => setFormData({ ...formData, role })}
                  >
                    <ThemedText
                      size="sm"
                      weight={formData.role === role ? 'semibold' : 'normal'}
                      style={{
                        color: formData.role === role ? getRoleColor(role) : theme.colors.textSecondary,
                      }}
                    >
                      {getRoleLabel(role)}
                    </ThemedText>
                  </Pressable>
                ))}
              </ThemedView>

              {formData.role === 'agent' && (
                <ThemedView variant="transparent" style={styles.pickerContainer}>
                  <ThemedText size="sm" weight="medium" style={styles.modalLabel}>
                    {t('admin.users.department') || 'Département'} *
                  </ThemedText>
                  <Pressable
                    style={StyleSheet.flatten([
                      styles.pickerButton,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      }
                    ])}
                    onPress={() => setShowDepartmentPickerModal(true)}
                  >
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.pickerText,
                        !formData.department && { color: theme.colors.textSecondary },
                      ])}
                    >
                      {formData.department
                        ? getDepartmentName(formData.department)
                        : t('admin.users.department') || 'Sélectionner le département'}
                    </ThemedText>
                    <FontAwesome name="chevron-down" size={16} color={theme.colors.textSecondary} />
                  </Pressable>
                </ThemedView>
              )}

              {formData.role === 'hospital' && (
                <ThemedInput
                  placeholder={t('admin.users.institutionName') || 'Nom de l\'institution'}
                  value={formData.institutionName}
                  onChangeText={(text) => setFormData({ ...formData, institutionName: text })}
                  style={styles.modalInput}
                />
              )}
            </ScrollView>

            <ThemedView variant="transparent" style={styles.modalActions}>
              <PressableButton
                onPress={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                label={t('common.cancel')}
                variant="outline"
                style={styles.modalButton}
              />
              <PressableButton
                onPress={handleSave}
                label={t('common.save')}
                variant="primary"
                style={styles.modalButton}
              />
            </ThemedView>
          </ThemedView>
        </Pressable>
      </Modal>

      {/* Modal de sélection du département dans le formulaire */}
      <Modal
        visible={showDepartmentPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepartmentPickerModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDepartmentPickerModal(false)}
        >
          <ThemedView style={StyleSheet.flatten([styles.modalContent, { backgroundColor: theme.colors.surface }])}>
            <ThemedView variant="transparent" style={styles.modalHeader}>
              <ThemedView variant="transparent" style={styles.modalHeaderText}>
                <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
                  {t('admin.users.department') || 'Sélectionner le département'}
                </ThemedText>
              </ThemedView>
              <Pressable
                onPress={() => setShowDepartmentPickerModal(false)}
                style={styles.modalCloseButton}
              >
                <FontAwesome name="times" size={20} color={theme.colors.text} />
              </Pressable>
            </ThemedView>
            
            <FlatList
              data={HAITIAN_DEPARTMENTS}
              keyExtractor={(item) => item.code}
              renderItem={({ item: dept }) => (
                <Pressable
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor: formData.department === dept.code 
                        ? theme.colors.primary + '20' 
                        : theme.colors.surface,
                      borderColor: formData.department === dept.code 
                        ? theme.colors.primary 
                        : theme.colors.border,
                    }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, department: dept.code });
                    setShowDepartmentPickerModal(false);
                  }}
                >
                  <ThemedText
                    size="base"
                    weight={formData.department === dept.code ? 'semibold' : 'normal'}
                    style={{
                      color: formData.department === dept.code ? theme.colors.primary : theme.colors.text,
                    }}
                  >
                    {currentLanguage === 'fr' ? dept.name : dept.nameKr}
                  </ThemedText>
                </Pressable>
              )}
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            />
          </ThemedView>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    marginBottom: 4,
  },
  headerSubtitle: {
    opacity: 0.9,
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  scrollContentTablet: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  filtersCard: {
    marginBottom: 16,
    padding: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterDropdown: {
    flex: 1,
  },
  filterLabel: {
    marginBottom: 6,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  modalCard: {
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statText: {
    flex: 1,
  },
  searchCard: {
    marginBottom: 16,
    padding: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    gap: 12,
  },
  userCard: {
    marginBottom: 12,
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  userIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  userDetails: {
    marginTop: 8,
    gap: 8,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userDetailText: {
    flex: 1,
  },
  userActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
  },
  modalScroll: {
    maxHeight: 400,
  },
  helperText: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalLabel: {
    marginBottom: 8,
    marginTop: 8,
  },
  nameSection: {
    marginBottom: 16,
  },
  firstNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  firstNameRowInput: {
    flex: 1,
    marginBottom: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  removeButton: {
    padding: 8,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
  },
  pickerText: {
    flex: 1,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
});

