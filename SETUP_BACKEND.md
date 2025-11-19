# 🚀 Guide d'Installation Backend - GraceRegistry

> **📖 Note** : Pour la configuration complète de Firebase (création du projet, activation de Firestore, récupération des clés, création du fichier `.env`), consultez le guide détaillé : **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

Ce guide se concentre sur l'intégration de la synchronisation dans votre application après la configuration Firebase.

---

## ✅ Prérequis

Avant de continuer, assurez-vous d'avoir :

1. ✅ Suivi le guide [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. ✅ Installé les packages (`firebase`, `expo-sqlite`)
3. ✅ Créé le fichier `.env` avec vos clés Firebase
4. ✅ Vérifié que Firebase et SQLite s'initialisent correctement (voir les logs de console)

---

## 🗄️ Initialisation de la Base de Données SQLite

L'initialisation de SQLite est déjà configurée dans `components/AppProvider.tsx`. Si vous devez la vérifier ou la modifier :

```typescript
import { useEffect } from 'react';
import { initDatabase } from '@/services/database/sqlite';

export default function AppProvider() {
  useEffect(() => {
    // Initialiser SQLite au démarrage
    initDatabase().catch(console.error);
  }, []);

  // ... reste du code
}
```

---

## 🔄 Étape 4: Intégrer dans les Stores

### 4.1 Modifier `pregnancyStore.ts`

```typescript
import { addToSyncQueue } from '@/services/sync/syncService';

export const usePregnancyStore = create<PregnancyState>((set, get) => ({
  // ...
  
  addPregnancy: async (pregnancy) => {
    const newPregnancy: Pregnancy = {
      ...pregnancy,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    
    // Sauvegarder dans SQLite (via syncService)
    await addToSyncQueue('pregnancy', newPregnancy);
    
    // Mettre à jour le store local
    set((state) => ({
      pregnancies: [...state.pregnancies, newPregnancy],
    }));
  },
  
  // ...
}));
```

### 4.2 Modifier `birthStore.ts`

```typescript
import { addToSyncQueue } from '@/services/sync/syncService';

export const useBirthStore = create<BirthState>((set, get) => ({
  // ...
  
  addBirth: async (birth) => {
    const newBirth: Birth = {
      ...birth,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      certificateStatus: 'pending',
      synced: false,
    };
    
    // Sauvegarder dans SQLite (via syncService)
    await addToSyncQueue('birth', newBirth);
    
    // Mettre à jour le store local
    set((state) => ({
      births: [...state.births, newBirth],
    }));
  },
  
  // ...
}));
```

---

## 🔄 Étape 5: Activer la Synchronisation Automatique

Dans `store/syncStore.ts`, remplacer les TODOs :

```typescript
import { syncPendingRecords, pullFromFirestore } from '@/services/sync/syncService';

export const useSyncStore = create<SyncState>((set, get) => ({
  // ...
  
  syncAll: async () => {
    const { isOnline } = get();
    
    if (!isOnline) {
      console.log('No internet connection. Sync will happen when connection is restored.');
      return;
    }
    
    set({ isSyncing: true });
    try {
      // Synchroniser les enregistrements en attente
      await syncPendingRecords();
      
      // Récupérer les nouvelles données depuis Firestore
      await pullFromFirestore('pregnancy');
      await pullFromFirestore('birth');
      
      set({ 
        isSyncing: false, 
        lastSyncDate: new Date(),
        pendingSync: await getPendingCount(),
      });
    } catch (error) {
      console.error('Sync all error:', error);
      set({ isSyncing: false });
    }
  },
}));
```

---

## 🔒 Étape 6: Configurer les Règles de Sécurité Firestore

Dans Firebase Console → Firestore Database → Règles :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les grossesses
    match /pregnancies/{pregnancyId} {
      // Les agents et hôpitaux peuvent créer
      allow create: if request.auth != null && 
                     (request.auth.token.role == 'agent' || 
                      request.auth.token.role == 'hospital');
      
      // Les admins peuvent lire et valider
      allow read: if request.auth != null && 
                   request.auth.token.role == 'admin';
      
      // Les admins peuvent mettre à jour (validation)
      allow update: if request.auth != null && 
                     request.auth.token.role == 'admin';
    }
    
    // Règles pour les naissances
    match /births/{birthId} {
      allow create: if request.auth != null && 
                     (request.auth.token.role == 'agent' || 
                      request.auth.token.role == 'hospital');
      
      allow read: if request.auth != null && 
                   request.auth.token.role == 'admin';
      
      allow update: if request.auth != null && 
                     request.auth.token.role == 'admin';
    }
    
    // Règles pour les utilisateurs
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == userId;
    }
  }
}
```

---

## ✅ Étape 7: Tester

### 7.1 Test Offline

1. Désactiver le WiFi/Données
2. Enregistrer une grossesse/naissance
3. Vérifier dans SQLite que c'est sauvegardé
4. Réactiver la connexion
5. Vérifier que ça se synchronise automatiquement

### 7.2 Test Online

1. Enregistrer une grossesse/naissance
2. Vérifier dans Firebase Console que ça apparaît
3. Vérifier que l'enregistrement disparaît de SQLite

---

## 📊 Monitoring

### Voir les Enregistrements en Attente

```typescript
import { getPendingCount } from '@/services/sync/syncService';

const counts = await getPendingCount();
console.log('Pending:', counts);
// { pregnancies: 2, births: 1 }
```

### Forcer une Synchronisation

```typescript
import { syncPendingRecords } from '@/services/sync/syncService';

await syncPendingRecords();
```

---

## 🎯 Prochaines Étapes

1. ✅ Setup Firebase
2. ✅ Installer packages
3. ✅ Intégrer dans stores
4. ⏭️ Tester offline/online
5. ⏭️ Ajouter gestion d'erreurs
6. ⏭️ Ajouter retry logic
7. ⏭️ Ajouter UI de statut de sync

---

## 🆘 Dépannage

### Erreur "Firebase not initialized"
- Consultez la section [Dépannage](./FIREBASE_SETUP.md#dépannage) dans FIREBASE_SETUP.md
- Vérifier que les variables d'environnement sont bien chargées
- Redémarrer l'app après modification de `.env`

### Erreur "Database not initialized"
- Vérifier que `initDatabase()` est appelé au démarrage
- Vérifier les logs de console
- Consultez la section [Dépannage](./FIREBASE_SETUP.md#dépannage) dans FIREBASE_SETUP.md

### Synchronisation ne fonctionne pas
- Vérifier la connexion internet
- Vérifier les règles Firestore
- Vérifier les logs de console
- Vérifier que `addToSyncQueue()` est bien appelé dans les stores

---

## 📚 Ressources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [React Native MMKV](https://github.com/mrousavy/react-native-mmkv)

