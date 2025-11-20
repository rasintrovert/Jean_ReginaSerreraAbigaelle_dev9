import { PressableButton } from '@/components/PressableButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  ThemedCard,
  ThemedText,
  ThemedView
} from '@/components/ThemedComponents';
import { HAITIAN_DEPARTMENTS } from '@/constants/departments';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { getRecordsForValidation, rejectRecord, validateRecord, validateRecordsBulk, ValidationStatus } from '@/services/admin/adminService';
import { useAuthStore } from '@/store/authStore';
import { useBirthStore } from '@/store/birthStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePregnancyStore } from '@/store/pregnancyStore';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, TextInput as RNTextInput, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'pending' | 'validated' | 'rejected';
type RecordType = 'all' | 'pregnancy' | 'birth';
type PeriodFilter = 'today' | 'thisWeek' | 'thisMonth' | 'all';

interface ValidationRecord {
  id: string;
  type: 'pregnancy' | 'birth';
  referenceNumber: string;
  date: string;
  recordedBy: string;
  recordedByType: 'agent' | 'hospital' | 'admin';
  childName?: string;
  motherName: string;
  fatherName?: string;
  status: 'pending' | 'validated' | 'rejected';
  rejectionReason?: string;
  // Détails complets pour l'analyse
  details?: {
    // Informations de la mère (pour grossesse et naissance)
    motherFirstNames?: string[];
    motherLastName?: string;
    motherBirthDate?: string;
    motherPhone?: string;
    motherPhoneAlt?: string;
    motherAddress?: string;
    motherCity?: string;
    motherDepartment?: string;
    motherBloodGroup?: string;
    motherProfession?: string;
    // Informations de grossesse
    estimatedDeliveryDate?: string;
    estimatedDeliveryMonth?: string;
    pregnancyCount?: string;
    healthCondition?: string;
    notes?: string;
    // Informations de naissance
    childFirstNames?: string[];
    childLastName?: string;
    birthDate?: string;
    birthTime?: string;
    gender?: 'male' | 'female';
    birthPlaceType?: string;
    birthPlaceName?: string;
    birthAddress?: string;
    birthDepartment?: string;
    // Informations du père (pour naissance)
    fatherFirstNames?: string[];
    fatherLastName?: string;
    fatherProfession?: string;
    fatherAddress?: string;
    // Informations des témoins (pour naissance)
    witness1FirstNames?: string[];
    witness1LastName?: string;
    witness1Address?: string;
    witness2FirstNames?: string[];
    witness2LastName?: string;
    witness2Address?: string;
    pregnancyId?: string;
  };
}

export default function AdminValidationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [recordTypeFilter, setRecordTypeFilter] = useState<RecordType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ValidationRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [recordForDetails, setRecordForDetails] = useState<ValidationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<ValidationRecord[]>([]);
  const [allRecordsForCounts, setAllRecordsForCounts] = useState<ValidationRecord[]>([]);
  const { user } = useAuthStore();
  const { pregnancies } = usePregnancyStore();
  const { births } = useBirthStore();

  // Charger les enregistrements depuis Firestore
  useEffect(() => {
    loadRecords();
    loadAllRecordsForCounts(); // Charger tous les enregistrements pour les compteurs
  }, [activeTab, recordTypeFilter]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const allRecords: ValidationRecord[] = [];
      
      // Charger les pregnancies
      if (recordTypeFilter === 'all' || recordTypeFilter === 'pregnancy') {
        const status = activeTab === 'pending' ? 'pending' : activeTab === 'validated' ? 'validated' : 'rejected';
        const pregnancyRecords = await getRecordsForValidation('pregnancy', status as ValidationStatus);
        
        for (const preg of pregnancyRecords) {
          const motherName = (Array.isArray(preg.motherFirstNames) && preg.motherFirstNames.length > 0 && preg.motherLastName)
            ? `${preg.motherFirstNames.join(' ')} ${preg.motherLastName}`
            : preg.motherName || 'N/A';
          
          allRecords.push({
            id: preg.firestoreId || preg.id,
            type: 'pregnancy',
            referenceNumber: preg.id || `PR-${preg.firestoreId?.substring(0, 8)}`,
            date: preg.createdAt || new Date().toISOString(),
            recordedBy: preg.recordedBy || 'Unknown',
            recordedByType: (preg.recordedByType as 'agent' | 'hospital' | 'admin') || 'agent',
            motherName,
            status: (preg.validationStatus || 'pending') as 'pending' | 'validated' | 'rejected',
            rejectionReason: preg.rejectionReason,
            details: {
              motherFirstNames: preg.motherFirstNames || [],
              motherLastName: preg.motherLastName,
              motherBirthDate: preg.motherBirthDate,
              motherPhone: preg.motherPhone,
              motherPhoneAlt: preg.motherPhoneAlt,
              motherAddress: preg.motherAddress,
              motherCity: preg.motherCity,
              motherDepartment: preg.motherDepartment,
              motherBloodGroup: preg.motherBloodGroup,
              estimatedDeliveryDate: preg.estimatedDeliveryDate,
              estimatedDeliveryMonth: preg.estimatedDeliveryMonth,
              pregnancyCount: preg.pregnancyCount,
              healthCondition: preg.healthCondition,
              notes: preg.notes,
            },
          });
        }
      }

      // Charger les births
      if (recordTypeFilter === 'all' || recordTypeFilter === 'birth') {
        const status = activeTab === 'pending' ? 'pending' : activeTab === 'validated' ? 'validated' : 'rejected';
        const birthRecords = await getRecordsForValidation('birth', status as ValidationStatus);
        
        for (const birth of birthRecords) {
          const childName = (Array.isArray(birth.childFirstNames) && birth.childFirstNames.length > 0 && birth.childLastName)
            ? `${birth.childFirstNames.join(' ')} ${birth.childLastName}`
            : birth.childName || 'N/A';
          const motherName = (Array.isArray(birth.motherFirstNames) && birth.motherFirstNames.length > 0 && birth.motherLastName)
            ? `${birth.motherFirstNames.join(' ')} ${birth.motherLastName}`
            : birth.motherName || 'N/A';
          const fatherName = (Array.isArray(birth.fatherFirstNames) && birth.fatherFirstNames.length > 0 && birth.fatherLastName)
            ? `${birth.fatherFirstNames.join(' ')} ${birth.fatherLastName}`
            : birth.fatherName;
          
          allRecords.push({
            id: birth.firestoreId || birth.id,
            type: 'birth',
            referenceNumber: birth.id || `INPR-${birth.firestoreId?.substring(0, 8)}`,
            date: birth.createdAt || new Date().toISOString(),
            recordedBy: birth.recordedBy || 'Unknown',
            recordedByType: (birth.recordedByType as 'agent' | 'hospital' | 'admin') || 'agent',
            childName,
            motherName,
            fatherName,
            status: (birth.validationStatus || 'pending') as 'pending' | 'validated' | 'rejected',
            rejectionReason: birth.rejectionReason,
            details: {
              childFirstNames: birth.childFirstNames || [],
              childLastName: birth.childLastName,
              birthDate: birth.birthDate,
              birthTime: birth.birthTime,
              gender: birth.gender,
              birthPlaceType: birth.birthPlaceType,
              birthPlaceName: birth.birthPlaceName,
              birthAddress: birth.birthAddress,
              birthDepartment: birth.birthDepartment,
              motherFirstNames: birth.motherFirstNames || [],
              motherLastName: birth.motherLastName,
              motherProfession: birth.motherProfession,
              motherAddress: birth.motherAddress,
              fatherFirstNames: birth.fatherFirstNames,
              fatherLastName: birth.fatherLastName,
              fatherProfession: birth.fatherProfession,
              fatherAddress: birth.fatherAddress,
              witness1FirstNames: birth.witness1FirstNames,
              witness1LastName: birth.witness1LastName,
              witness1Address: birth.witness1Address,
              witness2FirstNames: birth.witness2FirstNames,
              witness2LastName: birth.witness2LastName,
              witness2Address: birth.witness2Address,
              pregnancyId: birth.pregnancyId,
            },
          });
        }
      }

      setRecords(allRecords);
    } catch (error) {
      if (__DEV__) console.error('Error loading records:', error);
      Alert.alert(t('common.error'), t('admin.validation.loadError') || 'Erreur lors du chargement des enregistrements');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger TOUS les enregistrements (tous statuts) pour calculer les compteurs
  const loadAllRecordsForCounts = async () => {
    try {
      const allRecords: ValidationRecord[] = [];
      
      // Charger toutes les pregnancies (sans filtre de statut)
      if (recordTypeFilter === 'all' || recordTypeFilter === 'pregnancy') {
        const pregnancyRecords = await getRecordsForValidation('pregnancy'); // Pas de filtre de statut
        
        for (const preg of pregnancyRecords) {
          const motherName = (Array.isArray(preg.motherFirstNames) && preg.motherFirstNames.length > 0 && preg.motherLastName)
            ? `${preg.motherFirstNames.join(' ')} ${preg.motherLastName}`
            : preg.motherName || 'N/A';
          
          allRecords.push({
            id: preg.firestoreId || preg.id,
            type: 'pregnancy',
            referenceNumber: preg.id || `PR-${preg.firestoreId?.substring(0, 8)}`,
            date: preg.createdAt || new Date().toISOString(),
            recordedBy: preg.recordedBy || 'Unknown',
            recordedByType: (preg.recordedByType as 'agent' | 'hospital' | 'admin') || 'agent',
            motherName,
            status: (preg.validationStatus || 'pending') as 'pending' | 'validated' | 'rejected',
            rejectionReason: preg.rejectionReason,
            details: {
              motherFirstNames: preg.motherFirstNames || [],
              motherLastName: preg.motherLastName,
              motherBirthDate: preg.motherBirthDate,
              motherPhone: preg.motherPhone,
              motherPhoneAlt: preg.motherPhoneAlt,
              motherAddress: preg.motherAddress,
              motherCity: preg.motherCity,
              motherDepartment: preg.motherDepartment,
              motherBloodGroup: preg.motherBloodGroup,
              estimatedDeliveryDate: preg.estimatedDeliveryDate,
              estimatedDeliveryMonth: preg.estimatedDeliveryMonth,
              pregnancyCount: preg.pregnancyCount,
              healthCondition: preg.healthCondition,
              notes: preg.notes,
            },
          });
        }
      }

      // Charger tous les births (sans filtre de statut)
      if (recordTypeFilter === 'all' || recordTypeFilter === 'birth') {
        const birthRecords = await getRecordsForValidation('birth'); // Pas de filtre de statut
        
        for (const birth of birthRecords) {
          const childName = (Array.isArray(birth.childFirstNames) && birth.childFirstNames.length > 0 && birth.childLastName)
            ? `${birth.childFirstNames.join(' ')} ${birth.childLastName}`
            : birth.childName || 'N/A';
          const motherName = (Array.isArray(birth.motherFirstNames) && birth.motherFirstNames.length > 0 && birth.motherLastName)
            ? `${birth.motherFirstNames.join(' ')} ${birth.motherLastName}`
            : birth.motherName || 'N/A';
          const fatherName = (Array.isArray(birth.fatherFirstNames) && birth.fatherFirstNames.length > 0 && birth.fatherLastName)
            ? `${birth.fatherFirstNames.join(' ')} ${birth.fatherLastName}`
            : birth.fatherName;
          
          allRecords.push({
            id: birth.firestoreId || birth.id,
            type: 'birth',
            referenceNumber: birth.id || `INPR-${birth.firestoreId?.substring(0, 8)}`,
            date: birth.createdAt || new Date().toISOString(),
            recordedBy: birth.recordedBy || 'Unknown',
            recordedByType: (birth.recordedByType as 'agent' | 'hospital' | 'admin') || 'agent',
            childName,
            motherName,
            fatherName,
            status: (birth.validationStatus || 'pending') as 'pending' | 'validated' | 'rejected',
            rejectionReason: birth.rejectionReason,
            details: {
              childFirstNames: birth.childFirstNames || [],
              childLastName: birth.childLastName,
              birthDate: birth.birthDate,
              birthTime: birth.birthTime,
              gender: birth.gender,
              birthPlaceType: birth.birthPlaceType,
              birthPlaceName: birth.birthPlaceName,
              birthAddress: birth.birthAddress,
              birthDepartment: birth.birthDepartment,
              motherFirstNames: birth.motherFirstNames || [],
              motherLastName: birth.motherLastName,
              motherProfession: birth.motherProfession,
              motherAddress: birth.motherAddress,
              fatherFirstNames: birth.fatherFirstNames,
              fatherLastName: birth.fatherLastName,
              fatherProfession: birth.fatherProfession,
              fatherAddress: birth.fatherAddress,
              witness1FirstNames: birth.witness1FirstNames,
              witness1LastName: birth.witness1LastName,
              witness1Address: birth.witness1Address,
              witness2FirstNames: birth.witness2FirstNames,
              witness2LastName: birth.witness2LastName,
              witness2Address: birth.witness2Address,
              pregnancyId: birth.pregnancyId,
            },
          });
        }
      }

      setAllRecordsForCounts(allRecords);
    } catch (error) {
      if (__DEV__) console.error('Error loading all records for counts:', error);
      // Ne pas afficher d'alerte pour cette fonction, c'est juste pour les compteurs
    }
  };

  // Données simulées avec détails complets (fallback si pas de données)
  const mockRecords: ValidationRecord[] = [
    {
      id: '1',
      type: 'pregnancy',
      referenceNumber: 'PR-2025-001',
      date: '2025-01-28',
      recordedBy: 'Agent Jean Paul',
      recordedByType: 'agent',
      motherName: 'Marie Jean',
      status: 'pending',
      details: {
        motherFirstNames: ['Marie', 'Sophie'],
        motherLastName: 'Jean',
        motherBirthDate: '1990-05-15',
        motherPhone: '+509 1234-5678',
        motherPhoneAlt: '+509 8765-4321',
        motherAddress: '123 Rue de la Paix',
        motherCity: 'Port-au-Prince',
        motherDepartment: 'OU',
        motherBloodGroup: 'A+',
        estimatedDeliveryDate: '2025-09-15',
        pregnancyCount: '2',
        healthCondition: 'Bonne santé',
        notes: 'Suivi médical régulier',
      },
    },
    {
      id: '2',
      type: 'birth',
      referenceNumber: 'INPR-2025-001',
      date: '2025-01-28',
      recordedBy: 'Hôpital Général',
      recordedByType: 'hospital',
      childName: 'Sophie Laurent',
      motherName: 'Marie Jean',
      fatherName: 'Pierre Jean',
      status: 'pending',
      details: {
        childFirstNames: ['Sophie', 'Anne'],
        childLastName: 'Laurent',
        birthDate: '2025-01-28',
        birthTime: '14:30',
        gender: 'female',
        birthPlaceType: 'hospital',
        birthPlaceName: 'Hôpital Général de Port-au-Prince',
        birthAddress: 'Avenue John Brown',
        birthDepartment: 'OU',
        motherFirstNames: ['Marie', 'Sophie'],
        motherLastName: 'Jean',
        motherProfession: 'Enseignante',
        motherAddress: '123 Rue de la Paix, Port-au-Prince',
        fatherFirstNames: ['Pierre'],
        fatherLastName: 'Jean',
        fatherProfession: 'Ingénieur',
        fatherAddress: '123 Rue de la Paix, Port-au-Prince',
        witness1FirstNames: ['Jean'],
        witness1LastName: 'Dupont',
        witness1Address: '456 Avenue des Champs',
        witness2FirstNames: ['Marie'],
        witness2LastName: 'Martin',
        witness2Address: '789 Rue du Commerce',
        pregnancyId: 'PR-2024-050',
      },
    },
    {
      id: '3',
      type: 'pregnancy',
      referenceNumber: 'PR-2025-002',
      date: '2025-01-27',
      recordedBy: 'Agent Marie Joseph',
      recordedByType: 'agent',
      motherName: 'Claire Martin',
      status: 'validated',
      details: {
        motherFirstNames: ['Claire'],
        motherLastName: 'Martin',
        motherBirthDate: '1992-08-20',
        motherPhone: '+509 2345-6789',
        motherAddress: '456 Avenue Liberté',
        motherCity: 'Cap-Haïtien',
        motherDepartment: 'NO',
        motherBloodGroup: 'B+',
        estimatedDeliveryMonth: '2025-10',
        pregnancyCount: '1',
      },
    },
    {
      id: '4',
      type: 'birth',
      referenceNumber: 'INPR-2025-002',
      date: '2025-01-27',
      recordedBy: 'Hôpital St. Joseph',
      recordedByType: 'hospital',
      childName: 'Luc Martin',
      motherName: 'Claire Martin',
      fatherName: 'Marc Martin',
      status: 'rejected',
      rejectionReason: 'Informations incomplètes',
      details: {
        childFirstNames: ['Luc'],
        childLastName: 'Martin',
        birthDate: '2025-01-27',
        birthTime: '08:15',
        gender: 'male',
        birthPlaceType: 'hospital',
        birthPlaceName: 'Hôpital St. Joseph',
        birthAddress: 'Rue du Centre',
        birthDepartment: 'NO',
        motherFirstNames: ['Claire'],
        motherLastName: 'Martin',
        motherProfession: 'Infirmière',
        motherAddress: '456 Avenue Liberté',
        fatherFirstNames: ['Marc'],
        fatherLastName: 'Martin',
        fatherProfession: 'Médecin',
        fatherAddress: '456 Avenue Liberté',
        witness1FirstNames: ['Paul'],
        witness1LastName: 'Simon',
        witness1Address: '789 Rue Principale',
        witness2FirstNames: ['Julie'],
        witness2LastName: 'Bernard',
        witness2Address: '321 Boulevard République',
      },
    },
    {
      id: '5',
      type: 'pregnancy',
      referenceNumber: 'PR-2025-003',
      date: '2025-01-26',
      recordedBy: 'Dr. Pierre Laurent',
      recordedByType: 'admin',
      motherName: 'Isabelle Rose',
      status: 'validated',
      details: {
        motherFirstNames: ['Isabelle', 'Rose'],
        motherLastName: 'Laurent',
        motherBirthDate: '1988-12-10',
        motherPhone: '+509 3456-7890',
        motherAddress: '789 Rue de l\'Église',
        motherCity: 'Gonaïves',
        motherDepartment: 'AR',
        motherBloodGroup: 'O+',
        estimatedDeliveryDate: '2025-08-20',
        pregnancyCount: '3',
        healthCondition: 'Hypertension légère',
      },
    },
  ];

  // Fonction pour vérifier si une date est dans la période
  const isDateInPeriod = (dateString: string, period: PeriodFilter): boolean => {
    if (period === 'all') return true;
    
    const recordDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (period) {
      case 'today':
        return recordDate.toDateString() === today.toDateString();
      case 'thisWeek':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return recordDate >= weekStart;
      case 'thisMonth':
        return recordDate.getMonth() === today.getMonth() && 
               recordDate.getFullYear() === today.getFullYear();
      default:
        return true;
    }
  };

  const filteredRecords = (records.length > 0 ? records : mockRecords).filter(record => {
    const matchesTab = record.status === activeTab;
    const matchesType = recordTypeFilter === 'all' || record.type === recordTypeFilter;
    const matchesPeriod = isDateInPeriod(record.date, periodFilter);
    const matchesSearch = 
      record.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.motherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.childName && record.childName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      record.recordedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesType && matchesPeriod && matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Utiliser allRecordsForCounts pour les compteurs (tous les statuts)
  const pendingCount = (allRecordsForCounts.length > 0 ? allRecordsForCounts : mockRecords).filter(r => r.status === 'pending').length;
  const validatedCount = (allRecordsForCounts.length > 0 ? allRecordsForCounts : mockRecords).filter(r => r.status === 'validated').length;
  const rejectedCount = (allRecordsForCounts.length > 0 ? allRecordsForCounts : mockRecords).filter(r => r.status === 'rejected').length;

  const handleBack = () => {
    router.back();
  };

  const handleValidate = async (record: ValidationRecord) => {
    Alert.alert(
      t('admin.validation.validateTitle') || 'Valider l\'enregistrement',
      t('admin.validation.validateMessage') || `Voulez-vous valider l'enregistrement ${record.referenceNumber} ?`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel' as const,
        },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              const firestoreId = record.id;
              await validateRecord(record.type, firestoreId, user?.email);
              Alert.alert(t('common.success'), t('admin.validation.validated') || 'Enregistrement validé avec succès');
              // Recharger les données
              await Promise.all([loadRecords(), loadAllRecordsForCounts()]);
            } catch (error: any) {
              if (__DEV__) console.error('Error validating record:', error);
              Alert.alert(t('common.error'), error.message || t('admin.validation.validateError') || 'Erreur lors de la validation');
            }
          },
        },
      ]
    );
  };

  const handleReject = (record: ValidationRecord) => {
    setSelectedRecord(record);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRecord) return;
    
    if (!rejectionReason.trim()) {
      Alert.alert(t('common.error'), t('admin.validation.rejectionReasonRequired') || 'Veuillez indiquer la raison du rejet');
      return;
    }

    try {
      const firestoreId = selectedRecord.id;
      await rejectRecord(selectedRecord.type, firestoreId, rejectionReason, user?.email);
      Alert.alert(t('common.success'), t('admin.validation.rejected') || 'Enregistrement rejeté');
      setShowRejectModal(false);
      setSelectedRecord(null);
      setRejectionReason('');
      // Recharger les données
      await Promise.all([loadRecords(), loadAllRecordsForCounts()]);
    } catch (error: any) {
      if (__DEV__) console.error('Error rejecting record:', error);
      Alert.alert(t('common.error'), error.message || t('admin.validation.rejectError') || 'Erreur lors du rejet');
    }
  };

  const handleViewDetails = (record: ValidationRecord) => {
    setRecordForDetails(record);
    setShowDetailsModal(true);
  };

  const handleToggleSelection = (recordId: string) => {
    const newSelection = new Set(selectedRecords);
    if (newSelection.has(recordId)) {
      newSelection.delete(recordId);
    } else {
      newSelection.add(recordId);
    }
    setSelectedRecords(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedRecords.size === filteredRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleBulkValidate = async () => {
    if (selectedRecords.size === 0) {
      Alert.alert(t('common.error'), t('admin.validation.selectRecords') || 'Veuillez sélectionner au moins un enregistrement');
      return;
    }

    Alert.alert(
      t('admin.validation.bulkValidateTitle') || 'Valider en masse',
      t('admin.validation.bulkValidateMessage') || `Voulez-vous valider ${selectedRecords.size} enregistrement(s) ?`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel' as const,
        },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              // Grouper par type
              const pregnancyIds: string[] = [];
              const birthIds: string[] = [];
              
              for (const recordId of selectedRecords) {
                const record = filteredRecords.find(r => r.id === recordId);
                if (record) {
                  if (record.type === 'pregnancy') {
                    pregnancyIds.push(record.id);
                  } else {
                    birthIds.push(record.id);
                  }
                }
              }

              // Valider par type
              if (pregnancyIds.length > 0) {
                await validateRecordsBulk('pregnancy', pregnancyIds, user?.email);
              }
              if (birthIds.length > 0) {
                await validateRecordsBulk('birth', birthIds, user?.email);
              }

              Alert.alert(t('common.success'), t('admin.validation.bulkValidated') || 'Enregistrements validés avec succès');
              setSelectedRecords(new Set());
              // Recharger les données
              await Promise.all([loadRecords(), loadAllRecordsForCounts()]);
            } catch (error: any) {
              if (__DEV__) console.error('Error bulk validating:', error);
              Alert.alert(t('common.error'), error.message || t('admin.validation.bulkValidateError') || 'Erreur lors de la validation en masse');
            }
          },
        },
      ]
    );
  };

  const getRecordIcon = (type: 'pregnancy' | 'birth') => {
    return type === 'pregnancy' ? 'heart' : 'child';
  };

  const getRecordColor = (type: 'pregnancy' | 'birth') => {
    return type === 'pregnancy' ? theme.colors.success : theme.colors.primary;
  };

  const getStatusColor = (status: ValidationRecord['status']) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'validated':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getDepartmentName = (code?: string) => {
    if (!code) return '-';
    const dept = HAITIAN_DEPARTMENTS.find(d => d.code === code);
    return dept ? (language === 'ht' ? dept.nameKr : dept.name) : code;
  };

  const getGenderLabel = (gender?: 'male' | 'female') => {
    if (!gender) return '-';
    return gender === 'male' 
      ? (t('admin.validation.male') || 'Masculin')
      : (t('admin.validation.female') || 'Féminin');
  };

  const getBirthPlaceTypeLabel = (type?: string) => {
    if (!type) return '-';
    const types: Record<string, { fr: string; ht: string }> = {
      hospital: { fr: 'Hôpital', ht: 'Ospital' },
      home: { fr: 'À la maison', ht: 'Lakay' },
      other: { fr: 'Autre', ht: 'Lòt' },
    };
    const label = types[type] || { fr: type, ht: type };
    return language === 'ht' ? label.ht : label.fr;
  };

  const formatNames = (firstNames?: string[], lastName?: string) => {
    if (!firstNames || firstNames.length === 0) return lastName || '-';
    if (!lastName) return firstNames.join(' ');
    return `${firstNames.join(' ')} ${lastName}`;
  };

  const renderRecord = ({ item }: { item: ValidationRecord }) => {
    const isSelected = selectedRecords.has(item.id);
    
    return (
    <ThemedCard style={StyleSheet.flatten([
      styles.recordCard,
      isSelected && { borderWidth: 2, borderColor: theme.colors.primary }
    ])}>
      <ThemedView variant="transparent" style={styles.recordHeader}>
        {activeTab === 'pending' && (
          <Pressable
            onPress={() => handleToggleSelection(item.id)}
            style={({ pressed }) => [
              styles.checkbox,
              pressed && { opacity: 0.7 }
            ]}
          >
            <FontAwesome 
              name={isSelected ? 'check-square' : 'square-o'} 
              size={20} 
              color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </Pressable>
        )}
        <ThemedView 
          variant="transparent" 
          style={StyleSheet.flatten([
            styles.recordIconContainer,
            { backgroundColor: getRecordColor(item.type) + '20' }
          ])}
        >
          <FontAwesome 
            name={getRecordIcon(item.type)} 
            size={isTablet ? 28 : 24} 
            color={getRecordColor(item.type)} 
          />
        </ThemedView>
        <ThemedView variant="transparent" style={styles.recordInfo}>
          <ThemedText size="base" weight="semibold">
            {item.type === 'birth' && item.childName ? item.childName : item.motherName}
          </ThemedText>
          <ThemedText variant="secondary" size="sm">
            {item.referenceNumber}
          </ThemedText>
          <ThemedView variant="transparent" style={styles.recordMeta}>
            <FontAwesome name="calendar" size={10} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" size="xs">
              {item.date}
            </ThemedText>
            <FontAwesome name="user" size={10} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
            <ThemedText variant="secondary" size="xs">
              {item.recordedBy}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {item.status === 'rejected' && item.rejectionReason && (
        <ThemedView 
          variant="transparent" 
          style={StyleSheet.flatten([
            styles.rejectionReason,
            { backgroundColor: theme.colors.error + '10' }
          ])}
        >
          <ThemedText size="sm" style={{ color: theme.colors.error }}>
            {t('admin.validation.rejectionReason')}: {item.rejectionReason}
          </ThemedText>
        </ThemedView>
      )}

      {activeTab === 'pending' && (
        <ThemedView variant="transparent" style={styles.recordActions}>
          <Pressable
            onPress={() => handleReject(item)}
            style={({ pressed }) => [
              styles.actionIconButton,
              { borderColor: theme.colors.error },
              pressed && { opacity: 0.7 }
            ]}
          >
            <FontAwesome name="times" size={18} color={theme.colors.error} />
          </Pressable>
          <Pressable
            onPress={() => handleViewDetails(item)}
            style={({ pressed }) => [
              styles.actionIconButton,
              { borderColor: theme.colors.primary },
              pressed && { opacity: 0.7 }
            ]}
          >
            <FontAwesome name="eye" size={18} color={theme.colors.primary} />
          </Pressable>
          <PressableButton
            onPress={() => handleValidate(item)}
            label={t('admin.validation.validate') || 'Valider'}
            variant="primary"
            size="sm"
            icon="check"
            style={styles.actionButtonPrimary}
          />
        </ThemedView>
      )}
    </ThemedCard>
    );
  };

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
            {t('admin.validation.title') || 'Validation'}
          </ThemedText>
          <ThemedText size="sm" style={StyleSheet.flatten([styles.headerSubtitle, { color: '#fff' }])}>
            {t('admin.validation.subtitle') || 'Valider ou rejeter les enregistrements'}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={isTablet && styles.scrollContentTablet}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques rapides - Version simplifiée */}
        <ThemedCard style={styles.summaryCard}>
          <ThemedView variant="transparent" style={styles.summaryStats}>
            <ThemedView variant="transparent" style={styles.summaryStatItem}>
              <FontAwesome name="clock-o" size={18} color={theme.colors.warning} />
              <ThemedText size="lg" weight="bold" style={{ color: theme.colors.warning, marginLeft: 6 }}>
                {pendingCount}
              </ThemedText>
              <ThemedText variant="secondary" size="xs" style={{ marginLeft: 4 }}>
                {t('admin.validation.pending') || 'En Attente'}
              </ThemedText>
            </ThemedView>
            <ThemedView variant="transparent" style={styles.summaryStatItem}>
              <FontAwesome name="check-circle" size={18} color={theme.colors.success} />
              <ThemedText size="lg" weight="bold" style={{ color: theme.colors.success, marginLeft: 6 }}>
                {validatedCount}
              </ThemedText>
              <ThemedText variant="secondary" size="xs" style={{ marginLeft: 4 }}>
                {t('admin.validation.validated') || 'Validés'}
              </ThemedText>
            </ThemedView>
            <ThemedView variant="transparent" style={styles.summaryStatItem}>
              <FontAwesome name="times-circle" size={18} color={theme.colors.error} />
              <ThemedText size="lg" weight="bold" style={{ color: theme.colors.error, marginLeft: 6 }}>
                {rejectedCount}
              </ThemedText>
              <ThemedText variant="secondary" size="xs" style={{ marginLeft: 4 }}>
                {t('admin.validation.rejected') || 'Rejetés'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedCard>

        {/* Actions en masse pour l'onglet pending - Version simplifiée */}
        {activeTab === 'pending' && selectedRecords.size > 0 && (
          <ThemedView variant="transparent" style={styles.bulkActionsBar}>
            <ThemedText size="sm" weight="medium">
              {selectedRecords.size} {t('admin.validation.selected') || 'sélectionné(s)'}
            </ThemedText>
            <ThemedView variant="transparent" style={styles.bulkActionsButtons}>
              <Pressable
                onPress={handleSelectAll}
                style={({ pressed }) => [
                  styles.bulkActionIcon,
                  pressed && { opacity: 0.7 }
                ]}
              >
                <FontAwesome 
                  name={selectedRecords.size === filteredRecords.length ? 'square' : 'square-o'} 
                  size={20} 
                  color={theme.colors.primary} 
                />
              </Pressable>
              <PressableButton
                onPress={handleBulkValidate}
                label={t('admin.validation.validateSelected') || 'Valider'}
                variant="primary"
                size="sm"
                icon="check"
                style={styles.bulkActionButton}
              />
            </ThemedView>
          </ThemedView>
        )}

         {/* Filtres combinés - Une seule ligne */}
         <ThemedCard style={styles.filtersCard}>
           <ThemedView variant="transparent" style={styles.filtersRow}>
             {/* Dropdown Période */}
             <ThemedView variant="transparent" style={styles.filterDropdown}>
               <ThemedText size="xs" variant="secondary" style={styles.filterLabel}>
                 {t('admin.validation.period') || 'Période'}
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
                 onPress={() => setShowPeriodModal(true)}
               >
                 <ThemedText
                   size="sm"
                   weight="medium"
                   style={{
                     color: theme.colors.text,
                     flex: 1,
                   }}
                 >
                   {periodFilter === 'all' 
                     ? t('common.all') || 'Tous'
                     : periodFilter === 'today'
                     ? t('admin.dashboard.today') || 'Aujourd\'hui'
                     : periodFilter === 'thisWeek'
                     ? t('admin.dashboard.thisWeek') || 'Cette Semaine'
                     : t('admin.dashboard.thisMonth') || 'Ce Mois'}
                 </ThemedText>
                 <FontAwesome name="chevron-down" size={14} color={theme.colors.textSecondary} />
               </Pressable>
             </ThemedView>

             {/* Dropdown Catégorie */}
             <ThemedView variant="transparent" style={styles.filterDropdown}>
               <ThemedText size="xs" variant="secondary" style={styles.filterLabel}>
                 {t('admin.validation.category') || 'Catégorie'}
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
                 onPress={() => setShowTypeModal(true)}
               >
                 <ThemedText
                   size="sm"
                   weight="medium"
                   style={{
                     color: theme.colors.text,
                     flex: 1,
                   }}
                 >
                   {recordTypeFilter === 'all'
                     ? t('common.all') || 'Tous'
                     : recordTypeFilter === 'pregnancy'
                     ? t('common.pregnancy') || 'Grossesses'
                     : t('common.birth') || 'Naissances'}
                 </ThemedText>
                 <FontAwesome name="chevron-down" size={14} color={theme.colors.textSecondary} />
               </Pressable>
             </ThemedView>
           </ThemedView>
         </ThemedCard>

         {/* Modal Période */}
         <Modal
           visible={showPeriodModal}
           transparent
           animationType="fade"
           onRequestClose={() => setShowPeriodModal(false)}
         >
           <Pressable
             style={styles.modalOverlay}
             onPress={() => setShowPeriodModal(false)}
           >
             <View style={StyleSheet.flatten([styles.modalCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg }])} onStartShouldSetResponder={() => true}>
               <ThemedView variant="transparent" style={styles.modalHeader}>
                 <ThemedText size="base" weight="semibold">
                   {t('admin.validation.selectPeriod') || 'Sélectionner la période'}
                 </ThemedText>
                 <Pressable onPress={() => setShowPeriodModal(false)}>
                   <FontAwesome name="times" size={20} color={theme.colors.textSecondary} />
                 </Pressable>
               </ThemedView>
               <FlatList
                 data={[
                   { value: 'all', label: t('common.all') || 'Tous' },
                   { value: 'today', label: t('admin.dashboard.today') || 'Aujourd\'hui' },
                   { value: 'thisWeek', label: t('admin.dashboard.thisWeek') || 'Cette Semaine' },
                   { value: 'thisMonth', label: t('admin.dashboard.thisMonth') || 'Ce Mois' },
                 ]}
                 keyExtractor={(item) => item.value}
                 renderItem={({ item }) => (
                   <Pressable
                     style={({ pressed }) => [
                       styles.modalOption,
                       periodFilter === item.value && {
                         backgroundColor: theme.colors.primary + '20',
                       },
                       pressed && { opacity: 0.7 }
                     ]}
                     onPress={() => {
                       setPeriodFilter(item.value as PeriodFilter);
                       setShowPeriodModal(false);
                     }}
                   >
                     <ThemedText
                       size="base"
                       weight={periodFilter === item.value ? 'semibold' : 'normal'}
                       style={{
                         color: periodFilter === item.value ? theme.colors.primary : theme.colors.text,
                       }}
                     >
                       {item.label}
                     </ThemedText>
                     {periodFilter === item.value && (
                       <FontAwesome name="check" size={16} color={theme.colors.primary} />
                     )}
                   </Pressable>
                 )}
               />
             </View>
           </Pressable>
         </Modal>

         {/* Modal Catégorie */}
         <Modal
           visible={showTypeModal}
           transparent
           animationType="fade"
           onRequestClose={() => setShowTypeModal(false)}
         >
           <Pressable
             style={styles.modalOverlay}
             onPress={() => setShowTypeModal(false)}
           >
             <View style={StyleSheet.flatten([styles.modalCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg }])} onStartShouldSetResponder={() => true}>
               <ThemedView variant="transparent" style={styles.modalHeader}>
                 <ThemedText size="base" weight="semibold">
                   {t('admin.validation.selectCategory') || 'Sélectionner la catégorie'}
                 </ThemedText>
                 <Pressable onPress={() => setShowTypeModal(false)}>
                   <FontAwesome name="times" size={20} color={theme.colors.textSecondary} />
                 </Pressable>
               </ThemedView>
               <FlatList
                 data={[
                   { value: 'all', label: t('common.all') || 'Tous' },
                   { value: 'pregnancy', label: t('common.pregnancy') || 'Grossesses' },
                   { value: 'birth', label: t('common.birth') || 'Naissances' },
                 ]}
                 keyExtractor={(item) => item.value}
                 renderItem={({ item }) => (
                   <Pressable
                     style={({ pressed }) => [
                       styles.modalOption,
                       recordTypeFilter === item.value && {
                         backgroundColor: theme.colors.primary + '20',
                       },
                       pressed && { opacity: 0.7 }
                     ]}
                     onPress={() => {
                       setRecordTypeFilter(item.value as RecordType);
                       setShowTypeModal(false);
                     }}
                   >
                     <ThemedText
                       size="base"
                       weight={recordTypeFilter === item.value ? 'semibold' : 'normal'}
                       style={{
                         color: recordTypeFilter === item.value ? theme.colors.primary : theme.colors.text,
                       }}
                     >
                       {item.label}
                     </ThemedText>
                     {recordTypeFilter === item.value && (
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
              placeholder={t('admin.validation.searchPlaceholder') || 'Rechercher par référence, nom...'}
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

        {/* Tabs */}
        <ThemedView variant="transparent" style={styles.tabsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'pending' && {
                backgroundColor: theme.colors.warning + '15',
                borderBottomWidth: 2,
                borderBottomColor: theme.colors.warning,
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => setActiveTab('pending')}
          >
            <ThemedText
              size="base"
              weight={activeTab === 'pending' ? 'semibold' : 'normal'}
              style={{
                color: activeTab === 'pending' ? theme.colors.warning : theme.colors.textSecondary,
              }}
            >
              {t('admin.validation.pending') || 'En Attente'} ({pendingCount})
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'validated' && {
                backgroundColor: theme.colors.success + '15',
                borderBottomWidth: 2,
                borderBottomColor: theme.colors.success,
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => setActiveTab('validated')}
          >
            <ThemedText
              size="base"
              weight={activeTab === 'validated' ? 'semibold' : 'normal'}
              style={{
                color: activeTab === 'validated' ? theme.colors.success : theme.colors.textSecondary,
              }}
            >
              {t('admin.validation.validated') || 'Validés'} ({validatedCount})
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'rejected' && {
                backgroundColor: theme.colors.error + '15',
                borderBottomWidth: 2,
                borderBottomColor: theme.colors.error,
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => setActiveTab('rejected')}
          >
            <ThemedText
              size="base"
              weight={activeTab === 'rejected' ? 'semibold' : 'normal'}
              style={{
                color: activeTab === 'rejected' ? theme.colors.error : theme.colors.textSecondary,
              }}
            >
              {t('admin.validation.rejected') || 'Rejetés'} ({rejectedCount})
            </ThemedText>
          </Pressable>
        </ThemedView>

        {/* Liste des enregistrements */}
        {isLoading ? (
          <ThemedCard style={styles.emptyCard}>
            <ThemedView variant="transparent" style={styles.emptyContent}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <ThemedText variant="secondary" size="base" style={styles.emptyText}>
                {t('common.loading') || 'Chargement...'}
              </ThemedText>
            </ThemedView>
          </ThemedCard>
        ) : filteredRecords.length === 0 ? (
          <ThemedCard style={styles.emptyCard}>
            <ThemedView variant="transparent" style={styles.emptyContent}>
              <FontAwesome name="inbox" size={48} color={theme.colors.textSecondary} />
              <ThemedText variant="secondary" size="lg" weight="medium" style={styles.emptyText}>
                {t('admin.validation.noRecords') || 'Aucun enregistrement'}
              </ThemedText>
            </ThemedView>
          </ThemedCard>
        ) : (
          <FlatList
            data={filteredRecords}
            renderItem={renderRecord}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 } // SafeArea + espace supplémentaire
            ]}
          />
        )}
      </ScrollView>

      {/* Modal de détails complets */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDetailsModal(false)}
        >
          <View style={StyleSheet.flatten([styles.detailsModalContent, { backgroundColor: theme.colors.surface }])} onStartShouldSetResponder={() => true}>
            <ThemedView variant="transparent" style={styles.detailsModalHeader}>
              <ThemedView variant="transparent" style={styles.detailsModalHeaderLeft}>
                <ThemedView 
                  variant="transparent" 
                  style={StyleSheet.flatten([
                    styles.detailsModalIcon,
                    { backgroundColor: recordForDetails ? getRecordColor(recordForDetails.type) + '20' : theme.colors.primary + '20' }
                  ])}
                >
                  <FontAwesome 
                    name={recordForDetails ? getRecordIcon(recordForDetails.type) : 'file-text'} 
                    size={24} 
                    color={recordForDetails ? getRecordColor(recordForDetails.type) : theme.colors.primary} 
                  />
                </ThemedView>
                <ThemedView variant="transparent" style={styles.detailsModalHeaderText}>
                  <ThemedText size="lg" weight="bold">
                    {t('admin.validation.details') || 'Détails de l\'enregistrement'}
                  </ThemedText>
                  <ThemedText variant="secondary" size="sm">
                    {recordForDetails?.referenceNumber}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <Pressable
                onPress={() => setShowDetailsModal(false)}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <FontAwesome name="times" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </ThemedView>

            <ScrollView 
              style={styles.detailsModalScroll}
              showsVerticalScrollIndicator={true}
            >
              {recordForDetails && recordForDetails.details && (
                <>
                  {recordForDetails.type === 'pregnancy' ? (
                    <>
                      {/* Informations de la mère */}
                      <ThemedCard style={styles.detailsSection}>
                        <ThemedText size="base" weight="bold" style={styles.detailsSectionTitle}>
                          {t('admin.validation.motherInfo') || 'Informations de la mère'}
                        </ThemedText>
                        <ThemedView variant="transparent" style={styles.detailsGrid}>
                          <DetailRow 
                            label={t('admin.validation.name') || 'Nom complet'}
                            value={formatNames(recordForDetails.details.motherFirstNames, recordForDetails.details.motherLastName)}
                          />
                          <DetailRow 
                            label={t('admin.validation.birthDate') || 'Date de naissance'}
                            value={recordForDetails.details.motherBirthDate || '-'}
                          />
                          <DetailRow 
                            label={t('admin.validation.phone') || 'Téléphone'}
                            value={recordForDetails.details.motherPhone || '-'}
                          />
                          {recordForDetails.details.motherPhoneAlt && (
                            <DetailRow 
                              label={t('admin.validation.phoneAlt') || 'Téléphone alternatif'}
                              value={recordForDetails.details.motherPhoneAlt}
                            />
                          )}
                          <DetailRow 
                            label={t('admin.validation.address') || 'Adresse'}
                            value={recordForDetails.details.motherAddress || '-'}
                          />
                          <DetailRow 
                            label={t('admin.validation.city') || 'Commune/Ville'}
                            value={recordForDetails.details.motherCity || '-'}
                          />
                          <DetailRow 
                            label={t('admin.validation.department') || 'Département'}
                            value={getDepartmentName(recordForDetails.details.motherDepartment)}
                          />
                          {recordForDetails.details.motherBloodGroup && (
                            <DetailRow 
                              label={t('admin.validation.bloodGroup') || 'Groupe sanguin'}
                              value={recordForDetails.details.motherBloodGroup}
                            />
                          )}
                        </ThemedView>
                      </ThemedCard>

                      {/* Informations de grossesse */}
                      <ThemedCard style={styles.detailsSection}>
                        <ThemedText size="base" weight="bold" style={styles.detailsSectionTitle}>
                          {t('admin.validation.pregnancyInfo') || 'Informations de grossesse'}
                        </ThemedText>
                        <ThemedView variant="transparent" style={styles.detailsGrid}>
                          {recordForDetails.details.estimatedDeliveryDate && (
                            <DetailRow 
                              label={t('admin.validation.estimatedDeliveryDate') || 'Date prévue d\'accouchement'}
                              value={recordForDetails.details.estimatedDeliveryDate}
                            />
                          )}
                          {recordForDetails.details.estimatedDeliveryMonth && (
                            <DetailRow 
                              label={t('admin.validation.estimatedDeliveryMonth') || 'Mois prévu'}
                              value={recordForDetails.details.estimatedDeliveryMonth}
                            />
                          )}
                          <DetailRow 
                            label={t('admin.validation.pregnancyCount') || 'Nombre de grossesses'}
                            value={recordForDetails.details.pregnancyCount || '-'}
                          />
                          {recordForDetails.details.healthCondition && (
                            <DetailRow 
                              label={t('admin.validation.healthCondition') || 'Condition de santé'}
                              value={recordForDetails.details.healthCondition}
                            />
                          )}
                          {recordForDetails.details.notes && (
                            <DetailRow 
                              label={t('admin.validation.notes') || 'Notes'}
                              value={recordForDetails.details.notes}
                            />
                          )}
                        </ThemedView>
                      </ThemedCard>
                    </>
                  ) : (
                    <>
                      {/* Informations de l'enfant */}
                      <ThemedCard style={styles.detailsSection}>
                        <ThemedText size="base" weight="bold" style={styles.detailsSectionTitle}>
                          {t('admin.validation.childInfo') || 'Informations de l\'enfant'}
                        </ThemedText>
                        <ThemedView variant="transparent" style={styles.detailsGrid}>
                          <DetailRow 
                            label={t('admin.validation.name') || 'Nom complet'}
                            value={formatNames(recordForDetails.details.childFirstNames, recordForDetails.details.childLastName)}
                          />
                          <DetailRow 
                            label={t('admin.validation.birthDate') || 'Date de naissance'}
                            value={recordForDetails.details.birthDate || '-'}
                          />
                          <DetailRow 
                            label={t('admin.validation.birthTime') || 'Heure de naissance'}
                            value={recordForDetails.details.birthTime || '-'}
                          />
                          <DetailRow 
                            label={t('admin.validation.gender') || 'Sexe'}
                            value={getGenderLabel(recordForDetails.details.gender)}
                          />
                          <DetailRow 
                            label={t('admin.validation.birthPlaceType') || 'Type de lieu'}
                            value={getBirthPlaceTypeLabel(recordForDetails.details.birthPlaceType)}
                          />
                          <DetailRow 
                            label={t('admin.validation.birthPlaceName') || 'Nom du lieu'}
                            value={recordForDetails.details.birthPlaceName || '-'}
                          />
                          <DetailRow 
                            label={t('admin.validation.birthAddress') || 'Adresse du lieu'}
                            value={recordForDetails.details.birthAddress || '-'}
                          />
                          <DetailRow 
                            label={t('admin.validation.department') || 'Département'}
                            value={getDepartmentName(recordForDetails.details.birthDepartment)}
                          />
                          {recordForDetails.details.pregnancyId && (
                            <DetailRow 
                              label={t('admin.validation.pregnancyId') || 'ID Grossesse associée'}
                              value={recordForDetails.details.pregnancyId}
                            />
                          )}
                        </ThemedView>
                      </ThemedCard>

                      {/* Informations de la mère */}
                      <ThemedCard style={styles.detailsSection}>
                        <ThemedText size="base" weight="bold" style={styles.detailsSectionTitle}>
                          {t('admin.validation.motherInfo') || 'Informations de la mère'}
                        </ThemedText>
                        <ThemedView variant="transparent" style={styles.detailsGrid}>
                          <DetailRow 
                            label={t('admin.validation.name') || 'Nom complet'}
                            value={formatNames(recordForDetails.details.motherFirstNames, recordForDetails.details.motherLastName)}
                          />
                          <DetailRow 
                            label={t('admin.validation.profession') || 'Profession'}
                            value={recordForDetails.details.motherProfession || '-'}
                          />
                          <DetailRow 
                            label={t('admin.validation.address') || 'Adresse'}
                            value={recordForDetails.details.motherAddress || '-'}
                          />
                        </ThemedView>
                      </ThemedCard>

                      {/* Informations du père */}
                      {(recordForDetails.details.fatherLastName || recordForDetails.details.fatherFirstNames) && (
                        <ThemedCard style={styles.detailsSection}>
                          <ThemedText size="base" weight="bold" style={styles.detailsSectionTitle}>
                            {t('admin.validation.fatherInfo') || 'Informations du père'}
                          </ThemedText>
                          <ThemedView variant="transparent" style={styles.detailsGrid}>
                            <DetailRow 
                              label={t('admin.validation.name') || 'Nom complet'}
                              value={formatNames(recordForDetails.details.fatherFirstNames, recordForDetails.details.fatherLastName)}
                            />
                            {recordForDetails.details.fatherProfession && (
                              <DetailRow 
                                label={t('admin.validation.profession') || 'Profession'}
                                value={recordForDetails.details.fatherProfession}
                              />
                            )}
                            {recordForDetails.details.fatherAddress && (
                              <DetailRow 
                                label={t('admin.validation.address') || 'Adresse'}
                                value={recordForDetails.details.fatherAddress}
                              />
                            )}
                          </ThemedView>
                        </ThemedCard>
                      )}

                      {/* Informations des témoins */}
                      <ThemedCard style={styles.detailsSection}>
                        <ThemedText size="base" weight="bold" style={styles.detailsSectionTitle}>
                          {t('admin.validation.witnessesInfo') || 'Informations des témoins'}
                        </ThemedText>
                        <ThemedView variant="transparent" style={styles.detailsGrid}>
                          <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.witnessTitle, { color: theme.colors.primary }])}>
                            {t('admin.validation.witness1') || 'Témoin 1'}
                          </ThemedText>
                          <DetailRow 
                            label={t('admin.validation.name') || 'Nom complet'}
                            value={formatNames(recordForDetails.details.witness1FirstNames, recordForDetails.details.witness1LastName)}
                          />
                          <DetailRow 
                            label={t('admin.validation.address') || 'Adresse'}
                            value={recordForDetails.details.witness1Address || '-'}
                          />
                          
                          <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.witnessTitle, { marginTop: 12, color: theme.colors.primary }])}>
                            {t('admin.validation.witness2') || 'Témoin 2'}
                          </ThemedText>
                          <DetailRow 
                            label={t('admin.validation.name') || 'Nom complet'}
                            value={formatNames(recordForDetails.details.witness2FirstNames, recordForDetails.details.witness2LastName)}
                          />
                          <DetailRow 
                            label={t('admin.validation.address') || 'Adresse'}
                            value={recordForDetails.details.witness2Address || '-'}
                          />
                        </ThemedView>
                      </ThemedCard>
                    </>
                  )}

                  {/* Informations d'enregistrement */}
                  <ThemedCard style={styles.detailsSection}>
                    <ThemedText size="base" weight="bold" style={styles.detailsSectionTitle}>
                      {t('admin.validation.recordInfo') || 'Informations d\'enregistrement'}
                    </ThemedText>
                    <ThemedView variant="transparent" style={styles.detailsGrid}>
                      <DetailRow 
                        label={t('admin.validation.reference') || 'Référence'}
                        value={recordForDetails.referenceNumber}
                      />
                      <DetailRow 
                        label={t('admin.validation.date') || 'Date d\'enregistrement'}
                        value={recordForDetails.date}
                      />
                      <DetailRow 
                        label={t('admin.validation.recordedBy') || 'Enregistré par'}
                        value={recordForDetails.recordedBy}
                      />
                      <DetailRow 
                        label={t('admin.validation.recordedByType') || 'Type'}
                        value={
                          recordForDetails.recordedByType === 'agent' 
                            ? (t('roles.agent') || 'Agent')
                            : recordForDetails.recordedByType === 'hospital'
                            ? (t('roles.hospital') || 'Hôpital')
                            : (t('roles.admin') || 'Administrateur')
                        }
                      />
                    </ThemedView>
                  </ThemedCard>
                </>
              )}

              {recordForDetails && !recordForDetails.details && (
                <ThemedCard style={styles.detailsSection}>
                  <ThemedView variant="transparent" style={styles.emptyDetails}>
                    <FontAwesome name="info-circle" size={32} color={theme.colors.textSecondary} />
                    <ThemedText variant="secondary" size="base" style={styles.emptyDetailsText}>
                      {t('admin.validation.noDetails') || 'Aucun détail disponible pour cet enregistrement'}
                    </ThemedText>
                  </ThemedView>
                </ThemedCard>
              )}
            </ScrollView>

            {/* Actions */}
            {recordForDetails && recordForDetails.status === 'pending' && (
              <ThemedView variant="transparent" style={styles.detailsModalActions}>
                <PressableButton
                  onPress={() => {
                    setShowDetailsModal(false);
                    handleReject(recordForDetails);
                  }}
                  label={t('admin.validation.reject') || 'Rejeter'}
                  variant="outline"
                  style={StyleSheet.flatten([styles.detailsActionButton, { borderColor: theme.colors.error }])}
                  labelStyle={{ color: theme.colors.error }}
                />
                <PressableButton
                  onPress={() => {
                    setShowDetailsModal(false);
                    handleValidate(recordForDetails);
                  }}
                  label={t('admin.validation.validate') || 'Valider'}
                  variant="primary"
                  style={styles.detailsActionButton}
                />
              </ThemedView>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Modal de rejet */}
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowRejectModal(false)}
        >
          <ThemedView style={StyleSheet.flatten([styles.modalContent, { backgroundColor: theme.colors.surface }])}>
            <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
              {t('admin.validation.rejectTitle') || 'Rejeter l\'enregistrement'}
            </ThemedText>
            <ThemedText variant="secondary" size="sm" style={styles.modalSubtitle}>
              {t('admin.validation.rejectMessage') || 'Veuillez indiquer la raison du rejet'}
            </ThemedText>
            <RNTextInput
              style={StyleSheet.flatten([
                styles.rejectionInput,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                }
              ])}
              placeholder={t('admin.validation.rejectionReasonPlaceholder') || 'Raison du rejet...'}
              placeholderTextColor={theme.colors.textSecondary}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
            />
            <ThemedView variant="transparent" style={styles.modalActions}>
              <PressableButton
                onPress={() => setShowRejectModal(false)}
                label={t('common.cancel')}
                variant="outline"
                style={styles.modalButton}
              />
              <PressableButton
                onPress={handleRejectConfirm}
                label={t('admin.validation.confirmReject') || 'Confirmer le Rejet'}
                variant="primary"
                style={StyleSheet.flatten([styles.modalButton, { backgroundColor: theme.colors.error }])}
              />
            </ThemedView>
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
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  scrollContentTablet: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  summaryCard: {
    marginBottom: 16,
    padding: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  bulkActionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  bulkActionButton: {
    minWidth: 120,
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
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  listContent: {
    gap: 12,
  },
  recordCard: {
    marginBottom: 12,
    padding: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    padding: 4,
  },
  recordIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  recordParents: {
    marginTop: 6,
  },
  recordDetails: {
    marginTop: 8,
    gap: 4,
  },
  rejectionReason: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
  },
  actionButtonPrimary: {
    flex: 1,
    minWidth: 100,
  },
  bulkActionIcon: {
    padding: 8,
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
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    marginBottom: 8,
  },
  modalSubtitle: {
    marginBottom: 16,
  },
  rejectionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  detailsModalContent: {
    borderRadius: 16,
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailsModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailsModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsModalHeaderText: {
    flex: 1,
  },
  detailsModalScroll: {
    maxHeight: 400,
  },
  detailsSection: {
    marginBottom: 12,
    padding: 16,
  },
  detailsSectionTitle: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    marginBottom: 2,
  },
  detailValue: {
    // No specific styles needed
  },
  witnessTitle: {
    marginTop: 8,
    marginBottom: 8,
  },
  emptyDetails: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyDetailsText: {
    textAlign: 'center',
  },
  detailsModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailsActionButton: {
    flex: 1,
  },
});

// Composant helper pour afficher une ligne de détail
function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  
  return (
    <ThemedView variant="transparent" style={styles.detailRow}>
      <ThemedText variant="secondary" size="sm" style={styles.detailLabel}>
        {label}
      </ThemedText>
      <ThemedText size="base" weight="medium" style={styles.detailValue}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

