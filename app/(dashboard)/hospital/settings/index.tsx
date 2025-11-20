import { ScreenContainer } from '@/components/ScreenContainer';
import {
  ThemedCard,
  ThemedText,
  ThemedView
} from '@/components/ThemedComponents';
import { PressableButton } from '@/components/PressableButton';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { useOrientationStore } from '@/store/orientationStore';
import { useTheme } from '@/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HospitalSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguageStore();
  const { appTheme, setAppTheme } = useThemeStore();
  const { orientationPreference, setOrientationPreference } = useOrientationStore();

  const [autoSync, setAutoSync] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);

  const handleHelpPress = () => {
    router.push('/(dashboard)/hospital/help' as any);
  };

  return (
    <ScreenContainer variant="background">
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
            {t('hospital.settings.title') || t('agent.settings.title')}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
          { paddingBottom: insets.bottom + 20 } // SafeArea + espace supplémentaire
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedCard style={styles.sectionCard}>
          <ThemedView variant="transparent" style={styles.sectionHeader}>
            <FontAwesome
              name="language"
              size={20}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />
            <ThemedView variant="transparent" style={styles.sectionHeaderText}>
              <ThemedText size="lg" weight="semibold" style={styles.sectionTitle}>
                {t('hospital.settings.languageTitle') || t('agent.settings.languageTitle')}
              </ThemedText>
              <ThemedText variant="secondary" size="sm" style={styles.sectionSubtitle}>
                {t('hospital.settings.languageSubtitle') || t('agent.settings.languageSubtitle')}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <View style={styles.optionsContainer}>
            <PressableButton
              variant={language === 'ht' ? 'primary' : 'outline'}
              size="md"
              fullWidth
              onPress={() => setLanguage('ht')}
              style={styles.languageButton}
            >
              <ThemedText
                size="base"
                weight="semibold"
                style={{
                  color: language === 'ht' ? '#fff' : theme.colors.primary,
                }}
              >
                {t('hospital.settings.languageKreyol') || t('agent.settings.languageKreyol')}
              </ThemedText>
            </PressableButton>

            <PressableButton
              variant={language === 'fr' ? 'primary' : 'outline'}
              size="md"
              fullWidth
              onPress={() => setLanguage('fr')}
              style={styles.languageButton}
            >
              <ThemedText
                size="base"
                weight="semibold"
                style={{
                  color: language === 'fr' ? '#fff' : theme.colors.primary,
                }}
              >
                {t('hospital.settings.languageFrench') || t('agent.settings.languageFrench')}
              </ThemedText>
            </PressableButton>
          </View>
        </ThemedCard>

        <ThemedCard style={styles.sectionCard}>
          <ThemedView variant="transparent" style={styles.sectionHeader}>
            <FontAwesome
              name="wifi"
              size={20}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />
            <ThemedView variant="transparent" style={styles.sectionHeaderText}>
              <ThemedText size="lg" weight="semibold" style={styles.sectionTitle}>
                {t('hospital.settings.syncTitle') || t('agent.settings.syncTitle')}
              </ThemedText>
              <ThemedText variant="secondary" size="sm" style={styles.sectionSubtitle}>
                {t('hospital.settings.syncSubtitle') || t('agent.settings.syncSubtitle')}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <View style={styles.switchList}>
            <View style={styles.switchItem}>
              <ThemedText size="base" weight="medium" style={styles.switchLabel}>
                {t('hospital.settings.autoSync') || t('agent.settings.autoSync')}
              </ThemedText>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.switchItem}>
              <ThemedText size="base" weight="medium" style={styles.switchLabel}>
                {t('hospital.settings.wifiOnly') || t('agent.settings.wifiOnly')}
              </ThemedText>
              <Switch
                value={wifiOnly}
                onValueChange={setWifiOnly}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </ThemedCard>

        <ThemedCard style={styles.sectionCard}>
          <ThemedView variant="transparent" style={styles.sectionHeader}>
            <FontAwesome
              name="moon-o"
              size={20}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />
            <ThemedView variant="transparent" style={styles.sectionHeaderText}>
              <ThemedText size="lg" weight="semibold" style={styles.sectionTitle}>
                {t('hospital.settings.appearanceTitle') || t('agent.settings.appearanceTitle')}
              </ThemedText>
              <ThemedText variant="secondary" size="sm" style={styles.sectionSubtitle}>
                {t('hospital.settings.appearanceSubtitle') || t('agent.settings.appearanceSubtitle')}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <View style={styles.optionsContainer}>
            <PressableButton
              variant={appTheme === 'light' ? 'primary' : 'outline'}
              size="sm"
              style={styles.themeButton}
              onPress={() => setAppTheme('light')}
            >
              <ThemedText
                size="sm"
                weight="semibold"
                style={{
                  color: appTheme === 'light' ? '#fff' : theme.colors.primary,
                }}
              >
                {t('hospital.settings.lightMode') || t('agent.settings.lightMode')}
              </ThemedText>
            </PressableButton>

            <PressableButton
              variant={appTheme === 'dark' ? 'primary' : 'outline'}
              size="sm"
              style={styles.themeButton}
              onPress={() => setAppTheme('dark')}
            >
              <ThemedText
                size="sm"
                weight="semibold"
                style={{
                  color: appTheme === 'dark' ? '#fff' : theme.colors.primary,
                }}
              >
                {t('hospital.settings.darkMode') || t('agent.settings.darkMode')}
              </ThemedText>
            </PressableButton>

            <PressableButton
              variant={appTheme === 'system' ? 'primary' : 'outline'}
              size="sm"
              style={styles.themeButton}
              onPress={() => setAppTheme('system')}
            >
              <ThemedText
                size="sm"
                weight="semibold"
                style={{
                  color: appTheme === 'system' ? '#fff' : theme.colors.primary,
                }}
              >
                {t('hospital.settings.autoMode') || t('agent.settings.autoMode')}
              </ThemedText>
            </PressableButton>
          </View>
        </ThemedCard>

        {/* Section Orientation */}
        <ThemedCard style={styles.sectionCard}>
          <ThemedView variant="transparent" style={styles.sectionHeader}>
            <FontAwesome
              name="mobile"
              size={20}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />
            <ThemedView variant="transparent" style={styles.sectionHeaderText}>
              <ThemedText size="lg" weight="semibold" style={styles.sectionTitle}>
                {t('hospital.settings.orientationTitle') || t('agent.settings.orientationTitle')}
              </ThemedText>
              <ThemedText variant="secondary" size="sm" style={styles.sectionSubtitle}>
                {t('hospital.settings.orientationSubtitle') || t('agent.settings.orientationSubtitle')}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <View style={styles.optionsContainer}>
            <PressableButton
              variant={orientationPreference === 'portrait' ? 'primary' : 'outline'}
              size="sm"
              style={styles.themeButton}
              onPress={() => setOrientationPreference('portrait')}
            >
              <ThemedText
                size="sm"
                weight="semibold"
                style={{
                  color: orientationPreference === 'portrait' ? '#fff' : theme.colors.primary,
                }}
              >
                {t('hospital.settings.orientationPortrait') || t('agent.settings.orientationPortrait')}
              </ThemedText>
            </PressableButton>

            <PressableButton
              variant={orientationPreference === 'landscape' ? 'primary' : 'outline'}
              size="sm"
              style={styles.themeButton}
              onPress={() => setOrientationPreference('landscape')}
            >
              <ThemedText
                size="sm"
                weight="semibold"
                style={{
                  color: orientationPreference === 'landscape' ? '#fff' : theme.colors.primary,
                }}
              >
                {t('hospital.settings.orientationLandscape') || t('agent.settings.orientationLandscape')}
              </ThemedText>
            </PressableButton>

            <PressableButton
              variant={orientationPreference === 'auto' ? 'primary' : 'outline'}
              size="sm"
              style={styles.themeButton}
              onPress={() => setOrientationPreference('auto')}
            >
              <ThemedText
                size="sm"
                weight="semibold"
                style={{
                  color: orientationPreference === 'auto' ? '#fff' : theme.colors.primary,
                }}
              >
                {t('hospital.settings.orientationAuto') || t('agent.settings.orientationAuto')}
              </ThemedText>
            </PressableButton>
          </View>
        </ThemedCard>

        {/* Section Aide */}
        <ThemedCard style={styles.sectionCard}>
          <PressableButton
            variant="outline"
            size="md"
            fullWidth
            onPress={handleHelpPress}
            style={styles.helpButton}
          >
            <FontAwesome name="info-circle" size={16} color={theme.colors.primary} />
            <ThemedText size="base" weight="semibold" style={{ color: theme.colors.primary, marginLeft: 8 }}>
              {t('hospital.settings.help') || t('agent.settings.help')}
            </ThemedText>
          </PressableButton>
        </ThemedCard>
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
  sectionCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  sectionIcon: {
    marginTop: 2,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {},
  optionsContainer: {
    gap: 12,
  },
  languageButton: {},
  switchList: {
    gap: 16,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  themeButton: {
    flex: 1,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  versionContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  versionText: {},
});

