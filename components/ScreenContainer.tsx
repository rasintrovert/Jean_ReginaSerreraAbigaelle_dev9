/**
 * ScreenContainer - Wrapper pour tous les écrans avec SafeAreaView
 * 
 * Ce composant encapsule SafeAreaView de react-native-safe-area-context
 * pour garantir que tous les écrans respectent les zones sécurisées.
 * 
 * Rôle du SafeAreaView :
 * - Empêche le chevauchement de contenu avec les éléments du système (notch, barre de statut, etc.)
 * - Ajuste automatiquement le padding aux bords pertinents selon l'appareil
 * - Compatible avec les écrans complexes (encoches, coins arrondis)
 * 
 * SafeAreaProvider doit être au niveau racine (dans AppProvider.tsx)
 * SafeAreaView doit être dans chaque écran (via ce composant)
 */

import { ThemedView } from '@/components/ThemedComponents';
import { useTheme } from '@/theme';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

interface ScreenContainerProps extends Omit<SafeAreaViewProps, 'style'> {
  /**
   * Variant du ThemedView (background, surface, etc.)
   * @default 'background'
   */
  variant?: 'background' | 'surface' | 'transparent';
  
  /**
   * Style personnalisé pour le conteneur
   */
  style?: ViewStyle;
  
  /**
   * Style pour le contenu interne
   */
  contentStyle?: ViewStyle;
  
  /**
   * Désactiver les edges spécifiques (top, bottom, left, right)
   * Utile pour les écrans avec headers fixes
   */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  
  /**
   * Enfants à afficher
   */
  children: React.ReactNode;
}

/**
 * Composant conteneur pour tous les écrans avec SafeAreaView
 * 
 * @example
 * ```tsx
 * export default function MyScreen() {
 *   return (
 *     <ScreenContainer>
 *       <ThemedText>Contenu de l'écran</ThemedText>
 *     </ScreenContainer>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Pour un écran avec header fixe (désactiver top edge)
 * <ScreenContainer edges={['bottom', 'left', 'right']}>
 *   <Header />
 *   <Content />
 * </ScreenContainer>
 * ```
 */
export function ScreenContainer({
  variant = 'background',
  style,
  contentStyle,
  edges,
  children,
  ...safeAreaProps
}: ScreenContainerProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
      edges={edges}
      {...safeAreaProps}
    >
      <ThemedView
        variant={variant}
        style={StyleSheet.flatten([
          styles.content,
          contentStyle,
        ])}
      >
        {children}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

