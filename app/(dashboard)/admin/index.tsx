import { PressableButton } from '@/components/PressableButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  ThemedCard,
  ThemedText,
  ThemedView
} from '@/components/ThemedComponents';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdminDashboard() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('month');

  // Données simulées - Statistiques
  const statsThisWeek = {
    pregnancies: 45,
    births: 32,
  };
  const statsThisMonth = {
    pregnancies: 245,
    births: 178,
  };

  // Statistiques globales pour la carte
  const globalStats = {
    total: 127,
    pending: 23,
    validated: 54,
    legalized: 50,
  };

  const currentStats = selectedPeriod === 'week' ? {
    total: statsThisWeek.pregnancies + statsThisWeek.births,
    pending: 5,
    validated: 25,
    legalized: 22,
  } : {
    total: globalStats.total,
    pending: globalStats.pending,
    validated: globalStats.validated,
    legalized: globalStats.legalized,
  };

  // Cas récents enregistrés (simulés) - Limité à 3 pour alléger
  const recentRecords = [
    {
      id: 'PR-2025-001',
      type: 'pregnancy' as const,
      name: 'Marie Jean',
      date: new Date('2025-01-28'),
      status: 'pending',
    },
    {
      id: 'BR-2025-001',
      type: 'birth' as const,
      name: 'Sophie Laurent',
      date: new Date('2025-01-28'),
      status: 'validated',
    },
    {
      id: 'PR-2025-002',
      type: 'pregnancy' as const,
      name: 'Claire Martin',
      date: new Date('2025-01-27'),
      status: 'pending',
    },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'pregnancy':
        router.push('/(dashboard)/admin/pregnancy' as any);
        break;
      case 'birth':
        router.push('/(dashboard)/admin/birth' as any);
        break;
      case 'validation':
        router.push('/(dashboard)/admin/validation' as any);
        break;
      case 'users':
        router.push('/(dashboard)/admin/users' as any);
        break;
      case 'statistics':
        router.push('/(dashboard)/admin/statistics' as any);
        break;
    }
  };

  const handleNotificationPress = () => {
    // TODO: Ouvrir les notifications
    console.log('Ouvrir notifications');
  };

  const handleSettingsPress = () => {
    router.push('/(dashboard)/admin/settings' as any);
  };

  const handleBottomNavPress = (section: string) => {
    switch (section) {
      case 'home':
        // Déjà sur l'accueil
        break;
      case 'validation':
        router.push('/(dashboard)/admin/validation' as any);
        break;
      case 'add':
        setShowAddModal(true);
        break;
      case 'statistics':
        router.push('/(dashboard)/admin/statistics' as any);
        break;
      case 'profile':
        router.push('/(dashboard)/admin/profile' as any);
        break;
    }
  };

  const handleAddOption = (option: 'pregnancy' | 'birth') => {
    setShowAddModal(false);
    if (option === 'pregnancy') {
      router.push('/(dashboard)/admin/pregnancy' as any);
    } else {
      router.push('/(dashboard)/admin/birth' as any);
    }
  };

  return (
    <ScreenContainer variant="background">
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1️⃣ Header avec dégradé */}
        <ThemedView 
          variant="transparent"
          style={StyleSheet.flatten([
            styles.header,
            { backgroundColor: theme.colors.primary }
          ])}
        >
          <ThemedView variant="transparent" style={styles.headerContent}>
            <ThemedView variant="transparent" style={styles.headerLeft}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.adminIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }])}
              >
                <FontAwesome 
                  name="cog" 
                  size={isTablet ? 40 : 32} 
                  color="#fff" 
                />
              </ThemedView>
              <ThemedView variant="transparent" style={styles.headerText}>
                <ThemedText 
                  size="sm" 
                  style={StyleSheet.flatten([styles.welcomeText, { color: 'rgba(255, 255, 255, 0.9)' }])}
                >
                  {t('admin.dashboard.welcome') || 'Bienvenue'}
                </ThemedText>
                <ThemedText 
                  size="base" 
                  weight="semibold"
                  style={StyleSheet.flatten([styles.adminTitle, { color: '#fff' }])}
                >
                  {t('admin.dashboard.title') || 'Administrateur'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <ThemedView variant="transparent" style={styles.headerActions}>
              <Pressable
                style={styles.headerIconButton}
                onPress={handleNotificationPress}
              >
                <FontAwesome 
                  name="bell" 
                  size={isTablet ? 24 : 20} 
                  color="#fff" 
                />
                <View style={styles.notificationBadge} />
              </Pressable>
              <Pressable
                style={styles.headerIconButton}
                onPress={handleSettingsPress}
              >
                <FontAwesome 
                  name="cog" 
                  size={isTablet ? 24 : 20} 
                  color="#fff" 
                />
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* 2️⃣ Section Actions Rapides */}
        <ThemedView variant="transparent" style={styles.titleSection}>
          <ThemedText 
            size="xl" 
            weight="bold" 
            style={styles.mainTitle}
          >
            {t('admin.dashboard.quickActions') || 'Actions Rapides'}
          </ThemedText>
        </ThemedView>

        {/* 3️⃣ Grille 2x2 des actions rapides */}
        <ThemedView variant="transparent" style={styles.actionsGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: theme.colors.surface },
              pressed && styles.actionCardPressed
            ]}
            onPress={() => handleQuickAction('pregnancy')}
          >
            <ThemedView 
              variant="transparent"
              style={StyleSheet.flatten([styles.actionIconCircle, { backgroundColor: theme.colors.success + '20' }])}
            >
              <FontAwesome 
                name="heart" 
                size={isTablet ? 36 : 28} 
                color={theme.colors.success} 
              />
            </ThemedView>
            <ThemedText 
              size="base" 
              weight="semibold"
              style={styles.actionTitle}
            >
              {t('admin.dashboard.registerPregnancy') || 'Enregistrer Grossesse'}
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: theme.colors.surface },
              pressed && styles.actionCardPressed
            ]}
            onPress={() => handleQuickAction('birth')}
          >
            <ThemedView 
              variant="transparent"
              style={StyleSheet.flatten([styles.actionIconCircle, { backgroundColor: theme.colors.primary + '20' }])}
            >
              <FontAwesome 
                name="child" 
                size={isTablet ? 36 : 28} 
                color={theme.colors.primary} 
              />
            </ThemedView>
            <ThemedText 
              size="base" 
              weight="semibold"
              style={styles.actionTitle}
            >
              {t('admin.dashboard.registerBirth') || 'Enregistrer Naissance'}
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: theme.colors.surface },
              pressed && styles.actionCardPressed
            ]}
            onPress={() => handleQuickAction('validation')}
          >
            <ThemedView 
              variant="transparent"
              style={StyleSheet.flatten([styles.actionIconCircle, { backgroundColor: theme.colors.warning + '20' }])}
            >
              <FontAwesome 
                name="check-square" 
                size={isTablet ? 36 : 28} 
                color={theme.colors.warning} 
              />
            </ThemedView>
            <ThemedText 
              size="base" 
              weight="semibold"
              style={styles.actionTitle}
            >
              {t('admin.dashboard.validateRecords') || 'Valider Enregistrements'}
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: theme.colors.surface },
              pressed && styles.actionCardPressed
            ]}
            onPress={() => handleQuickAction('users')}
          >
            <ThemedView 
              variant="transparent"
              style={StyleSheet.flatten([styles.actionIconCircle, { backgroundColor: theme.colors.info + '20' }])}
            >
              <FontAwesome 
                name="users" 
                size={isTablet ? 36 : 28} 
                color={theme.colors.info} 
              />
            </ThemedView>
            <ThemedText 
              size="base" 
              weight="semibold"
              style={styles.actionTitle}
            >
              {t('admin.dashboard.manageUsers') || 'Gérer Utilisateurs'}
            </ThemedText>
          </Pressable>
        </ThemedView>

        {/* 4️⃣ Carte de Statistiques Globales */}
        <Pressable
          onPress={() => handleQuickAction('statistics')}
          style={({ pressed }) => [
            pressed && { opacity: 0.9 }
          ]}
        >
          <ThemedCard style={styles.statisticsCard}>
            <ThemedView variant="transparent" style={styles.statisticsHeader}>
              <ThemedView variant="transparent" style={styles.statisticsTitleSection}>
                <ThemedView variant="transparent" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText size="base" weight="bold">
                    {t('admin.dashboard.statistics') || 'Statistiques'}
                  </ThemedText>
                  <FontAwesome name="bar-chart" size={14} color={theme.colors.primary} />
                </ThemedView>
                <Pressable
                  style={({ pressed }) => [
                    styles.periodSelector,
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedPeriod(selectedPeriod === 'week' ? 'month' : 'week');
                  }}
                >
                  <ThemedText variant="secondary" size="sm">
                    {selectedPeriod === 'week' 
                      ? t('admin.dashboard.thisWeek') 
                      : t('admin.dashboard.thisMonth')}
                  </ThemedText>
                  <FontAwesome name="chevron-down" size={12} color={theme.colors.textSecondary} style={{ marginLeft: 4 }} />
                </Pressable>
              </ThemedView>

            {/* Total Général */}
            <ThemedView variant="transparent" style={styles.totalRow}>
              <ThemedText size="sm" weight="medium" variant="secondary">
                {t('admin.dashboard.totalRegistrations') || 'Total Enregistrements'}
              </ThemedText>
              <ThemedText size="xl" weight="bold">
                {currentStats.total}
              </ThemedText>
            </ThemedView>

            {/* Barre de progression */}
            <View style={styles.progressBarContainer}>
              <View 
                style={StyleSheet.flatten([
                  styles.progressSegment,
                  { 
                    width: `${(currentStats.pending / currentStats.total) * 100}%`,
                    backgroundColor: theme.colors.warning 
                  }
                ])}
              />
              <View 
                style={StyleSheet.flatten([
                  styles.progressSegment,
                  { 
                    width: `${(currentStats.validated / currentStats.total) * 100}%`,
                    backgroundColor: theme.colors.success 
                  }
                ])}
              />
              <View 
                style={StyleSheet.flatten([
                  styles.progressSegment,
                  { 
                    width: `${(currentStats.legalized / currentStats.total) * 100}%`,
                    backgroundColor: theme.colors.secondary 
                  }
                ])}
              />
            </View>

            {/* Ligne de sous-statistiques simplifiée */}
            <ThemedView variant="transparent" style={styles.subStatsRow}>
              <ThemedView variant="transparent" style={styles.subStatItem}>
                <ThemedText size="base" weight="bold" style={{ color: theme.colors.warning }}>
                  {currentStats.pending}
                </ThemedText>
                <ThemedText variant="secondary" size="xs">
                  {t('admin.dashboard.pending') || 'En Attente'}
                </ThemedText>
              </ThemedView>
              <ThemedView variant="transparent" style={styles.subStatItem}>
                <ThemedText size="base" weight="bold" style={{ color: theme.colors.success }}>
                  {currentStats.validated}
                </ThemedText>
                <ThemedText variant="secondary" size="xs">
                  {t('admin.dashboard.validated') || 'Validé'}
                </ThemedText>
              </ThemedView>
              <ThemedView variant="transparent" style={styles.subStatItem}>
                <ThemedText size="base" weight="bold" style={{ color: theme.colors.secondary }}>
                  {currentStats.legalized}
                </ThemedText>
                <ThemedText variant="secondary" size="xs">
                  {t('admin.dashboard.legalized') || 'Légalisé'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ThemedCard>
        </Pressable>

        {/* 5️⃣ Cas Récents Enregistrés */}
        <ThemedCard style={styles.recentRecordsCard}>
          <ThemedView variant="transparent" style={styles.recentRecordsHeader}>
            <ThemedText size="lg" weight="bold">
              {t('admin.dashboard.recentRecords') || 'Cas Récents'}
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.viewAllButton,
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => handleQuickAction('validation')}
            >
              <ThemedText size="sm" weight="medium" style={{ color: theme.colors.primary }}>
                {t('admin.dashboard.viewAll') || 'Voir Tout'}
              </ThemedText>
              <FontAwesome name="arrow-right" size={12} color={theme.colors.primary} style={{ marginLeft: 4 }} />
            </Pressable>
          </ThemedView>

          <FlatList
            data={recentRecords}
            keyExtractor={(item) => item.id}
            renderItem={({ item: record }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.recordCard,
                  { backgroundColor: theme.colors.surface },
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => {
                  // TODO: Naviguer vers les détails du cas
                  console.log('Voir détails:', record.id);
                }}
              >
                <ThemedView 
                  variant="transparent"
                  style={StyleSheet.flatten([
                    styles.recordIcon,
                    { 
                      backgroundColor: record.type === 'pregnancy' 
                        ? theme.colors.success + '20' 
                        : theme.colors.primary + '20' 
                    }
                  ])}
                >
                  <FontAwesome 
                    name={record.type === 'pregnancy' ? 'heart' : 'child'} 
                    size={isTablet ? 24 : 20} 
                    color={record.type === 'pregnancy' ? theme.colors.success : theme.colors.primary} 
                  />
                </ThemedView>
                <ThemedView variant="transparent" style={styles.recordContent}>
                  <ThemedText size="base" weight="semibold" numberOfLines={1}>
                    {record.name}
                  </ThemedText>
                  <ThemedText variant="secondary" size="xs" style={styles.recordId}>
                    {record.id}
                  </ThemedText>
                </ThemedView>
                <ThemedView variant="transparent" style={styles.recordMeta}>
                  <ThemedView 
                    variant="transparent"
                    style={StyleSheet.flatten([
                      styles.statusBadge,
                      { 
                        backgroundColor: record.status === 'validated' 
                          ? theme.colors.success + '20' 
                          : theme.colors.warning + '20' 
                      }
                    ])}
                  >
                    <FontAwesome 
                      name={record.status === 'validated' ? 'check-circle' : 'clock-o'} 
                      size={10} 
                      color={record.status === 'validated' ? theme.colors.success : theme.colors.warning} 
                    />
                    <ThemedText 
                      size="xs" 
                      weight="medium"
                      style={StyleSheet.flatten([
                        styles.statusText,
                        { 
                          color: record.status === 'validated' 
                            ? theme.colors.success 
                            : theme.colors.warning 
                        }
                      ])}
                    >
                      {record.status === 'validated' 
                        ? t('admin.dashboard.validated') 
                        : t('admin.dashboard.pending')}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </Pressable>
            )}
            scrollEnabled={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.recentRecordsList}
          />

          {recentRecords.length === 0 && (
            <ThemedView variant="transparent" style={styles.emptyState}>
              <FontAwesome name="inbox" size={48} color={theme.colors.textSecondary} />
              <ThemedText variant="secondary" size="base" style={styles.emptyStateText}>
                {t('admin.dashboard.noRecentRecords') || 'Aucun cas récent'}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedCard>
      </ScrollView>

      {/* 7️⃣ Barre de navigation inférieure */}
      <ThemedView style={{ ...styles.bottomNavigation, backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }}>
        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            pressed && styles.navItemPressed
          ]}
          onPress={() => handleBottomNavPress('home')}
        >
          <FontAwesome 
            name="home" 
            size={isTablet ? 24 : 20} 
            color={theme.colors.primary} 
          />
          <ThemedText 
            size="xs" 
            weight="medium"
            style={{ ...styles.navLabel, color: theme.colors.primary }}
          >
            {t('admin.navigation.home') || 'Accueil'}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            pressed && styles.navItemPressed
          ]}
          onPress={() => handleBottomNavPress('validation')}
        >
          <FontAwesome 
            name="check-square" 
            size={isTablet ? 24 : 20} 
            color={theme.colors.textSecondary} 
          />
          <ThemedText 
            variant="secondary" 
            size="xs" 
            weight="medium"
            style={styles.navLabel}
          >
            {t('admin.navigation.validation') || 'Validation'}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItemCenter,
            pressed && styles.navItemPressed
          ]}
          onPress={() => handleBottomNavPress('add')}
        >
          <ThemedView style={styles.centerNavIcon}>
            <FontAwesome 
              name="plus" 
              size={isTablet ? 24 : 20} 
              color="#fff" 
            />
          </ThemedView>
          <ThemedText 
            size="xs" 
            weight="medium"
            style={{ ...styles.navLabel, color: theme.colors.primary }}
          >
            {t('admin.navigation.add') || 'Ajouter'}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            pressed && styles.navItemPressed
          ]}
          onPress={() => handleBottomNavPress('statistics')}
        >
          <FontAwesome 
            name="bar-chart" 
            size={isTablet ? 24 : 20} 
            color={theme.colors.textSecondary} 
          />
          <ThemedText 
            variant="secondary" 
            size="xs" 
            weight="medium"
            style={styles.navLabel}
          >
            {t('admin.navigation.statistics') || 'Statistiques'}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            pressed && styles.navItemPressed
          ]}
          onPress={() => handleBottomNavPress('profile')}
        >
          <FontAwesome 
            name="user" 
            size={isTablet ? 24 : 20} 
            color={theme.colors.textSecondary} 
          />
          <ThemedText 
            variant="secondary" 
            size="xs" 
            weight="medium"
            style={styles.navLabel}
          >
            {t('admin.navigation.profile') || 'Profil'}
          </ThemedText>
        </Pressable>
      </ThemedView>

      {/* 8️⃣ Modal pour choisir le type d'enregistrement */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={StyleSheet.flatten([styles.modalContent, { backgroundColor: theme.colors.surface }])}>
            <ThemedText 
              size="lg" 
              weight="bold" 
              style={styles.modalTitle}
            >
              {t('admin.addModal.title') || 'Ajouter un Enregistrement'}
            </ThemedText>
            <ThemedText 
              variant="secondary" 
              size="sm" 
              style={styles.modalSubtitle}
            >
              {t('admin.addModal.subtitle') || 'Choisissez le type d\'enregistrement'}
            </ThemedText>
            
            <ThemedView variant="transparent" style={styles.modalOptions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalOption,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => handleAddOption('pregnancy')}
              >
                <ThemedView variant="transparent" style={StyleSheet.flatten([styles.modalOptionIcon, { backgroundColor: theme.colors.success + '20' }])}>
                  <FontAwesome 
                    name="heart" 
                    size={isTablet ? 32 : 28} 
                    color={theme.colors.success} 
                  />
                </ThemedView>
                <ThemedView variant="transparent" style={StyleSheet.flatten([styles.modalOptionText, { backgroundColor: 'transparent' }])}>
                  <ThemedText 
                    size="base" 
                    weight="semibold"
                    style={styles.modalOptionTitle}
                  >
                    {t('admin.addModal.registerPregnancy') || 'Enregistrer Grossesse'}
                  </ThemedText>
                  <ThemedText 
                    variant="secondary" 
                    size="sm"
                    style={styles.modalOptionSubtitle}
                  >
                    {t('admin.addModal.registerPregnancyDesc') || 'Enregistrer une nouvelle grossesse'}
                  </ThemedText>
                </ThemedView>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalOption,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => handleAddOption('birth')}
              >
                <ThemedView variant="transparent" style={StyleSheet.flatten([styles.modalOptionIcon, { backgroundColor: theme.colors.primary + '20' }])}>
                  <FontAwesome 
                    name="child" 
                    size={isTablet ? 32 : 28} 
                    color={theme.colors.primary} 
                  />
                </ThemedView>
                <ThemedView variant="transparent" style={StyleSheet.flatten([styles.modalOptionText, { backgroundColor: 'transparent' }])}>
                  <ThemedText 
                    size="base" 
                    weight="semibold"
                    style={styles.modalOptionTitle}
                  >
                    {t('admin.addModal.registerBirth') || 'Enregistrer Naissance'}
                  </ThemedText>
                  <ThemedText 
                    variant="secondary" 
                    size="sm"
                    style={styles.modalOptionSubtitle}
                  >
                    {t('admin.addModal.registerBirthDesc') || 'Enregistrer une nouvelle naissance'}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </ThemedView>

            <PressableButton
              variant="outline"
              size="md"
              onPress={() => setShowAddModal(false)}
              style={styles.modalCancelButton}
            >
              <FontAwesome name="times" size={14} color={theme.colors.textSecondary} />
              <ThemedText size="sm" style={{ color: theme.colors.textSecondary, marginLeft: 8 }}>
                {t('common.cancel')}
              </ThemedText>
            </PressableButton>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 0,
    paddingBottom: 100,
  },
  scrollContentTablet: {
    paddingHorizontal: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginBottom: 24,
    borderRadius: 0,
    marginHorizontal: 0,
    marginTop: 0,
    width: '100%',
    alignSelf: 'stretch',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    marginBottom: 4,
  },
  adminTitle: {
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  mainTitle: {
    flex: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  actionCard: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCardPressed: {
    borderWidth: 2,
    borderColor: '#2f95dc',
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  statsCard: {
    marginBottom: 20,
    padding: 20,
    marginHorizontal: 16,
  },
  statsHeader: {
    marginBottom: 16,
  },
  statsTitle: {
    marginBottom: 4,
  },
  statsSubtitle: {
    lineHeight: 16,
  },
  statsRows: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  statsRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRowText: {
    flex: 1,
  },
  statsRowNumber: {
    minWidth: 40,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statsColumn: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statsColumnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsColumnNumber: {
    marginBottom: 4,
  },
  statsColumnText: {
    textAlign: 'center',
    lineHeight: 16,
  },
  secondaryActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  secondarySectionTitle: {
    marginBottom: 16,
  },
  secondaryActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  statisticsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statisticsHeader: {
    gap: 12,
  },
  statisticsTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: 6,
  },
  progressSegment: {
    height: '100%',
  },
  subStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  subStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  recentRecordsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
  },
  recentRecordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  recentRecordsList: {
    gap: 12,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordContent: {
    flex: 1,
    gap: 2,
  },
  recordId: {
    fontFamily: 'monospace',
  },
  recordMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
  },
  recordDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    textAlign: 'center',
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemCenter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemPressed: {
    opacity: 0.7,
  },
  centerNavIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2f95dc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#2f95dc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  navLabel: {
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  modalOptions: {
    gap: 16,
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    marginBottom: 4,
  },
  modalOptionSubtitle: {
    lineHeight: 16,
  },
  modalCancelButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
