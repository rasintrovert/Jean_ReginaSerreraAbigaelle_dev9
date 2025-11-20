import { PressableButton } from '@/components/PressableButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedCard, ThemedText, ThemedView } from '@/components/ThemedComponents';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { getRecordsForValidation } from '@/services/admin/adminService';
import { firestore } from '@/services/firebase/config';
import { useTheme } from '@/theme';
import { formatDateSafe } from '@/utils/date';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CertificateStatus = 'pending' | 'verified' | 'approved' | 'issued' | 'rejected';
type FilterStatus = 'all' | CertificateStatus;

interface Certificate {
  id: string;
  firestoreId: string;
  type: 'birth';
  childName: string;
  motherName: string;
  fatherName?: string;
  birthDate: string;
  certificateStatus: CertificateStatus;
  certificateNumber?: string;
  createdAt: any;
}

export default function CertificatesManagementScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { isTablet } = useResponsive();
  const [isLoading, setIsLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      const allBirths = await getRecordsForValidation('birth');

      // Filtrer uniquement les naissances validées
      const validatedBirths = allBirths.filter(
        (r: any) => r.validationStatus === 'validated'
      );

      // Transformer en format Certificate
      const certs: Certificate[] = validatedBirths.map((b: any) => {
        const childName = b.childFirstNames && b.childLastName
          ? [...b.childFirstNames, b.childLastName].join(' ')
          : b.childName || 'N/A';
        
        const motherName = b.motherFirstNames && b.motherLastName
          ? [...b.motherFirstNames, b.motherLastName].join(' ')
          : b.motherName || 'N/A';
        
        const fatherName = b.fatherFirstNames && b.fatherLastName
          ? [...b.fatherFirstNames, b.fatherLastName].join(' ')
          : b.fatherName || undefined;

        return {
          id: b.id || b.firestoreId || '',
          firestoreId: b.firestoreId || b.id,
          type: 'birth' as const,
          childName,
          motherName,
          fatherName,
          birthDate: b.birthDate || '',
          certificateStatus: (b.certificateStatus || 'pending') as CertificateStatus,
          certificateNumber: b.certificateNumber,
          createdAt: b.createdAt,
        };
      });

      // Trier par date (plus récent en premier)
      certs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setCertificates(certs);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCertificateStatus = async (certId: string, newStatus: CertificateStatus) => {
    try {
      setIsProcessing(true);
      const cert = certificates.find(c => c.firestoreId === certId);
      if (!cert) return;

      const docRef = doc(firestore, 'births', certId);
      await updateDoc(docRef, {
        certificateStatus: newStatus,
        updatedAt: Timestamp.now(),
        ...(newStatus === 'issued' && !cert.certificateNumber && {
          certificateNumber: `CERT-${new Date().getFullYear()}-${String(certId).slice(-8).toUpperCase()}`,
        }),
      });

      Alert.alert('Succès', 'Statut du certificat mis à jour');
      await loadCertificates();
      setShowDetailsModal(false);
      setSelectedCertificate(null);
    } catch (error) {
      console.error('Error updating certificate status:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: CertificateStatus) => {
    switch (status) {
      case 'pending':
        return { color: theme.colors.warning, label: 'En attente' };
      case 'verified':
        return { color: theme.colors.info, label: 'Vérifié' };
      case 'approved':
        return { color: theme.colors.success, label: 'Approuvé' };
      case 'issued':
        return { color: theme.colors.primary, label: 'Émis' };
      case 'rejected':
        return { color: theme.colors.error, label: 'Rejeté' };
      default:
        return { color: theme.colors.textSecondary, label: status };
    }
  };

  const filteredCertificates = filterStatus === 'all'
    ? certificates
    : certificates.filter(c => c.certificateStatus === filterStatus);

  const renderCertificateCard = ({ item }: { item: Certificate }) => {
    const statusBadge = getStatusBadge(item.certificateStatus);
    
    return (
      <ThemedCard style={styles.certificateCard}>
        <ThemedView variant="transparent" style={styles.cardHeader}>
          <ThemedView variant="transparent" style={styles.cardHeaderLeft}>
            <ThemedView
              variant="transparent"
              style={StyleSheet.flatten([
                styles.statusBadge,
                { backgroundColor: statusBadge.color + '20' }
              ])}
            >
              <ThemedText
                size="xs"
                weight="semibold"
                style={{ color: statusBadge.color }}
              >
                {statusBadge.label}
              </ThemedText>
            </ThemedView>
            {item.certificateNumber && (
              <ThemedText variant="secondary" size="sm" style={styles.certNumber}>
                {item.certificateNumber}
              </ThemedText>
            )}
          </ThemedView>
          <Pressable
            onPress={() => {
              setSelectedCertificate(item);
              setShowDetailsModal(true);
            }}
            style={styles.viewButton}
          >
            <FontAwesome name="eye" size={16} color={theme.colors.primary} />
          </Pressable>
        </ThemedView>

        <ThemedView variant="transparent" style={styles.cardContent}>
          <ThemedText size="base" weight="bold" style={styles.childName}>
            {item.childName}
          </ThemedText>
          <ThemedText variant="secondary" size="sm" style={styles.parents}>
            {item.motherName}
            {item.fatherName && ` & ${item.fatherName}`}
          </ThemedText>
          <ThemedView variant="transparent" style={styles.dateRow}>
            <FontAwesome name="calendar" size={12} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" size="sm" style={styles.date}>
              Naissance: {formatDateSafe(item.birthDate, 'dd MMMM yyyy') || item.birthDate}
            </ThemedText>
          </ThemedView>
        </ThemedView>
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
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <ThemedView variant="transparent" style={styles.headerText}>
          <ThemedText size="xl" weight="bold" style={StyleSheet.flatten([styles.headerTitle, { color: '#fff' }])}>
            Gestion des certificats
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Filtres */}
      <ThemedView variant="transparent" style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {(['all', 'pending', 'verified', 'approved', 'issued', 'rejected'] as FilterStatus[]).map((status) => (
            <Pressable
              key={status}
              onPress={() => setFilterStatus(status)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filterStatus === status
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: filterStatus === status
                    ? theme.colors.primary
                    : theme.colors.border,
                }
              ]}
            >
              <ThemedText
                size="sm"
                weight={filterStatus === status ? 'semibold' : 'normal'}
                style={{
                  color: filterStatus === status ? '#fff' : theme.colors.text,
                }}
              >
                {status === 'all' ? 'Tous' :
                 status === 'pending' ? 'En attente' :
                 status === 'verified' ? 'Vérifiés' :
                 status === 'approved' ? 'Approuvés' :
                 status === 'issued' ? 'Émis' : 'Rejetés'}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Liste des certificats */}
      {isLoading ? (
        <ThemedView variant="transparent" style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText variant="secondary" size="base" style={styles.loadingText}>
            Chargement...
          </ThemedText>
        </ThemedView>
      ) : filteredCertificates.length === 0 ? (
        <ThemedCard style={styles.emptyCard}>
          <ThemedView variant="transparent" style={styles.emptyContent}>
            <FontAwesome name="file-text-o" size={64} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" size="base" style={styles.emptyText}>
              Aucun certificat trouvé
            </ThemedText>
          </ThemedView>
        </ThemedCard>
      ) : (
        <FlatList
          data={filteredCertificates}
          keyExtractor={(item) => item.firestoreId}
          renderItem={renderCertificateCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={true}
        />
      )}

      {/* Modal de détails */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDetailsModal(false);
          setSelectedCertificate(null);
        }}
      >
        <ThemedView variant="transparent" style={styles.modalOverlay}>
          <ThemedCard style={styles.modalContent}>
            <ThemedView variant="transparent" style={styles.modalHeader}>
              <ThemedText size="lg" weight="bold">
                Détails du certificat
              </ThemedText>
              <Pressable
                onPress={() => {
                  setShowDetailsModal(false);
                  setSelectedCertificate(null);
                }}
                style={styles.modalCloseButton}
              >
                <FontAwesome name="times" size={20} color={theme.colors.text} />
              </Pressable>
            </ThemedView>

            {selectedCertificate && (
              <ScrollView style={styles.modalBody}>
                <ThemedView variant="transparent" style={styles.detailRow}>
                  <ThemedText variant="secondary" size="sm">Enfant:</ThemedText>
                  <ThemedText size="base" weight="semibold">{selectedCertificate.childName}</ThemedText>
                </ThemedView>
                <ThemedView variant="transparent" style={styles.detailRow}>
                  <ThemedText variant="secondary" size="sm">Mère:</ThemedText>
                  <ThemedText size="base">{selectedCertificate.motherName}</ThemedText>
                </ThemedView>
                {selectedCertificate.fatherName && (
                  <ThemedView variant="transparent" style={styles.detailRow}>
                    <ThemedText variant="secondary" size="sm">Père:</ThemedText>
                    <ThemedText size="base">{selectedCertificate.fatherName}</ThemedText>
                  </ThemedView>
                )}
                <ThemedView variant="transparent" style={styles.detailRow}>
                  <ThemedText variant="secondary" size="sm">Date de naissance:</ThemedText>
                  <ThemedText size="base">
                    {formatDateSafe(selectedCertificate.birthDate, 'dd MMMM yyyy') || selectedCertificate.birthDate}
                  </ThemedText>
                </ThemedView>
                <ThemedView variant="transparent" style={styles.detailRow}>
                  <ThemedText variant="secondary" size="sm">Statut:</ThemedText>
                  <ThemedView
                    variant="transparent"
                    style={StyleSheet.flatten([
                      styles.statusBadge,
                      { backgroundColor: getStatusBadge(selectedCertificate.certificateStatus).color + '20' }
                    ])}
                  >
                    <ThemedText
                      size="sm"
                      weight="semibold"
                      style={{ color: getStatusBadge(selectedCertificate.certificateStatus).color }}
                    >
                      {getStatusBadge(selectedCertificate.certificateStatus).label}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                {selectedCertificate.certificateNumber && (
                  <ThemedView variant="transparent" style={styles.detailRow}>
                    <ThemedText variant="secondary" size="sm">Numéro de certificat:</ThemedText>
                    <ThemedText size="base" weight="semibold">{selectedCertificate.certificateNumber}</ThemedText>
                  </ThemedView>
                )}

                <ThemedView variant="transparent" style={styles.actionsContainer}>
                  <ThemedText size="sm" weight="semibold" style={styles.actionsTitle}>
                    Changer le statut:
                  </ThemedText>
                  {selectedCertificate.certificateStatus !== 'verified' && (
                    <PressableButton
                      label="Marquer comme vérifié"
                      variant="outline"
                      size="md"
                      onPress={() => updateCertificateStatus(selectedCertificate.firestoreId, 'verified')}
                      disabled={isProcessing}
                      style={styles.actionButton}
                    />
                  )}
                  {selectedCertificate.certificateStatus !== 'approved' && (
                    <PressableButton
                      label="Approuver"
                      variant="outline"
                      size="md"
                      onPress={() => updateCertificateStatus(selectedCertificate.firestoreId, 'approved')}
                      disabled={isProcessing}
                      style={styles.actionButton}
                    />
                  )}
                  {selectedCertificate.certificateStatus !== 'issued' && (
                    <PressableButton
                      label="Émettre le certificat"
                      variant="primary"
                      size="md"
                      onPress={() => updateCertificateStatus(selectedCertificate.firestoreId, 'issued')}
                      disabled={isProcessing}
                      style={styles.actionButton}
                    />
                  )}
                  {selectedCertificate.certificateStatus !== 'rejected' && (
                    <PressableButton
                      label="Rejeter"
                      variant="outline"
                      size="md"
                      onPress={() => {
                        Alert.alert(
                          'Rejeter le certificat',
                          'Êtes-vous sûr de vouloir rejeter ce certificat ?',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            {
                              text: 'Rejeter',
                              style: 'destructive',
                              onPress: () => updateCertificateStatus(selectedCertificate.firestoreId, 'rejected'),
                            },
                          ]
                        );
                      }}
                      disabled={isProcessing}
                      style={StyleSheet.flatten([styles.actionButton, { borderColor: theme.colors.error }])}
                    />
                  )}
                </ThemedView>
              </ScrollView>
            )}
          </ThemedCard>
        </ThemedView>
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
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
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
  listContent: {
    padding: 16,
  },
  certificateCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  certNumber: {
    fontFamily: 'monospace',
  },
  viewButton: {
    padding: 8,
  },
  cardContent: {
    gap: 8,
  },
  childName: {
    marginBottom: 4,
  },
  parents: {
    fontStyle: 'italic',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  date: {},
  emptyCard: {
    marginTop: 48,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    padding: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  actionsContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionsTitle: {
    marginBottom: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});
