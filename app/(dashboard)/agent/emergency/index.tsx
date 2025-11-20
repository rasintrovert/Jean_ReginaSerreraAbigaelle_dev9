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
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { createEmergencyReport } from '@/services/emergency/emergencyService';

// Schéma de validation pour l'urgence
const emergencySchema = z.object({
  emergencyType: z.string().min(1, 'Le type d\'urgence est requis'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  location: z.string().min(5, 'Le lieu doit contenir au moins 5 caractères'),
  contactPhone: z.string().min(8, 'Le numéro de contact est requis'),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical'], { required_error: 'Le niveau d\'urgence est requis' }),
});

type EmergencyFormData = z.infer<typeof emergencySchema>;

export default function EmergencyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [isSending, setIsSending] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState<'low' | 'medium' | 'high' | 'critical' | ''>('');
  const [showCallModal, setShowCallModal] = useState(false);
  const [emergencyToCall, setEmergencyToCall] = useState<{ name: string; number: string } | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<EmergencyFormData>({
    resolver: zodResolver(emergencySchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: EmergencyFormData) => {
    setIsSending(true);
    
    try {
      // Envoyer le signalement à Firestore
      await createEmergencyReport({
        emergencyType: data.emergencyType,
        description: data.description,
        location: data.location,
        contactPhone: data.contactPhone,
        urgencyLevel: data.urgencyLevel,
      });
      
      Alert.alert(
        t('agent.emergency.reported'),
        t('agent.emergency.reportedDesc'),
        [
          {
            text: t('common.confirm'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      if (__DEV__) console.error('Error sending emergency report:', error);
      Alert.alert(
        t('common.error'), 
        error.message || t('agent.emergency.sendReport') || 'Erreur lors de l\'envoi du signalement'
      );
    } finally {
      setIsSending(false);
    }
  };

  const callEmergency = (name: string, number: string) => {
    setEmergencyToCall({ name, number });
    setShowCallModal(true);
  };

  const handleConfirmCall = () => {
    if (emergencyToCall) {
      Linking.openURL(`tel:${emergencyToCall.number}`);
      setShowCallModal(false);
      setEmergencyToCall(null);
    }
  };

  const handleCancelCall = () => {
    setShowCallModal(false);
    setEmergencyToCall(null);
  };

  const emergencyNumbers = [
    { name: t('agent.emergency.police'), number: '114', icon: 'shield' as const, color: theme.colors.primary },
    { name: t('agent.emergency.firefighters'), number: '115', icon: 'fire' as const, color: theme.colors.error },
    { name: t('agent.emergency.ambulance'), number: '116', icon: 'ambulance' as const, color: theme.colors.success },
    { name: t('agent.emergency.medicalEmergency'), number: '118', icon: 'hospital-o' as const, color: theme.colors.info },
  ];

  const urgencyLevels = [
    { value: 'low', label: t('agent.emergency.urgencyLevels.low'), color: theme.colors.success },
    { value: 'medium', label: t('agent.emergency.urgencyLevels.medium'), color: theme.colors.warning },
    { value: 'high', label: t('agent.emergency.urgencyLevels.high'), color: theme.colors.error },
    { value: 'critical', label: t('agent.emergency.urgencyLevels.critical'), color: '#8B0000' },
  ];

  const safetyTips = [
    {
      title: t('agent.emergency.tips.imminentBirth'),
      tips: [
        t('agent.emergency.tips.imminentBirthTip1'),
        t('agent.emergency.tips.imminentBirthTip2'),
        t('agent.emergency.tips.imminentBirthTip3'),
        t('agent.emergency.tips.imminentBirthTip4'),
        t('agent.emergency.tips.imminentBirthTip5')
      ]
    },
    {
      title: t('agent.emergency.tips.medicalEmergencyTitle'),
      tips: [
        t('agent.emergency.tips.medicalEmergencyTip1'),
        t('agent.emergency.tips.medicalEmergencyTip2'),
        t('agent.emergency.tips.medicalEmergencyTip3'),
        t('agent.emergency.tips.medicalEmergencyTip4'),
        t('agent.emergency.tips.medicalEmergencyTip5')
      ]
    },
    {
      title: t('agent.emergency.tips.dangerTitle'),
      tips: [
        t('agent.emergency.tips.dangerTip1'),
        t('agent.emergency.tips.dangerTip2'),
        t('agent.emergency.tips.dangerTip3'),
        t('agent.emergency.tips.dangerTip4'),
        t('agent.emergency.tips.dangerTip5')
      ]
    }
  ];

  return (
    <ScreenContainer variant="background">
      {/* Header */}
      <ThemedView style={StyleSheet.flatten([
        styles.header, 
        { 
          backgroundColor: theme.colors.primary,
          paddingTop: Math.max(insets.top, 16),
        }
      ])}>
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
          <ThemedText size="xl" weight="bold" style={StyleSheet.flatten([styles.headerTitle, { color: '#fff' }])}>
            {t('agent.emergency.title')}
          </ThemedText>
          <ThemedText size="sm" style={StyleSheet.flatten([styles.headerSubtitle, { color: 'rgba(255, 255, 255, 0.9)' }])}>
            {t('agent.emergency.subtitle')}
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
        {/* Numéros d'urgence */}
        <ThemedCard style={styles.emergencyCard}>
          <ThemedText 
            size="lg" 
            weight="semibold" 
            style={styles.sectionTitle}
            accessibilityLabel={t('agent.emergency.emergencyNumbers')}
          >
            {t('agent.emergency.emergencyNumbers')}
          </ThemedText>
          
          <View style={styles.emergencyGrid}>
            {emergencyNumbers.map((emergency) => (
              <PressableButton
                key={emergency.number}
                variant="outline"
                style={{
                  ...styles.emergencyButton,
                  borderColor: emergency.color,
                }}
                onPress={() => callEmergency(emergency.name, emergency.number)}
                accessibilityLabel={`Appeler ${emergency.name} - ${emergency.number}`}
              >
                <View style={styles.emergencyButtonContent}>
                  <FontAwesome 
                    name={emergency.icon} 
                    size={20} 
                    color={emergency.color} 
                  />
                  <ThemedView variant="transparent" style={styles.emergencyButtonText}>
                    <ThemedText 
                      size="sm" 
                      weight="semibold"
                      style={{ color: emergency.color }}
                    >
                      {emergency.name}
                    </ThemedText>
                    <ThemedText 
                      size="lg" 
                      weight="bold"
                      style={{ color: emergency.color }}
                    >
                      {emergency.number}
                    </ThemedText>
                  </ThemedView>
                </View>
              </PressableButton>
            ))}
          </View>
        </ThemedCard>

        {/* Conseils de sécurité */}
        <ThemedCard style={styles.tipsCard}>
          <ThemedText 
            size="lg" 
            weight="semibold" 
            style={styles.sectionTitle}
            accessibilityLabel={t('agent.emergency.safetyTips')}
          >
            {t('agent.emergency.safetyTips')}
          </ThemedText>
          
          {safetyTips.map((tip, index) => (
            <ThemedView key={index} variant="transparent" style={styles.tipSection}>
              <ThemedText 
                size="base" 
                weight="semibold" 
                style={styles.tipTitle}
                accessibilityLabel={tip.title}
              >
                {tip.title}
              </ThemedText>
              {tip.tips.map((tipText, tipIndex) => (
                <ThemedView key={tipIndex} variant="transparent" style={styles.tipItem}>
                  <FontAwesome 
                    name="check-circle" 
                    size={12} 
                    color={theme.colors.success} 
                    style={styles.tipIcon}
                  />
                  <ThemedText 
                    variant="secondary" 
                    size="sm" 
                    style={styles.tipText}
                    accessibilityLabel={`Conseil ${tipIndex + 1}: ${tipText}`}
                  >
                    {tipText}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          ))}
        </ThemedCard>

        {/* Formulaire de signalement */}
        <ThemedCard style={styles.formCard}>
          <ThemedText 
            size="lg" 
            weight="semibold" 
            style={styles.sectionTitle}
            accessibilityLabel={t('agent.emergency.detailedReport')}
          >
            {t('agent.emergency.detailedReport')}
          </ThemedText>

          {/* Type d'urgence */}
          <ThemedView variant="transparent" style={styles.inputContainer}>
            <ThemedText 
              size="sm" 
              weight="medium" 
              style={styles.label}
              accessibilityLabel={t('agent.emergency.emergencyType')}
            >
              {t('agent.emergency.emergencyType')} *
            </ThemedText>
            <Controller
              control={control}
              name="emergencyType"
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedInput
                  placeholder={t('agent.emergency.emergencyTypePlaceholder')}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  variant={errors.emergencyType ? 'error' : 'default'}
                  size="md"
                  fullWidth
                  accessibilityLabel={t('agent.emergency.emergencyType')}
                  accessibilityHint={t('agent.emergency.emergencyType')}
                  style={styles.input}
                />
              )}
            />
            {errors.emergencyType && (
              <ThemedText variant="error" size="xs" style={styles.errorText}>
                {errors.emergencyType.message}
              </ThemedText>
            )}
          </ThemedView>

          {/* Niveau d'urgence */}
          <ThemedView variant="transparent" style={styles.inputContainer}>
            <ThemedText 
              size="sm" 
              weight="medium" 
              style={styles.label}
              accessibilityLabel={t('agent.emergency.urgencyLevel')}
            >
              {t('agent.emergency.urgencyLevel')} *
            </ThemedText>
            <View style={styles.urgencyButtons}>
              {urgencyLevels.map((level) => (
                <PressableButton
                  key={level.value}
                  variant={selectedUrgency === level.value ? 'primary' : 'outline'}
                  size="sm"
                  style={{
                    ...styles.urgencyButton,
                    borderColor: level.color,
                    backgroundColor: selectedUrgency === level.value ? level.color : undefined,
                  }}
                  onPress={() => {
                    setSelectedUrgency(level.value as 'low' | 'medium' | 'high' | 'critical');
                    setValue('urgencyLevel', level.value as 'low' | 'medium' | 'high' | 'critical');
                  }}
                  accessibilityLabel={`Niveau d'urgence ${level.label}`}
                >
                  <ThemedText 
                    size="xs" 
                    weight="semibold"
                    style={{ 
                      color: selectedUrgency === level.value ? '#fff' : level.color 
                    }}
                  >
                    {level.label}
                  </ThemedText>
                </PressableButton>
              ))}
            </View>
            {errors.urgencyLevel && (
              <ThemedText variant="error" size="xs" style={styles.errorText}>
                {errors.urgencyLevel.message}
              </ThemedText>
            )}
          </ThemedView>

          {/* Description */}
          <ThemedView variant="transparent" style={styles.inputContainer}>
            <ThemedText 
              size="sm" 
              weight="medium" 
              style={styles.label}
              accessibilityLabel={t('agent.emergency.description')}
            >
              {t('agent.emergency.description')} *
            </ThemedText>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedInput
                  placeholder={t('agent.emergency.descriptionPlaceholder')}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  variant={errors.description ? 'error' : 'default'}
                  size="md"
                  fullWidth
                  multiline
                  numberOfLines={5}
                  accessibilityLabel={t('agent.emergency.description')}
                  accessibilityHint={t('agent.emergency.description')}
                  style={{ ...styles.input, ...styles.multilineInput }}
                />
              )}
            />
            {errors.description && (
              <ThemedText variant="error" size="xs" style={styles.errorText}>
                {errors.description.message}
              </ThemedText>
            )}
          </ThemedView>

          {/* Lieu */}
          <ThemedView variant="transparent" style={styles.inputContainer}>
            <ThemedText 
              size="sm" 
              weight="medium" 
              style={styles.label}
              accessibilityLabel={t('agent.emergency.location')}
            >
              {t('agent.emergency.location')} *
            </ThemedText>
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedInput
                  placeholder={t('agent.emergency.locationPlaceholder')}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  variant={errors.location ? 'error' : 'default'}
                  size="md"
                  fullWidth
                  accessibilityLabel={t('agent.emergency.location')}
                  accessibilityHint={t('agent.emergency.location')}
                  style={styles.input}
                />
              )}
            />
            {errors.location && (
              <ThemedText variant="error" size="xs" style={styles.errorText}>
                {errors.location.message}
              </ThemedText>
            )}
          </ThemedView>

          {/* Contact */}
          <ThemedView variant="transparent" style={styles.inputContainer}>
            <ThemedText 
              size="sm" 
              weight="medium" 
              style={styles.label}
              accessibilityLabel={t('agent.emergency.contactPhone')}
            >
              {t('agent.emergency.contactPhone')} *
            </ThemedText>
            <Controller
              control={control}
              name="contactPhone"
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedInput
                  placeholder={t('agent.profile.phone')}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  variant={errors.contactPhone ? 'error' : 'default'}
                  size="md"
                  fullWidth
                  keyboardType="phone-pad"
                  accessibilityLabel={t('agent.emergency.contactPhone')}
                  accessibilityHint={t('agent.profile.phone')}
                  style={styles.input}
                />
              )}
            />
            {errors.contactPhone && (
              <ThemedText variant="error" size="xs" style={styles.errorText}>
                {errors.contactPhone.message}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedCard>

        {/* Avertissement */}
        <ThemedCard style={{ ...styles.warningCard, borderLeftWidth: 4, borderLeftColor: theme.colors.error }}>
          <FontAwesome 
            name="warning" 
            size={20} 
            color={theme.colors.error} 
            style={styles.warningIcon}
          />
          <ThemedView variant="transparent" style={styles.warningContent}>
            <ThemedText 
              size="base" 
              weight="semibold"
              style={{ color: theme.colors.error }}
              accessibilityLabel={t('agent.emergency.warning')}
            >
              {t('agent.emergency.warning')}
            </ThemedText>
            <ThemedText 
              variant="secondary" 
              size="sm"
              style={styles.warningText}
            >
              {t('agent.emergency.warningText')}
            </ThemedText>
          </ThemedView>
        </ThemedCard>

        {/* Actions */}
        <ThemedView style={styles.actionsContainer}>
          <PressableButton
            variant="outline"
            size="lg"
            fullWidth
            onPress={() => router.back()}
            accessibilityLabel={t('common.cancel')}
            style={styles.button}
          >
            {t('common.cancel')}
          </PressableButton>
          
          <PressableButton
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSending}
            accessibilityLabel={t('agent.emergency.sendReport')}
            style={{ ...styles.button, backgroundColor: theme.colors.error }}
          >
            {isSending ? t('agent.emergency.sending') : t('agent.emergency.sendReport')}
          </PressableButton>
        </ThemedView>
      </ScrollView>

      {/* Modal pour confirmer l'appel d'urgence */}
      <Modal
        visible={showCallModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelCall}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayPressable} onPress={handleCancelCall} />
          <ThemedCard style={styles.modalContent}>
            <ThemedView variant="transparent" style={styles.modalHeader}>
              <FontAwesome
                name="phone"
                size={24}
                color={theme.colors.primary}
              />
              <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
                {t('agent.emergency.callEmergency')}
              </ThemedText>
            </ThemedView>

            <ThemedText
              variant="secondary"
              size="base"
              style={styles.modalMessage}
            >
              {t('agent.emergency.callEmergencyDesc', { number: emergencyToCall?.number || '' })}
            </ThemedText>

            <ThemedView variant="transparent" style={styles.modalButtons}>
              <PressableButton
                variant="outline"
                size="md"
                onPress={handleCancelCall}
                accessibilityLabel={t('common.cancel')}
                style={styles.modalButton}
              >
                {t('common.cancel')}
              </PressableButton>

              <PressableButton
                variant="primary"
                size="md"
                onPress={handleConfirmCall}
                accessibilityLabel={t('agent.emergency.call')}
                style={styles.modalButton}
              >
                <FontAwesome name="phone" size={16} color="#fff" />
                <ThemedText size="base" weight="semibold" style={{ color: '#fff', marginLeft: 8 }}>
                  {t('agent.emergency.call')}
                </ThemedText>
              </PressableButton>
            </ThemedView>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    // No specific styles needed, inherits from ThemedText variant="secondary"
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
  emergencyCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  emergencyGrid: {
    gap: 12,
  },
  emergencyButton: {
    // Styles handled by PressableButton
  },
  emergencyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  emergencyButtonText: {
    flex: 1,
  },
  tipsCard: {
    marginBottom: 16,
  },
  tipSection: {
    marginBottom: 16,
  },
  tipTitle: {
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    lineHeight: 18,
  },
  formCard: {
    marginBottom: 16,
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
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  urgencyButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  urgencyButton: {
    flex: 1,
    minWidth: 80,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    marginBottom: 8,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    padding: 16,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningText: {
    marginTop: 4,
    lineHeight: 18,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    // No specific styles needed
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
