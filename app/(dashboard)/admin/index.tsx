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
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRecordsForValidation } from '@/services/admin/adminService';
import { usePregnancyStore } from '@/store/pregnancyStore';
import { useBirthStore } from '@/store/birthStore';
import { getAllEmergencyReports } from '@/services/emergency/emergencyService';

export default function AdminDashboard() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    validated: 0,
    legalized: 0,
    pregnancies: 0,
    births: 0,
  });
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [recentRecords, setRecentRecords] = useState<Array<{
    id: string;
    type: 'pregnancy' | 'birth';
    name: string;
    date: Date;
    status: 'pending' | 'validated' | 'rejected';
  }>>([]);
  const { pregnancies } = usePregnancyStore();
  const { births } = useBirthStore();

  // Charger les statistiques et cas récents
  useEffect(() => {
    loadDashboardData();
    loadEmergencyCount();
  }, [selectedPeriod]);

  // Recharger le compteur d'urgence quand l'écran est mis au focus
  useFocusEffect(
    useCallback(() => {
      loadEmergencyCount();
    }, [])
  );

  const loadEmergencyCount = async () => {
    try {
      const reports = await getAllEmergencyReports();
      const pendingReports = reports.filter(r => r.status === 'pending');
      setEmergencyCount(pendingReports.length);
    } catch (error) {
      console.error('Error loading emergency count:', error);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Charger tous les enregistrements pour calculer les statistiques
      const [allPregnancies, allBirths] = await Promise.all([
        getRecordsForValidation('pregnancy'),
        getRecordsForValidation('birth'),
      ]);

      // Calculer les statistiques globales
      const allRecords = [...allPregnancies, ...allBirths];
      const total = allRecords.length;
      const pending = allRecords.filter(r => (r.validationStatus || 'pending') === 'pending').length;
      const validated = allRecords.filter(r => (r.validationStatus || 'pending') === 'validated').length;
      const legalized = allRecords.filter(r => (r.certificateStatus === 'issued' || r.certificateStatus === 'approved')).length;

      // Calculer les statistiques par période
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recordsThisWeek = allRecords.filter(r => {
        const createdAt = r.createdAt ? new Date(r.createdAt) : new Date(0);
        return createdAt >= weekAgo;
      });

      const recordsThisMonth = allRecords.filter(r => {
        const createdAt = r.createdAt ? new Date(r.createdAt) : new Date(0);
        return createdAt >= monthAgo;
      });

      // Distinguer pregnancies et births : births ont childFirstNames, pregnancies ont motherFirstNames mais pas childFirstNames
      const isBirthRecord = (r: any) => r.childFirstNames && r.childFirstNames.length > 0;
      const isPregnancyRecord = (r: any) => !isBirthRecord(r) && (r.motherFirstNames || r.motherName);

      const pregnanciesThisWeek = recordsThisWeek.filter(isPregnancyRecord).length;
      const birthsThisWeek = recordsThisWeek.filter(isBirthRecord).length;
      const pregnanciesThisMonth = recordsThisMonth.filter(isPregnancyRecord).length;
      const birthsThisMonth = recordsThisMonth.filter(isBirthRecord).length;

      // Statistiques selon la période sélectionnée
      const currentStats = selectedPeriod === 'week' ? {
        total: recordsThisWeek.length,
        pending: recordsThisWeek.filter(r => (r.validationStatus || 'pending') === 'pending').length,
        validated: recordsThisWeek.filter(r => (r.validationStatus || 'pending') === 'validated').length,
        legalized: recordsThisWeek.filter(r => r.certificateStatus === 'issued' || r.certificateStatus === 'approved').length,
        pregnancies: pregnanciesThisWeek,
        births: birthsThisWeek,
      } : {
        total: recordsThisMonth.length,
        pending: recordsThisMonth.filter(r => (r.validationStatus || 'pending') === 'pending').length,
        validated: recordsThisMonth.filter(r => (r.validationStatus || 'pending') === 'validated').length,
        legalized: recordsThisMonth.filter(r => r.certificateStatus === 'issued' || r.certificateStatus === 'approved').length,
        pregnancies: pregnanciesThisMonth,
        births: birthsThisMonth,
      };

      setStats({
        total: currentStats.total,
        pending: currentStats.pending,
        validated: currentStats.validated,
        legalized: currentStats.legalized,
        pregnancies: currentStats.pregnancies,
        births: currentStats.births,
      });

      // Cas récents (les 3 plus récents, tous statuts confondus)
      const sortedRecords = allRecords
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 3)
        .map(record => {
          // Distinguer pregnancies et births
          const isPreg = isPregnancyRecord(record);
          const name = isPreg
            ? (record.motherFirstNames && record.motherLastName
                ? `${record.motherFirstNames.join(' ')} ${record.motherLastName}`
                : record.motherName || 'N/A')
            : (record.childFirstNames && record.childLastName
                ? `${record.childFirstNames.join(' ')} ${record.childLastName}`
                : record.childName || 'N/A');

          return {
            id: record.firestoreId || record.id || 'N/A',
            type: (isPreg ? 'pregnancy' : 'birth') as 'pregnancy' | 'birth',
            name,
            date: record.createdAt ? new Date(record.createdAt) : new Date(),
            status: (record.validationStatus || 'pending') as 'pending' | 'validated' | 'rejected',
          };
        });

      setRecentRecords(sortedRecords);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStats = {
    total: stats.total,
    pending: stats.pending,
    validated: stats.validated,
    legalized: stats.legalized,
  };

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
      case 'emergency':
        router.push('/(dashboard)/admin/emergency' as any);
        break;
    }
  };

  const handleNotificationPress = () => {
    console.log('Notification button pressed, navigating to emergency page');
    try {
      router.push('/(dashboard)/admin/emergency' as any);
    } catch (error) {
      console.error('Error navigating to emergency page:', error);
    }
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
          isTablet && styles.scrollContentTablet,
          { paddingBottom: insets.bottom + 20 } // SafeArea + espace supplémentaire
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
                style={({ pressed }) => [
                  styles.headerIconButton,
                  pressed && { opacity: 0.7 }
                ]}
                onPress={handleNotificationPress}
                accessibilityLabel="Signalements d'urgence"
                accessibilityRole="button"
              >
                <FontAwesome 
                  name="bell" 
                  size={isTablet ? 24 : 20} 
                  color="#fff" 
                />
                {emergencyCount > 0 && (
                  <View 
                    style={[
                      styles.notificationBadge,
                      { backgroundColor: theme.colors.error }
                    ]}
                    pointerEvents="none"
                  >
                    <ThemedText 
                      size="xs" 
                      weight="bold"
                      style={{ color: '#fff' }}
                    >
                      {emergencyCount > 99 ? '99+' : emergencyCount}
                    </ThemedText>
                  </View>
                )}
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

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: theme.colors.surface },
              pressed && styles.actionCardPressed
            ]}
            onPress={() => handleQuickAction('emergency')}
          >
            <ThemedView 
              variant="transparent"
              style={StyleSheet.flatten([styles.actionIconCircle, { backgroundColor: theme.colors.error + '20' }])}
            >
              <FontAwesome 
                name="exclamation-triangle" 
                size={isTablet ? 36 : 28} 
                color={theme.colors.error} 
              />
              {emergencyCount > 0 && (
                <ThemedView 
                  variant="transparent"
                  style={[
                    styles.emergencyBadge,
                    { backgroundColor: theme.colors.error }
                  ]}
                >
                  <ThemedText 
                    size="xs" 
                    weight="bold"
                    style={{ color: '#fff' }}
                  >
                    {emergencyCount > 99 ? '99+' : emergencyCount}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
            <ThemedText 
              size="base" 
              weight="semibold"
              style={styles.actionTitle}
            >
              Signalements d'urgence
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
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <ThemedText size="xl" weight="bold">
                  {currentStats.total}
                </ThemedText>
              )}
            </ThemedView>

            {/* Barre de progression */}
            <View style={styles.progressBarContainer}>
              <View 
                style={StyleSheet.flatten([
                  styles.progressSegment,
                  { 
                    width: `${currentStats.total > 0 ? (currentStats.pending / currentStats.total) * 100 : 0}%`,
                    backgroundColor: theme.colors.warning 
                  }
                ])}
              />
              <View 
                style={StyleSheet.flatten([
                  styles.progressSegment,
                  { 
                    width: `${currentStats.total > 0 ? (currentStats.validated / currentStats.total) * 100 : 0}%`,
                    backgroundColor: theme.colors.success 
                  }
                ])}
              />
              <View 
                style={StyleSheet.flatten([
                  styles.progressSegment,
                  { 
                    width: `${currentStats.total > 0 ? (currentStats.legalized / currentStats.total) * 100 : 0}%`,
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

          {isLoading ? (
            <ThemedView variant="transparent" style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <ThemedText variant="secondary" size="sm" style={{ marginTop: 12 }}>
                {t('common.loading') || 'Chargement...'}
              </ThemedText>
            </ThemedView>
          ) : recentRecords.length === 0 ? (
            <ThemedView variant="transparent" style={styles.emptyState}>
              <FontAwesome name="inbox" size={48} color={theme.colors.textSecondary} />
              <ThemedText variant="secondary" size="base" style={styles.emptyStateText}>
                {t('admin.dashboard.noRecentRecords') || 'Aucun cas récent'}
              </ThemedText>
            </ThemedView>
          ) : (
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
    // paddingBottom sera géré dynamiquement avec useSafeAreaInsets
  },
  scrollContentTablet: {
    paddingHorizontal: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
    // paddingBottom sera géré dynamiquement avec useSafeAreaInsets
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
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
    position: 'relative',
    marginBottom: 10,
  },
  actionTitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  emergencyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
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
