import { create } from 'zustand';
import { addToSyncQueue, loadBirthsFromSQLite, deleteRecord } from '@/services/sync/syncService';
import { useSyncStore } from './syncStore';
import { useAuthStore } from './authStore';

// Interface alignée avec les champs du formulaire BirthForm
interface Birth {
  id: string;
  // Étape 1 : Informations de l'enfant
  childFirstNames: string[];
  childLastName: string;
  birthDate: string;
  birthTime: string;
  gender: 'male' | 'female' | 'other';
  birthPlaceType: string;
  birthPlaceName: string;
  birthAddress: string;
  birthDepartment: string;
  // Étape 2 : Informations des parents
  motherFirstNames: string[];
  motherLastName: string;
  motherProfession: string;
  motherAddress: string;
  fatherFirstNames?: string[];
  fatherLastName?: string;
  fatherProfession?: string;
  fatherAddress?: string;
  // Étape 3 : Informations sur les témoins
  witness1FirstNames: string[];
  witness1LastName: string;
  witness1Address: string;
  witness2FirstNames: string[];
  witness2LastName: string;
  witness2Address: string;
  pregnancyId?: string;
  // Métadonnées
  certificateStatus: 'pending' | 'verified' | 'approved' | 'issued' | 'rejected';
  validationStatus?: 'pending' | 'validated' | 'rejected'; // Statut de validation admin
  recordedBy?: string; // Qui a créé l'enregistrement
  recordedByType?: 'agent' | 'hospital' | 'admin'; // Type d'utilisateur
  certificateNumber?: string;
  createdAt: string;
  synced: boolean;
  // Champs calculés pour compatibilité (optionnels)
  childName?: string; // Pour compatibilité avec l'ancien code
  childFirstName?: string; // Pour compatibilité avec l'ancien code
  birthPlace?: string; // Pour compatibilité avec l'ancien code
  motherName?: string; // Pour compatibilité avec l'ancien code
  motherId?: string; // Pour compatibilité avec l'ancien code
  fatherName?: string; // Pour compatibilité avec l'ancien code
  fatherId?: string; // Pour compatibilité avec l'ancien code
  witnesses?: string[]; // Pour compatibilité avec l'ancien code
}

interface BirthState {
  births: Birth[];
  isLoading: boolean;
  addBirth: (birth: Omit<Birth, 'id' | 'createdAt' | 'synced' | 'certificateStatus'>) => Promise<void>;
  updateBirth: (id: string, data: Partial<Birth>) => void;
  deleteBirth: (id: string, firestoreId?: string) => Promise<void>;
  updateCertificateStatus: (id: string, status: Birth['certificateStatus']) => void;
  syncBirths: () => Promise<void>;
  loadBirths: () => Promise<void>;
}

export const useBirthStore = create<BirthState>((set, get) => ({
  births: [],
  isLoading: false,
  
  addBirth: async (birth) => {
    // Récupérer les informations de l'utilisateur connecté
    const { user } = useAuthStore.getState();
    const recordedBy = user?.name || user?.email || 'Unknown';
    const recordedByType = user?.role || 'agent';
    
    const newBirth: Birth = {
      ...birth,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      certificateStatus: 'pending',
      validationStatus: 'pending', // Statut de validation admin
      synced: false,
      recordedBy, // Qui a créé l'enregistrement
      recordedByType, // Type d'utilisateur (agent, hospital, admin)
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
  
  deleteBirth: async (id, firestoreId) => {
    // Supprimer de SQLite et Firestore
    try {
      await deleteRecord('birth', id, firestoreId);
      console.log('✅ Birth supprimé de SQLite et Firestore');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      // On continue quand même pour mettre à jour le store local
    }
    
    // Mettre à jour le store local
    set((state) => ({
      births: state.births.filter((b) => {
        // Supprimer si l'ID local ou firestoreId correspond
        return b.id !== id && (firestoreId ? (b as any).firestoreId !== firestoreId : true);
      }),
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

