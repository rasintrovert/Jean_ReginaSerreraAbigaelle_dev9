import { ScreenContainer } from '@/components/ScreenContainer';
import {
  ThemedCard,
  ThemedInput,
  ThemedText,
  ThemedView
} from '@/components/ThemedComponents';
import { PressableButton } from '@/components/PressableButton';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRecordsForValidation } from '@/services/admin/adminService';
import { formatDateSafe } from '@/utils/date';

interface SearchRecord {
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

export default function HospitalSearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<SearchRecord[]>([]);

  // Charger tous les enregistrements validés
  useEffect(() => {
    loadRecords();
  }, []);

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

      // Transformer les grossesses en format SearchRecord
      const pregnancyRecords: SearchRecord[] = validatedPregnancies.map((p: any) => {
        const motherName = p.motherFirstNames && p.motherLastName
          ? [...p.motherFirstNames, p.motherLastName].join(' ')
          : p.motherName || 'N/A';
        
        const recordedBy = p.recordedBy || 'Agent';
        const recordedByTitle = p.recordedByType === 'hospital' ? 'Hôpital' : 
                                p.recordedByType === 'admin' ? 'Admin' : 'Agent';

        // Gérer les différents formats de date
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

      // Transformer les naissances en format SearchRecord
      const birthRecords: SearchRecord[] = validatedBirths.map((b: any) => {
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

        // Gérer les différents formats de date
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
      const combined = [...pregnancyRecords, ...birthRecords].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setAllRecords(combined);
    } catch (error) {
      console.error('Error loading search records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les résultats selon la recherche
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    return allRecords.filter(record => {
      const matchesReference = record.referenceNumber.toLowerCase().includes(query);
      const matchesMother = record.motherName?.toLowerCase().includes(query);
      const matchesChild = record.childName?.toLowerCase().includes(query);
      const matchesFather = record.fatherName?.toLowerCase().includes(query);
      const matchesRecordedBy = record.recordedBy?.toLowerCase().includes(query);
      
      return matchesReference || matchesMother || matchesChild || matchesFather || matchesRecordedBy;
    });
  }, [searchQuery, allRecords]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDateSafe(date, 'd MMM yyyy') || date.toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const renderRecordCard = ({ item }: { item: SearchRecord }) => (
    <Pressable
      onPress={() => {
        // TODO: Ouvrir la fiche détaillée
        console.log('Ouvrir fiche:', item.id);
      }}
    >
      <ThemedCard style={styles.recordCard}>
        <ThemedView variant="transparent" style={styles.recordHeader}>
          <ThemedView 
            variant="transparent" 
            style={StyleSheet.flatten([
              styles.recordIcon, 
              { 
                backgroundColor: item.type === 'pregnancy' 
                  ? theme.colors.success + '20' 
                  : theme.colors.primary + '20' 
              }
            ])}
          >
            <FontAwesome 
              name={item.type === 'pregnancy' ? 'user' : 'child'} 
              size={20} 
              color={item.type === 'pregnancy' ? theme.colors.success : theme.colors.primary} 
            />
          </ThemedView>
          <ThemedView variant="transparent" style={styles.recordContent}>
            <ThemedText size="base" weight="bold" style={styles.recordName}>
              {item.type === 'pregnancy' ? item.motherName : item.childName}
            </ThemedText>
            {item.type === 'birth' && item.motherName && item.fatherName && (
              <ThemedText variant="secondary" size="sm" style={styles.recordParents}>
                {item.motherName} & {item.fatherName}
              </ThemedText>
            )}
            <ThemedText variant="secondary" size="sm" style={styles.recordId}>
              {item.referenceNumber}
            </ThemedText>
            <ThemedText variant="secondary" size="sm" style={styles.recordProfessional}>
              {item.recordedBy}
            </ThemedText>
            <ThemedView variant="transparent" style={styles.recordDateRow}>
              <FontAwesome name="calendar" size={12} color={theme.colors.textSecondary} />
              <ThemedText variant="secondary" size="sm" style={styles.recordDate}>
                {formatDate(item.date)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedCard>
    </Pressable>
  );

  return (
    <ScreenContainer variant="background">
      {/* Header */}
      <ThemedView 
        variant="transparent"
        style={StyleSheet.flatten([styles.header, { backgroundColor: theme.colors.primary }])}
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
        <ThemedView variant="transparent" style={styles.headerText}>
          <ThemedText 
            size="xl" 
            weight="bold" 
            style={StyleSheet.flatten([styles.headerTitle, { color: '#fff' }])}
          >
            {t('hospital.search.title') || 'Recherche'}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
          { paddingBottom: insets.bottom + 20 } // SafeArea + espace supplémentaire
        ]}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* Barre de recherche */}
        <ThemedCard style={styles.searchCard}>
          <ThemedView variant="transparent" style={styles.searchContainer}>
            <FontAwesome 
              name="search" 
              size={20} 
              color={theme.colors.textSecondary} 
              style={styles.searchIcon}
            />
            <ThemedInput
              placeholder={t('hospital.search.placeholder') || 'Rechercher un enregistrement...'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              size="md"
              style={styles.searchInput}
            />
          </ThemedView>
        </ThemedCard>

        {/* Résultats ou état vide */}
        {isLoading ? (
          <ThemedView variant="transparent" style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <ThemedText variant="secondary" size="base" style={styles.loadingText}>
              {t('common.loading') || 'Chargement...'}
            </ThemedText>
          </ThemedView>
        ) : searchQuery.length === 0 ? (
          <ThemedCard style={styles.emptyCard}>
            <ThemedView variant="transparent" style={styles.emptyContent}>
              <FontAwesome name="search" size={64} color={theme.colors.textSecondary} />
              <ThemedText size="lg" weight="semibold" style={styles.emptyTitle}>
                {t('hospital.search.emptyTitle') || 'Rechercher un enregistrement'}
              </ThemedText>
              <ThemedText variant="secondary" size="base" style={styles.emptyText}>
                {t('hospital.search.emptyDescription') || 'Utilisez la barre de recherche ci-dessus pour trouver des enregistrements de grossesse ou de naissance.'}
              </ThemedText>
            </ThemedView>
          </ThemedCard>
        ) : filteredRecords.length === 0 ? (
          <ThemedCard style={styles.emptyCard}>
            <ThemedView variant="transparent" style={styles.emptyContent}>
              <FontAwesome name="info-circle" size={48} color={theme.colors.textSecondary} />
              <ThemedText variant="secondary" size="base" style={styles.emptyText}>
                {t('hospital.search.noResults') || 'Aucun résultat trouvé. Essayez avec d\'autres mots-clés.'}
              </ThemedText>
            </ThemedView>
          </ThemedCard>
        ) : (
          <>
            <ThemedText size="sm" variant="secondary" style={styles.resultsCount}>
              {filteredRecords.length} {filteredRecords.length === 1 ? 'résultat' : 'résultats'} trouvé{filteredRecords.length > 1 ? 's' : ''}
            </ThemedText>
            <FlatList
              data={filteredRecords}
              keyExtractor={(item) => item.id}
              renderItem={renderRecordCard}
              scrollEnabled={false}
              contentContainerStyle={styles.resultsList}
            />
          </>
        )}
      </ScrollView>
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
  headerTitle: {},
  scrollContent: {
    padding: 16,
    // paddingBottom sera géré dynamiquement avec useSafeAreaInsets
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
  },
  searchCard: {
    marginBottom: 24,
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
  },
  emptyCard: {
    padding: 48,
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  resultsCount: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resultsList: {
    paddingBottom: 0,
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
});

