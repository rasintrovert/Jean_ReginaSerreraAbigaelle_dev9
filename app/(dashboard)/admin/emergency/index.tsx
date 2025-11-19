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
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  getAllEmergencyReports, 
  acknowledgeEmergencyReport, 
  resolveEmergencyReport,
  EmergencyReport 
} from '@/services/emergency/emergencyService';
import { formatDateSafe } from '@/utils/date';

type FilterStatus = 'all' | 'pending' | 'acknowledged' | 'resolved';

export default function AdminEmergencyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedReport, setSelectedReport] = useState<EmergencyReport | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Charger les signalements
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const allReports = await getAllEmergencyReports();
      setReports(allReports);
    } catch (error) {
      console.error('Error loading emergency reports:', error);
      Alert.alert(t('common.error'), 'Erreur lors du chargement des signalements');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les signalements
  const filteredReports = filterStatus === 'all' 
    ? reports 
    : reports.filter(r => r.status === filterStatus);

  // Obtenir le badge de niveau d'urgence
  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return { color: '#8B0000', label: t('agent.emergency.urgencyLevels.critical') || 'Critique' };
      case 'high':
        return { color: theme.colors.error, label: t('agent.emergency.urgencyLevels.high') || 'Élevé' };
      case 'medium':
        return { color: theme.colors.warning, label: t('agent.emergency.urgencyLevels.medium') || 'Moyen' };
      case 'low':
        return { color: theme.colors.success, label: t('agent.emergency.urgencyLevels.low') || 'Faible' };
      default:
        return { color: theme.colors.textSecondary, label: level };
    }
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: theme.colors.warning, label: 'En attente' };
      case 'acknowledged':
        return { color: theme.colors.info, label: 'Pris en charge' };
      case 'resolved':
        return { color: theme.colors.success, label: 'Résolu' };
      default:
        return { color: theme.colors.textSecondary, label: status };
    }
  };

  // Marquer comme pris en charge
  const handleAcknowledge = async (reportId: string) => {
    if (!user?.id) {
      Alert.alert(t('common.error'), 'Utilisateur non authentifié');
      return;
    }

    try {
      setIsProcessing(true);
      await acknowledgeEmergencyReport(reportId, user.id);
      Alert.alert(t('common.success'), 'Signalement marqué comme pris en charge');
      await loadReports();
      if (selectedReport?.id === reportId) {
        setShowDetailsModal(false);
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error acknowledging report:', error);
      Alert.alert(t('common.error'), 'Erreur lors de la prise en charge');
    } finally {
      setIsProcessing(false);
    }
  };

  // Marquer comme résolu
  const handleResolve = async () => {
    if (!selectedReport?.id || !user?.id) {
      return;
    }

    try {
      setIsProcessing(true);
      await resolveEmergencyReport(selectedReport.id, user.id, resolveNotes);
      Alert.alert(t('common.success'), 'Signalement marqué comme résolu');
      setShowResolveModal(false);
      setShowDetailsModal(false);
      setSelectedReport(null);
      setResolveNotes('');
      await loadReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      Alert.alert(t('common.error'), 'Erreur lors de la résolution');
    } finally {
      setIsProcessing(false);
    }
  };

  // Ouvrir les détails
  const handleViewDetails = (report: EmergencyReport) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  // Rendre un signalement
  const renderReport = ({ item }: { item: EmergencyReport }) => {
    const urgencyBadge = getUrgencyBadge(item.urgencyLevel);
    const statusBadge = getStatusBadge(item.status);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.reportCard,
          { backgroundColor: theme.colors.surface },
          pressed && { opacity: 0.7 }
        ]}
        onPress={() => handleViewDetails(item)}
      >
        <ThemedView variant="transparent" style={styles.reportHeader}>
          <ThemedView variant="transparent" style={styles.reportHeaderLeft}>
            <ThemedView 
              variant="transparent" 
              style={[
                styles.urgencyBadge,
                { backgroundColor: urgencyBadge.color + '20' }
              ]}
            >
              <ThemedText 
                size="xs" 
                weight="semibold"
                style={{ color: urgencyBadge.color }}
              >
                {urgencyBadge.label}
              </ThemedText>
            </ThemedView>
            <ThemedView 
              variant="transparent" 
              style={[
                styles.statusBadge,
                { backgroundColor: statusBadge.color + '20' }
              ]}
            >
              <ThemedText 
                size="xs" 
                weight="semibold"
                style={{ color: statusBadge.color }}
              >
                {statusBadge.label}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <FontAwesome 
            name="chevron-right" 
            size={16} 
            color={theme.colors.textSecondary} 
          />
        </ThemedView>

        <ThemedText size="base" weight="semibold" style={styles.reportType}>
          {item.emergencyType}
        </ThemedText>

        <ThemedText 
          variant="secondary" 
          size="sm" 
          numberOfLines={2}
          style={styles.reportDescription}
        >
          {item.description}
        </ThemedText>

        <ThemedView variant="transparent" style={styles.reportInfo}>
          <ThemedView variant="transparent" style={styles.reportInfoRow}>
            <FontAwesome name="map-marker" size={12} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" size="xs" style={styles.reportInfoText}>
              {item.location}
            </ThemedText>
          </ThemedView>
          <ThemedView variant="transparent" style={styles.reportInfoRow}>
            <FontAwesome name="user" size={12} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" size="xs" style={styles.reportInfoText}>
              {item.reportedByName || 'Agent'}
            </ThemedText>
          </ThemedView>
          <ThemedView variant="transparent" style={styles.reportInfoRow}>
            <FontAwesome name="clock-o" size={12} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" size="xs" style={styles.reportInfoText}>
              {formatDateSafe(item.createdAt, 'dd/MM/yyyy HH:mm')}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </Pressable>
    );
  };

  // Compteurs par statut
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const acknowledgedCount = reports.filter(r => r.status === 'acknowledged').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

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
            Signalements d'urgence
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Filtres par statut */}
      <ThemedView variant="transparent" style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          <PressableButton
            variant={filterStatus === 'all' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setFilterStatus('all')}
            style={styles.filterButton}
          >
            <ThemedText 
              size="sm" 
              weight="semibold"
              style={{ 
                color: filterStatus === 'all' ? '#fff' : theme.colors.primary 
              }}
            >
              Tous ({reports.length})
            </ThemedText>
          </PressableButton>

          <PressableButton
            variant={filterStatus === 'pending' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setFilterStatus('pending')}
            style={styles.filterButton}
          >
            <ThemedText 
              size="sm" 
              weight="semibold"
              style={{ 
                color: filterStatus === 'pending' ? '#fff' : theme.colors.warning 
              }}
            >
              En attente ({pendingCount})
            </ThemedText>
          </PressableButton>

          <PressableButton
            variant={filterStatus === 'acknowledged' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setFilterStatus('acknowledged')}
            style={styles.filterButton}
          >
            <ThemedText 
              size="sm" 
              weight="semibold"
              style={{ 
                color: filterStatus === 'acknowledged' ? '#fff' : theme.colors.info 
              }}
            >
              Pris en charge ({acknowledgedCount})
            </ThemedText>
          </PressableButton>

          <PressableButton
            variant={filterStatus === 'resolved' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setFilterStatus('resolved')}
            style={styles.filterButton}
          >
            <ThemedText 
              size="sm" 
              weight="semibold"
              style={{ 
                color: filterStatus === 'resolved' ? '#fff' : theme.colors.success 
              }}
            >
              Résolu ({resolvedCount})
            </ThemedText>
          </PressableButton>
        </ScrollView>
      </ThemedView>

      {/* Liste des signalements */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText variant="secondary" size="base" style={{ marginTop: 16 }}>
            {t('common.loading') || 'Chargement...'}
          </ThemedText>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="exclamation-triangle" size={48} color={theme.colors.textSecondary} />
          <ThemedText size="lg" weight="semibold" style={styles.emptyTitle}>
            Aucun signalement
          </ThemedText>
          <ThemedText variant="secondary" size="base" style={styles.emptyText}>
            {filterStatus === 'all' 
              ? 'Aucun signalement d\'urgence pour le moment'
              : `Aucun signalement avec le statut "${getStatusBadge(filterStatus).label}"`
            }
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={renderReport}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={loadReports}
        />
      )}

      {/* Modal de détails */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDetailsModal(false);
          setSelectedReport(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalOverlayPressable} 
            onPress={() => {
              setShowDetailsModal(false);
              setSelectedReport(null);
            }} 
          />
          <ThemedCard style={styles.modalContent}>
            <ThemedView variant="transparent" style={styles.modalHeader}>
              <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
                Détails du signalement
              </ThemedText>
              <Pressable
                onPress={() => {
                  setShowDetailsModal(false);
                  setSelectedReport(null);
                }}
                style={styles.modalCloseButton}
              >
                <FontAwesome name="times" size={20} color={theme.colors.text} />
              </Pressable>
            </ThemedView>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedReport && (
                <>
                  {/* Badges */}
                  <ThemedView variant="transparent" style={styles.detailsBadges}>
                    <ThemedView 
                      variant="transparent" 
                      style={[
                        styles.detailBadge,
                        { backgroundColor: getUrgencyBadge(selectedReport.urgencyLevel).color + '20' }
                      ]}
                    >
                      <ThemedText 
                        size="sm" 
                        weight="semibold"
                        style={{ color: getUrgencyBadge(selectedReport.urgencyLevel).color }}
                      >
                        {getUrgencyBadge(selectedReport.urgencyLevel).label}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView 
                      variant="transparent" 
                      style={[
                        styles.detailBadge,
                        { backgroundColor: getStatusBadge(selectedReport.status).color + '20' }
                      ]}
                    >
                      <ThemedText 
                        size="sm" 
                        weight="semibold"
                        style={{ color: getStatusBadge(selectedReport.status).color }}
                      >
                        {getStatusBadge(selectedReport.status).label}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  {/* Type d'urgence */}
                  <ThemedView variant="transparent" style={styles.detailRow}>
                    <ThemedText variant="secondary" size="sm" style={styles.detailLabel}>
                      Type d'urgence
                    </ThemedText>
                    <ThemedText size="base" weight="semibold" style={styles.detailValue}>
                      {selectedReport.emergencyType}
                    </ThemedText>
                  </ThemedView>

                  {/* Description */}
                  <ThemedView variant="transparent" style={styles.detailRow}>
                    <ThemedText variant="secondary" size="sm" style={styles.detailLabel}>
                      Description
                    </ThemedText>
                    <ThemedText size="base" style={styles.detailValue}>
                      {selectedReport.description}
                    </ThemedText>
                  </ThemedView>

                  {/* Lieu */}
                  <ThemedView variant="transparent" style={styles.detailRow}>
                    <ThemedText variant="secondary" size="sm" style={styles.detailLabel}>
                      Lieu
                    </ThemedText>
                    <ThemedText size="base" style={styles.detailValue}>
                      {selectedReport.location}
                    </ThemedText>
                  </ThemedView>

                  {/* Contact */}
                  <ThemedView variant="transparent" style={styles.detailRow}>
                    <ThemedText variant="secondary" size="sm" style={styles.detailLabel}>
                      Numéro de contact
                    </ThemedText>
                    <ThemedText size="base" style={styles.detailValue}>
                      {selectedReport.contactPhone}
                    </ThemedText>
                  </ThemedView>

                  {/* Agent */}
                  <ThemedView variant="transparent" style={styles.detailRow}>
                    <ThemedText variant="secondary" size="sm" style={styles.detailLabel}>
                      Signalé par
                    </ThemedText>
                    <ThemedText size="base" style={styles.detailValue}>
                      {selectedReport.reportedByName || 'Agent'}
                    </ThemedText>
                    {selectedReport.reportedByEmail && (
                      <ThemedText variant="secondary" size="xs" style={styles.detailSubValue}>
                        {selectedReport.reportedByEmail}
                      </ThemedText>
                    )}
                  </ThemedView>

                  {/* Date */}
                  <ThemedView variant="transparent" style={styles.detailRow}>
                    <ThemedText variant="secondary" size="sm" style={styles.detailLabel}>
                      Date de signalement
                    </ThemedText>
                    <ThemedText size="base" style={styles.detailValue}>
                      {formatDateSafe(selectedReport.createdAt, 'dd/MM/yyyy à HH:mm')}
                    </ThemedText>
                  </ThemedView>

                  {/* Notes (si résolu) */}
                  {selectedReport.status === 'resolved' && selectedReport.notes && (
                    <ThemedView variant="transparent" style={styles.detailRow}>
                      <ThemedText variant="secondary" size="sm" style={styles.detailLabel}>
                        Notes de résolution
                      </ThemedText>
                      <ThemedText size="base" style={styles.detailValue}>
                        {selectedReport.notes}
                      </ThemedText>
                    </ThemedView>
                  )}

                  {/* Actions */}
                  <ThemedView variant="transparent" style={styles.modalActions}>
                    {selectedReport.status === 'pending' && (
                      <PressableButton
                        variant="primary"
                        size="md"
                        fullWidth
                        onPress={() => handleAcknowledge(selectedReport.id!)}
                        disabled={isProcessing}
                        style={styles.modalActionButton}
                      >
                        {isProcessing ? 'Traitement...' : 'Prendre en charge'}
                      </PressableButton>
                    )}

                    {selectedReport.status === 'acknowledged' && (
                      <PressableButton
                        variant="primary"
                        size="md"
                        fullWidth
                        onPress={() => setShowResolveModal(true)}
                        disabled={isProcessing}
                        style={[styles.modalActionButton, { backgroundColor: theme.colors.success }]}
                      >
                        Marquer comme résolu
                      </PressableButton>
                    )}
                  </ThemedView>
                </>
              )}
            </ScrollView>
          </ThemedCard>
        </View>
      </Modal>

      {/* Modal pour résoudre */}
      <Modal
        visible={showResolveModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowResolveModal(false);
          setResolveNotes('');
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalOverlayPressable} 
            onPress={() => {
              setShowResolveModal(false);
              setResolveNotes('');
            }} 
          />
          <ThemedCard style={styles.modalContent}>
            <ThemedView variant="transparent" style={styles.modalHeader}>
              <ThemedText size="lg" weight="bold" style={styles.modalTitle}>
                Résoudre le signalement
              </ThemedText>
              <Pressable
                onPress={() => {
                  setShowResolveModal(false);
                  setResolveNotes('');
                }}
                style={styles.modalCloseButton}
              >
                <FontAwesome name="times" size={20} color={theme.colors.text} />
              </Pressable>
            </ThemedView>

            <ThemedView variant="transparent" style={styles.resolveForm}>
              <ThemedText variant="secondary" size="sm" style={styles.resolveLabel}>
                Notes (optionnel)
              </ThemedText>
              <ThemedInput
                placeholder="Ajouter des notes sur la résolution..."
                value={resolveNotes}
                onChangeText={setResolveNotes}
                multiline
                numberOfLines={4}
                style={styles.resolveInput}
              />

              <ThemedView variant="transparent" style={styles.resolveActions}>
                <PressableButton
                  variant="outline"
                  size="md"
                  onPress={() => {
                    setShowResolveModal(false);
                    setResolveNotes('');
                  }}
                  style={styles.resolveButton}
                >
                  {t('common.cancel')}
                </PressableButton>

                <PressableButton
                  variant="primary"
                  size="md"
                  onPress={handleResolve}
                  disabled={isProcessing}
                  style={[styles.resolveButton, { backgroundColor: theme.colors.success }]}
                >
                  {isProcessing ? 'Traitement...' : 'Résoudre'}
                </PressableButton>
              </ThemedView>
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
    // No specific styles needed
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportHeaderLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reportType: {
    marginBottom: 8,
  },
  reportDescription: {
    marginBottom: 12,
    lineHeight: 18,
  },
  reportInfo: {
    gap: 6,
  },
  reportInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportInfoText: {
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
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
  detailsBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  detailBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    marginBottom: 4,
  },
  detailValue: {
    // No specific styles needed
  },
  detailSubValue: {
    marginTop: 2,
  },
  modalActions: {
    marginTop: 24,
    gap: 12,
  },
  modalActionButton: {
    // Styles handled by PressableButton
  },
  resolveForm: {
    marginTop: 8,
  },
  resolveLabel: {
    marginBottom: 8,
  },
  resolveInput: {
    marginBottom: 20,
    minHeight: 100,
  },
  resolveActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resolveButton: {
    flex: 1,
  },
});

