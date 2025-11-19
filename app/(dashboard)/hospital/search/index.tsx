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
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

export default function HospitalSearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

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
          isTablet && styles.scrollContentTablet
        ]}
        showsVerticalScrollIndicator={false}
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
        {searchQuery.length === 0 ? (
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
        ) : (
          <ThemedCard style={styles.emptyCard}>
            <ThemedView variant="transparent" style={styles.emptyContent}>
              <FontAwesome name="info-circle" size={48} color={theme.colors.textSecondary} />
              <ThemedText variant="secondary" size="base" style={styles.emptyText}>
                {t('hospital.search.noResults') || 'Aucun résultat trouvé. Essayez avec d\'autres mots-clés.'}
              </ThemedText>
            </ThemedView>
          </ThemedCard>
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
    paddingBottom: 100,
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
});

