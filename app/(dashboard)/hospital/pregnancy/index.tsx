import { PregnancyForm } from '@/components/PregnancyForm';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText, ThemedView } from '@/components/ThemedComponents';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HospitalPregnancyRegistration() {
  const router = useRouter();
  const theme = useTheme();
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <ScreenContainer variant="background">
      {/* Header avec retour, titre et sous-titre */}
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
            {t('hospital.pregnancy.title')}
          </ThemedText>
          <ThemedText 
            size="sm" 
            style={StyleSheet.flatten([styles.headerSubtitle, { color: 'rgba(255, 255, 255, 0.9)' }])}
          >
            {t('hospital.pregnancy.description')}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <PregnancyForm
        translationPrefix="hospital"
        onSuccess={() => router.back()}
        onCancel={() => router.back()}
      />
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
  headerSubtitle: {
    lineHeight: 18,
  },
});
