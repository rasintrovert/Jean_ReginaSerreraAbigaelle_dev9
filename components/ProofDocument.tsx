import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedCard, ThemedText, ThemedView } from '@/components/ThemedComponents';
import { useTheme } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { FontAwesome } from '@expo/vector-icons';

interface ProofDocumentProps {
  type: 'pregnancy' | 'birth';
  referenceNumber: string;
  generationDate: string;
  personName: string;
  status: 'valid' | 'pending';
  // Données supplémentaires pour grossesse
  pregnancyData?: {
    motherName: string;
    location?: string;
    estimatedDeliveryDate?: string;
  };
  // Données supplémentaires pour naissance
  birthData?: {
    childName: string;
    childFirstName: string;
    birthDate: string;
    birthPlace?: string;
    motherName: string;
    fatherName?: string;
  };
}

export function ProofDocument({
  type,
  referenceNumber,
  generationDate,
  personName,
  status,
  pregnancyData,
  birthData,
}: ProofDocumentProps) {
  const theme = useTheme();
  const t = useTranslation();

  const isPregnancy = type === 'pregnancy';

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <ThemedCard style={styles.document}>
        {/* En-tête officiel */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.logoContainer}>
            <FontAwesome 
              name={isPregnancy ? 'heart' : 'child'} 
              size={40} 
              color={theme.colors.primary} 
            />
          </ThemedView>
          <ThemedText 
            size="xl" 
            weight="bold" 
            style={[styles.title, { color: theme.colors.primary }]}
          >
            RÉPUBLIQUE D'HAÏTI
          </ThemedText>
          <ThemedText 
            size="lg" 
            weight="semibold"
            style={styles.subtitle}
          >
            {isPregnancy ? 'ATTESTATION DE GROSSESSE' : 'ATTESTATION DE NAISSANCE'}
          </ThemedText>
          <ThemedText 
            size="sm" 
            variant="secondary"
            style={styles.subtitle2}
          >
            Document Provisoire
          </ThemedText>
        </ThemedView>

        {/* Corps du document */}
        <ThemedView style={styles.body}>
          <ThemedText size="base" style={styles.paragraph}>
            Je soussigné(e), <ThemedText weight="semibold">Agent de Terrain</ThemedText> du système GraceRegistry,
          </ThemedText>

          <ThemedText size="base" style={styles.paragraph}>
            <ThemedText weight="semibold">ATTESTE</ThemedText> avoir enregistré {isPregnancy ? 'la grossesse' : 'la naissance'} suivante :
          </ThemedText>

          {/* Informations principales */}
          <ThemedView style={styles.infoSection}>
            {isPregnancy ? (
              <>
                <ThemedView style={styles.infoRow}>
                  <ThemedText size="base" weight="semibold" style={styles.infoLabel}>
                    Nom de la mère :
                  </ThemedText>
                  <ThemedText size="base" style={styles.infoValue}>
                    {pregnancyData?.motherName || personName}
                  </ThemedText>
                </ThemedView>
                
                {pregnancyData?.location && (
                  <ThemedView style={styles.infoRow}>
                    <ThemedText size="base" weight="semibold" style={styles.infoLabel}>
                      Lieu :
                    </ThemedText>
                    <ThemedText size="base" style={styles.infoValue}>
                      {pregnancyData.location}
                    </ThemedText>
                  </ThemedView>
                )}

                {pregnancyData?.estimatedDeliveryDate && (
                  <ThemedView style={styles.infoRow}>
                    <ThemedText size="base" weight="semibold" style={styles.infoLabel}>
                      Date prévue d'accouchement :
                    </ThemedText>
                    <ThemedText size="base" style={styles.infoValue}>
                      {pregnancyData.estimatedDeliveryDate}
                    </ThemedText>
                  </ThemedView>
                )}
              </>
            ) : (
              <>
                <ThemedView style={styles.infoRow}>
                  <ThemedText size="base" weight="semibold" style={styles.infoLabel}>
                    Nom de l'enfant :
                  </ThemedText>
                  <ThemedText size="base" style={styles.infoValue}>
                    {birthData?.childFirstName && birthData?.childName
                      ? `${birthData.childFirstName} ${birthData.childName}`
                      : birthData?.childName || personName}
                  </ThemedText>
                </ThemedView>

                {birthData?.birthDate && (
                  <ThemedView style={styles.infoRow}>
                    <ThemedText size="base" weight="semibold" style={styles.infoLabel}>
                      Date de naissance :
                    </ThemedText>
                    <ThemedText size="base" style={styles.infoValue}>
                      {new Date(birthData.birthDate).toLocaleDateString('fr-FR')}
                    </ThemedText>
                  </ThemedView>
                )}

                {birthData?.birthPlace && (
                  <ThemedView style={styles.infoRow}>
                    <ThemedText size="base" weight="semibold" style={styles.infoLabel}>
                      Lieu de naissance :
                    </ThemedText>
                    <ThemedText size="base" style={styles.infoValue}>
                      {birthData.birthPlace}
                    </ThemedText>
                  </ThemedView>
                )}

                {birthData?.motherName && (
                  <ThemedView style={styles.infoRow}>
                    <ThemedText size="base" weight="semibold" style={styles.infoLabel}>
                      Nom de la mère :
                    </ThemedText>
                    <ThemedText size="base" style={styles.infoValue}>
                      {birthData.motherName}
                    </ThemedText>
                  </ThemedView>
                )}

                {birthData?.fatherName && (
                  <ThemedView style={styles.infoRow}>
                    <ThemedText size="base" weight="semibold" style={styles.infoLabel}>
                      Nom du père :
                    </ThemedText>
                    <ThemedText size="base" style={styles.infoValue}>
                      {birthData.fatherName}
                    </ThemedText>
                  </ThemedView>
                )}
              </>
            )}
          </ThemedView>

          {/* Référence */}
          <ThemedView style={styles.referenceSection}>
            <ThemedText size="sm" variant="secondary" style={styles.referenceLabel}>
              Numéro de référence :
            </ThemedText>
            <ThemedText size="base" weight="semibold" style={[styles.referenceNumber, { color: theme.colors.primary }]}>
              {referenceNumber}
            </ThemedText>
          </ThemedView>

          {/* Date de génération */}
          <ThemedView style={styles.dateSection}>
            <ThemedText size="sm" variant="secondary">
              Date de génération : {generationDate}
            </ThemedText>
          </ThemedView>

          {/* Statut */}
          <ThemedView style={styles.statusSection}>
            <ThemedView 
              style={[
                styles.statusBadge,
                { backgroundColor: status === 'valid' ? theme.colors.success + '20' : theme.colors.warning + '20' }
              ]}
            >
              <ThemedText 
                size="sm" 
                weight="semibold"
                style={{ color: status === 'valid' ? theme.colors.success : theme.colors.warning }}
              >
                {status === 'valid' ? '✓ Validé' : '⏳ En attente de validation'}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Avertissement */}
          <ThemedView style={styles.warningSection}>
            <ThemedText size="xs" variant="secondary" style={styles.warningText}>
              ⚠️ Ce document est provisoire et en attente de validation officielle par l'administration.
              Le certificat officiel sera émis après validation.
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Pied de page */}
        <ThemedView style={styles.footer}>
          <ThemedText size="xs" variant="secondary" style={styles.footerText}>
            GraceRegistry - Système d'enregistrement des naissances
          </ThemedText>
          <ThemedText size="xs" variant="secondary" style={styles.footerText}>
            Document généré automatiquement
          </ThemedText>
        </ThemedView>
      </ThemedCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  document: {
    padding: 24,
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle2: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  body: {
    marginBottom: 24,
  },
  paragraph: {
    marginBottom: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  infoSection: {
    marginVertical: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    minWidth: 150,
    marginRight: 8,
  },
  infoValue: {
    flex: 1,
  },
  referenceSection: {
    marginVertical: 24,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  referenceLabel: {
    marginBottom: 8,
  },
  referenceNumber: {
    fontSize: 18,
    letterSpacing: 1,
  },
  dateSection: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  statusSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  warningSection: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    lineHeight: 18,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerText: {
    marginBottom: 4,
    textAlign: 'center',
  },
});

