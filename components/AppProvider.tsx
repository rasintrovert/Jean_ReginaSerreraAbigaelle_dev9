import { useColorScheme } from '@/components/useColorScheme';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { usePregnancyStore } from '@/store/pregnancyStore';
import { useBirthStore } from '@/store/birthStore';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { initDatabase } from '@/services/database/sqlite';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

interface AppProviderProps {
  children: React.ReactNode;
}

function StatusBarHandler() {
  const { appTheme, loadTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');

  // Charger le thème et attendre qu'il soit chargé
  useEffect(() => {
    const initializeTheme = async () => {
      await loadTheme();
      await new Promise(resolve => setTimeout(resolve, 150));
      setThemeLoaded(true);
    };
    initializeTheme();
  }, [loadTheme]);

  // Mettre à jour le thème actuel quand appTheme ou systemColorScheme change
  useEffect(() => {
    if (themeLoaded) {
      const mode = appTheme === 'system' ? systemColorScheme : appTheme;
      setCurrentTheme(mode === 'dark' ? 'dark' : 'light');
    }
  }, [appTheme, systemColorScheme, themeLoaded]);

  const isDark = currentTheme === 'dark';

  // Fonction pour configurer TOUTES les barres de manière synchrone et fiable
  const configureBars = React.useCallback(async () => {
    if (!themeLoaded || Platform.OS !== 'android') return;

    try {
      // 1. Configurer StatusBar de React Native
      StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
      StatusBar.setBackgroundColor(isDark ? '#000000' : '#ffffff', true);
      
      // 2. Configurer la barre de navigation Android
      // AVEC EDGE-TO-EDGE (Android 16+), on ne peut PAS utiliser :
      // - setBackgroundColorAsync() (la barre hérite du fond de la fenêtre)
      // - setBorderColorAsync() (pas supporté)
      // 
      // La solution : le fond de la fenêtre est configuré via le backgroundColor
      // du SafeAreaView dans AppProvider, ce qui affecte automatiquement 
      // la barre de navigation avec edge-to-edge.
      
      // Seul le style des boutons fonctionne avec edge-to-edge
      await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
      
    } catch (error) {
      console.log('Navigation bar configuration error:', error);
    }
  }, [isDark, themeLoaded]);

  // Configurer immédiatement quand le thème change
  useEffect(() => {
    if (themeLoaded) {
      // Configuration immédiate
      configureBars();
      
      // Configuration de secours après un court délai
      const timer = setTimeout(() => {
        configureBars();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [configureBars, themeLoaded, isDark]);

  // Écouter les changements d'état de l'app - FORCER la reconfiguration
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasInactive = appStateRef.current.match(/inactive|background/);
      
      if (wasInactive && nextAppState === 'active' && themeLoaded) {
        // FORCER la reconfiguration avec plusieurs tentatives
        configureBars();
        
        // Réessayer après un délai (pour s'assurer que l'app est complètement active)
        setTimeout(() => {
          configureBars();
        }, 200);
        
        // Réessayer une dernière fois
        setTimeout(() => {
          configureBars();
        }, 500);
      }
      
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [configureBars, themeLoaded]);

  // Configuration initiale après chargement
  useEffect(() => {
    if (themeLoaded) {
      const timer = setTimeout(() => {
        configureBars();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [themeLoaded, configureBars]);

  // Utiliser React Native StatusBar - configuration directe, plus fiable
  // On retourne aussi un composant StatusBar pour garantir qu'il soit présent dans le rendu
  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={isDark ? '#000000' : '#ffffff'}
      translucent={false}
    />
  );
}

export function AppProvider({ children }: AppProviderProps) {
  const { loadTheme, appTheme } = useThemeStore();
  const { loadLanguage } = useLanguageStore();
  const systemColorScheme = useColorScheme();
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');

  // Charger le thème, la langue et initialiser la base de données au démarrage
  const { initializeAuth } = useAuthStore();
  const { loadPregnancies } = usePregnancyStore();
  const { loadBirths } = useBirthStore();
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialiser SQLite en premier
        await initDatabase();
        console.log('✅ Database initialized');
      } catch (error) {
        console.error('❌ Database initialization error:', error);
      }
      
      try {
        // Initialiser Firebase
        await import('@/services/firebase/config');
        console.log('✅ Firebase initialized');
      } catch (error) {
        console.error('❌ Firebase initialization error:', error);
      }
      
      // Initialiser l'authentification (écouter les changements d'état)
      initializeAuth();
      console.log('✅ Auth listener initialized');
      
      // Charger les données depuis SQLite
      try {
        await loadPregnancies();
        await loadBirths();
        console.log('✅ Data loaded from SQLite');
        
        // Synchroniser avec Firestore pour mettre à jour les données
        // Cela supprimera aussi les enregistrements qui n'existent plus dans Firestore
        const { useSyncStore } = await import('@/store/syncStore');
        const { isOnline } = useSyncStore.getState();
        if (isOnline) {
          try {
            await useSyncStore.getState().syncAll();
            console.log('✅ Data synced with Firestore');
            
            // Recharger les données après la synchronisation
            await loadPregnancies();
            await loadBirths();
            console.log('✅ Data reloaded after sync');
          } catch (error) {
            console.error('❌ Error syncing data:', error);
          }
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
      }
      
      // Charger le thème et la langue
      await loadTheme();
      await loadLanguage();
      await new Promise(resolve => setTimeout(resolve, 100));
      setThemeLoaded(true);
    };
    initialize();
  }, [loadTheme, loadLanguage, initializeAuth, loadPregnancies, loadBirths]);

  // Déterminer le thème actuel
  useEffect(() => {
    if (themeLoaded) {
      const mode = appTheme === 'system' ? systemColorScheme : appTheme;
      setCurrentTheme(mode === 'dark' ? 'dark' : 'light');
    }
  }, [appTheme, systemColorScheme, themeLoaded]);

  // Avec edge-to-edge, la barre de navigation hérite du fond de la fenêtre
  // Donc on configure le backgroundColor du SafeAreaView selon le thème
  const windowBackgroundColor = currentTheme === 'dark' ? '#000000' : '#ffffff';

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBarHandler />
        {/* SafeAreaView est maintenant géré par ScreenContainer dans chaque écran */}
        {children}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
