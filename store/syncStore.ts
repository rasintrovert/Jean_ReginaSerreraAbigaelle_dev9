import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

interface SyncState {
  isOnline: boolean;
  pendingSync: {
    pregnancies: number;
    births: number;
  };
  isSyncing: boolean;
  lastSyncDate: Date | null;
  checkConnection: () => void;
  syncAll: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: false,
  pendingSync: { pregnancies: 0, births: 0 },
  isSyncing: false,
  lastSyncDate: null,
  
  checkConnection: () => {
    NetInfo.fetch().then((state) => {
      set({ isOnline: state.isConnected ?? false });
    });
  },
  
  syncAll: async () => {
    const { isOnline } = get();
    
    if (!isOnline) {
      console.log('No internet connection. Sync will happen when connection is restored.');
      return;
    }
    
    set({ isSyncing: true });
    try {
      // Importer dynamiquement pour éviter les dépendances circulaires
      const { syncPendingRecords, pullFromFirestore, getPendingCount } = await import('@/services/sync/syncService');
      
      // Synchroniser les enregistrements en attente
      await syncPendingRecords();
      
      // Récupérer les nouvelles données depuis Firestore
      await pullFromFirestore('pregnancy');
      await pullFromFirestore('birth');
      
      // Mettre à jour le nombre d'enregistrements en attente
      const pendingCount = await getPendingCount();
      
      set({ 
        isSyncing: false, 
        lastSyncDate: new Date(),
        pendingSync: pendingCount,
      });
    } catch (error) {
      console.error('Sync all error:', error);
      set({ isSyncing: false });
    }
  },
}));

// Écouter les changements de connexion
NetInfo.addEventListener((state) => {
  useSyncStore.getState().checkConnection();
  
  // Synchroniser automatiquement quand la connexion revient
  if (state.isConnected) {
    useSyncStore.getState().syncAll();
  }
});

