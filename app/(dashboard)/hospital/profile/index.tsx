import { PressableButton } from '@/components/PressableButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  ThemedCard,
  ThemedInput,
  ThemedText,
  ThemedView
} from '@/components/ThemedComponents';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { getUserById, AdminUser } from '@/services/admin/userService';
import { formatDateSafe } from '@/utils/date';
import { changePassword, getAuthErrorMessage } from '@/services/firebase/authService';

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string().min(6, 'La confirmation est requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function HospitalProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuthStore();

  // Charger le profil utilisateur
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userProfile = await getUserById(user.id);
        setProfile(userProfile);
      } catch (error) {
        if (__DEV__) console.error('Error loading profile:', error);
        Alert.alert(t('common.error'), t('hospital.profile.loadError') || t('agent.profile.loadError') || 'Erreur lors du chargement du profil');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  // Obtenir le nom complet du directeur
  const getDirectorName = (user: AdminUser | null) => {
    if (!user) return '';
    const firstNames = user.firstNames?.filter(fn => fn.trim()).join(' ') || '';
    return `${firstNames} ${user.lastName}`.trim();
  };

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsSaving(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      
      Alert.alert(t('common.success'), t('hospital.profile.passwordChanged') || t('agent.profile.passwordChanged'));
      resetPasswordForm();
      setShowPasswordModal(false);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      Alert.alert(t('common.error'), t(errorMessage) || t('hospital.profile.passwordError') || t('agent.profile.passwordError'));
    } finally {
      setIsSaving(false);
    }
  };

  const { logout } = useAuthStore();
  
  const handleLogout = () => {
    Alert.alert(
      t('hospital.profile.logout') || t('agent.profile.logout'),
      t('hospital.profile.logoutConfirm') || t('agent.profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' as const },
        { 
          text: t('hospital.profile.logout') || t('agent.profile.logout'), 
          style: 'destructive' as const,
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login' as any);
            } catch (error) {
              if (__DEV__) console.error('Logout error:', error);
              Alert.alert(t('common.error'), t('errors.generic'));
            }
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer variant="background">
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 100 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText variant="secondary" size="base" style={{ marginTop: 16 }}>
            {t('common.loading') || 'Chargement...'}
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer variant="background">
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 100 }]}>
          <ThemedText variant="error" size="base">
            {t('hospital.profile.loadError') || t('agent.profile.loadError') || 'Erreur lors du chargement du profil'}
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  const institutionName = profile.institutionName || t('hospital.profile.institutionName') || 'Institution';
  const directorName = getDirectorName(profile);
  const registrationDate = profile.createdAt 
    ? formatDateSafe(profile.createdAt instanceof Date ? profile.createdAt : profile.createdAt.toDate(), 'dd/MM/yyyy')
    : '';

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
        {/* Header avec dégradé */}
        <ThemedView 
          variant="transparent"
          style={StyleSheet.flatten([
            styles.header,
            { backgroundColor: theme.colors.primary }
          ])}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <FontAwesome
              name="arrow-left"
              size={20}
              color="#fff"
            />
          </Pressable>
          <ThemedView variant="transparent" style={styles.headerContent}>
            <ThemedView 
              variant="transparent" 
              style={StyleSheet.flatten([styles.avatarContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }])}
            >
              <FontAwesome
                name="building"
                size={isTablet ? 48 : 40}
                color="#fff"
              />
            </ThemedView>
            <ThemedText 
              size="lg" 
              weight="bold"
              style={styles.institutionName}
            >
              {institutionName}
            </ThemedText>
            {directorName && (
              <ThemedText 
                size="sm"
                style={styles.institutionType}
              >
                {t('hospital.profile.director') || 'Directeur'}: {directorName}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>

        {/* Informations Institution */}
        <ThemedCard style={styles.infoCard}>
          <ThemedText size="lg" weight="semibold" style={styles.sectionTitle}>
            {t('hospital.profile.institutionInfo') || 'Informations Institution'}
          </ThemedText>

          <ThemedView variant="transparent" style={styles.infoRow}>
            <FontAwesome name="building" size={18} color={theme.colors.primary} />
            <ThemedView variant="transparent" style={styles.infoContent}>
              <ThemedText variant="secondary" size="sm" style={styles.infoLabel}>
                {t('hospital.profile.name') || 'Nom'}
              </ThemedText>
              <ThemedText size="base" weight="medium" style={styles.infoValue}>
                {institutionName}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {directorName && (
            <ThemedView variant="transparent" style={StyleSheet.flatten([styles.infoRow, styles.infoRowSeparator])}>
              <FontAwesome name="user-md" size={18} color={theme.colors.primary} />
              <ThemedView variant="transparent" style={styles.infoContent}>
                <ThemedText variant="secondary" size="sm" style={styles.infoLabel}>
                  {t('hospital.profile.director') || 'Directeur'}
                </ThemedText>
                <ThemedText size="base" weight="medium" style={styles.infoValue}>
                  {directorName}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          <ThemedView variant="transparent" style={StyleSheet.flatten([styles.infoRow, styles.infoRowSeparator])}>
            <FontAwesome name="calendar" size={18} color={theme.colors.primary} />
            <ThemedView variant="transparent" style={styles.infoContent}>
              <ThemedText variant="secondary" size="sm" style={styles.infoLabel}>
                {t('hospital.profile.registrationDate') || 'Date d\'enregistrement'}
              </ThemedText>
              <ThemedText size="base" weight="medium" style={styles.infoValue}>
                {registrationDate || t('common.notProvided') || 'Non renseigné'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedCard>

        {/* Contact */}
        <ThemedCard style={styles.infoCard}>
          <ThemedText size="lg" weight="semibold" style={styles.sectionTitle}>
            {t('hospital.profile.contact') || 'Contact'}
          </ThemedText>

          <ThemedView variant="transparent" style={styles.infoRow}>
            <FontAwesome name="envelope" size={18} color={theme.colors.primary} />
            <ThemedView variant="transparent" style={styles.infoContent}>
              <ThemedText variant="secondary" size="sm" style={styles.infoLabel}>
                {t('hospital.profile.email') || 'Email'}
              </ThemedText>
              <ThemedText size="base" weight="medium" style={styles.infoValue}>
                {profile.email || t('common.notProvided') || 'Non renseigné'}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {profile.phone && (
            <ThemedView variant="transparent" style={StyleSheet.flatten([styles.infoRow, styles.infoRowSeparator])}>
              <FontAwesome name="phone" size={18} color={theme.colors.primary} />
              <ThemedView variant="transparent" style={styles.infoContent}>
                <ThemedText variant="secondary" size="sm" style={styles.infoLabel}>
                  {t('hospital.profile.phone') || 'Téléphone'}
                </ThemedText>
                <ThemedText size="base" weight="medium" style={styles.infoValue}>
                  {profile.phone}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedCard>


        {/* Actions */}
        <ThemedView variant="transparent" style={styles.actionsContainer}>
          <PressableButton
            variant="outline"
            size="md"
            fullWidth
            onPress={() => setShowPasswordModal(true)}
            style={styles.actionButton}
          >
            <FontAwesome name="edit" size={16} color={theme.colors.primary} />
            <ThemedText size="base" weight="semibold" style={{ color: theme.colors.primary, marginLeft: 8 }}>
              {t('hospital.profile.changePassword') || t('agent.profile.changePassword')}
            </ThemedText>
          </PressableButton>

          <PressableButton
            variant="primary"
            size="md"
            fullWidth
            onPress={handleLogout}
            style={StyleSheet.flatten([styles.actionButton, { backgroundColor: theme.colors.error }])}
          >
            <FontAwesome name="sign-out" size={16} color="#fff" />
            <ThemedText size="base" weight="semibold" style={{ color: '#fff', marginLeft: 8 }}>
              {t('hospital.profile.logout') || t('agent.profile.logout')}
            </ThemedText>
          </PressableButton>
        </ThemedView>
      </ScrollView>

      {/* Modal changement mot de passe */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedCard style={styles.modalContent}>
            <ThemedView variant="transparent" style={styles.modalHeader}>
              <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
                {t('hospital.profile.changePassword') || t('agent.profile.changePassword')}
              </ThemedText>
              <Pressable onPress={() => setShowPasswordModal(false)}>
                <FontAwesome name="times" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </ThemedView>

            <View style={styles.modalForm}>
              <Controller
                control={passwordControl}
                name="currentPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <ThemedText variant="secondary" size="sm" style={styles.modalLabel}>
                      {t('hospital.profile.currentPassword') || t('agent.profile.currentPassword')}
                    </ThemedText>
                    <ThemedInput
                      placeholder={t('hospital.profile.currentPassword') || t('agent.profile.currentPassword')}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      secureTextEntry
                      variant={passwordErrors.currentPassword ? 'error' : 'default'}
                      size="md"
                      fullWidth
                      style={styles.modalInput}
                    />
                    {passwordErrors.currentPassword && (
                      <ThemedText variant="error" size="xs" style={styles.modalError}>
                        {passwordErrors.currentPassword.message}
                      </ThemedText>
                    )}
                  </>
                )}
              />

              <Controller
                control={passwordControl}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <ThemedText variant="secondary" size="sm" style={styles.modalLabel}>
                      {t('hospital.profile.newPassword') || t('agent.profile.newPassword')}
                    </ThemedText>
                    <ThemedInput
                      placeholder={t('hospital.profile.newPassword') || t('agent.profile.newPassword')}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      secureTextEntry
                      variant={passwordErrors.newPassword ? 'error' : 'default'}
                      size="md"
                      fullWidth
                      style={styles.modalInput}
                    />
                    {passwordErrors.newPassword && (
                      <ThemedText variant="error" size="xs" style={styles.modalError}>
                        {passwordErrors.newPassword.message}
                      </ThemedText>
                    )}
                  </>
                )}
              />

              <Controller
                control={passwordControl}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <ThemedText variant="secondary" size="sm" style={styles.modalLabel}>
                      {t('hospital.profile.confirmPassword') || t('agent.profile.confirmPassword')}
                    </ThemedText>
                    <ThemedInput
                      placeholder={t('hospital.profile.confirmPassword') || t('agent.profile.confirmPassword')}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      secureTextEntry
                      variant={passwordErrors.confirmPassword ? 'error' : 'default'}
                      size="md"
                      fullWidth
                      style={styles.modalInput}
                    />
                    {passwordErrors.confirmPassword && (
                      <ThemedText variant="error" size="xs" style={styles.modalError}>
                        {passwordErrors.confirmPassword.message}
                      </ThemedText>
                    )}
                  </>
                )}
              />

              <ThemedView variant="transparent" style={styles.modalActions}>
                <PressableButton
                  variant="outline"
                  size="md"
                  onPress={() => setShowPasswordModal(false)}
                  style={styles.modalButton}
                >
                  <ThemedText size="base" style={{ color: theme.colors.textSecondary }}>
                    {t('common.cancel')}
                  </ThemedText>
                </PressableButton>
                <PressableButton
                  variant="primary"
                  size="md"
                  onPress={handlePasswordSubmit(onPasswordSubmit)}
                  disabled={isSaving}
                  style={styles.modalButton}
                >
                  <ThemedText size="base" weight="semibold" style={{ color: '#fff' }}>
                    {isSaving ? t('common.saving') || 'Enregistrement...' : t('common.save')}
                  </ThemedText>
                </PressableButton>
              </ThemedView>
            </View>
          </ThemedCard>
        </ThemedView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    // paddingBottom sera géré dynamiquement avec useSafeAreaInsets
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    padding: 8,
    borderRadius: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  institutionName: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  institutionType: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  infoCard: {
    margin: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  infoRowSeparator: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoContent: {
    flex: 1,
  },
  infoContentMultiline: {
    alignItems: 'flex-start',
  },
  infoLabel: {
    marginBottom: 4,
  },
  infoValue: {},
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  statsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsNumber: {
    marginBottom: 4,
  },
  statsLabel: {
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {},
  modalForm: {
    gap: 16,
  },
  modalLabel: {
    marginBottom: 8,
  },
  modalInput: {
    marginBottom: 4,
  },
  modalError: {
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

