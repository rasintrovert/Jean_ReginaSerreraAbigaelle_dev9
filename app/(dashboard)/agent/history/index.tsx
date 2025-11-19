import {
  ThemedButton,
  ThemedCard,
  ThemedInput,
  ThemedText,
  ThemedView
} from '@/components/ThemedComponents';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ProofDocument } from '@/components/ProofDocument';
import { useOrientation } from '@/hooks/useOrientation';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { usePregnancyStore } from '@/store/pregnancyStore';
import { useBirthStore } from '@/store/birthStore';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Pressable } from 'react-native';

// Types pour les données
interface Proof {
  id: string;
  type: 'pregnancy' | 'birth';
  referenceNumber: string;
  generationDate: string;
  personName: string; // Nom de la personne concernée (mère pour grossesse, enfant pour naissance)
  status: 'valid' | 'pending';
  createdAt: string; // Date originale pour le tri
}

export default function AgentHistory() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const { isLandscape } = useOrientation();
  const t = useTranslation();
  const { pregnancies, isLoading: isLoadingPregnancies } = usePregnancyStore();
  const { births, isLoading: isLoadingBirths } = useBirthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'pregnancy' | 'birth'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'pending'>('all');
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);

  const isLoading = isLoadingPregnancies || isLoadingBirths;

  // Transformer les données des stores en format Proof
  const proofs: Proof[] = useMemo(() => {
    const allProofs: Proof[] = [];

    // Ajouter les grossesses
    pregnancies.forEach((pregnancy) => {
      try {
        const date = new Date(pregnancy.createdAt);
        const formattedDate = isNaN(date.getTime()) 
          ? new Date().toLocaleDateString('fr-FR')
          : date.toLocaleDateString('fr-FR');
        
        allProofs.push({
          id: pregnancy.id,
          type: 'pregnancy' as const,
          referenceNumber: `PREGN-${pregnancy.id.slice(-8)}`,
          generationDate: formattedDate,
          personName: pregnancy.motherName || 'N/A',
          status: pregnancy.status === 'synced' ? 'valid' : 'pending',
          createdAt: pregnancy.createdAt, // Garder la date originale pour le tri
        });
      } catch (error) {
        console.error('Error processing pregnancy:', error);
      }
    });

    // Ajouter les naissances
    births.forEach((birth) => {
      try {
        const date = new Date(birth.createdAt);
        const formattedDate = isNaN(date.getTime()) 
          ? new Date().toLocaleDateString('fr-FR')
          : date.toLocaleDateString('fr-FR');
        
        // Pour les naissances, utiliser le nom complet de l'enfant (prénom + nom)
        const childFullName = birth.childFirstName && birth.childName 
          ? `${birth.childFirstName} ${birth.childName}`.trim()
          : birth.childName || birth.childFirstName || 'N/A';
        
        allProofs.push({
          id: birth.id,
          type: 'birth' as const,
          referenceNumber: `BIRTH-${birth.id.slice(-8)}`,
          generationDate: formattedDate,
          personName: childFullName,
          status: birth.synced ? 'valid' : 'pending',
          createdAt: birth.createdAt, // Garder la date originale pour le tri
        });
      } catch (error) {
        console.error('Error processing birth:', error);
      }
    });

    // Trier par date (plus récent en premier) - utiliser createdAt directement
    return allProofs.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Plus récent en premier
    });
  }, [pregnancies, births]);

  const filteredProofs = proofs.filter(proof => {
    const matchesSearch = proof.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proof.generationDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proof.personName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || proof.type === filterType;
    const matchesStatus = filterStatus === 'all' || proof.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: Proof['type']) => {
    return type === 'pregnancy' ? 'heart' : 'child';
  };

  const getTypeColor = (type: Proof['type']) => {
    return type === 'pregnancy' ? theme.colors.success : theme.colors.primary;
  };

  const getTypeLabel = (type: Proof['type']) => {
    return type === 'pregnancy' ? t('agent.history.proofType.pregnancy') : t('agent.history.proofType.birth');
  };

  const getStatusColor = (status: Proof['status']) => {
    return status === 'valid' ? theme.colors.success : theme.colors.warning;
  };

  const getStatusLabel = (status: Proof['status']) => {
    return status === 'valid' ? t('agent.history.statusValid') : t('agent.history.statusPending');
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleViewProof = (proof: Proof) => {
    setSelectedProof(proof);
    setShowProofModal(true);
  };

  const getProofData = (proof: Proof) => {
    if (proof.type === 'pregnancy') {
      const pregnancy = pregnancies.find(p => p.id === proof.id);
      return {
        pregnancyData: {
          motherName: pregnancy?.motherName || proof.personName,
          location: pregnancy?.location,
          estimatedDeliveryDate: pregnancy?.lastMenstruationDate 
            ? new Date(pregnancy.lastMenstruationDate).toLocaleDateString('fr-FR')
            : undefined,
        },
      };
    } else {
      const birth = births.find(b => b.id === proof.id);
      return {
        birthData: {
          childName: birth?.childName || '',
          childFirstName: birth?.childFirstName || '',
          birthDate: birth?.birthDate || '',
          birthPlace: birth?.birthPlace,
          motherName: birth?.motherName || '',
          fatherName: birth?.fatherName,
        },
      };
    }
  };

  const handleFilterApply = () => {
    setShowFilterModal(false);
  };

  return (
    <ScreenContainer variant="background">
      {/* 1️⃣ En-tête et barre de navigation supérieure */}
      <ThemedView 
        variant="transparent"
        style={StyleSheet.flatten([styles.header, { backgroundColor: theme.colors.primary }])}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 }
          ]}
          onPress={handleBackPress}
          accessibilityLabel={t('common.back')}
          accessibilityHint={t('common.back')}
        >
          <FontAwesome 
            name="arrow-left" 
            size={isTablet ? 24 : 20} 
            color="#fff" 
          />
        </Pressable>
        
        <ThemedText 
          size="lg" 
          weight="bold" 
          style={StyleSheet.flatten([styles.headerTitle, { color: '#fff' }])}
        >
          {t('agent.history.title')}
        </ThemedText>
        
        <Pressable
          style={({ pressed }) => [
            styles.filterButton,
            pressed && { opacity: 0.7 }
          ]}
          onPress={handleFilterPress}
          accessibilityLabel={t('common.filter')}
          accessibilityHint={t('agent.history.filters')}
        >
          <FontAwesome 
            name="filter" 
            size={isTablet ? 24 : 20} 
            color="#fff" 
          />
        </Pressable>
      </ThemedView>

      {/* 2️⃣ Zone de recherche */}
      <ThemedCard style={styles.searchCard}>
        <ThemedView style={{ ...styles.searchContainer, backgroundColor: theme.colors.background }}>
          <FontAwesome 
            name="search" 
            size={16} 
            color={theme.colors.textSecondary} 
            style={styles.searchIcon}
          />
          <ThemedInput
            placeholder={t('agent.history.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            size="md"
            style={styles.searchInput}
            accessibilityLabel={t('common.search')}
            accessibilityHint={t('agent.history.searchHint')}
          />
        </ThemedView>
      </ThemedCard>

      {/* 3️⃣ Section de liste - Aperçu des preuves générées avec FlatList */}
      <ThemedView style={styles.proofsSection}>
        <ThemedText 
          size="base" 
          weight="semibold" 
          style={styles.sectionTitle}
        >
          {t('agent.history.title')} ({filteredProofs.length})
        </ThemedText>
        
        {filteredProofs.length === 0 ? (
          <ThemedCard style={styles.emptyCard}>
            <FontAwesome 
              name="file-text-o" 
              size={48} 
              color={theme.colors.textSecondary} 
              style={styles.emptyIcon}
            />
            <ThemedText 
              variant="secondary" 
              size="base"
              style={styles.emptyText}
            >
              {t('agent.history.noProofs')}
            </ThemedText>
            <ThemedText 
              variant="secondary" 
              size="sm"
              style={styles.emptySubtext}
            >
              {t('agent.history.searchHint')}
            </ThemedText>
          </ThemedCard>
        ) : (
          <FlatList
            data={filteredProofs}
            keyExtractor={(item) => item.id}
            renderItem={({ item: proof }) => (
              <ThemedCard 
                style={styles.proofCard}
              >
                {/* a) En-tête de la carte */}
                <ThemedView style={{ ...styles.proofHeader, backgroundColor: 'transparent' }}>
                  <ThemedView style={{ ...styles.proofIcon, backgroundColor: getTypeColor(proof.type) + '20' }}>
                    <FontAwesome 
                      name={getTypeIcon(proof.type)} 
                      size={isTablet ? 24 : 20} 
                      color={getTypeColor(proof.type)} 
                    />
                  </ThemedView>
                  <ThemedView style={{ ...styles.proofTypeContainer, backgroundColor: 'transparent' }}>
                    <ThemedText 
                      size="base" 
                      weight="semibold"
                      style={styles.proofTypeLabel}
                    >
                      {getTypeLabel(proof.type)}
                    </ThemedText>
                    <ThemedView style={{ ...styles.statusBadge, backgroundColor: getStatusColor(proof.status) + '20' }}>
                      <ThemedText 
                        size="xs" 
                        weight="semibold"
                        style={{ color: getStatusColor(proof.status) }}
                      >
                        {getStatusLabel(proof.status)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>

                {/* b) Contenu principal (données essentielles) */}
                <ThemedView style={{ ...styles.proofContent, backgroundColor: 'transparent' }}>
                  <ThemedView style={{ ...styles.proofInfoRow, backgroundColor: 'transparent' }}>
                    <FontAwesome 
                      name="hashtag" 
                      size={14} 
                      color={theme.colors.textSecondary} 
                      style={styles.infoIcon}
                    />
                    <ThemedText 
                      variant="secondary" 
                      size="sm"
                      style={styles.infoText}
                    >
                      {proof.referenceNumber}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={{ ...styles.proofInfoRow, backgroundColor: 'transparent' }}>
                    <FontAwesome 
                      name="calendar" 
                      size={14} 
                      color={theme.colors.textSecondary} 
                      style={styles.infoIcon}
                    />
                    <ThemedText 
                      variant="secondary" 
                      size="sm"
                      style={styles.infoText}
                    >
                      {t('agent.history.generationDate')}: {proof.generationDate}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={{ ...styles.proofInfoRow, backgroundColor: 'transparent' }}>
                    <FontAwesome 
                      name="user" 
                      size={14} 
                      color={theme.colors.textSecondary} 
                      style={styles.infoIcon}
                    />
                    <ThemedText 
                      variant="secondary" 
                      size="sm"
                      style={styles.infoText}
                    >
                      {proof.type === 'pregnancy' 
                        ? `Mère: ${proof.personName}`
                        : `Enfant: ${proof.personName}`
                      }
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {/* c) Bouton d'action */}
                <ThemedView style={{ ...styles.proofActions, backgroundColor: 'transparent' }}>
                  <ThemedButton
                    variant="outline"
                    size="sm"
                    onPress={() => handleViewProof(proof)}
                    accessibilityLabel={t('agent.history.viewProof')}
                    accessibilityHint={t('agent.history.viewProof')}
                    style={styles.viewProofButton}
                  >
                    <FontAwesome name="eye" size={12} color={theme.colors.primary} />
                    <ThemedText size="xs" style={{ color: theme.colors.primary, marginLeft: 6 }}>
                      {t('agent.history.viewProof')}
                    </ThemedText>
                  </ThemedButton>
                </ThemedView>
              </ThemedCard>
            )}
            contentContainerStyle={[
              styles.flatListContent,
              isTablet && styles.flatListContentTablet
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ThemedCard style={styles.emptyCard}>
                <FontAwesome 
                  name="file-text-o" 
                  size={48} 
                  color={theme.colors.textSecondary} 
                  style={styles.emptyIcon}
                />
                <ThemedText 
                  variant="secondary" 
                  size="base"
                  style={styles.emptyText}
                >
                  {t('agent.history.noProofs')}
                </ThemedText>
              </ThemedCard>
            }
          />
        )}
      </ThemedView>

      {/* Modal de filtrage */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={{ ...styles.modalContent, backgroundColor: theme.colors.surface }}>
            <ThemedText 
              size="lg" 
              weight="bold" 
              style={styles.modalTitle}
            >
              {t('agent.history.filters')}
            </ThemedText>
            
            <ThemedView style={{ ...styles.filterSection, backgroundColor: 'transparent' }}>
              <ThemedText 
                size="base" 
                weight="semibold" 
                style={styles.filterSectionTitle}
              >
                {t('agent.history.filterType')}
              </ThemedText>
              <ThemedView style={{ ...styles.filterButtons, backgroundColor: 'transparent' }}>
                {[
                  { key: 'all', label: t('agent.history.typeAll') },
                  { key: 'pregnancy', label: t('agent.history.typePregnancy') },
                  { key: 'birth', label: t('agent.history.typeBirth') },
                ].map((filter) => (
                  <ThemedButton
                    key={filter.key}
                    variant={filterType === filter.key ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => setFilterType(filter.key as any)}
                    style={styles.modalFilterButton}
                  >
                    <ThemedText 
                      size="xs" 
                      weight="semibold"
                      style={{ 
                        color: filterType === filter.key ? '#fff' : theme.colors.primary 
                      }}
                    >
                      {filter.label}
                    </ThemedText>
                  </ThemedButton>
                ))}
              </ThemedView>
            </ThemedView>

            <ThemedView style={{ ...styles.filterSection, backgroundColor: 'transparent' }}>
              <ThemedText 
                size="base" 
                weight="semibold" 
                style={styles.filterSectionTitle}
              >
                {t('agent.history.filterStatus')}
              </ThemedText>
              <ThemedView style={{ ...styles.filterButtons, backgroundColor: 'transparent' }}>
                {[
                  { key: 'all', label: t('agent.history.statusAll') },
                  { key: 'valid', label: t('agent.history.statusValid') },
                  { key: 'pending', label: t('agent.history.statusPending') },
                ].map((filter) => (
                  <ThemedButton
                    key={filter.key}
                    variant={filterStatus === filter.key ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => setFilterStatus(filter.key as any)}
                    style={styles.modalFilterButton}
                  >
                    <ThemedText 
                      size="xs" 
                      weight="semibold"
                      style={{ 
                        color: filterStatus === filter.key ? '#fff' : theme.colors.primary 
                      }}
                    >
                      {filter.label}
                    </ThemedText>
                  </ThemedButton>
                ))}
              </ThemedView>
            </ThemedView>

            <ThemedView style={{ ...styles.modalActions, backgroundColor: 'transparent' }}>
              <ThemedButton
                variant="outline"
                size="md"
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCancelButton}
              >
                <ThemedText size="sm" style={{ color: theme.colors.textSecondary }}>
                  {t('common.cancel')}
                </ThemedText>
              </ThemedButton>
              <ThemedButton
                variant="primary"
                size="md"
                onPress={handleFilterApply}
                style={styles.modalApplyButton}
              >
                <ThemedText size="sm" style={{ color: '#fff' }}>
                  {t('common.confirm')}
                </ThemedText>
              </ThemedButton>
            </ThemedView>
            </ThemedView>
          </ThemedView>
        </Modal>

      {/* Modal pour afficher le document professionnel */}
      <Modal
        visible={showProofModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowProofModal(false)}
      >
        <ScreenContainer variant="background">
          <ThemedView style={styles.proofModalHeader}>
            <Pressable
              onPress={() => setShowProofModal(false)}
              style={styles.proofModalCloseButton}
            >
              <FontAwesome name="times" size={24} color={theme.colors.text} />
            </Pressable>
            <ThemedText size="lg" weight="bold" style={styles.proofModalTitle}>
              {selectedProof ? getTypeLabel(selectedProof.type) : ''}
            </ThemedText>
            <ThemedView style={{ width: 40 }} />
          </ThemedView>
          
          {selectedProof && (
            <ProofDocument
              type={selectedProof.type}
              referenceNumber={selectedProof.referenceNumber}
              generationDate={selectedProof.generationDate}
              personName={selectedProof.personName}
              status={selectedProof.status}
              {...getProofData(selectedProof)}
            />
          )}
        </ScreenContainer>
      </Modal>
      </ScreenContainer>
    );
  }

const styles = StyleSheet.create({
  flatListContent: {
    padding: 16,
    paddingBottom: 100, // Espace pour la navigation inférieure
  },
  flatListContentTablet: {
    paddingHorizontal: 24,
    maxWidth: 600,
    alignSelf: 'center',
  },
  
  // 1️⃣ En-tête et barre de navigation supérieure
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 117, 125, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 117, 125, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 2️⃣ Zone de recherche
  searchCard: {
    marginBottom: 16,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
  },
  
  // 3️⃣ Section de liste - Aperçu des preuves générées
  proofsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  
  // 🪪 Structure d'une carte de preuve
  proofCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // a) En-tête de la carte
  proofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  proofIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  proofTypeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proofTypeLabel: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  // b) Contenu principal (données essentielles)
  proofContent: {
    marginBottom: 16,
    gap: 8,
  },
  proofInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
    width: 16,
  },
  infoText: {
    flex: 1,
    lineHeight: 16,
  },
  
  // c) Bouton d'action
  proofActions: {
    alignItems: 'flex-end',
  },
  viewProofButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  // Empty State
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Modal de filtrage
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modalFilterButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalApplyButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // Modal de preuve
  proofModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  proofModalCloseButton: {
    padding: 8,
  },
  proofModalTitle: {
    flex: 1,
    textAlign: 'center',
  },
});

