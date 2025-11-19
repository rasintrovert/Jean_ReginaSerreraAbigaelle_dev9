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

// Schéma de validation pour le mot de passe
const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string().min(6, 'La confirmation est requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function AgentProfile() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
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
        console.error('Error loading profile:', error);
        Alert.alert(t('common.error'), t('agent.profile.loadError') || 'Erreur lors du chargement du profil');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

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
      // Simulation de changement de mot de passe
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(t('common.success'), t('agent.profile.passwordChanged'));
      resetPasswordForm();
      setShowPasswordModal(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('agent.profile.passwordError'));
    } finally {
      setIsSaving(false);
    }
  };

  const { logout } = useAuthStore();
  
  const handleLogout = () => {
    Alert.alert(
      t('agent.profile.logout'),
      t('agent.profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' as const },
        { 
          text: t('agent.profile.logout'), 
          style: 'destructive' as const,
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login' as any);
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(t('common.error'), t('errors.generic'));
            }
          }
        },
      ]
    );
  };

  // Générer les initiales pour l'avatar
  const getInitials = (firstNames: string[], lastName: string) => {
    const firstInitial = firstNames && firstNames.length > 0 ? firstNames[0].charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  // Obtenir le nom complet
  const getFullName = (user: AdminUser | null) => {
    if (!user) return '';
    const firstNames = user.firstNames?.filter(fn => fn.trim()).join(' ') || '';
    return `${firstNames} ${user.lastName}`.trim();
  };

  // Obtenir le nom du rôle traduit
  const getRoleName = (role: string) => {
    switch (role) {
      case 'agent':
        return t('roles.agent');
      case 'admin':
        return t('roles.admin');
      case 'hospital':
        return t('roles.hospital');
      default:
        return role;
    }
  };

  // Obtenir le nom du département
  const getDepartmentName = (code?: string) => {
    if (!code) return '';
    const departments: Record<string, string> = {
      'OU': 'Ouest',
      'NO': 'Nord-Ouest',
      'NE': 'Nord-Est',
      'N': 'Nord',
      'AR': 'Artibonite',
      'CE': 'Centre',
      'SD': 'Sud',
      'SE': 'Sud-Est',
      'NI': 'Nippes',
      'GA': 'Grand\'Anse',
    };
    return departments[code] || code;
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
            {t('agent.profile.loadError') || 'Erreur lors du chargement du profil'}
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  const fullName = getFullName(profile);
  const initials = getInitials(profile.firstNames || [], profile.lastName);
  const registrationDate = profile.createdAt 
    ? formatDateSafe(profile.createdAt instanceof Date ? profile.createdAt : profile.createdAt.toDate(), 'dd/MM/yyyy')
    : '';

  const profileInfo = [
    {
      icon: 'user' as const,
      label: t('agent.profile.fullName'),
      value: fullName || t('common.notProvided') || 'Non renseigné',
    },
    {
      icon: 'envelope' as const,
      label: t('agent.profile.email'),
      value: profile.email || t('common.notProvided') || 'Non renseigné',
    },
    {
      icon: 'phone' as const,
      label: t('agent.profile.phone'),
      value: profile.phone || t('common.notProvided') || 'Non renseigné',
    },
    ...(profile.department ? [{
      icon: 'map-marker' as const,
      label: t('agent.profile.department') || 'Département',
      value: getDepartmentName(profile.department),
    }] : []),
    {
      icon: 'calendar' as const,
      label: t('agent.profile.registeredOn'),
      value: registrationDate || t('common.notProvided') || 'Non renseigné',
    },
  ];

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
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <FontAwesome
            name="arrow-left"
            size={20}
            color="#fff"
          />
        </Pressable>
        <ThemedView variant="transparent" style={styles.headerText}>
          <ThemedText 
            size="xl" 
            weight="bold" 
            style={StyleSheet.flatten([styles.headerTitle, { color: '#fff' }])}
          >
            {t('agent.profile.title')}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
          { paddingBottom: insets.bottom + 20 } // SafeArea + espace supplémentaire
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar et identité */}
        <ThemedView variant="transparent" style={styles.identitySection}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <ThemedText size="xl" weight="bold" style={styles.avatarText}>
              {initials}
            </ThemedText>
          </View>
          <ThemedText size="lg" weight="bold" style={styles.fullName}>
            {fullName || t('common.notProvided') || 'Non renseigné'}
          </ThemedText>
          <ThemedText variant="secondary" size="base" style={styles.role}>
            {getRoleName(profile.role)}
          </ThemedText>
        </ThemedView>

        {/* Fiche d'informations personnelles */}
        <ThemedCard style={styles.infoCard}>
          {profileInfo.map((info, index) => (
            <View
              key={index}
              style={[
                styles.infoRow,
                index < profileInfo.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }
              ]}
            >
              <FontAwesome
                name={info.icon}
                size={18}
                color={theme.colors.textSecondary}
                style={styles.infoIcon}
              />
              <ThemedView variant="transparent" style={styles.infoContent}>
                <ThemedText variant="secondary" size="sm" style={styles.infoLabel}>
                  {info.label}
                </ThemedText>
                <ThemedText size="base" weight="medium" style={styles.infoValue}>
                  {info.value}
                </ThemedText>
              </ThemedView>
            </View>
          ))}
        </ThemedCard>

        {/* Zone d'actions */}
        <ThemedView style={styles.actionsContainer}>
          <PressableButton
            variant="outline"
            size="lg"
            fullWidth
            onPress={() => setShowPasswordModal(true)}
            accessibilityLabel={t('agent.profile.changePassword')}
            style={styles.actionButton}
          >
            <FontAwesome name="lock" size={16} color={theme.colors.primary} />
            <ThemedText size="base" weight="semibold" style={{ color: theme.colors.primary, marginLeft: 8 }}>
              {t('agent.profile.changePassword')}
            </ThemedText>
          </PressableButton>

          <PressableButton
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleLogout}
            accessibilityLabel={t('agent.profile.logout')}
            style={{ ...styles.actionButton, borderColor: theme.colors.error }}
          >
            <FontAwesome name="sign-out" size={16} color={theme.colors.error} />
            <ThemedText size="base" weight="semibold" style={{ color: theme.colors.error, marginLeft: 8 }}>
              {t('agent.profile.logout')}
            </ThemedText>
          </PressableButton>
        </ThemedView>
      </ScrollView>

      {/* Modal pour changer le mot de passe */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayPressable} onPress={() => setShowPasswordModal(false)} />
          <ThemedCard style={styles.modalContent}>
            <ThemedView variant="transparent" style={styles.modalHeader}>
              <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
                {t('agent.profile.changePassword')}
              </ThemedText>
              <Pressable
                onPress={() => setShowPasswordModal(false)}
                style={styles.modalCloseButton}
              >
                <FontAwesome name="times" size={20} color={theme.colors.text} />
              </Pressable>
            </ThemedView>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Mot de passe actuel */}
              <ThemedView variant="transparent" style={styles.inputContainer}>
                <ThemedText 
                  size="sm" 
                  weight="medium" 
                  style={styles.label}
                  accessibilityLabel={t('agent.profile.currentPassword')}
                >
                  {t('agent.profile.currentPassword')} *
                </ThemedText>
                <Controller
                  control={passwordControl}
                  name="currentPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ThemedInput
                      placeholder={t('agent.profile.currentPassword')}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      variant={passwordErrors.currentPassword ? 'error' : 'default'}
                      size="md"
                      fullWidth
                      secureTextEntry
                      accessibilityLabel={t('agent.profile.currentPassword')}
                      style={styles.input}
                    />
                  )}
                />
                {passwordErrors.currentPassword && (
                  <ThemedText variant="error" size="xs" style={styles.errorText}>
                    {passwordErrors.currentPassword.message}
                  </ThemedText>
                )}
              </ThemedView>

              {/* Nouveau mot de passe */}
              <ThemedView variant="transparent" style={styles.inputContainer}>
                <ThemedText 
                  size="sm" 
                  weight="medium" 
                  style={styles.label}
                  accessibilityLabel={t('agent.profile.newPassword')}
                >
                  {t('agent.profile.newPassword')} *
                </ThemedText>
                <Controller
                  control={passwordControl}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ThemedInput
                      placeholder={t('agent.profile.newPassword')}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      variant={passwordErrors.newPassword ? 'error' : 'default'}
                      size="md"
                      fullWidth
                      secureTextEntry
                      accessibilityLabel={t('agent.profile.newPassword')}
                      style={styles.input}
                    />
                  )}
                />
                {passwordErrors.newPassword && (
                  <ThemedText variant="error" size="xs" style={styles.errorText}>
                    {passwordErrors.newPassword.message}
                  </ThemedText>
                )}
              </ThemedView>

              {/* Confirmation */}
              <ThemedView variant="transparent" style={styles.inputContainer}>
                <ThemedText 
                  size="sm" 
                  weight="medium" 
                  style={styles.label}
                  accessibilityLabel={t('agent.profile.confirmPassword')}
                >
                  {t('agent.profile.confirmPassword')} *
                </ThemedText>
                <Controller
                  control={passwordControl}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ThemedInput
                      placeholder={t('agent.profile.confirmPassword')}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      variant={passwordErrors.confirmPassword ? 'error' : 'default'}
                      size="md"
                      fullWidth
                      secureTextEntry
                      accessibilityLabel={t('agent.profile.confirmPassword')}
                      style={styles.input}
                    />
                  )}
                />
                {passwordErrors.confirmPassword && (
                  <ThemedText variant="error" size="xs" style={styles.errorText}>
                    {passwordErrors.confirmPassword.message}
                  </ThemedText>
                )}
              </ThemedView>

              <PressableButton
                variant="primary"
                size="lg"
                fullWidth
                onPress={handlePasswordSubmit(onPasswordSubmit)}
                disabled={isSaving}
                accessibilityLabel={t('agent.profile.changingPassword')}
                style={styles.saveButton}
              >
                {isSaving ? t('agent.profile.changing') : t('agent.profile.changingPassword')}
              </PressableButton>
            </ScrollView>
          </ThemedCard>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    // No specific styles needed
  },
  scrollContent: {
    padding: 16,
    // paddingBottom sera géré dynamiquement avec useSafeAreaInsets
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
  },
  identitySection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#ffffff',
  },
  fullName: {
    marginBottom: 8,
  },
  role: {
    // No specific styles needed
  },
  infoCard: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    marginBottom: 4,
  },
  infoValue: {
    // No specific styles needed
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlayPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    flex: 1,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 4,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
