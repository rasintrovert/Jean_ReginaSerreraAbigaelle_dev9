import { create } from 'zustand';
import { addToSyncQueue, loadPregnanciesFromSQLite } from '@/services/sync/syncService';
import { useSyncStore } from './syncStore';

interface Pregnancy {
  id: string;
  motherName: string;
  fatherName: string;
  lastMenstruationDate: string;
  location: string;
  prenatalCare: boolean;
  status: 'pending' | 'synced';
  createdAt: string;
}

interface PregnancyState {
  pregnancies: Pregnancy[];
  isLoading: boolean;
  addPregnancy: (pregnancy: Omit<Pregnancy, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updatePregnancy: (id: string, data: Partial<Pregnancy>) => void;
  deletePregnancy: (id: string) => void;
  syncPregnancies: () => Promise<void>;
  loadPregnancies: () => Promise<void>;
}

export const usePregnancyStore = create<PregnancyState>((set, get) => ({
  pregnancies: [],
  isLoading: false,
  
  addPregnancy: async (pregnancy) => {
    const newPregnancy: Pregnancy = {
      ...pregnancy,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    
    // Sauvegarder dans SQLite (via syncService)
    try {
      await addToSyncQueue('pregnancy', newPregnancy);
      console.log('✅ Pregnancy ajoutée à la queue de synchronisation');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout à la queue:', error);
      // On continue quand même pour que l'utilisateur voie l'enregistrement
    }
    
    // Mettre à jour le store local
    set((state) => ({
      pregnancies: [...state.pregnancies, newPregnancy],
    }));
    
    // Tenter une synchronisation immédiate si en ligne
    const { isOnline } = useSyncStore.getState();
    if (isOnline) {
      useSyncStore.getState().syncAll().catch(console.error);
    }
  },
  
  updatePregnancy: (id, data) => {
    set((state) => ({
      pregnancies: state.pregnancies.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    }));
  },
  
  deletePregnancy: (id) => {
    set((state) => ({
      pregnancies: state.pregnancies.filter((p) => p.id !== id),
    }));
  },
  
  syncPregnancies: async () => {
    set({ isLoading: true });
    try {
      // Utiliser le syncStore pour synchroniser
      await useSyncStore.getState().syncAll();
      
      // Mettre à jour le statut des pregnancies synchronisées
      // (Le syncStore gère déjà la synchronisation via syncService)
      set({ isLoading: false });
    } catch (error) {
      console.error('Sync error:', error);
      set({ isLoading: false });
    }
  },

  loadPregnancies: async () => {
    set({ isLoading: true });
    try {
      const pregnancies = await loadPregnanciesFromSQLite();
      set({ pregnancies, isLoading: false });
      console.log(`✅ Loaded ${pregnancies.length} pregnancies from SQLite`);
    } catch (error) {
      console.error('Error loading pregnancies:', error);
      set({ isLoading: false });
    }
  },
}));

