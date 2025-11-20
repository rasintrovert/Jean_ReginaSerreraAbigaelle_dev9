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
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { FlatList, Pressable, Text as RNText, TextInput as RNTextInput, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRecordsForValidation } from '@/services/admin/adminService';
import { formatDateSafe } from '@/utils/date';
import { useAuthStore } from '@/store/authStore';

type TabType = 'all' | 'pregnancy' | 'birth';
type PeriodFilter = 'thisWeek' | 'thisMonth' | 'lastMonth';

interface Record {
  id: string;
  firestoreId?: string;
  type: 'pregnancy' | 'birth';
  referenceNumber: string;
  date: string;
  recordedBy: string;
  recordedByTitle: string;
  childName?: string;
  motherName?: string;
  fatherName?: string;
  createdAt?: any;
}

export default function HospitalHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('thisWeek');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<Record[]>([]);

  // Charger les enregistrements validés depuis Firestore
  useEffect(() => {
    loadRecords();
  }, [periodFilter]);

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const [allPregnancies, allBirths] = await Promise.all([
        getRecordsForValidation('pregnancy'),
        getRecordsForValidation('birth'),
      ]);

      // Filtrer uniquement les enregistrements validés ET créés par l'hôpital
      const validatedPregnancies = allPregnancies.filter(
        (r: any) => r.validationStatus === 'validated' && r.recordedByType === 'hospital'
      );
      const validatedBirths = allBirths.filter(
        (r: any) => r.validationStatus === 'validated' && r.recordedByType === 'hospital'
      );

      // Transformer les grossesses en format Record
      const pregnancyRecords: Record[] = validatedPregnancies.map((p: any) => {
        const motherName = p.motherFirstNames && p.motherLastName
          ? [...p.motherFirstNames, p.motherLastName].join(' ')
          : p.motherName || 'N/A';
        
        const recordedBy = p.recordedBy || 'Agent';
        const recordedByTitle = p.recordedByType === 'hospital' ? 'Hôpital' : 
                                p.recordedByType === 'admin' ? 'Admin' : 'Agent';

        // Gérer les différents formats de date (Timestamp Firestore, string ISO, Date)
        let createdAt: Date;
        if (p.createdAt?.toDate) {
          createdAt = p.createdAt.toDate();
        } else if (typeof p.createdAt === 'string') {
          createdAt = new Date(p.createdAt);
        } else if (p.createdAt instanceof Date) {
          createdAt = p.createdAt;
        } else {
          createdAt = new Date();
        }
        
        return {
          id: p.id || p.firestoreId || '',
          firestoreId: p.firestoreId || p.id,
          type: 'pregnancy' as const,
          referenceNumber: `PR-${createdAt.getFullYear()}-${String(p.id || '').slice(-6).padStart(6, '0')}`,
          date: formatDateSafe(createdAt, 'yyyy-MM-dd') || createdAt.toISOString().split('T')[0],
          recordedBy,
          recordedByTitle,
          motherName,
          createdAt,
        };
      });

      // Transformer les naissances en format Record
      const birthRecords: Record[] = validatedBirths.map((b: any) => {
        const childName = b.childFirstNames && b.childLastName
          ? [...b.childFirstNames, b.childLastName].join(' ')
          : b.childName || 'N/A';
        
        const motherName = b.motherFirstNames && b.motherLastName
          ? [...b.motherFirstNames, b.motherLastName].join(' ')
          : b.motherName || 'N/A';
        
        const fatherName = b.fatherFirstNames && b.fatherLastName
          ? [...b.fatherFirstNames, b.fatherLastName].join(' ')
          : b.fatherName || undefined;

        const recordedBy = b.recordedBy || 'Agent';
        const recordedByTitle = b.recordedByType === 'hospital' ? 'Hôpital' : 
                                b.recordedByType === 'admin' ? 'Admin' : 'Agent';

        // Gérer les différents formats de date (Timestamp Firestore, string ISO, Date)
        let createdAt: Date;
        if (b.createdAt?.toDate) {
          createdAt = b.createdAt.toDate();
        } else if (typeof b.createdAt === 'string') {
          createdAt = new Date(b.createdAt);
        } else if (b.createdAt instanceof Date) {
          createdAt = b.createdAt;
        } else {
          createdAt = new Date();
        }
        
        return {
          id: b.id || b.firestoreId || '',
          firestoreId: b.firestoreId || b.id,
          type: 'birth' as const,
          referenceNumber: `INPR-${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}-${String(b.id || '').slice(-3).padStart(3, '0')}`,
          date: formatDateSafe(createdAt, 'yyyy-MM-dd') || createdAt.toISOString().split('T')[0],
          recordedBy,
          recordedByTitle,
          childName,
          motherName,
          fatherName,
          createdAt,
        };
      });

      // Combiner et trier par date (plus récent en premier)
      const allRecords = [...pregnancyRecords, ...birthRecords].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      // Appliquer le filtre de période
      const now = new Date();
      let periodStart: Date;
      
      switch (periodFilter) {
        case 'thisWeek':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'thisMonth':
          periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'lastMonth':
          periodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
          const lastMonthEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const filtered = allRecords.filter(r => {
            const recordDate = r.createdAt ? new Date(r.createdAt) : new Date(0);
            return recordDate >= periodStart && recordDate < lastMonthEnd;
          });
          setRecords(filtered);
          return;
        default:
          setRecords(allRecords);
          return;
      }

      const filtered = allRecords.filter(r => {
        const recordDate = r.createdAt ? new Date(r.createdAt) : new Date(0);
        return recordDate >= periodStart;
      });

      setRecords(filtered);
    } catch (error) {
      console.error('Error loading hospital history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchQuery === '' || 
      record.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.motherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.childName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || record.type === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const pregnancyRecords = filteredRecords.filter(r => r.type === 'pregnancy');
  const birthRecords = filteredRecords.filter(r => r.type === 'birth');
  const totalCount = filteredRecords.length;

  const formatDate = (dateString: string) => {
    try {
      const date = parse(dateString, 'yyyy-MM-dd', new Date());
      // Utiliser le format avec fr pour les deux langues
      // Pour le créole, on pourrait adapter le format si nécessaire
      return format(date, 'd MMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Types pour FlatList avec sections
  type ListItem = 
    | { type: 'section-header'; title: string; id: string }
    | { type: 'record'; record: Record; id: string };

  // Créer une liste combinée pour l'onglet "all"
  const getAllRecordsList = (): ListItem[] => {
    const items: ListItem[] = [];
    if (pregnancyRecords.length > 0) {
      items.push({ type: 'section-header', title: t('hospital.history.pregnancies'), id: 'pregnancy-header' });
      pregnancyRecords.forEach(record => {
        items.push({ type: 'record', record, id: `pregnancy-${record.id}` });
      });
    }
    if (birthRecords.length > 0) {
      items.push({ type: 'section-header', title: t('hospital.history.births'), id: 'birth-header' });
      birthRecords.forEach(record => {
        items.push({ type: 'record', record, id: `birth-${record.id}` });
      });
    }
    return items;
  };

  const renderPregnancyCard = (record: Record) => (
    <Pressable
      onPress={() => {
        // TODO: Ouvrir la fiche détaillée
        console.log('Ouvrir fiche grossesse:', record.id);
      }}
    >
      <ThemedCard style={styles.recordCard}>
        <ThemedView variant="transparent" style={styles.recordHeader}>
          <ThemedView 
            variant="transparent" 
            style={StyleSheet.flatten([styles.recordIcon, { backgroundColor: theme.colors.success + '20' }])}
          >
            <FontAwesome 
              name="user" 
              size={20} 
              color={theme.colors.success} 
            />
          </ThemedView>
          <ThemedView variant="transparent" style={styles.recordContent}>
            <RNText 
              numberOfLines={1}
              style={[styles.recordName, { 
                fontSize: theme.typography.fontSize.base, 
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text 
              }]}
            >
              {record.motherName}
            </RNText>
            <ThemedText variant="secondary" size="sm" style={styles.recordId}>
              {record.referenceNumber}
            </ThemedText>
            <ThemedText variant="secondary" size="sm" style={styles.recordProfessional}>
              {record.recordedBy}
            </ThemedText>
            <ThemedView variant="transparent" style={styles.recordDateRow}>
              <FontAwesome name="calendar" size={12} color={theme.colors.textSecondary} />
              <ThemedText variant="secondary" size="sm" style={styles.recordDate}>
                {t('hospital.history.recorded')}: {formatDate(record.date)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedCard>
    </Pressable>
  );

  const renderBirthCard = (record: Record) => (
    <Pressable
      onPress={() => {
        // TODO: Ouvrir la fiche détaillée
        console.log('Ouvrir fiche naissance:', record.id);
      }}
    >
      <ThemedCard style={styles.recordCard}>
        <ThemedView variant="transparent" style={styles.recordHeader}>
          <ThemedView 
            variant="transparent" 
            style={StyleSheet.flatten([styles.recordIcon, { backgroundColor: theme.colors.primary + '20' }])}
          >
            <FontAwesome 
              name="child" 
              size={20} 
              color={theme.colors.primary} 
            />
          </ThemedView>
          <ThemedView variant="transparent" style={styles.recordContent}>
            <RNText 
              numberOfLines={1}
              style={[styles.recordName, { 
                fontSize: theme.typography.fontSize.base, 
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text 
              }]}
            >
              {record.childName}
            </RNText>
            {record.motherName && record.fatherName && (
              <ThemedText variant="secondary" size="sm" style={styles.recordParents}>
                {record.motherName} & {record.fatherName}
              </ThemedText>
            )}
            <ThemedText variant="secondary" size="sm" style={styles.recordId}>
              {record.referenceNumber}
            </ThemedText>
            <ThemedText variant="secondary" size="sm" style={styles.recordProfessional}>
              {record.recordedBy}
            </ThemedText>
            <ThemedView variant="transparent" style={styles.recordDateRow}>
              <FontAwesome name="calendar" size={12} color={theme.colors.textSecondary} />
              <ThemedText variant="secondary" size="sm" style={styles.recordDate}>
                {t('hospital.history.recorded')}: {formatDate(record.date)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedCard>
    </Pressable>
  );

  return (
    <ScreenContainer variant="background">
      {/* 1️⃣ PARTIE 1: HEADER (Sticky) */}
      <ThemedView 
        variant="transparent"
        style={StyleSheet.flatten([
          styles.headerSection, 
          { 
            backgroundColor: theme.colors.primary,
            paddingTop: Math.max(insets.top, 8),
            // Forcer le fond bleu et éviter tout fond par défaut
          }
        ])}
      >
        {/* Barre supérieure */}
        <ThemedView variant="transparent" style={styles.topBar}>
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
          <ThemedView variant="transparent" style={styles.headerText}>
            <ThemedText size="xl" weight="bold" style={StyleSheet.flatten([styles.headerTitle, { color: '#fff' }])}>
              {t('hospital.history.title')}
            </ThemedText>
            <ThemedText size="xs" style={StyleSheet.flatten([styles.headerSubtitle, { color: 'rgba(255, 255, 255, 0.9)' }])}>
              {t('hospital.history.subtitle')}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Carte de résumé */}
        <ThemedView 
          variant="transparent"
          style={StyleSheet.flatten([styles.summaryCard, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }])}
        >
          <ThemedView variant="transparent" style={styles.summaryContent}>
            <ThemedText size="2xl" weight="bold" style={StyleSheet.flatten([styles.summaryNumber, { color: '#fff' }])}>
              {totalCount}
            </ThemedText>
            <ThemedText size="sm" style={StyleSheet.flatten([styles.summaryLabel, { color: 'rgba(255, 255, 255, 0.9)' }])}>
              {t('hospital.history.total')}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Filtres temporels */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.periodFilters, { backgroundColor: 'transparent' }]}
          contentContainerStyle={styles.periodFiltersContent}
        >
          <Pressable
            onPress={() => setPeriodFilter('thisWeek')}
            style={[
              styles.periodFilterButton,
              {
                backgroundColor: periodFilter === 'thisWeek' ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                borderWidth: periodFilter === 'thisWeek' ? 0 : 1,
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: theme.borderRadius.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }
            ]}
          >
            <FontAwesome 
              name="clock-o" 
              size={14} 
              color={periodFilter === 'thisWeek' ? theme.colors.primary : '#fff'} 
            />
            <ThemedText
              size="sm"
              style={{
                color: periodFilter === 'thisWeek' ? theme.colors.primary : '#fff',
                marginLeft: 6,
              }}
            >
              {t('hospital.history.thisWeek')}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setPeriodFilter('thisMonth')}
            style={[
              styles.periodFilterButton,
              {
                backgroundColor: periodFilter === 'thisMonth' ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                borderWidth: periodFilter === 'thisMonth' ? 0 : 1,
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: theme.borderRadius.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }
            ]}
          >
            <FontAwesome 
              name="calendar" 
              size={14} 
              color={periodFilter === 'thisMonth' ? theme.colors.primary : '#fff'} 
            />
            <ThemedText
              size="sm"
              style={{
                color: periodFilter === 'thisMonth' ? theme.colors.primary : '#fff',
                marginLeft: 6,
              }}
            >
              {t('hospital.history.thisMonth')}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setPeriodFilter('lastMonth')}
            style={[
              styles.periodFilterButton,
              {
                backgroundColor: periodFilter === 'lastMonth' ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                borderWidth: periodFilter === 'lastMonth' ? 0 : 1,
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: theme.borderRadius.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }
            ]}
          >
            <FontAwesome 
              name="arrow-up" 
              size={14} 
              color={periodFilter === 'lastMonth' ? theme.colors.primary : '#fff'} 
            />
            <ThemedText
              size="sm"
              style={{
                color: periodFilter === 'lastMonth' ? theme.colors.primary : '#fff',
                marginLeft: 6,
              }}
            >
              {t('hospital.history.lastMonth')}
            </ThemedText>
          </Pressable>
        </ScrollView>

        {/* Barre de recherche */}
        <ThemedView 
          variant="transparent"
          style={StyleSheet.flatten([styles.searchCard, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }])}
        >
          <ThemedView variant="transparent" style={styles.searchContainer}>
            <FontAwesome 
              name="search" 
              size={16} 
              color="rgba(255, 255, 255, 0.9)" 
              style={styles.searchIcon}
            />
            <RNTextInput
              placeholder={t('hospital.history.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[
                styles.searchInput,
                {
                  color: '#fff',
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.md,
                  fontSize: theme.typography.fontSize.base,
                  minHeight: 48,
                }
              ]}
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* 2️⃣ PARTIE 2: CONTENU PRINCIPAL */}
      <ThemedView variant="transparent" style={{ flex: 1 }}>
        {isLoading ? (
          <ThemedView variant="transparent" style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <ThemedText variant="secondary" size="base" style={styles.loadingText}>
              {t('common.loading') || 'Chargement...'}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            {/* Onglets de catégories */}
            <ThemedView variant="transparent" style={styles.tabsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'all' && {
                backgroundColor: theme.colors.primary + '15',
                borderBottomWidth: 2,
                borderBottomColor: theme.colors.primary,
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => setActiveTab('all')}
          >
            <ThemedText
              size="base"
              weight={activeTab === 'all' ? 'semibold' : 'normal'}
              style={{
                color: activeTab === 'all' ? theme.colors.primary : theme.colors.textSecondary,
              }}
            >
              {t('hospital.history.tabAll')}
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'pregnancy' && {
                backgroundColor: theme.colors.success + '15',
                borderBottomWidth: 2,
                borderBottomColor: theme.colors.success,
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => setActiveTab('pregnancy')}
          >
            <ThemedText
              size="base"
              weight={activeTab === 'pregnancy' ? 'semibold' : 'normal'}
              style={{
                color: activeTab === 'pregnancy' ? theme.colors.success : theme.colors.textSecondary,
              }}
            >
              {t('hospital.history.tabPregnancies')} ({pregnancyRecords.length})
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'birth' && {
                backgroundColor: theme.colors.primary + '15',
                borderBottomWidth: 2,
                borderBottomColor: theme.colors.primary,
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => setActiveTab('birth')}
          >
            <ThemedText
              size="base"
              weight={activeTab === 'birth' ? 'semibold' : 'normal'}
              style={{
                color: activeTab === 'birth' ? theme.colors.primary : theme.colors.textSecondary,
              }}
            >
              {t('hospital.history.tabBirths')} ({birthRecords.length})
            </ThemedText>
          </Pressable>
        </ThemedView>

        {/* Liste des enregistrements avec FlatList */}
        {activeTab === 'all' ? (
          filteredRecords.length === 0 ? (
            <ThemedCard style={styles.emptyCard}>
              <ThemedView variant="transparent" style={styles.emptyContent}>
                <FontAwesome name="file-text-o" size={48} color={theme.colors.textSecondary} />
                <ThemedText variant="secondary" size="base" style={styles.emptyText}>
                  {t('hospital.history.noRecords')}
                </ThemedText>
              </ThemedView>
            </ThemedCard>
          ) : (
            <FlatList
              data={getAllRecordsList()}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                if (item.type === 'section-header') {
                  return (
                    <ThemedText size="lg" weight="semibold" style={styles.sectionHeader}>
                      {item.title}
                    </ThemedText>
                  );
                } else {
                  return item.record.type === 'pregnancy' 
                    ? renderPregnancyCard(item.record)
                    : renderBirthCard(item.record);
                }
              }}
              contentContainerStyle={[
                styles.flatListContent,
                isTablet && styles.flatListContentTablet,
                { paddingBottom: insets.bottom + 20 } // SafeArea + espace supplémentaire
              ]}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : activeTab === 'pregnancy' ? (
          <FlatList
            data={pregnancyRecords}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderPregnancyCard(item)}
            contentContainerStyle={[
              styles.flatListContent,
              isTablet && styles.flatListContentTablet,
              { paddingBottom: insets.bottom + 20 } // SafeArea + espace supplémentaire
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ThemedCard style={styles.emptyCard}>
                <ThemedView variant="transparent" style={styles.emptyContent}>
                  <FontAwesome name="heart" size={48} color={theme.colors.textSecondary} />
                  <ThemedText variant="secondary" size="base" style={styles.emptyText}>
                    {t('hospital.history.noPregnancies')}
                  </ThemedText>
                </ThemedView>
              </ThemedCard>
            }
          />
        ) : (
          <FlatList
            data={birthRecords}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderBirthCard(item)}
            contentContainerStyle={[
              styles.flatListContent,
              isTablet && styles.flatListContentTablet,
              { paddingBottom: insets.bottom + 20 } // SafeArea + espace supplémentaire
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ThemedCard style={styles.emptyCard}>
                <ThemedView variant="transparent" style={styles.emptyContent}>
                  <FontAwesome name="child" size={48} color={theme.colors.textSecondary} />
                  <ThemedText variant="secondary" size="base" style={styles.emptyText}>
                    {t('hospital.history.noBirths')}
                  </ThemedText>
                </ThemedView>
              </ThemedCard>
            }
          />
        )}
          </>
        )}
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // PARTIE 1: HEADER
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 0,
    width: '100%',
    alignSelf: 'stretch',
    zIndex: 10,
    marginTop: 0,
    marginHorizontal: 0,
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    marginBottom: 2,
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: 10,
    alignItems: 'center',
    padding: 6,
    alignSelf: 'center',
    minWidth: 80,
    maxWidth: 120,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryNumber: {
    marginBottom: 2,
  },
  summaryLabel: {},
  periodFilters: {
    marginBottom: 10,
  },
  periodFiltersContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  periodFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchCard: {
    marginBottom: 0,
    paddingHorizontal: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 48,
    paddingRight: 16,
    flex: 1,
  },
  // PARTIE 2: CONTENU
  flatListContent: {
    padding: 16,
    // paddingBottom sera géré dynamiquement avec useSafeAreaInsets
  },
  flatListContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  recordCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  recordContent: {
    flex: 1,
    minWidth: 0,
  },
  recordName: {
    marginBottom: 6,
  },
  recordId: {
    marginBottom: 4,
  },
  recordParents: {
    marginBottom: 4,
    fontStyle: 'italic',
  },
  recordProfessional: {
    marginBottom: 4,
  },
  recordDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  recordDate: {},
  emptyCard: {
    marginTop: 24,
    padding: 48,
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
  },
});
