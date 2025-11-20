import { create } from 'zustand';
import { addToSyncQueue, loadPregnanciesFromSQLite, deleteRecord } from '@/services/sync/syncService';
import { useSyncStore } from './syncStore';
import { useAuthStore } from './authStore';

// Interface alignée avec les champs du formulaire PregnancyForm
interface Pregnancy {
  id: string;
  // Étape 1 : Informations de la mère
  motherFirstNames: string[];
  motherLastName: string;
  motherBirthDate: string;
  motherPhone: string;
  motherPhoneAlt?: string;
  motherAddress: string;
  motherCity: string;
  motherDepartment: string;
  motherBloodGroup?: string;
  // Étape 2 : Informations de grossesse
  estimatedDeliveryDate?: string;
  estimatedDeliveryMonth?: string;
  pregnancyCount: string;
  healthCondition?: string;
  notes?: string;
  // Métadonnées
  status: 'pending' | 'synced';
  validationStatus?: 'pending' | 'validated' | 'rejected'; // Statut de validation admin
  recordedBy?: string; // Qui a créé l'enregistrement
  recordedByType?: 'agent' | 'hospital' | 'admin'; // Type d'utilisateur
  createdAt: string;
  // Champs calculés pour compatibilité (optionnels)
  motherName?: string; // Pour compatibilité avec l'ancien code
  location?: string; // Pour compatibilité avec l'ancien code
  prenatalCare?: boolean; // Pour compatibilité avec l'ancien code
}

interface PregnancyState {
  pregnancies: Pregnancy[];
  isLoading: boolean;
  addPregnancy: (pregnancy: Omit<Pregnancy, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updatePregnancy: (id: string, data: Partial<Pregnancy>) => void;
  deletePregnancy: (id: string, firestoreId?: string) => Promise<void>;
  syncPregnancies: () => Promise<void>;
  loadPregnancies: () => Promise<void>;
}

export const usePregnancyStore = create<PregnancyState>((set, get) => ({
  pregnancies: [],
  isLoading: false,
  
  addPregnancy: async (pregnancy) => {
    // Récupérer les informations de l'utilisateur connecté
    const { user } = useAuthStore.getState();
    const recordedBy = user?.name || user?.email || 'Unknown';
    const recordedByType = user?.role || 'agent';
    
    const newPregnancy: Pregnancy = {
      ...pregnancy,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      validationStatus: 'pending', // Statut de validation admin
      recordedBy, // Qui a créé l'enregistrement
      recordedByType, // Type d'utilisateur (agent, hospital, admin)
    };
    
    // Sauvegarder dans SQLite (via syncService)
    try {
      await addToSyncQueue('pregnancy', newPregnancy);
      if (__DEV__) console.log('Pregnancy ajoutée à la queue de synchronisation');
    } catch (error) {
      if (__DEV__) console.error('Erreur lors de l\'ajout à la queue:', error);
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
  
  deletePregnancy: async (id, firestoreId) => {
    // Supprimer de SQLite et Firestore
    try {
      await deleteRecord('pregnancy', id, firestoreId);
      if (__DEV__) console.log('Pregnancy supprimée de SQLite et Firestore');
    } catch (error) {
      if (__DEV__) console.error('Erreur lors de la suppression:', error);
      // On continue quand même pour mettre à jour le store local
    }
    
    // Mettre à jour le store local
    set((state) => ({
      pregnancies: state.pregnancies.filter((p) => {
        // Supprimer si l'ID local ou firestoreId correspond
        return p.id !== id && (firestoreId ? (p as any).firestoreId !== firestoreId : true);
      }),
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
      if (__DEV__) console.log(`Loaded ${pregnancies.length} pregnancies from SQLite`);
    } catch (error) {
      if (__DEV__) console.error('Error loading pregnancies:', error);
      set({ isLoading: false });
    }
  },
}));

