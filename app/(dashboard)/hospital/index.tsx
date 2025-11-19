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
import React, { useState, useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { getUserById, AdminUser } from '@/services/admin/userService';

export default function HospitalDashboard() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const { user } = useAuthStore();

  // Charger le profil utilisateur
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        const userProfile = await getUserById(user.id);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'pregnancy':
        router.push('/(dashboard)/hospital/pregnancy' as any);
        break;
      case 'birth':
        router.push('/(dashboard)/hospital/birth' as any);
        break;
      case 'history':
        router.push('/(dashboard)/hospital/history' as any);
        break;
      case 'search':
        router.push('/(dashboard)/hospital/search' as any);
        break;
    }
  };

  const handleSettingsPress = () => {
    router.push('/(dashboard)/hospital/settings' as any);
  };

  const handleBottomNavPress = (section: string) => {
    switch (section) {
      case 'home':
        // Déjà sur l'accueil
        break;
      case 'history':
        router.push('/(dashboard)/hospital/history' as any);
        break;
      case 'add':
        setShowAddModal(true);
        break;
      case 'search':
        router.push('/(dashboard)/hospital/search' as any);
        break;
      case 'profile':
        router.push('/(dashboard)/hospital/profile' as any);
        break;
    }
  };

  const handleAddOption = (option: 'pregnancy' | 'birth') => {
    setShowAddModal(false);
    if (option === 'pregnancy') {
      router.push('/(dashboard)/hospital/pregnancy' as any);
    } else {
      router.push('/(dashboard)/hospital/birth' as any);
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
                style={StyleSheet.flatten([styles.institutionIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }])}
              >
                <FontAwesome 
                  name="building" 
                  size={isTablet ? 40 : 32} 
                  color="#fff" 
                />
              </ThemedView>
              <ThemedView variant="transparent" style={styles.headerText}>
                <ThemedText 
                  size="sm" 
                  style={styles.welcomeText}
                >
                  {t('hospital.dashboard.welcome')}
                </ThemedText>
                <ThemedText 
                  size="base" 
                  weight="semibold"
                  style={styles.institutionName}
                >
                  {isLoadingProfile ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    profile?.institutionName || t('hospital.dashboard.welcome') || 'Chargement...'
                  )}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <ThemedView variant="transparent" style={styles.headerActions}>
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
        <ThemedView style={styles.titleSection}>
          <ThemedText 
            size="xl" 
            weight="bold" 
            style={styles.mainTitle}
          >
            {t('hospital.dashboard.quickActions')}
          </ThemedText>
          <ThemedView style={styles.connectionBadge}>
            <FontAwesome 
              name={isOnline ? "wifi" : "wifi"} 
              size={14} 
              color={isOnline ? theme.colors.success : theme.colors.error} 
            />
            <ThemedText 
              size="xs"
              style={{ 
                color: isOnline ? theme.colors.success : theme.colors.error,
                marginLeft: 4 
              }}
            >
              {isOnline ? t('hospital.dashboard.online') : t('hospital.dashboard.offline')}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 3️⃣ Grille 2x2 des actions rapides */}
        <ThemedView style={styles.actionsGrid}>
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
                size={isTablet ? 40 : 32} 
                color={theme.colors.success} 
              />
            </ThemedView>
            <ThemedText 
              size="base" 
              weight="semibold"
              style={styles.actionTitle}
            >
              {t('hospital.dashboard.registerPregnancy')}
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
                size={isTablet ? 40 : 32} 
                color={theme.colors.primary} 
              />
            </ThemedView>
            <ThemedText 
              size="base" 
              weight="semibold"
              style={styles.actionTitle}
            >
              {t('hospital.dashboard.registerBirth')}
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: theme.colors.surface },
              pressed && styles.actionCardPressed
            ]}
            onPress={() => handleQuickAction('history')}
          >
            <ThemedView 
              variant="transparent"
              style={StyleSheet.flatten([styles.actionIconCircle, { backgroundColor: theme.colors.info + '20' }])}
            >
              <FontAwesome 
                name="history" 
                size={isTablet ? 40 : 32} 
                color={theme.colors.info} 
              />
            </ThemedView>
            <ThemedText 
              size="base" 
              weight="semibold"
              style={styles.actionTitle}
            >
              {t('hospital.dashboard.viewHistory')}
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: theme.colors.surface },
              pressed && styles.actionCardPressed
            ]}
            onPress={() => handleQuickAction('search')}
          >
            <ThemedView 
              variant="transparent"
              style={StyleSheet.flatten([styles.actionIconCircle, { backgroundColor: theme.colors.warning + '20' }])}
            >
              <FontAwesome 
                name="search" 
                size={isTablet ? 40 : 32} 
                color={theme.colors.warning} 
              />
            </ThemedView>
            <ThemedText 
              size="base" 
              weight="semibold"
              style={styles.actionTitle}
            >
              {t('hospital.dashboard.search')}
            </ThemedText>
          </Pressable>
        </ThemedView>

        {/* 4️⃣ Statistiques - Cette Semaine */}
        <ThemedCard style={styles.statsCard}>
          <ThemedView variant="transparent" style={styles.statsHeader}>
            <ThemedText size="lg" weight="semibold" style={styles.statsTitle}>
              {t('hospital.dashboard.thisWeek')}
            </ThemedText>
            <ThemedText variant="secondary" size="sm" style={styles.statsSubtitle}>
              {t('hospital.dashboard.recentActivity')}
            </ThemedText>
          </ThemedView>
          
          <ThemedView variant="transparent" style={styles.statsRows}>
            <ThemedView 
              variant="transparent" 
              style={StyleSheet.flatten([styles.statsRow, { backgroundColor: theme.colors.primary + '10' }])}
            >
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.statsRowIcon, { backgroundColor: theme.colors.success + '20' }])}
              >
                <FontAwesome 
                  name="heart" 
                  size={20} 
                  color={theme.colors.success} 
                />
              </ThemedView>
              <ThemedText size="base" weight="medium" style={styles.statsRowText}>
                {t('hospital.dashboard.pregnancies')}
              </ThemedText>
              <ThemedText size="lg" weight="bold" style={styles.statsRowNumber}>
                {statsThisWeek.pregnancies}
              </ThemedText>
            </ThemedView>

            <ThemedView 
              variant="transparent" 
              style={StyleSheet.flatten([styles.statsRow, { backgroundColor: theme.colors.secondary + '10' }])}
            >
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.statsRowIcon, { backgroundColor: theme.colors.primary + '20' }])}
              >
                <FontAwesome 
                  name="child" 
                  size={20} 
                  color={theme.colors.primary} 
                />
              </ThemedView>
              <ThemedText size="base" weight="medium" style={styles.statsRowText}>
                {t('hospital.dashboard.births')}
              </ThemedText>
              <ThemedText size="lg" weight="bold" style={styles.statsRowNumber}>
                {statsThisWeek.births}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedCard>

        {/* 5️⃣ Statistiques - Ce Mois */}
        <ThemedCard style={styles.statsCard}>
          <ThemedView variant="transparent" style={styles.statsHeader}>
            <ThemedText size="lg" weight="semibold" style={styles.statsTitle}>
              {t('hospital.dashboard.thisMonth')}
            </ThemedText>
            <ThemedText variant="secondary" size="sm" style={styles.statsSubtitle}>
              {t('hospital.dashboard.monthlyActivity')}
            </ThemedText>
          </ThemedView>
          
          <ThemedView variant="transparent" style={styles.statsGrid}>
            <ThemedView variant="transparent" style={styles.statsColumn}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.statsColumnIcon, { backgroundColor: theme.colors.success + '20' }])}
              >
                <FontAwesome 
                  name="calendar" 
                  size={24} 
                  color={theme.colors.success} 
                />
              </ThemedView>
              <ThemedText size="2xl" weight="bold" style={styles.statsColumnNumber}>
                {statsThisMonth.pregnancies}
              </ThemedText>
              <ThemedText variant="secondary" size="sm" style={styles.statsColumnText}>
                {t('hospital.dashboard.pregnancies')}
              </ThemedText>
            </ThemedView>

            <ThemedView variant="transparent" style={styles.statsColumn}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.statsColumnIcon, { backgroundColor: theme.colors.primary + '20' }])}
              >
                <FontAwesome 
                  name="calendar" 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </ThemedView>
              <ThemedText size="2xl" weight="bold" style={styles.statsColumnNumber}>
                {statsThisMonth.births}
              </ThemedText>
              <ThemedText variant="secondary" size="sm" style={styles.statsColumnText}>
                {t('hospital.dashboard.births')}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedCard>

        {/* 6️⃣ Bouton Voir Historique */}
        <PressableButton
          variant="outline"
          size="md"
          onPress={() => handleQuickAction('history')}
          style={styles.historyButton}
        >
          <FontAwesome name="history" size={16} color={theme.colors.primary} />
          <ThemedText size="base" weight="semibold" style={{ color: theme.colors.primary, marginLeft: 8 }}>
            {t('hospital.dashboard.viewHistory')}
          </ThemedText>
        </PressableButton>
      </ScrollView>

      {/* 7️⃣ Barre de navigation inférieure */}
      <ThemedView style={{ ...styles.bottomNavigation, backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }}>
        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            pressed && { opacity: 0.7 }
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
            {t('hospital.navigation.home')}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => handleBottomNavPress('history')}
        >
          <FontAwesome 
            name="history" 
            size={isTablet ? 24 : 20} 
            color={theme.colors.textSecondary} 
          />
          <ThemedText 
            variant="secondary" 
            size="xs" 
            weight="medium"
            style={styles.navLabel}
          >
            {t('hospital.navigation.history')}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItemCenter,
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => handleBottomNavPress('add')}
        >
          <ThemedView style={styles.centerNavIcon}>
            <FontAwesome 
              name="plus" 
              size={isTablet ? 28 : 24} 
              color="#fff" 
            />
          </ThemedView>
          <ThemedText 
            size="xs" 
            weight="medium"
            style={{ ...styles.navLabel, color: theme.colors.primary }}
          >
            {t('hospital.navigation.add')}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => handleBottomNavPress('search')}
        >
          <FontAwesome 
            name="search" 
            size={isTablet ? 24 : 20} 
            color={theme.colors.textSecondary} 
          />
          <ThemedText 
            variant="secondary" 
            size="xs" 
            weight="medium"
            style={styles.navLabel}
          >
            {t('hospital.navigation.search')}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => handleBottomNavPress('profile')}
        >
          <FontAwesome 
            name="building" 
            size={isTablet ? 24 : 20} 
            color={theme.colors.textSecondary} 
          />
          <ThemedText 
            variant="secondary" 
            size="xs" 
            weight="medium"
            style={styles.navLabel}
          >
            {t('hospital.navigation.profile')}
          </ThemedText>
        </Pressable>
      </ThemedView>

      {/* Modal pour choisir le type d'enregistrement */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={{ ...styles.modalContent, backgroundColor: theme.colors.surface }}>
            <ThemedText 
              size="lg" 
              weight="bold" 
              style={styles.modalTitle}
            >
              {t('hospital.addModal.title')}
            </ThemedText>
            <ThemedText 
              variant="secondary" 
              size="sm" 
              style={styles.modalSubtitle}
            >
              {t('hospital.addModal.subtitle')}
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
                <ThemedView variant="transparent" style={{ ...styles.modalOptionText, backgroundColor: 'transparent' }}>
                  <ThemedText 
                    size="base" 
                    weight="semibold"
                    style={styles.modalOptionTitle}
                  >
                    {t('hospital.addModal.registerPregnancy')}
                  </ThemedText>
                  <ThemedText 
                    variant="secondary" 
                    size="sm"
                    style={styles.modalOptionSubtitle}
                  >
                    {t('hospital.addModal.registerPregnancyDesc')}
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
                <ThemedView variant="transparent" style={{ ...styles.modalOptionText, backgroundColor: 'transparent' }}>
                  <ThemedText 
                    size="base" 
                    weight="semibold"
                    style={styles.modalOptionTitle}
                  >
                    {t('hospital.addModal.registerBirth')}
                  </ThemedText>
                  <ThemedText 
                    variant="secondary" 
                    size="sm"
                    style={styles.modalOptionSubtitle}
                  >
                    {t('hospital.addModal.registerBirthDesc')}
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
  institutionIcon: {
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
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  institutionName: {
    color: '#fff',
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
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
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
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    backgroundColor: 'rgba(47, 149, 220, 0.05)',
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
  historyButton: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
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
  centerNavIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
