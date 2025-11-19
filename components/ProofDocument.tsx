import { ThemedText } from '@/components/ThemedComponents';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils/date';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

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

  // Fonction helper pour formater les dates de manière sécurisée
  const formatDateSafe = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Si la date est invalide, essayer avec formatDate de date-fns
        const formatted = formatDate(dateString);
        return formatted || dateString; // Retourner la chaîne originale si le formatage échoue
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString; // Retourner la chaîne originale en cas d'erreur
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
    >
      <View style={[styles.document, { backgroundColor: '#ffffff' }]}>
        {/* En-tête officiel */}
        <View style={[styles.header, { borderBottomColor: '#e0e0e0' }]}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <FontAwesome 
              name={isPregnancy ? 'heart' : 'child'} 
              size={36} 
              color={theme.colors.primary} 
            />
          </View>
          <ThemedText 
            size="lg" 
            weight="bold" 
            style={StyleSheet.flatten([styles.title, { color: theme.colors.primary }])}
          >
            RÉPUBLIQUE D'HAÏTI
          </ThemedText>
          <ThemedText 
            size="base" 
            weight="semibold"
            style={StyleSheet.flatten([styles.subtitle, { color: '#1a1a1a' }])}
          >
            {isPregnancy ? 'ATTESTATION DE GROSSESSE' : 'ATTESTATION DE NAISSANCE'}
          </ThemedText>
          <ThemedText 
            size="xs" 
            style={StyleSheet.flatten([styles.subtitle2, { color: '#666666' }])}
          >
            Document Provisoire
          </ThemedText>
        </View>

        {/* Corps du document */}
        <View style={styles.body}>
          <ThemedText size="sm" style={StyleSheet.flatten([styles.paragraph, { color: '#1a1a1a' }])}>
            Je soussigné(e), <ThemedText weight="semibold" style={{ color: '#1a1a1a' }}>Agent de Terrain</ThemedText> du système GraceRegistry,
          </ThemedText>

          <ThemedText size="sm" style={StyleSheet.flatten([styles.paragraph, { color: '#1a1a1a' }])}>
            <ThemedText weight="semibold" style={{ color: '#1a1a1a' }}>ATTESTE</ThemedText> avoir enregistré {isPregnancy ? 'la grossesse' : 'la naissance'} suivante :
          </ThemedText>

          {/* Informations principales */}
          <View style={[styles.infoSection, { 
            backgroundColor: '#f8f9fa',
            borderColor: '#dee2e6' 
          }]}>
            {isPregnancy ? (
              <>
                <View style={[styles.infoRow, { borderBottomColor: '#dee2e6' }]}>
                  <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.infoLabel, { color: '#1a1a1a' }])}>
                    Nom de la mère :
                  </ThemedText>
                  <ThemedText size="sm" style={StyleSheet.flatten([styles.infoValue, { color: '#1a1a1a' }])}>
                    {pregnancyData?.motherName || personName}
                  </ThemedText>
                </View>
                
                {pregnancyData?.location && (
                  <View style={[styles.infoRow, { borderBottomColor: '#dee2e6' }]}>
                    <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.infoLabel, { color: '#1a1a1a' }])}>
                      Lieu :
                    </ThemedText>
                    <ThemedText size="sm" style={StyleSheet.flatten([styles.infoValue, { color: '#1a1a1a' }])}>
                      {pregnancyData.location}
                    </ThemedText>
                  </View>
                )}

                {pregnancyData?.estimatedDeliveryDate && (
                  <View style={[styles.infoRow, { borderBottomColor: '#dee2e6', borderBottomWidth: 0 }]}>
                    <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.infoLabel, { color: '#1a1a1a' }])}>
                      Date prévue d'accouchement :
                    </ThemedText>
                    <ThemedText size="sm" style={StyleSheet.flatten([styles.infoValue, { color: '#1a1a1a' }])}>
                      {formatDateSafe(pregnancyData.estimatedDeliveryDate)}
                    </ThemedText>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={[styles.infoRow, { borderBottomColor: '#dee2e6' }]}>
                  <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.infoLabel, { color: '#1a1a1a' }])}>
                    Nom de l'enfant :
                  </ThemedText>
                  <ThemedText size="sm" style={StyleSheet.flatten([styles.infoValue, { color: '#1a1a1a' }])}>
                    {birthData?.childFirstName && birthData?.childName
                      ? `${birthData.childFirstName} ${birthData.childName}`
                      : birthData?.childName || personName}
                  </ThemedText>
                </View>

                {birthData?.birthDate && (
                  <View style={[styles.infoRow, { borderBottomColor: '#dee2e6' }]}>
                    <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.infoLabel, { color: '#1a1a1a' }])}>
                      Date de naissance :
                    </ThemedText>
                    <ThemedText size="sm" style={StyleSheet.flatten([styles.infoValue, { color: '#1a1a1a' }])}>
                      {formatDateSafe(birthData.birthDate)}
                    </ThemedText>
                  </View>
                )}

                {birthData?.birthPlace && (
                  <View style={[styles.infoRow, { borderBottomColor: '#dee2e6' }]}>
                    <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.infoLabel, { color: '#1a1a1a' }])}>
                      Lieu de naissance :
                    </ThemedText>
                    <ThemedText size="sm" style={StyleSheet.flatten([styles.infoValue, { color: '#1a1a1a' }])}>
                      {birthData.birthPlace}
                    </ThemedText>
                  </View>
                )}

                {birthData?.motherName && (
                  <View style={[styles.infoRow, { borderBottomColor: '#dee2e6' }]}>
                    <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.infoLabel, { color: '#1a1a1a' }])}>
                      Nom de la mère :
                    </ThemedText>
                    <ThemedText size="sm" style={StyleSheet.flatten([styles.infoValue, { color: '#1a1a1a' }])}>
                      {birthData.motherName}
                    </ThemedText>
                  </View>
                )}

                {birthData?.fatherName && (
                  <View style={[styles.infoRow, { borderBottomColor: '#dee2e6', borderBottomWidth: 0 }]}>
                    <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.infoLabel, { color: '#1a1a1a' }])}>
                      Nom du père :
                    </ThemedText>
                    <ThemedText size="sm" style={StyleSheet.flatten([styles.infoValue, { color: '#1a1a1a' }])}>
                      {birthData.fatherName}
                    </ThemedText>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Référence */}
          <View style={[styles.referenceSection, { 
            backgroundColor: '#f8f9fa',
            borderColor: theme.colors.primary + '40'
          }]}>
            <ThemedText size="xs" style={StyleSheet.flatten([styles.referenceLabel, { color: '#666666' }])}>
              Numéro de référence :
            </ThemedText>
            <ThemedText size="sm" weight="semibold" style={StyleSheet.flatten([styles.referenceNumber, { color: theme.colors.primary }])}>
              {referenceNumber}
            </ThemedText>
          </View>

          {/* Date de génération */}
          <View style={styles.dateSection}>
            <ThemedText size="xs" style={{ color: '#666666' }}>
              Date de génération : {generationDate}
            </ThemedText>
          </View>

          {/* Statut */}
          <View style={styles.statusSection}>
            <View 
              style={[
                styles.statusBadge,
                { backgroundColor: status === 'valid' ? theme.colors.success + '20' : theme.colors.warning + '20' }
              ]}
            >
              <ThemedText 
                size="xs" 
                weight="semibold"
                style={{ color: status === 'valid' ? theme.colors.success : theme.colors.warning }}
              >
                {status === 'valid' ? '✓ Validé' : '⏳ En attente de validation'}
              </ThemedText>
            </View>
          </View>

          {/* Avertissement */}
          <View style={[styles.warningSection, { 
            backgroundColor: theme.colors.warning + '15',
            borderLeftColor: theme.colors.warning
          }]}>
            <ThemedText size="xs" style={StyleSheet.flatten([styles.warningText, { color: '#856404' }])}>
              ⚠️ Ce document est provisoire et en attente de validation officielle par l'administration.
              Le certificat officiel sera émis après validation.
            </ThemedText>
          </View>
        </View>

        {/* Pied de page */}
        <View style={[styles.footer, { borderTopColor: '#e0e0e0' }]}>
          <ThemedText size="xs" style={StyleSheet.flatten([styles.footerText, { color: '#666666' }])}>
            GraceRegistry - Système d'enregistrement des naissances
          </ThemedText>
          <ThemedText size="xs" style={StyleSheet.flatten([styles.footerText, { color: '#666666' }])}>
            Document généré automatiquement
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 150, // Espace en bas pour que la dernière carte soit complètement visible
  },
  document: {
    padding: 28,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
  },
  logoContainer: {
    marginBottom: 12,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subtitle2: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  body: {
    marginBottom: 24,
  },
  paragraph: {
    marginBottom: 16,
    lineHeight: 22,
    textAlign: 'justify',
    letterSpacing: 0.1,
  },
  infoSection: {
    marginVertical: 20,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
    paddingBottom: 10,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  infoLabel: {
    minWidth: 150,
    marginRight: 12,
    marginTop: 1,
  },
  infoValue: {
    flex: 1,
    fontWeight: '500',
    marginTop: 1,
  },
  referenceSection: {
    marginVertical: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  referenceLabel: {
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  referenceNumber: {
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dateSection: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  statusSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 28,
    minWidth: 220,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningSection: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  warningText: {
    lineHeight: 20,
  },
  footer: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1.5,
    alignItems: 'center',
  },
  footerText: {
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

