# 🔥 Guide Complet - Configuration Firebase & Backend

## 📋 Table des Matières

1. [Installation des Packages](#installation-des-packages)
2. [Création du Projet Firebase](#création-du-projet-firebase)
3. [Activation de Firestore](#activation-de-firestore)
4. [Récupération des Clés de Configuration](#récupération-des-clés-de-configuration)
5. [Création du Fichier .env](#création-du-fichier-env)
6. [Vérification et Tests](#vérification-et-tests)
7. [Intégration dans les Stores](#intégration-dans-les-stores)
8. [Dépannage](#dépannage)

---

## 📦 Installation des Packages

```bash
# Firestore (SDK Web - compatible Expo)
npm install firebase

# SQLite (intégré Expo)
npx expo install expo-sqlite

# MMKV (optionnel, pour settings rapides)
npm install react-native-mmkv
```

---

## 🔥 Création du Projet Firebase

### Étape 1 : Accéder à Firebase Console

1. Ouvrez votre navigateur
2. Allez sur : **https://console.firebase.google.com**
3. Connectez-vous avec votre compte Google

### Étape 2 : Créer un Nouveau Projet

1. Cliquez sur le bouton **"Ajouter un projet"** (ou "Add project")
2. **Nom du projet** : Entrez `GraceRegistry` (ou le nom de votre choix)
3. Cliquez sur **"Continuer"**
4. **Google Analytics** : 
   - Pour débuter, vous pouvez **désactiver** (décochez la case)
   - Ou l'activer si vous voulez des statistiques
5. Cliquez sur **"Créer le projet"**
6. Attendez quelques secondes que le projet soit créé
7. Cliquez sur **"Continuer"**

---

## 🗄️ Activation de Firestore

### Étape 1 : Accéder à Firestore

1. Dans le menu de gauche, cliquez sur **"Firestore Database"**
   - (Icône de base de données 📊)
2. Cliquez sur le bouton **"Créer une base de données"**

### Étape 2 : Choisir l'Édition

1. **Choisir l'Édition** :
   - ✅ **Sélectionnez "Standard"** (Édition standard)
   - ⚠️ **Ne choisissez PAS "Entreprise"** (c'est payant et pour des besoins avancés)
   - L'édition Standard est **GRATUITE** avec un quota généreux :
     - 50,000 lectures/jour gratuites
     - 20,000 écritures/jour gratuites
     - 20,000 suppressions/jour gratuites
   - C'est largement suffisant pour débuter et tester !
   - Cliquez sur **"Suivant"** ou **"Continue"**

### Étape 3 : Configurer Firestore

1. **Mode de sécurité** : 
   - Choisissez **"Démarrer en mode test"** ✅
   - (Pour le développement, on pourra changer les règles plus tard)
   - ⚠️ Mode test = toutes les lectures/écritures autorisées pendant 30 jours
2. Cliquez sur **"Suivant"**
3. **Emplacement** : 
   - Choisissez une région proche (ex: `us-central1` ou `europe-west1`)
   - Pour Haïti, `us-central1` est une bonne option
4. Cliquez sur **"Activer"**
5. Attendez quelques secondes (30-60 secondes) que la base soit créée
6. Vous devriez voir un écran avec "Aucune collection" - c'est normal ! ✅

---

## 🔑 Récupération des Clés de Configuration

### Étape 1 : Accéder aux Paramètres

1. Cliquez sur l'icône **⚙️** (Paramètres) en haut à gauche
2. Sélectionnez **"Paramètres du projet"** (ou "Project settings")

### Étape 2 : Ajouter une Application Web

> **💡 Pourquoi seulement Web ?**
> 
> Avec **Expo + Firebase SDK Web**, vous n'avez besoin que d'**UNE SEULE application Web** dans Firebase !
> 
> - ✅ Le SDK Web de Firebase fonctionne sur **iOS, Android ET Web**
> - ✅ Expo utilise le SDK Web de Firebase (pas les SDKs natifs)
> - ✅ Une seule configuration = toutes les plateformes
> - ❌ Vous n'avez PAS besoin de créer des apps séparées pour iOS/Android
> 
> C'est la beauté d'Expo : une seule configuration pour toutes les plateformes ! 🎉

1. Scrollez jusqu'à la section **"Vos applications"** (ou "Your apps")
   - Vous verrez peut-être déjà des applications (Android, iOS) - **ignorez-les**
   - Ou la section sera vide

2. **Cliquez sur l'icône Web** (`</>`) pour ajouter une application web

3. **Nom de l'application** :
   - Entrez : `GraceRegistry Web`
   - Ou n'importe quel nom que vous voulez

4. **Firebase Hosting** :
   - Vous pouvez **décocher** cette case (pas nécessaire pour l'instant)

5. **Cliquez sur "Enregistrer l'application"** (ou "Register app")

6. **Choisir la Méthode d'Installation** :
   - ✅ **Sélectionnez "Utiliser npm"** (ou "Use npm")
   - ❌ **Ne choisissez PAS "Utiliser une balise script"** (c'est pour les sites web HTML simples)
   - Pourquoi npm ? Parce que vous utilisez **Expo/React Native** et vous avez déjà installé le package `firebase` avec npm !
   - Vous pouvez ignorer le code d'exemple qui s'affiche (on a déjà créé le fichier de config)

### Étape 3 : Copier les Clés

Vous verrez maintenant un code JavaScript qui ressemble à ça :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "graceregistry-xxxxx.firebaseapp.com",
  projectId: "graceregistry-xxxxx",
  storageBucket: "graceregistry-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

**📋 COPIEZ ces 6 valeurs** (sans les guillemets) :
- `apiKey` → EXPO_PUBLIC_FIREBASE_API_KEY
- `authDomain` → EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
- `projectId` → EXPO_PUBLIC_FIREBASE_PROJECT_ID
- `storageBucket` → EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
- `messagingSenderId` → EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- `appId` → EXPO_PUBLIC_FIREBASE_APP_ID

> **Note sur le 7ème élément** : Si Firebase vous donne aussi `measurementId` (Google Analytics), vous pouvez l'**IGNORER** pour l'instant. Il n'est pas nécessaire pour Firestore et peut être ajouté plus tard si besoin.

---

## 📝 Création du Fichier .env

### Étape 1 : Créer le Fichier

1. À la **racine du projet** (même niveau que `package.json`, `app.json`, `README.md`)
2. Créez un nouveau fichier nommé `.env`
3. **Important** : Le fichier doit commencer par un point (`.env`)

### Étape 2 : Remplir les Variables

Copiez ce template et remplacez avec vos vraies valeurs :

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyB...votre-clé-ici
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=votre-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Exemple concret** :
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=graceregistry-12345.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=graceregistry-12345
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=graceregistry-12345.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Étape 3 : Vérifier le Fichier

1. ✅ Vérifiez que le fichier s'appelle bien `.env` (avec le point au début)
2. ✅ Vérifiez qu'il est à la racine du projet
3. ✅ Vérifiez que toutes les variables commencent par `EXPO_PUBLIC_`
4. ✅ Vérifiez qu'il n'y a pas d'espaces avant/après les `=`
5. ⚠️ **Important** : Ajoutez `.env` dans `.gitignore` pour ne pas commiter les clés !

---

## ✅ Vérification et Tests

### Étape 1 : Redémarrer Expo

**IMPORTANT** : Après avoir créé/modifié le fichier `.env`, vous DEVEZ redémarrer Expo !

1. **Arrêtez** l'application (Ctrl+C dans le terminal)
2. **Redémarrez** avec :
   ```bash
   npm start
   ```

### Étape 2 : Vérifier dans la Console

Quand l'app démarre, vous devriez voir dans la console :

```
✅ Database initialized successfully
✅ Database initialized
✅ Firebase initialized
```

Si vous voyez ces 3 lignes, c'est que tout fonctionne ! 🎉

### Étape 3 : Vérifier les Logs

Le message `console.log('✅ Database initialized')` apparaît dans les **logs de l'application**, pas dans le terminal Expo.

**Où chercher les logs ?**

1. **Terminal Metro** : Les logs apparaissent **après** que l'app se soit chargée sur votre téléphone/émulateur
2. **Expo Dev Tools** : Appuyez sur `j` dans le terminal Expo pour ouvrir les Dev Tools, puis allez dans l'onglet "Logs"
3. **Android Studio Logcat** (si vous utilisez Android) : Filtrez par "ReactNativeJS"
4. **Xcode Console** (si vous utilisez iOS) : Ouvrez Xcode et allez dans la console

**Le plus important** : Vérifiez qu'il **n'y a PAS d'erreur** dans le terminal ! Si l'app démarre normalement, c'est bon signe ! ✅

### Étape 4 : Tester la Connexion Firebase

Une fois Expo redémarré, ouvrez l'application et vérifiez dans la console qu'il n'y a **pas d'erreur Firebase**.

Si vous voyez une erreur comme :
- ❌ "Firebase: Error (auth/invalid-api-key)"
- ❌ "Firebase: Error (auth/invalid-credential)"

**Solution** :
1. Vérifiez que le fichier `.env` est bien à la racine
2. Vérifiez que toutes les variables commencent par `EXPO_PUBLIC_`
3. Vérifiez qu'il n'y a pas d'espaces avant/après les `=`
4. Redémarrez Expo complètement

---

## 🔄 Intégration dans les Stores

Une fois que Firebase fonctionne, on doit intégrer la synchronisation dans les stores :

### Modifier `pregnancyStore.ts`

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

### Modifier `birthStore.ts`

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

### Activer la Synchronisation Automatique

Dans `store/syncStore.ts`, la synchronisation est déjà configurée. Elle se déclenche automatiquement quand :
- L'app démarre et qu'il y a une connexion internet
- La connexion internet est restaurée après une période offline
- Vous appelez manuellement `useSyncStore.getState().syncAll()`

---

## 🆘 Dépannage

### Erreur "Firebase not initialized"
- Vérifiez que toutes les valeurs dans `.env` sont correctes
- Vérifiez qu'il n'y a pas d'espaces avant/après les `=`
- Vérifiez que les variables commencent par `EXPO_PUBLIC_`
- Redémarrez Expo complètement

### Erreur "Database not initialized" ou "SQLite.OpenDatabase is not a function"
- ✅ **Corrigé** : Le code utilise maintenant `openDatabaseAsync` (API moderne)
- Vérifiez les logs de console
- Vérifiez que `expo-sqlite` est bien installé (`npm list expo-sqlite`)
- Si l'erreur persiste, redémarrez complètement Expo

### Les variables ne sont pas chargées
- Redémarrez Expo : `npm start`
- Vérifiez que le fichier s'appelle bien `.env` (avec le point)
- Vérifiez qu'il est à la racine du projet

### Synchronisation ne fonctionne pas
- Vérifiez la connexion internet
- Vérifiez les règles Firestore (mode test autorise tout pendant 30 jours)
- Vérifiez les logs de console

### Le fichier .env n'est pas reconnu
- Vérifiez le nom : `.env` (pas `env` ou `.env.txt`)
- Redémarrez Expo complètement

---

## 📚 Ressources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [React Native MMKV](https://github.com/mrousavy/react-native-mmkv)

---

## 🎯 Prochaines Étapes

Une fois que tout fonctionne :

1. ✅ Setup Firebase
2. ✅ Installer packages
3. ⏭️ Intégrer dans stores (voir section ci-dessus)
4. ⏭️ Tester offline/online
5. ⏭️ Ajouter gestion d'erreurs
6. ⏭️ Ajouter retry logic
7. ⏭️ Ajouter UI de statut de sync

