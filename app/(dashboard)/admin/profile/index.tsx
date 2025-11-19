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
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

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

export default function AdminProfile() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Données simulées du profil admin
  const mockProfile = {
    firstName: 'Pierre',
    lastName: 'Laurent',
    email: 'pierre.laurent@graceregistry.ht',
    phone: '+509 1234 5678',
    location: 'Port-au-Prince',
    registrationDate: '10/01/2024',
    role: 'Administrateur',
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
      // Simulation de changement de mot de passe
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(t('common.success'), t('admin.profile.passwordChanged') || t('agent.profile.passwordChanged'));
      resetPasswordForm();
      setShowPasswordModal(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('admin.profile.passwordError') || t('agent.profile.passwordError'));
    } finally {
      setIsSaving(false);
    }
  };

  const { logout } = useAuthStore();
  
  const handleLogout = () => {
    Alert.alert(
      t('admin.profile.logout') || t('agent.profile.logout'),
      t('admin.profile.logoutConfirm') || t('agent.profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' as const },
        { 
          text: t('admin.profile.logout') || t('agent.profile.logout'), 
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
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };

  const fullName = `${mockProfile.firstName} ${mockProfile.lastName}`;
  const initials = getInitials(mockProfile.firstName, mockProfile.lastName);

  const profileInfo = [
    {
      icon: 'user' as const,
      label: t('admin.profile.fullName') || t('agent.profile.fullName'),
      value: fullName,
    },
    {
      icon: 'envelope' as const,
      label: t('admin.profile.email') || t('agent.profile.email'),
      value: mockProfile.email,
    },
    {
      icon: 'phone' as const,
      label: t('admin.profile.phone') || t('agent.profile.phone'),
      value: mockProfile.phone,
    },
    {
      icon: 'map-marker' as const,
      label: t('admin.profile.location') || t('agent.profile.location'),
      value: mockProfile.location,
    },
    {
      icon: 'calendar' as const,
      label: t('admin.profile.registeredOn') || t('agent.profile.registeredOn'),
      value: mockProfile.registrationDate,
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
            {t('admin.profile.title') || t('agent.profile.title')}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet
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
            {fullName}
          </ThemedText>
          <ThemedText variant="secondary" size="base" style={styles.role}>
            {mockProfile.role}
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
            accessibilityLabel={t('admin.profile.changePassword') || t('agent.profile.changePassword')}
            style={styles.actionButton}
          >
            <FontAwesome name="lock" size={16} color={theme.colors.primary} />
            <ThemedText size="base" weight="semibold" style={{ color: theme.colors.primary, marginLeft: 8 }}>
              {t('admin.profile.changePassword') || t('agent.profile.changePassword')}
            </ThemedText>
          </PressableButton>

          <PressableButton
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleLogout}
            accessibilityLabel={t('admin.profile.logout') || t('agent.profile.logout')}
            style={{ ...styles.actionButton, borderColor: theme.colors.error }}
          >
            <FontAwesome name="sign-out" size={16} color={theme.colors.error} />
            <ThemedText size="base" weight="semibold" style={{ color: theme.colors.error, marginLeft: 8 }}>
              {t('admin.profile.logout') || t('agent.profile.logout')}
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
          <ThemedCard style={StyleSheet.flatten([styles.modalContent, { backgroundColor: theme.colors.surface }])}>
            <ThemedView variant="transparent" style={styles.modalHeader}>
              <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
                {t('admin.profile.changePassword') || t('agent.profile.changePassword')}
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
                  accessibilityLabel={t('admin.profile.currentPassword') || t('agent.profile.currentPassword')}
                >
                  {t('admin.profile.currentPassword') || t('agent.profile.currentPassword')} *
                </ThemedText>
                <Controller
                  control={passwordControl}
                  name="currentPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ThemedInput
                      placeholder={t('admin.profile.currentPassword') || t('agent.profile.currentPassword')}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      variant={passwordErrors.currentPassword ? 'error' : 'default'}
                      size="md"
                      fullWidth
                      secureTextEntry
                      accessibilityLabel={t('admin.profile.currentPassword') || t('agent.profile.currentPassword')}
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
                  accessibilityLabel={t('admin.profile.newPassword') || t('agent.profile.newPassword')}
                >
                  {t('admin.profile.newPassword') || t('agent.profile.newPassword')} *
                </ThemedText>
                <Controller
                  control={passwordControl}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ThemedInput
                      placeholder={t('admin.profile.newPassword') || t('agent.profile.newPassword')}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      variant={passwordErrors.newPassword ? 'error' : 'default'}
                      size="md"
                      fullWidth
                      secureTextEntry
                      accessibilityLabel={t('admin.profile.newPassword') || t('agent.profile.newPassword')}
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
                  accessibilityLabel={t('admin.profile.confirmPassword') || t('agent.profile.confirmPassword')}
                >
                  {t('admin.profile.confirmPassword') || t('agent.profile.confirmPassword')} *
                </ThemedText>
                <Controller
                  control={passwordControl}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ThemedInput
                      placeholder={t('admin.profile.confirmPassword') || t('agent.profile.confirmPassword')}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      variant={passwordErrors.confirmPassword ? 'error' : 'default'}
                      size="md"
                      fullWidth
                      secureTextEntry
                      accessibilityLabel={t('admin.profile.confirmPassword') || t('agent.profile.confirmPassword')}
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
                accessibilityLabel={t('admin.profile.changingPassword') || t('agent.profile.changingPassword')}
                style={styles.saveButton}
              >
                {isSaving ? t('admin.profile.changing') || t('agent.profile.changing') : t('admin.profile.changingPassword') || t('agent.profile.changingPassword')}
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
    paddingBottom: 32,
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
});

