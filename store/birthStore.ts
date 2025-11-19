import { create } from 'zustand';
import { addToSyncQueue, loadBirthsFromSQLite } from '@/services/sync/syncService';
import { useSyncStore } from './syncStore';

interface Birth {
  id: string;
  childName: string;
  childFirstName: string;
  birthDate: string;
  birthPlace: string;
  gender: 'male' | 'female' | 'other';
  motherName: string;
  motherId: string;
  fatherName: string;
  fatherId: string;
  witnesses: string[];
  certificateStatus: 'pending' | 'verified' | 'approved' | 'issued' | 'rejected';
  certificateNumber?: string;
  createdAt: string;
  synced: boolean;
}

interface BirthState {
  births: Birth[];
  isLoading: boolean;
  addBirth: (birth: Omit<Birth, 'id' | 'createdAt' | 'synced' | 'certificateStatus'>) => Promise<void>;
  updateBirth: (id: string, data: Partial<Birth>) => void;
  deleteBirth: (id: string) => void;
  updateCertificateStatus: (id: string, status: Birth['certificateStatus']) => void;
  syncBirths: () => Promise<void>;
  loadBirths: () => Promise<void>;
}

export const useBirthStore = create<BirthState>((set, get) => ({
  births: [],
  isLoading: false,
  
  addBirth: async (birth) => {
    const newBirth: Birth = {
      ...birth,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      certificateStatus: 'pending',
      synced: false,
    };
    
    // Sauvegarder dans SQLite (via syncService)
    try {
      await addToSyncQueue('birth', newBirth);
      console.log('✅ Birth ajouté à la queue de synchronisation');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout à la queue:', error);
      // On continue quand même pour que l'utilisateur voie l'enregistrement
    }
    
    // Mettre à jour le store local
    set((state) => ({
      births: [...state.births, newBirth],
    }));
    
    // Tenter une synchronisation immédiate si en ligne
    const { isOnline } = useSyncStore.getState();
    if (isOnline) {
      useSyncStore.getState().syncAll().catch(console.error);
    }
  },
  
  updateBirth: (id, data) => {
    set((state) => ({
      births: state.births.map((b) =>
        b.id === id ? { ...b, ...data } : b
      ),
    }));
  },
  
  deleteBirth: (id) => {
    set((state) => ({
      births: state.births.filter((b) => b.id !== id),
    }));
  },
  
  updateCertificateStatus: (id, status) => {
    set((state) => ({
      births: state.births.map((b) =>
        b.id === id ? { ...b, certificateStatus: status } : b
      ),
    }));
  },
  
  syncBirths: async () => {
    set({ isLoading: true });
    try {
      // Utiliser le syncStore pour synchroniser
      await useSyncStore.getState().syncAll();
      
      // Mettre à jour le statut des births synchronisés
      // (Le syncStore gère déjà la synchronisation via syncService)
      set({ isLoading: false });
    } catch (error) {
      console.error('Sync error:', error);
      set({ isLoading: false });
    }
  },

  loadBirths: async () => {
    set({ isLoading: true });
    try {
      const births = await loadBirthsFromSQLite();
      set({ births, isLoading: false });
      console.log(`✅ Loaded ${births.length} births from SQLite`);
    } catch (error) {
      console.error('Error loading births:', error);
      set({ isLoading: false });
    }
  },
}));

