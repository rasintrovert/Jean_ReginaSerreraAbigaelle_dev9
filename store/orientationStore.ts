import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lockPortrait, lockLandscape, unlockOrientation } from '@/hooks/useOrientation';

export type OrientationPreference = 'portrait' | 'landscape' | 'auto';

interface OrientationState {
  orientationPreference: OrientationPreference;
  setOrientationPreference: (preference: OrientationPreference) => Promise<void>;
  loadOrientation: () => Promise<void>;
}

const ORIENTATION_STORAGE_KEY = '@graceregistry:orientation';
const DEFAULT_ORIENTATION: OrientationPreference = 'auto';

export const useOrientationStore = create<OrientationState>((set, get) => ({
  orientationPreference: DEFAULT_ORIENTATION,
  
  setOrientationPreference: async (preference: OrientationPreference) => {
    try {
      // Appliquer le verrouillage d'orientation
      if (preference === 'portrait') {
        await lockPortrait();
      } else if (preference === 'landscape') {
        await lockLandscape();
      } else {
        await unlockOrientation();
      }
      
      set({ orientationPreference: preference });
      
      // Sauvegarder dans AsyncStorage
      try {
        await AsyncStorage.setItem(ORIENTATION_STORAGE_KEY, preference);
      } catch (error) {
        console.error('Failed to save orientation preference:', error);
      }
    } catch (error) {
      console.error('Error setting orientation preference:', error);
    }
  },
  
  loadOrientation: async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(ORIENTATION_STORAGE_KEY);
      if (savedPreference && ['portrait', 'landscape', 'auto'].includes(savedPreference)) {
        const preference = savedPreference as OrientationPreference;
        set({ orientationPreference: preference });
        // Appliquer l'orientation sauvegardée
        const { setOrientationPreference } = get();
        await setOrientationPreference(preference);
      } else {
        // Si aucune préférence sauvegardée, utiliser la valeur par défaut
        set({ orientationPreference: DEFAULT_ORIENTATION });
        await unlockOrientation();
      }
    } catch (error) {
      console.error('Failed to load orientation preference:', error);
      set({ orientationPreference: DEFAULT_ORIENTATION });
    }
  },
}));

// Initialiser l'orientation au chargement
export const initializeOrientation = async () => {
  const { loadOrientation } = useOrientationStore.getState();
  await loadOrientation();
};

