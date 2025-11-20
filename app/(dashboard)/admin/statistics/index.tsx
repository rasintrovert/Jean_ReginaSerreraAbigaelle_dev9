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
import { useLanguageStore } from '@/store/languageStore';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRecordsForValidation } from '@/services/admin/adminService';

export default function AdminStatisticsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { language } = useLanguageStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pregnancies' | 'births'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalRegistrations: 0,
    totalPregnancies: 0,
    totalBirths: 0,
    pendingValidation: 0,
    validated: 0,
    sentForLegalization: 0,
    legalized: 0,
    rejected: 0,
  });
  const [periodStats, setPeriodStats] = useState({
    day: { pregnancies: 0, births: 0, validations: 0, legalizations: 0 },
    week: { pregnancies: 0, births: 0, validations: 0, legalizations: 0 },
    month: { pregnancies: 0, births: 0, validations: 0, legalizations: 0 },
    year: { pregnancies: 0, births: 0, validations: 0, legalizations: 0 },
  });
  const [departmentStats, setDepartmentStats] = useState<Array<{
    id: string;
    code: string;
    name: string;
    nameKr: string;
    pregnancies: number;
    births: number;
    total: number;
  }>>([]);
  const [timelineData, setTimelineData] = useState<Array<{
    month: string;
    pregnancies: number;
    births: number;
    validations: number;
  }>>([]);

  // Charger les statistiques
  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      // Charger tous les enregistrements
      const [allPregnancies, allBirths] = await Promise.all([
        getRecordsForValidation('pregnancy'),
        getRecordsForValidation('birth'),
      ]);

      const allRecords = [...allPregnancies, ...allBirths];

      // Distinguer pregnancies et births
      const isBirthRecord = (r: any) => r.childFirstNames && r.childFirstNames.length > 0;
      const isPregnancyRecord = (r: any) => !isBirthRecord(r) && (r.motherFirstNames || r.motherName);

      // Statistiques globales
      const totalPregnancies = allPregnancies.length;
      const totalBirths = allBirths.length;
      const totalRegistrations = allRecords.length;
      const pendingValidation = allRecords.filter(r => (r.validationStatus || 'pending') === 'pending').length;
      const validated = allRecords.filter(r => (r.validationStatus || 'pending') === 'validated').length;
      const rejected = allRecords.filter(r => (r.validationStatus || 'pending') === 'rejected').length;
      const legalized = allRecords.filter(r => r.certificateStatus === 'issued' || r.certificateStatus === 'approved').length;
      const sentForLegalization = validated; // Approximation

      setGlobalStats({
        totalRegistrations,
        totalPregnancies,
        totalBirths,
        pendingValidation,
        validated,
        sentForLegalization,
        legalized,
        rejected,
      });

      // Calculer les statistiques par période
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const getRecordsInPeriod = (startDate: Date) => {
        return allRecords.filter(r => {
          const createdAt = r.createdAt ? new Date(r.createdAt) : new Date(0);
          return createdAt >= startDate;
        });
      };

      const recordsDay = getRecordsInPeriod(dayAgo);
      const recordsWeek = getRecordsInPeriod(weekAgo);
      const recordsMonth = getRecordsInPeriod(monthAgo);
      const recordsYear = getRecordsInPeriod(yearAgo);

      const calculatePeriodStats = (records: any[]) => {
        const pregnancies = records.filter(isPregnancyRecord).length;
        const births = records.filter(isBirthRecord).length;
        const validations = records.filter(r => (r.validationStatus || 'pending') === 'validated').length;
        const legalizations = records.filter(r => r.certificateStatus === 'issued' || r.certificateStatus === 'approved').length;
        return { pregnancies, births, validations, legalizations };
      };

      setPeriodStats({
        day: calculatePeriodStats(recordsDay),
        week: calculatePeriodStats(recordsWeek),
        month: calculatePeriodStats(recordsMonth),
        year: calculatePeriodStats(recordsYear),
      });

      // Statistiques par département
      const deptMap = new Map<string, { pregnancies: number; births: number }>();
      
      allRecords.forEach(record => {
        const dept = record.motherDepartment || record.birthDepartment || 'Unknown';
        if (!deptMap.has(dept)) {
          deptMap.set(dept, { pregnancies: 0, births: 0 });
        }
        const stats = deptMap.get(dept)!;
        if (isPregnancyRecord(record)) {
          stats.pregnancies++;
        } else if (isBirthRecord(record)) {
          stats.births++;
        }
      });

      const deptStatsArray = Array.from(deptMap.entries()).map(([deptName, stats], index) => {
        // Trouver le code du département
        const dept = HAITIAN_DEPARTMENTS.find(d => d.name === deptName || d.nameKr === deptName);
        return {
          id: `${dept?.code || deptName.substring(0, 2).toUpperCase()}-${index}-${deptName}`, // Clé unique
          code: dept?.code || deptName.substring(0, 2).toUpperCase(),
          name: dept?.name || deptName,
          nameKr: dept?.nameKr || deptName,
          pregnancies: stats.pregnancies,
          births: stats.births,
          total: stats.pregnancies + stats.births,
        };
      }).sort((a, b) => b.total - a.total);

      setDepartmentStats(deptStatsArray);

      // Données temporelles (6 derniers mois)
      const monthsData: Array<{ month: string; pregnancies: number; births: number; validations: number }> = [];
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthRecords = allRecords.filter(r => {
          const createdAt = r.createdAt ? new Date(r.createdAt) : new Date(0);
          return createdAt >= monthDate && createdAt < nextMonth;
        });

        monthsData.push({
          month: monthNames[monthDate.getMonth()],
          pregnancies: monthRecords.filter(isPregnancyRecord).length,
          births: monthRecords.filter(isBirthRecord).length,
          validations: monthRecords.filter(r => (r.validationStatus || 'pending') === 'validated').length,
        });
      }

      setTimelineData(monthsData);
    } catch (error) {
      if (__DEV__) console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPeriodStats = periodStats[selectedPeriod];

  const maxValue = timelineData.length > 0
    ? Math.max(...timelineData.map(d => Math.max(d.pregnancies, d.births, d.validations)))
    : 100;

  const getDepartmentName = (dept: typeof departmentStats[0]) => {
    return language === 'ht' ? dept.nameKr : dept.name;
  };

  const handleBack = () => {
    router.back();
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
            style={styles.backButton}
            onPress={handleBack}
          >
            <FontAwesome 
              name="arrow-left" 
              size={isTablet ? 20 : 18} 
              color="#fff" 
            />
          </Pressable>
          <ThemedText 
            size="lg" 
            weight="bold"
            style={StyleSheet.flatten([styles.headerTitle, { color: '#fff' }])}
          >
            {t('admin.statistics.title') || 'Statistiques Avancées'}
          </ThemedText>
        </ThemedView>

        {/* Filtres de période */}
        <ThemedCard style={styles.periodFiltersCard}>
          <ThemedView variant="transparent" style={styles.periodFilters}>
            <ThemedView variant="transparent" style={styles.periodFiltersRow}>
              <PressableButton
                variant={selectedPeriod === 'day' ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setSelectedPeriod('day')}
                style={styles.periodButton}
                labelStyle={styles.periodButtonText}
              >
                {t('admin.statistics.day') || 'Aujourd\'hui'}
              </PressableButton>
              <PressableButton
                variant={selectedPeriod === 'week' ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setSelectedPeriod('week')}
                style={styles.periodButton}
                labelStyle={styles.periodButtonText}
              >
                {t('admin.statistics.week') || 'Cette Semaine'}
              </PressableButton>
            </ThemedView>
            <ThemedView variant="transparent" style={styles.periodFiltersRow}>
              <PressableButton
                variant={selectedPeriod === 'month' ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setSelectedPeriod('month')}
                style={styles.periodButton}
                labelStyle={styles.periodButtonText}
              >
                {t('admin.statistics.month') || 'Ce Mois'}
              </PressableButton>
              <PressableButton
                variant={selectedPeriod === 'year' ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setSelectedPeriod('year')}
                style={styles.periodButton}
                labelStyle={styles.periodButtonText}
              >
                {t('admin.statistics.year') || 'Cette Année'}
              </PressableButton>
            </ThemedView>
          </ThemedView>
        </ThemedCard>

        {isLoading ? (
          <ThemedView variant="transparent" style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <ThemedText variant="secondary" size="sm" style={{ marginTop: 12 }}>
              {t('common.loading') || 'Chargement des statistiques...'}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            {/* Statistiques principales */}
            <ThemedView variant="transparent" style={styles.mainStatsContainer}>
          <ThemedView variant="transparent" style={styles.mainStatsRow}>
            <ThemedCard style={styles.mainStatCard}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.mainStatIcon, { backgroundColor: theme.colors.primary + '20' }])}
              >
                <FontAwesome name="file-text" size={isTablet ? 20 : 18} color={theme.colors.primary} />
              </ThemedView>
              <ThemedText size="xl" weight="bold" style={styles.mainStatNumber}>
                {globalStats.totalRegistrations.toLocaleString()}
              </ThemedText>
              <ThemedText variant="secondary" size="xs" style={styles.mainStatLabel}>
                {t('admin.statistics.totalRegistrations') || 'Total Enregistrements'}
              </ThemedText>
            </ThemedCard>

            <ThemedCard style={styles.mainStatCard}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.mainStatIcon, { backgroundColor: theme.colors.success + '20' }])}
              >
                <FontAwesome name="heart" size={isTablet ? 20 : 18} color={theme.colors.success} />
              </ThemedView>
              <ThemedText size="xl" weight="bold" style={styles.mainStatNumber}>
                {globalStats.totalPregnancies.toLocaleString()}
              </ThemedText>
              <ThemedText variant="secondary" size="xs" style={styles.mainStatLabel}>
                {t('admin.statistics.totalPregnancies') || 'Total Grossesses'}
              </ThemedText>
            </ThemedCard>
          </ThemedView>

          <ThemedView variant="transparent" style={styles.mainStatsRow}>
            <ThemedCard style={styles.mainStatCard}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.mainStatIcon, { backgroundColor: theme.colors.secondary + '20' }])}
              >
                <FontAwesome name="child" size={isTablet ? 20 : 18} color={theme.colors.secondary} />
              </ThemedView>
              <ThemedText size="xl" weight="bold" style={styles.mainStatNumber}>
                {globalStats.totalBirths.toLocaleString()}
              </ThemedText>
              <ThemedText variant="secondary" size="xs" style={styles.mainStatLabel}>
                {t('admin.statistics.totalBirths') || 'Total Naissances'}
              </ThemedText>
            </ThemedCard>

            <ThemedCard style={styles.mainStatCard}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.mainStatIcon, { backgroundColor: theme.colors.warning + '20' }])}
              >
                <FontAwesome name="clock-o" size={isTablet ? 20 : 18} color={theme.colors.warning} />
              </ThemedView>
              <ThemedText size="xl" weight="bold" style={styles.mainStatNumber}>
                {globalStats.pendingValidation.toLocaleString()}
              </ThemedText>
              <ThemedText variant="secondary" size="xs" style={styles.mainStatLabel}>
                {t('admin.statistics.pendingValidation') || 'En Attente'}
              </ThemedText>
            </ThemedCard>
          </ThemedView>
        </ThemedView>

        {/* Statistiques par période */}
        <ThemedCard style={styles.periodStatsCard}>
          <ThemedText size="base" weight="bold" style={styles.sectionTitle}>
            {t('admin.statistics.periodStats') || 'Statistiques de la Période'}
          </ThemedText>
          
          <ThemedView variant="transparent" style={styles.periodStatsGrid}>
            <ThemedView variant="transparent" style={styles.periodStatItem}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.periodStatIcon, { backgroundColor: theme.colors.success + '20' }])}
              >
                <FontAwesome name="heart" size={16} color={theme.colors.success} />
              </ThemedView>
              <ThemedView variant="transparent" style={styles.periodStatContent}>
                <ThemedText size="xl" weight="bold">
                  {currentPeriodStats.pregnancies}
                </ThemedText>
                <ThemedText variant="secondary" size="xs">
                  {t('admin.statistics.pregnancies') || 'Grossesses'}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView variant="transparent" style={styles.periodStatItem}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.periodStatIcon, { backgroundColor: theme.colors.primary + '20' }])}
              >
                <FontAwesome name="child" size={16} color={theme.colors.primary} />
              </ThemedView>
              <ThemedView variant="transparent" style={styles.periodStatContent}>
                <ThemedText size="xl" weight="bold">
                  {currentPeriodStats.births}
                </ThemedText>
                <ThemedText variant="secondary" size="xs">
                  {t('admin.statistics.births') || 'Naissances'}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView variant="transparent" style={styles.periodStatItem}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.periodStatIcon, { backgroundColor: theme.colors.info + '20' }])}
              >
                <FontAwesome name="check-circle" size={16} color={theme.colors.info} />
              </ThemedView>
              <ThemedView variant="transparent" style={styles.periodStatContent}>
                <ThemedText size="xl" weight="bold">
                  {currentPeriodStats.validations}
                </ThemedText>
                <ThemedText variant="secondary" size="xs">
                  {t('admin.statistics.validations') || 'Validations'}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView variant="transparent" style={styles.periodStatItem}>
              <ThemedView 
                variant="transparent" 
                style={StyleSheet.flatten([styles.periodStatIcon, { backgroundColor: theme.colors.secondary + '20' }])}
              >
                <FontAwesome name="certificate" size={16} color={theme.colors.secondary} />
              </ThemedView>
              <ThemedView variant="transparent" style={styles.periodStatContent}>
                <ThemedText size="xl" weight="bold">
                  {currentPeriodStats.legalizations}
                </ThemedText>
                <ThemedText variant="secondary" size="xs">
                  {t('admin.statistics.legalizations') || 'Légalisations'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ThemedCard>

        {/* Taux de validation et légalisation */}
        <ThemedCard style={styles.ratesCard}>
          <ThemedText size="base" weight="bold" style={styles.sectionTitle}>
            {t('admin.statistics.rates') || 'Taux de Traitement'}
          </ThemedText>
          
          <ThemedView variant="transparent" style={styles.ratesContainer}>
            <ThemedView variant="transparent" style={styles.rateItem}>
              <ThemedText size="sm" weight="medium" style={styles.rateLabel}>
                {t('admin.statistics.validationRate') || 'Taux de Validation'}
              </ThemedText>
              <ThemedView variant="transparent" style={styles.progressBarContainer}>
                <ThemedView 
                  variant="transparent" 
                  style={StyleSheet.flatten([
                    styles.progressBar,
                    { 
                      width: `${(globalStats.validated / globalStats.totalRegistrations) * 100}%`,
                      backgroundColor: theme.colors.success
                    }
                  ])}
                />
              </ThemedView>
              <ThemedText size="base" weight="bold" style={styles.rateValue}>
                {((globalStats.validated / globalStats.totalRegistrations) * 100).toFixed(1)}%
              </ThemedText>
            </ThemedView>

            <ThemedView variant="transparent" style={styles.rateItem}>
              <ThemedText size="sm" weight="medium" style={styles.rateLabel}>
                {t('admin.statistics.legalizationRate') || 'Taux de Légalisation'}
              </ThemedText>
              <ThemedView variant="transparent" style={styles.progressBarContainer}>
                <ThemedView 
                  variant="transparent" 
                  style={StyleSheet.flatten([
                    styles.progressBar,
                    { 
                      width: `${(globalStats.legalized / globalStats.totalRegistrations) * 100}%`,
                      backgroundColor: theme.colors.secondary
                    }
                  ])}
                />
              </ThemedView>
              <ThemedText size="base" weight="bold" style={styles.rateValue}>
                {((globalStats.legalized / globalStats.totalRegistrations) * 100).toFixed(1)}%
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedCard>

        {/* Statistiques par département */}
        <ThemedCard style={styles.departmentsCard}>
          <ThemedText size="base" weight="bold" style={styles.sectionTitle}>
            {t('admin.statistics.byDepartment') || 'Par Département'}
          </ThemedText>
          
          <FlatList
            data={departmentStats}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const maxDeptValue = Math.max(...departmentStats.map(d => d.total));
              const percentage = (item.total / maxDeptValue) * 100;
              
              return (
                <ThemedView variant="transparent" style={styles.departmentItem}>
                  <ThemedView variant="transparent" style={styles.departmentHeader}>
                    <ThemedText size="base" weight="semibold">
                      {getDepartmentName(item)}
                    </ThemedText>
                    <ThemedText size="base" weight="bold" style={{ color: theme.colors.primary }}>
                      {item.total}
                    </ThemedText>
                  </ThemedView>
                  
                  {/* Barre de progression */}
                  <View style={styles.departmentProgressBar}>
                    <View 
                      style={StyleSheet.flatten([
                        styles.departmentProgressFill,
                        { 
                          width: `${percentage}%`,
                          backgroundColor: theme.colors.primary 
                        }
                      ])}
                    />
                  </View>
                  
                  {/* Détails */}
                  <ThemedView variant="transparent" style={styles.departmentDetails}>
                    <ThemedView variant="transparent" style={styles.departmentDetailItem}>
                      <FontAwesome name="heart" size={12} color={theme.colors.success} />
                      <ThemedText variant="secondary" size="xs" style={styles.departmentDetailText}>
                        {item.pregnancies} {t('admin.statistics.pregnancies') || 'Grossesses'}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView variant="transparent" style={styles.departmentDetailItem}>
                      <FontAwesome name="child" size={12} color={theme.colors.secondary} />
                      <ThemedText variant="secondary" size="xs" style={styles.departmentDetailText}>
                        {item.births} {t('admin.statistics.births') || 'Naissances'}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              );
            }}
          />
        </ThemedCard>

        {/* Statistiques temporelles */}
        <ThemedCard style={styles.timelineCard}>
          <ThemedText size="base" weight="bold" style={styles.sectionTitle}>
            {t('admin.statistics.timeline') || 'Évolution Temporelle'}
          </ThemedText>
          
          <ThemedView variant="transparent" style={styles.timelineContainer}>
            {timelineData.map((data, index) => (
              <ThemedView key={index} variant="transparent" style={styles.timelineItem}>
                <ThemedText variant="secondary" size="xs" style={styles.timelineMonth}>
                  {data.month}
                </ThemedText>
                
                {/* Barres empilées */}
                <ThemedView variant="transparent" style={styles.timelineBars}>
                  {/* Grossesses */}
                  <View 
                    style={StyleSheet.flatten([
                      styles.timelineBar,
                      {
                        height: `${(data.pregnancies / maxValue) * 100}%`,
                        backgroundColor: theme.colors.success,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }
                    ])}
                  />
                  {/* Naissances */}
                  <View 
                    style={StyleSheet.flatten([
                      styles.timelineBar,
                      {
                        height: `${(data.births / maxValue) * 100}%`,
                        backgroundColor: theme.colors.primary,
                      }
                    ])}
                  />
                  {/* Validations */}
                  <View 
                    style={StyleSheet.flatten([
                      styles.timelineBar,
                      {
                        height: `${(data.validations / maxValue) * 100}%`,
                        backgroundColor: theme.colors.info,
                        borderBottomLeftRadius: 4,
                        borderBottomRightRadius: 4,
                      }
                    ])}
                  />
                </ThemedView>
                
                <ThemedText variant="secondary" size="xs" style={styles.timelineValue}>
                  {data.pregnancies + data.births + data.validations}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
          
          {/* Légende */}
          <ThemedView variant="transparent" style={styles.timelineLegend}>
            <ThemedView variant="transparent" style={styles.legendItem}>
              <View style={StyleSheet.flatten([styles.legendColor, { backgroundColor: theme.colors.success }])} />
              <ThemedText variant="secondary" size="xs">
                {t('admin.statistics.pregnancies') || 'Grossesses'}
              </ThemedText>
            </ThemedView>
            <ThemedView variant="transparent" style={styles.legendItem}>
              <View style={StyleSheet.flatten([styles.legendColor, { backgroundColor: theme.colors.primary }])} />
              <ThemedText variant="secondary" size="xs">
                {t('admin.statistics.births') || 'Naissances'}
              </ThemedText>
            </ThemedView>
            <ThemedView variant="transparent" style={styles.legendItem}>
              <View style={StyleSheet.flatten([styles.legendColor, { backgroundColor: theme.colors.info }])} />
              <ThemedText variant="secondary" size="xs">
                {t('admin.statistics.validations') || 'Validations'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedCard>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    // paddingBottom sera géré dynamiquement avec useSafeAreaInsets
  },
  scrollContentTablet: {
    paddingHorizontal: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
    // paddingBottom sera géré dynamiquement avec useSafeAreaInsets
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    alignSelf: 'stretch',
    marginHorizontal: 0,
    borderRadius: 0,
    marginTop: 0,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodFiltersCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  periodFilters: {
    gap: 8,
  },
  periodFiltersRow: {
    flexDirection: 'row',
    gap: 6,
  },
  periodButton: {
    flex: 1,
  },
  periodButtonText: {
    fontSize: 11,
  },
  mainStatsContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  mainStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mainStatCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  mainStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  mainStatNumber: {
    marginBottom: 2,
  },
  mainStatLabel: {
    textAlign: 'center',
  },
  periodStatsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionSubtitle: {
    marginBottom: 12,
    lineHeight: 18,
  },
  periodStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodStatItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(47, 149, 220, 0.05)',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(47, 149, 220, 0.1)',
  },
  periodStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodStatContent: {
    flex: 1,
  },
  ratesCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  ratesContainer: {
    gap: 14,
  },
  rateItem: {
    gap: 6,
  },
  rateLabel: {
    marginBottom: 2,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  rateValue: {
    marginTop: 2,
  },
  departmentsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  timelineCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  departmentItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  departmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  departmentProgressBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  departmentProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  departmentDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  departmentDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  departmentDetailText: {
    marginLeft: 2,
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  timelineMonth: {
    marginBottom: 2,
  },
  timelineBars: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    maxHeight: 120,
  },
  timelineBar: {
    flex: 1,
    minHeight: 3,
    maxHeight: '100%',
  },
  timelineValue: {
    marginTop: 2,
    textAlign: 'center',
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
});

