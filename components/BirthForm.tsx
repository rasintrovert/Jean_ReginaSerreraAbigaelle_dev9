import { DateInput } from '@/components/DateInput';
import { PressableButton } from '@/components/PressableButton';
import {
  ThemedCard,
  ThemedInput,
  ThemedText,
  ThemedView
} from '@/components/ThemedComponents';
import { TimeInput } from '@/components/TimeInput';
import { HAITIAN_DEPARTMENTS } from '@/constants/departments';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/languageStore';
import { useBirthStore } from '@/store/birthStore';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

// Schéma de validation pour l'étape 1 (Informations de l'enfant)
const step1Schema = z.object({
  childFirstNames: z.array(z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'))
    .refine((names) => names.some(name => name && name.trim().length >= 2), {
      message: 'Au moins un prénom est requis',
    }),
  childLastName: z.string().min(2, 'Le nom de famille est requis'),
  birthDate: z.string().min(1, 'La date de naissance est requise'),
  birthTime: z.string().min(1, 'L\'heure de naissance est requise'),
  gender: z.enum(['male', 'female'], { required_error: 'Le sexe est requis' }),
  birthPlaceType: z.string().min(1, 'Le type de lieu est requis'),
  birthPlaceName: z.string().min(2, 'Le nom du lieu est requis'),
  birthAddress: z.string().min(5, 'L\'adresse est requise'),
  birthDepartment: z.string().min(1, 'Le département est requis'),
});

// Schéma de validation pour l'étape 2 (Informations des parents)
const step2Schema = z.object({
  motherFirstNames: z.array(z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'))
    .refine((names) => names.some(name => name && name.trim().length >= 2), {
      message: 'Au moins un prénom est requis',
    }),
  motherLastName: z.string().min(2, 'Le nom de la mère est requis'),
  motherProfession: z.string().min(2, 'La profession de la mère est requise'),
  motherAddress: z.string().min(5, 'L\'adresse de la mère est requise'),
  fatherFirstNames: z.array(z.string().min(2, 'Le prénom doit contenir au moins 2 caractères')).optional(),
  fatherLastName: z.string().optional(),
  fatherProfession: z.string().optional(),
  fatherAddress: z.string().optional(),
});

// Schéma de validation pour l'étape 3 (Informations sur les témoins)
const step3Schema = z.object({
  witness1FirstNames: z.array(z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'))
    .refine((names) => names.some(name => name && name.trim().length >= 2), {
      message: 'Au moins un prénom est requis',
    }),
  witness1LastName: z.string().min(2, 'Le nom du premier témoin est requis'),
  witness1Address: z.string().min(5, 'L\'adresse du premier témoin est requise'),
  witness2FirstNames: z.array(z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'))
    .refine((names) => names.some(name => name && name.trim().length >= 2), {
      message: 'Au moins un prénom est requis',
    }),
  witness2LastName: z.string().min(2, 'Le nom du deuxième témoin est requis'),
  witness2Address: z.string().min(5, 'L\'adresse du deuxième témoin est requise'),
  pregnancyId: z.string().optional(),
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;
type Step3FormData = z.infer<typeof step3Schema>;
export type BirthFormData = Step1FormData & Step2FormData & Step3FormData;

const BIRTH_PLACE_TYPES = [
  { value: 'hospital', label: { fr: 'Hôpital', ht: 'Ospital' } },
  { value: 'home', label: { fr: 'À la maison', ht: 'Lakay' } },
  { value: 'other', label: { fr: 'Autre', ht: 'Lòt' } },
];

interface BirthFormProps {
  translationPrefix: 'agent' | 'hospital' | 'admin';
  onSuccess?: (data: BirthFormData) => void;
  onCancel?: () => void;
}

export function BirthForm({ translationPrefix, onSuccess, onCancel }: BirthFormProps) {
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const currentLanguage = useLanguageStore((state) => state.language);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [step1Data, setStep1Data] = useState<Step1FormData | null>(null);
  const [step2Data, setStep2Data] = useState<Step2FormData | null>(null);
  const [showPlaceTypeModal, setShowPlaceTypeModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);

  // Helper function pour obtenir les clés de traduction
  const getTranslationKey = (key: string) => `${translationPrefix}.birth.${key}`;

  // Formulaire pour l'étape 1
  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    mode: 'onChange',
    defaultValues: step1Data || {
      childFirstNames: [''],
      childLastName: '',
    },
  });

  // Formulaire pour l'étape 2
  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    mode: 'onChange',
    defaultValues: step2Data || {
      motherFirstNames: [''],
      fatherFirstNames: [''],
    },
  });

  // Formulaire pour l'étape 3
  const step3Form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    mode: 'onChange',
    defaultValues: {
      witness1FirstNames: [''],
      witness2FirstNames: [''],
    },
  });

  const handleStep1Next = (data: Step1FormData) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Next = (data: Step2FormData) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const { addBirth } = useBirthStore();
  const { user } = useAuthStore();

  const handleSubmit = async (data: Step3FormData) => {
    if (!step1Data || !step2Data) {
      Alert.alert(t('common.error'), 'Missing step data.');
      return;
    }

    try {
      const fullData: BirthFormData = { ...step1Data, ...step2Data, ...data };
      
      // Sauvegarder directement tous les champs du formulaire avec leurs noms d'origine
      // Pas de transformation - les données doivent être identiques au formulaire
      await addBirth({
        // Étape 1 : Informations de l'enfant
        childFirstNames: fullData.childFirstNames || [],
        childLastName: fullData.childLastName,
        birthDate: fullData.birthDate,
        birthTime: fullData.birthTime,
        gender: fullData.gender,
        birthPlaceType: fullData.birthPlaceType,
        birthPlaceName: fullData.birthPlaceName,
        birthAddress: fullData.birthAddress,
        birthDepartment: fullData.birthDepartment,
        // Étape 2 : Informations des parents
        motherFirstNames: fullData.motherFirstNames || [],
        motherLastName: fullData.motherLastName,
        motherProfession: fullData.motherProfession,
        motherAddress: fullData.motherAddress,
        fatherFirstNames: fullData.fatherFirstNames,
        fatherLastName: fullData.fatherLastName,
        fatherProfession: fullData.fatherProfession,
        fatherAddress: fullData.fatherAddress,
        // Étape 3 : Informations sur les témoins
        witness1FirstNames: fullData.witness1FirstNames || [],
        witness1LastName: fullData.witness1LastName,
        witness1Address: fullData.witness1Address,
        witness2FirstNames: fullData.witness2FirstNames || [],
        witness2LastName: fullData.witness2LastName,
        witness2Address: fullData.witness2Address,
        pregnancyId: fullData.pregnancyId,
      });

      Alert.alert(
        t('common.success'),
        t(getTranslationKey('saved')),
        [
          {
            text: t(getTranslationKey('generateProof')),
            onPress: () => generateProof(fullData),
          },
          {
            text: t('common.confirm'),
            style: 'cancel' as const,
            onPress: () => {
              onSuccess?.(fullData);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert(t('common.error'), t('errors.saveFailed'));
    }
  };

  const generateProof = async (birthData: BirthFormData) => {
    setIsGeneratingProof(true);
    
    try {
      // Simulation de génération de preuve
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        t(getTranslationKey('proofGenerated')),
        t(getTranslationKey('proofGeneratedDesc')),
        [
          {
            text: t('common.confirm'),
            style: 'cancel' as const,
            onPress: () => {
              onSuccess?.(birthData);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.saveFailed'));
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const progress = currentStep / 3;

  // Ajouter un prénom pour l'enfant
  const addChildFirstName = () => {
    const currentNames = step1Form.getValues('childFirstNames') || [''];
    step1Form.setValue('childFirstNames', [...currentNames, '']);
  };

  const removeChildFirstName = (index: number) => {
    const currentNames = step1Form.getValues('childFirstNames') || [''];
    if (currentNames.length > 1) {
      const newNames = currentNames.filter((_, i) => i !== index);
      step1Form.setValue('childFirstNames', newNames);
    }
  };

  // Ajouter un prénom pour la mère
  const addMotherFirstName = () => {
    const currentNames = step2Form.getValues('motherFirstNames') || [''];
    step2Form.setValue('motherFirstNames', [...currentNames, '']);
  };

  const removeMotherFirstName = (index: number) => {
    const currentNames = step2Form.getValues('motherFirstNames') || [''];
    if (currentNames.length > 1) {
      const newNames = currentNames.filter((_, i) => i !== index);
      step2Form.setValue('motherFirstNames', newNames);
    }
  };

  // Ajouter un prénom pour le père
  const addFatherFirstName = () => {
    const currentNames = step2Form.getValues('fatherFirstNames') || [''];
    step2Form.setValue('fatherFirstNames', [...currentNames, '']);
  };

  const removeFatherFirstName = (index: number) => {
    const currentNames = step2Form.getValues('fatherFirstNames') || [''];
    if (currentNames.length > 1) {
      const newNames = currentNames.filter((_, i) => i !== index);
      step2Form.setValue('fatherFirstNames', newNames);
    }
  };

  // Ajouter un prénom pour le témoin 1
  const addWitness1FirstName = () => {
    const currentNames = step3Form.getValues('witness1FirstNames') || [''];
    step3Form.setValue('witness1FirstNames', [...currentNames, '']);
  };

  const removeWitness1FirstName = (index: number) => {
    const currentNames = step3Form.getValues('witness1FirstNames') || [''];
    if (currentNames.length > 1) {
      const newNames = currentNames.filter((_, i) => i !== index);
      step3Form.setValue('witness1FirstNames', newNames);
    }
  };

  // Ajouter un prénom pour le témoin 2
  const addWitness2FirstName = () => {
    const currentNames = step3Form.getValues('witness2FirstNames') || [''];
    step3Form.setValue('witness2FirstNames', [...currentNames, '']);
  };

  const removeWitness2FirstName = (index: number) => {
    const currentNames = step3Form.getValues('witness2FirstNames') || [''];
    if (currentNames.length > 1) {
      const newNames = currentNames.filter((_, i) => i !== index);
      step3Form.setValue('witness2FirstNames', newNames);
    }
  };

  const linkToPregnancy = () => {
    Alert.alert(
      t(getTranslationKey('linkPregnancy')),
      t(getTranslationKey('searchPregnancy')),
      [{ text: t('common.confirm') }]
    );
  };

  return (
    <>
      {/* Indicateur d'étape */}
      <ThemedView style={styles.stepIndicator}>
        <ThemedText variant="secondary" size="sm" style={styles.stepText}>
          {currentStep === 1 ? t(getTranslationKey('step1')) : 
           currentStep === 2 ? t(getTranslationKey('step2')) : 
           t(getTranslationKey('step3'))}
        </ThemedText>
        <View style={styles.progressBar}>
          <View
            style={{
              ...styles.progressFill,
              width: `${progress * 100}%`,
              backgroundColor: theme.colors.primary,
            }}
          />
        </View>
      </ThemedView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Lien vers grossesse (optionnel, visible sur l'étape 1) */}
        {currentStep === 1 && (
          <ThemedCard style={styles.linkCard}>
            <ThemedView variant="transparent" style={styles.linkContent}>
              <FontAwesome 
                name="link" 
                size={20} 
                color={theme.colors.primary} 
              />
              <ThemedView variant="transparent" style={styles.linkText}>
                <ThemedText size="base" weight="medium">
                  {t(getTranslationKey('linkPregnancy'))}
                </ThemedText>
                <ThemedText variant="secondary" size="sm" style={styles.linkSubtext}>
                  {t(getTranslationKey('searchPregnancy'))} ({t('common.optional')})
                </ThemedText>
              </ThemedView>
              <PressableButton
                variant="outline"
                size="sm"
                onPress={linkToPregnancy}
              >
                {t(getTranslationKey('link'))}
              </PressableButton>
            </ThemedView>
          </ThemedCard>
        )}

        {/* Étape 1 : Informations de l'enfant */}
        {currentStep === 1 && (
          <ThemedCard style={styles.formCard}>
            <ThemedView variant="transparent" style={styles.cardHeader}>
              <FontAwesome
                name="child"
                size={24}
                color={theme.colors.primary}
                style={styles.cardIcon}
              />
              <ThemedText size="lg" weight="semibold" style={styles.cardTitle}>
                {t(getTranslationKey('step1Title'))}
              </ThemedText>
            </ThemedView>

            {/* Prénoms de l'enfant */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('childFirstNames'))} *
              </ThemedText>
              {(step1Form.watch('childFirstNames') || ['']).map((_, index) => (
                <ThemedView key={index} variant="transparent" style={styles.firstNameRow}>
                  <Controller
                    control={step1Form.control}
                    name={`childFirstNames.${index}` as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <ThemedInput
                        placeholder={t(getTranslationKey('childFirstName'))}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        variant={step1Form.formState.errors.childFirstNames ? 'error' : 'default'}
                        size="md"
                        fullWidth={false}
                        style={{ ...styles.input, ...styles.firstNameRowInput } as any}
                      />
                    )}
                  />
                  {index > 0 && (
                    <Pressable
                      onPress={() => removeChildFirstName(index)}
                      style={styles.removeButton}
                    >
                      <FontAwesome name="times" size={16} color={theme.colors.error} />
                    </Pressable>
                  )}
                </ThemedView>
              ))}
              <Pressable onPress={addChildFirstName} style={styles.addButton}>
                <FontAwesome name="plus" size={16} color={theme.colors.primary} />
                <ThemedText size="sm" style={{ color: theme.colors.primary, marginLeft: 8 }}>
                  {t(getTranslationKey('addFirstName'))}
                </ThemedText>
              </Pressable>
              {step1Form.formState.errors.childFirstNames && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step1Form.formState.errors.childFirstNames.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Nom de famille / Siyati de l'enfant */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('childLastName'))} *
              </ThemedText>
              <Controller
                control={step1Form.control}
                name="childLastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('childLastName'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step1Form.formState.errors.childLastName ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    style={styles.input}
                  />
                )}
              />
              {step1Form.formState.errors.childLastName && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step1Form.formState.errors.childLastName.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Date de naissance */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('birthDate'))} *
              </ThemedText>
              <Controller
                control={step1Form.control}
                name="birthDate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <DateInput
                    placeholder="JJ/MM/AAAA"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step1Form.formState.errors.birthDate ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    style={styles.input}
                    mode="date"
                    maximumDate={new Date()} // Pas de date future
                  />
                )}
              />
              {step1Form.formState.errors.birthDate && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step1Form.formState.errors.birthDate.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Heure de naissance */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('birthTime'))} *
              </ThemedText>
              <Controller
                control={step1Form.control}
                name="birthTime"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TimeInput
                    placeholder="HH:MM"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step1Form.formState.errors.birthTime ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    style={styles.input}
                  />
                )}
              />
              {step1Form.formState.errors.birthTime && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step1Form.formState.errors.birthTime.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Sexe */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('sex'))} *
              </ThemedText>
              <ThemedView variant="transparent" style={styles.radioGroup}>
                <Controller
                  control={step1Form.control}
                  name="gender"
                  render={({ field: { onChange, value } }) => (
                    <>
                      <Pressable
                        style={[
                          styles.radioOption,
                          {
                            borderColor: value === 'male' ? theme.colors.primary : theme.colors.border,
                            backgroundColor: value === 'male' ? theme.colors.primary + '20' : theme.colors.surface,
                          }
                        ]}
                        onPress={() => onChange('male')}
                      >
                        <View style={[
                          styles.radioCircle,
                          {
                            borderColor: value === 'male' ? theme.colors.primary : theme.colors.border,
                            backgroundColor: value === 'male' ? theme.colors.primary : 'transparent',
                          }
                        ]}>
                          {value === 'male' && <View style={styles.radioInner} />}
                        </View>
                        <ThemedText size="base" style={{ marginLeft: 12 }}>
                          {t(getTranslationKey('sexMale'))}
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.radioOption,
                          {
                            borderColor: value === 'female' ? theme.colors.primary : theme.colors.border,
                            backgroundColor: value === 'female' ? theme.colors.primary + '20' : theme.colors.surface,
                          }
                        ]}
                        onPress={() => onChange('female')}
                      >
                        <View style={[
                          styles.radioCircle,
                          {
                            borderColor: value === 'female' ? theme.colors.primary : theme.colors.border,
                            backgroundColor: value === 'female' ? theme.colors.primary : 'transparent',
                          }
                        ]}>
                          {value === 'female' && <View style={styles.radioInner} />}
                        </View>
                        <ThemedText size="base" style={{ marginLeft: 12 }}>
                          {t(getTranslationKey('sexFemale'))}
                        </ThemedText>
                      </Pressable>
                    </>
                  )}
                />
              </ThemedView>
              {step1Form.formState.errors.gender && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step1Form.formState.errors.gender.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Type de lieu de naissance */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('birthPlaceType'))} *
              </ThemedText>
              <Controller
                control={step1Form.control}
                name="birthPlaceType"
                render={({ field: { onChange, value } }) => (
                  <ThemedView variant="transparent" style={styles.pickerContainer}>
                    <Pressable
                      style={{
                        ...styles.pickerButton,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      }}
                      onPress={() => setShowPlaceTypeModal(true)}
                    >
                      <ThemedText
                        style={{
                          ...styles.pickerText,
                          ...(!value && { color: theme.colors.textSecondary }),
                        }}
                      >
                        {value
                          ? BIRTH_PLACE_TYPES.find(p => p.value === value)?.label[currentLanguage] || value
                          : t(getTranslationKey('birthPlaceType'))}
                      </ThemedText>
                      <FontAwesome name="chevron-down" size={16} color={theme.colors.textSecondary} />
                    </Pressable>

                    {/* Modal pour sélectionner le type de lieu */}
                    <Modal
                      visible={showPlaceTypeModal}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setShowPlaceTypeModal(false)}
                    >
                      <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setShowPlaceTypeModal(false)}
                      >
                        <ThemedView style={StyleSheet.flatten([styles.modalContent, { backgroundColor: theme.colors.surface }])}>
                          <ThemedView variant="transparent" style={styles.modalHeader}>
                            <ThemedView variant="transparent" style={styles.modalHeaderText}>
                              <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
                                {t(getTranslationKey('birthPlaceType'))}
                              </ThemedText>
                            </ThemedView>
                            <Pressable
                              onPress={() => setShowPlaceTypeModal(false)}
                              style={styles.modalCloseButton}
                            >
                              <FontAwesome name="times" size={20} color={theme.colors.text} />
                            </Pressable>
                          </ThemedView>
                          
                          <FlatList
                            data={BIRTH_PLACE_TYPES}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item: placeType }) => (
                              <Pressable
                                style={[
                                  styles.modalOption,
                                  {
                                    backgroundColor: value === placeType.value 
                                      ? theme.colors.primary + '20' 
                                      : theme.colors.surface,
                                    borderColor: value === placeType.value 
                                      ? theme.colors.primary 
                                      : theme.colors.border,
                                  }
                                ]}
                                onPress={() => {
                                  onChange(placeType.value);
                                  setShowPlaceTypeModal(false);
                                }}
                              >
                                <ThemedText
                                  size="base"
                                  weight={value === placeType.value ? 'semibold' : 'normal'}
                                  style={{
                                    color: value === placeType.value ? theme.colors.primary : theme.colors.text,
                                  }}
                                >
                                  {placeType.label[currentLanguage]}
                                </ThemedText>
                              </Pressable>
                            )}
                            style={styles.modalScrollView}
                            showsVerticalScrollIndicator={true}
                          />
                        </ThemedView>
                      </Pressable>
                    </Modal>
                  </ThemedView>
                )}
              />
              {step1Form.formState.errors.birthPlaceType && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step1Form.formState.errors.birthPlaceType.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Nom du lieu */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('birthPlaceName'))} *
              </ThemedText>
              <Controller
                control={step1Form.control}
                name="birthPlaceName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('birthPlaceName'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step1Form.formState.errors.birthPlaceName ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    style={styles.input}
                  />
                )}
              />
              {step1Form.formState.errors.birthPlaceName && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step1Form.formState.errors.birthPlaceName.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Adresse */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('birthAddress'))} *
              </ThemedText>
              <Controller
                control={step1Form.control}
                name="birthAddress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('birthAddress'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step1Form.formState.errors.birthAddress ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    multiline
                    numberOfLines={2}
                    style={{ ...styles.input, ...styles.multilineInput }}
                  />
                )}
              />
              {step1Form.formState.errors.birthAddress && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step1Form.formState.errors.birthAddress.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Département */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('birthDepartment'))} *
              </ThemedText>
              <Controller
                control={step1Form.control}
                name="birthDepartment"
                render={({ field: { onChange, value } }) => (
                  <ThemedView variant="transparent" style={styles.pickerContainer}>
                    <Pressable
                      style={{
                        ...styles.pickerButton,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      }}
                      onPress={() => setShowDepartmentModal(true)}
                    >
                      <ThemedText
                        style={{
                          ...styles.pickerText,
                          ...(!value && { color: theme.colors.textSecondary }),
                        }}
                      >
                        {value
                          ? (currentLanguage === 'fr'
                            ? HAITIAN_DEPARTMENTS.find(d => d.name === value || d.code === value)?.name
                            : HAITIAN_DEPARTMENTS.find(d => d.name === value || d.code === value)?.nameKr) || value
                          : t(getTranslationKey('birthDepartment'))}
                      </ThemedText>
                      <FontAwesome name="chevron-down" size={16} color={theme.colors.textSecondary} />
                    </Pressable>

                    {/* Modal pour sélectionner le département */}
                    <Modal
                      visible={showDepartmentModal}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setShowDepartmentModal(false)}
                    >
                      <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setShowDepartmentModal(false)}
                      >
                        <ThemedView style={StyleSheet.flatten([styles.modalContent, { backgroundColor: theme.colors.surface }])}>
                          <ThemedView variant="transparent" style={styles.modalHeader}>
                            <ThemedView variant="transparent" style={styles.modalHeaderText}>
                              <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
                                {t(getTranslationKey('birthDepartment'))}
                              </ThemedText>
                            </ThemedView>
                            <Pressable
                              onPress={() => setShowDepartmentModal(false)}
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
                                    backgroundColor: value === dept.name 
                                      ? theme.colors.primary + '20' 
                                      : theme.colors.surface,
                                    borderColor: value === dept.name 
                                      ? theme.colors.primary 
                                      : theme.colors.border,
                                  }
                                ]}
                                onPress={() => {
                                  // Sauvegarder le nom complet au lieu du code
                                  onChange(dept.name);
                                  setShowDepartmentModal(false);
                                }}
                              >
                                <ThemedText
                                  size="base"
                                    weight={value === dept.name ? 'semibold' : 'normal'}
                                    style={{
                                      color: value === dept.name ? theme.colors.primary : theme.colors.text,
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
                  </ThemedView>
                )}
              />
              {step1Form.formState.errors.birthDepartment && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step1Form.formState.errors.birthDepartment.message}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedCard>
        )}

        {/* Étape 2 : Informations des parents */}
        {currentStep === 2 && (
          <ThemedCard style={styles.formCard}>
            <ThemedView variant="transparent" style={styles.cardHeader}>
              <FontAwesome
                name="users"
                size={24}
                color={theme.colors.primary}
                style={styles.cardIcon}
              />
              <ThemedText size="lg" weight="semibold" style={styles.cardTitle}>
                {t(getTranslationKey('step2Title'))}
              </ThemedText>
            </ThemedView>

            {/* Section Mère */}
            <ThemedText size="base" weight="semibold" style={styles.sectionSubtitle}>
              {t(getTranslationKey('motherInfo'))}
            </ThemedText>

            {/* Prénoms de la mère */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('motherFirstNames'))} *
              </ThemedText>
              {(step2Form.watch('motherFirstNames') || ['']).map((_, index) => (
                <ThemedView key={index} variant="transparent" style={styles.firstNameRow}>
                  <Controller
                    control={step2Form.control}
                    name={`motherFirstNames.${index}` as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <ThemedInput
                        placeholder={t(getTranslationKey('motherFirstName'))}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        variant={step2Form.formState.errors.motherFirstNames ? 'error' : 'default'}
                        size="md"
                        fullWidth={false}
                        style={{ ...styles.input, ...styles.firstNameRowInput } as any}
                      />
                    )}
                  />
                  {index > 0 && (
                    <Pressable
                      onPress={() => removeMotherFirstName(index)}
                      style={styles.removeButton}
                    >
                      <FontAwesome name="times" size={16} color={theme.colors.error} />
                    </Pressable>
                  )}
                </ThemedView>
              ))}
              <Pressable onPress={addMotherFirstName} style={styles.addButton}>
                <FontAwesome name="plus" size={16} color={theme.colors.primary} />
                <ThemedText size="sm" style={{ color: theme.colors.primary, marginLeft: 8 }}>
                  {t(getTranslationKey('addFirstName'))}
                </ThemedText>
              </Pressable>
              {step2Form.formState.errors.motherFirstNames && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step2Form.formState.errors.motherFirstNames.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Nom de la mère */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('motherLastName'))} *
              </ThemedText>
              <Controller
                control={step2Form.control}
                name="motherLastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('motherLastName'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step2Form.formState.errors.motherLastName ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    style={styles.input}
                  />
                )}
              />
              {step2Form.formState.errors.motherLastName && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step2Form.formState.errors.motherLastName.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Profession de la mère */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('motherProfession'))} *
              </ThemedText>
              <Controller
                control={step2Form.control}
                name="motherProfession"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('motherProfession'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step2Form.formState.errors.motherProfession ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    style={styles.input}
                  />
                )}
              />
              {step2Form.formState.errors.motherProfession && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step2Form.formState.errors.motherProfession.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Adresse de la mère */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('motherAddress'))} *
              </ThemedText>
              <Controller
                control={step2Form.control}
                name="motherAddress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('motherAddress'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step2Form.formState.errors.motherAddress ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    multiline
                    numberOfLines={2}
                    style={{ ...styles.input, ...styles.multilineInput }}
                  />
                )}
              />
              {step2Form.formState.errors.motherAddress && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step2Form.formState.errors.motherAddress.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Section Père */}
            <ThemedText size="base" weight="semibold" style={styles.sectionSubtitle}>
              {t(getTranslationKey('fatherInfo'))}
            </ThemedText>

            {/* Prénoms du père */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('fatherFirstNames'))} ({t('common.optional')})
              </ThemedText>
              {(step2Form.watch('fatherFirstNames') || ['']).map((_, index) => (
                <ThemedView key={index} variant="transparent" style={styles.firstNameRow}>
                  <Controller
                    control={step2Form.control}
                    name={`fatherFirstNames.${index}` as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <ThemedInput
                        placeholder={t(getTranslationKey('fatherFirstName'))}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        size="md"
                        fullWidth={false}
                        style={{ ...styles.input, ...styles.firstNameRowInput } as any}
                      />
                    )}
                  />
                  {index > 0 && (
                    <Pressable
                      onPress={() => removeFatherFirstName(index)}
                      style={styles.removeButton}
                    >
                      <FontAwesome name="times" size={16} color={theme.colors.error} />
                    </Pressable>
                  )}
                </ThemedView>
              ))}
              <Pressable onPress={addFatherFirstName} style={styles.addButton}>
                <FontAwesome name="plus" size={16} color={theme.colors.primary} />
                <ThemedText size="sm" style={{ color: theme.colors.primary, marginLeft: 8 }}>
                  {t(getTranslationKey('addFirstName'))}
                </ThemedText>
              </Pressable>
            </ThemedView>

            {/* Nom du père */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('fatherLastName'))} ({t('common.optional')})
              </ThemedText>
              <Controller
                control={step2Form.control}
                name="fatherLastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('fatherLastName'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    size="md"
                    fullWidth
                    style={styles.input}
                  />
                )}
              />
            </ThemedView>

            {/* Profession du père */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('fatherProfession'))} ({t('common.optional')})
              </ThemedText>
              <Controller
                control={step2Form.control}
                name="fatherProfession"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('fatherProfession'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    size="md"
                    fullWidth
                    style={styles.input}
                  />
                )}
              />
            </ThemedView>

            {/* Adresse du père */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('fatherAddress'))} ({t('common.optional')})
              </ThemedText>
              <Controller
                control={step2Form.control}
                name="fatherAddress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('fatherAddress'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    size="md"
                    fullWidth
                    multiline
                    numberOfLines={2}
                    style={{ ...styles.input, ...styles.multilineInput }}
                  />
                )}
              />
            </ThemedView>
          </ThemedCard>
        )}

        {/* Étape 3 : Informations sur les témoins */}
        {currentStep === 3 && (
          <ThemedCard style={styles.formCard}>
            <ThemedView variant="transparent" style={styles.cardHeader}>
              <FontAwesome
                name="users"
                size={24}
                color={theme.colors.primary}
                style={styles.cardIcon}
              />
              <ThemedText size="lg" weight="semibold" style={styles.cardTitle}>
                {t(getTranslationKey('step3Title'))}
              </ThemedText>
            </ThemedView>

            {/* Témoin 1 */}
            <ThemedText size="base" weight="semibold" style={styles.sectionSubtitle}>
              {t(getTranslationKey('witness1'))}
            </ThemedText>

            {/* Prénoms du témoin 1 */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('witness1FirstNames'))} *
              </ThemedText>
              {(step3Form.watch('witness1FirstNames') || ['']).map((_, index) => (
                <ThemedView key={index} variant="transparent" style={styles.firstNameRow}>
                  <Controller
                    control={step3Form.control}
                    name={`witness1FirstNames.${index}` as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <ThemedInput
                        placeholder={t(getTranslationKey('witness1FirstName'))}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        variant={step3Form.formState.errors.witness1FirstNames ? 'error' : 'default'}
                        size="md"
                        fullWidth={false}
                        style={{ ...styles.input, ...styles.firstNameRowInput } as any}
                      />
                    )}
                  />
                  {index > 0 && (
                    <Pressable
                      onPress={() => removeWitness1FirstName(index)}
                      style={styles.removeButton}
                    >
                      <FontAwesome name="times" size={16} color={theme.colors.error} />
                    </Pressable>
                  )}
                </ThemedView>
              ))}
              <Pressable onPress={addWitness1FirstName} style={styles.addButton}>
                <FontAwesome name="plus" size={16} color={theme.colors.primary} />
                <ThemedText size="sm" style={{ color: theme.colors.primary, marginLeft: 8 }}>
                  {t(getTranslationKey('addFirstName'))}
                </ThemedText>
              </Pressable>
              {step3Form.formState.errors.witness1FirstNames && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step3Form.formState.errors.witness1FirstNames.message}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('witness1LastName'))} *
              </ThemedText>
              <Controller
                control={step3Form.control}
                name="witness1LastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('witness1LastName'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step3Form.formState.errors.witness1LastName ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    style={styles.input}
                  />
                )}
              />
              {step3Form.formState.errors.witness1LastName && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step3Form.formState.errors.witness1LastName.message}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('witness1Address'))} *
              </ThemedText>
              <Controller
                control={step3Form.control}
                name="witness1Address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('witness1Address'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step3Form.formState.errors.witness1Address ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    multiline
                    numberOfLines={2}
                    style={{ ...styles.input, ...styles.multilineInput }}
                  />
                )}
              />
              {step3Form.formState.errors.witness1Address && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step3Form.formState.errors.witness1Address.message}
                </ThemedText>
              )}
            </ThemedView>

            {/* Témoin 2 */}
            <ThemedText size="base" weight="semibold" style={styles.sectionSubtitle}>
              {t(getTranslationKey('witness2'))}
            </ThemedText>

            {/* Prénoms du témoin 2 */}
            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('witness2FirstNames'))} *
              </ThemedText>
              {(step3Form.watch('witness2FirstNames') || ['']).map((_, index) => (
                <ThemedView key={index} variant="transparent" style={styles.firstNameRow}>
                  <Controller
                    control={step3Form.control}
                    name={`witness2FirstNames.${index}` as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <ThemedInput
                        placeholder={t(getTranslationKey('witness2FirstName'))}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        variant={step3Form.formState.errors.witness2FirstNames ? 'error' : 'default'}
                        size="md"
                        fullWidth={false}
                        style={{ ...styles.input, ...styles.firstNameRowInput } as any}
                      />
                    )}
                  />
                  {index > 0 && (
                    <Pressable
                      onPress={() => removeWitness2FirstName(index)}
                      style={styles.removeButton}
                    >
                      <FontAwesome name="times" size={16} color={theme.colors.error} />
                    </Pressable>
                  )}
                </ThemedView>
              ))}
              <Pressable onPress={addWitness2FirstName} style={styles.addButton}>
                <FontAwesome name="plus" size={16} color={theme.colors.primary} />
                <ThemedText size="sm" style={{ color: theme.colors.primary, marginLeft: 8 }}>
                  {t(getTranslationKey('addFirstName'))}
                </ThemedText>
              </Pressable>
              {step3Form.formState.errors.witness2FirstNames && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step3Form.formState.errors.witness2FirstNames.message}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('witness2LastName'))} *
              </ThemedText>
              <Controller
                control={step3Form.control}
                name="witness2LastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('witness2LastName'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step3Form.formState.errors.witness2LastName ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    style={styles.input}
                  />
                )}
              />
              {step3Form.formState.errors.witness2LastName && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step3Form.formState.errors.witness2LastName.message}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView variant="transparent" style={styles.inputContainer}>
              <ThemedText size="sm" weight="medium" style={styles.label}>
                {t(getTranslationKey('witness2Address'))} *
              </ThemedText>
              <Controller
                control={step3Form.control}
                name="witness2Address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ThemedInput
                    placeholder={t(getTranslationKey('witness2Address'))}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    variant={step3Form.formState.errors.witness2Address ? 'error' : 'default'}
                    size="md"
                    fullWidth
                    multiline
                    numberOfLines={2}
                    style={{ ...styles.input, ...styles.multilineInput }}
                  />
                )}
              />
              {step3Form.formState.errors.witness2Address && (
                <ThemedText variant="error" size="xs" style={styles.errorText}>
                  {step3Form.formState.errors.witness2Address.message}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedCard>
        )}

        {/* Boutons d'action */}
        <ThemedView style={styles.actionsContainer}>
          {currentStep === 1 ? (
            <PressableButton
              variant="primary"
              size="lg"
              fullWidth
              onPress={step1Form.handleSubmit(handleStep1Next)}
              disabled={!step1Form.formState.isValid}
              accessibilityLabel={t(getTranslationKey('next'))}
              style={styles.button}
            >
              {t(getTranslationKey('next'))}
            </PressableButton>
          ) : currentStep === 2 ? (
            <ThemedView variant="transparent" style={styles.twoButtonsRow}>
              <PressableButton
                variant="outline"
                size="lg"
                onPress={handleStep2Back}
                accessibilityLabel={t('common.cancel')}
                style={{ ...styles.button, ...styles.buttonHalf }}
              >
                {t('common.cancel')}
              </PressableButton>
              <PressableButton
                variant="primary"
                size="lg"
                onPress={step2Form.handleSubmit(handleStep2Next)}
                disabled={!step2Form.formState.isValid}
                accessibilityLabel={t(getTranslationKey('next'))}
                style={{ ...styles.button, ...styles.buttonHalf }}
              >
                {t(getTranslationKey('next'))}
              </PressableButton>
            </ThemedView>
          ) : (
            <ThemedView variant="transparent" style={styles.twoButtonsRow}>
              <PressableButton
                variant="outline"
                size="lg"
                onPress={handleStep3Back}
                accessibilityLabel={t('common.cancel')}
                style={{ ...styles.button, ...styles.buttonHalf }}
              >
                {t('common.cancel')}
              </PressableButton>
              <PressableButton
                variant="primary"
                size="lg"
                onPress={step3Form.handleSubmit(handleSubmit)}
                disabled={!step3Form.formState.isValid}
                accessibilityLabel={t(getTranslationKey('register'))}
                style={{ ...styles.button, ...styles.buttonHalf }}
              >
                {t(getTranslationKey('register'))}
              </PressableButton>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  stepIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  stepText: {
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Espace pour la navigation en bas
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
  },
  linkCard: {
    marginBottom: 16,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    flex: 1,
  },
  linkSubtext: {
    marginTop: 4,
  },
  formCard: {
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  cardIcon: {
    marginRight: 4,
  },
  cardTitle: {
    flex: 1,
  },
  sectionSubtitle: {
    marginTop: 8,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 4,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  firstNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    width: '100%',
  },
  firstNameRowInput: {
    flex: 1,
    minWidth: 0,
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
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  pickerContainer: {
    marginBottom: 4,
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
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  actionsContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  twoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    marginBottom: 12,
  },
  buttonHalf: {
    flex: 1,
  },
  // Modal styles
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
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    marginBottom: 4,
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
    alignItems: 'center',
  },
});

