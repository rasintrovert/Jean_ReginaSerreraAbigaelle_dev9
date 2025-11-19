/**
 * Hook pour gérer l'orientation de l'écran
 * Utilise expo-screen-orientation
 */

import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export type Orientation = 'portrait' | 'landscape';

export interface OrientationState {
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
}

/**
 * Hook pour détecter et gérer l'orientation de l'écran
 * 
 * @example
 * ```tsx
 * const { orientation, isPortrait, isLandscape } = useOrientation();
 * 
 * if (isLandscape) {
 *   // Layout pour paysage
 * }
 * ```
 */
export function useOrientation(): OrientationState {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [orientation, setOrientation] = useState<Orientation>(
    dimensions.width > dimensions.height ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    // Écouter les changements de dimensions
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
    });

    // Récupérer l'orientation actuelle
    const getCurrentOrientation = async () => {
      try {
        const orientationLock = await ScreenOrientation.getOrientationLockAsync();
        // Si l'orientation n'est pas verrouillée, détecter depuis les dimensions
        const currentOrientation = dimensions.width > dimensions.height ? 'landscape' : 'portrait';
        setOrientation(currentOrientation);
      } catch (error) {
        console.error('Error getting orientation:', error);
      }
    };

    getCurrentOrientation();

    return () => {
      subscription?.remove();
    };
  }, [dimensions.width, dimensions.height]);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * Verrouiller l'orientation en portrait
 */
export async function lockPortrait(): Promise<void> {
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  } catch (error) {
    console.error('Error locking portrait:', error);
  }
}

/**
 * Verrouiller l'orientation en paysage
 */
export async function lockLandscape(): Promise<void> {
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  } catch (error) {
    console.error('Error locking landscape:', error);
  }
}

/**
 * Déverrouiller l'orientation (autoriser toutes les orientations)
 */
export async function unlockOrientation(): Promise<void> {
  try {
    await ScreenOrientation.unlockAsync();
  } catch (error) {
    console.error('Error unlocking orientation:', error);
  }
}

