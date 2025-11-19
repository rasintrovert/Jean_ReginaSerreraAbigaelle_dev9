import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText, ThemedView } from '@/components/ThemedComponents';
import { useTheme } from '@/theme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

export default function CertificatesManagementScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // TODO: Afficher la liste des certificats avec différents statuts
  // TODO: Filtrer par statut (en attente, vérifié, approuvé, émis, rejeté)
  // TODO: Permettre la modification et suppression
  // TODO: Générer PDF et envoyer par email
  
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

      <ScrollView style={styles.scrollContent}>
        <ThemedText size="lg" weight="bold" style={styles.title}>
          Gestion des certificats
        </ThemedText>
        <ThemedView style={styles.separator} />
        
        {/* TODO: Liste des certificats avec filtres */}
        <ThemedText variant="secondary" size="base" style={styles.text}>
          Liste des certificats à développer
        </ThemedText>
        
        {/* TODO: Composant CertificateCard pour chaque certificat
            - Afficher numéro, nom enfant, statut, date
            - Boutons: Voir, Modifier, Générer PDF, Supprimer
        */}
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
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 16,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '100%',
  },
  text: {
    marginTop: 8,
  },
});

