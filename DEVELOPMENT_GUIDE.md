# Guide de Développement - GraceRegistry

## ✅ Ce qui a été fait

### 1. Structure de Navigation
- ✅ `app/_layout.tsx` - Root layout avec (auth) et (dashboard)
- ✅ `app/(auth)/_layout.tsx` - Layout authentification
- ✅ `app/(auth)/login.tsx` - Écran de connexion
- ✅ `app/(auth)/register.tsx` - Écran d'inscription
- ✅ `app/(dashboard)/_layout.tsx` - Layout dashboard principal

### 2. Dashboards par Rôle
- ✅ **Agent** : `/agent/` avec tabs pregnancy et birth
- ✅ **Admin** : `/admin/` avec section certificates et validation
- ✅ **Hospital** : `/hospital/` avec pregnancy et birth

### 3. Stores Zustand (État Global)
- ✅ `store/authStore.ts` - Authentification
- ✅ `store/pregnancyStore.ts` - Enregistrements de grossesse
- ✅ `store/birthStore.ts` - Enregistrements de naissance
- ✅ `store/syncStore.ts` - Synchronisation offline/online

### 4. Types TypeScript
- ✅ `types/user.ts` - Types utilisateur
- ✅ `types/pregnancy.ts` - Types grossesse
- ✅ `types/birth.ts` - Types naissance

### 5. Utilitaires
- ✅ `utils/validation.ts` - Schémas Zod pour validation
- ✅ `utils/date.ts` - Fonctions de manipulation de dates
- ✅ `hooks/useOffline.ts` - Hook pour détection de connexion
- ✅ `constants/config.ts` - Configuration de l'app

---

## 🚀 Prochaines étapes de développement

### Priorité 1 : Authentification

#### 1.1 Compléter `app/(auth)/login.tsx`
```typescript
// Implémenter :
- Formulaire avec react-hook-form
- Validation avec zod (loginSchema existe déjà)
- Appel API avec useAuthStore
- Redirection vers le dashboard approprié selon le rôle
```

#### 1.2 Compléter `app/(auth)/register.tsx`
```typescript
// Implémenter :
- Formulaire avec react-hook-form
- Validation avec zod (registerSchema existe déjà)
- Appel API avec useAuthStore
```

### Priorité 2 : Formulaires d'Enregistrement

#### 2.1 Formulaire de Grossesse
**Fichier : `app/(dashboard)/agent/pregnancy/index.tsx`**

Champs à implémenter :
- Informations de la mère (nom, ID, nationalité)
- Informations du père (nom, ID, nationalité)
- Date de dernière menstruation
- Date d'accouchement estimée (calculée automatiquement)
- Lieu de grossesse
- Suivi prénatal (oui/non)
- Notes supplémentaires

Technologies :
- `react-hook-form` pour le formulaire
- `zod` (pregnancySchema) pour la validation
- `usePregnancyStore` pour sauvegarder

#### 2.2 Formulaire de Naissance
**Fichier : `app/(dashboard)/agent/birth/index.tsx`**

Champs à implémenter :
- Informations de l'enfant (nom, prénom, date, lieu, sexe, poids)
- Informations des parents (mère et père)
- Témoins (2 témoins obligatoires)
- Sélection du statut initial

Technologies :
- `react-hook-form` pour le formulaire
- `zod` (birthSchema) pour la validation
- `useBirthStore` pour sauvegarder

### Priorité 3 : Persistance Locale

#### 3.1 Installation des dépendances
```bash
npm install @react-native-async-storage/async-storage
npm install expo-secure-store
```

#### 3.2 Créer un service de stockage
**Créer : `services/storage.ts`**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '@/constants/config';

export const storage = {
  // Sauvegarder
  save: async (key: string, value: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  
  // Charger
  load: async (key: string) => {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  
  // Supprimer
  remove: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
  
  // Vider tout
  clear: async () => {
    await AsyncStorage.clear();
  },
};
```

#### 3.3 Intégrer dans les stores
Modifier `store/pregnancyStore.ts` et `store/birthStore.ts` pour :
- Sauvegarder automatiquement dans AsyncStorage
- Charger les données au démarrage
- Marquer les données comme "synced" après synchronisation

### Priorité 4 : Génération de PDF

#### 4.1 Installation
```bash
npm install expo-print react-native-pdf-lib
```

#### 4.2 Créer un service de génération PDF
**Créer : `services/pdf.ts`**
```typescript
import * as Print from 'expo-print';

export const generateCertificatePDF = async (birthData: Birth) => {
  // Template HTML du certificat
  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <h1>Certificat de Naissance</h1>
        <p>Enfant: ${birthData.childFirstName} ${birthData.childLastName}</p>
        <!-- TODO: Template complet avec toutes les informations -->
      </body>
    </html>
  `;
  
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
};
```

### Priorité 5 : Synchronisation Offline

#### 5.1 Créer un service API
**Créer : `services/api.ts`**
```typescript
import { CONFIG } from '@/constants/config';
import { useAuthStore } from '@/store/authStore';

const API_URL = CONFIG.API_URL;

export const api = {
  // Login
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },
  
  // Syncer les grossesses
  syncPregnancies: async (pregnancies) => {
    // TODO
  },
  
  // Syncer les naissances
  syncBirths: async (births) => {
    // TODO
  },
};
```

#### 5.2 Intégrer dans `store/syncStore.ts`
- Détecter quand la connexion revient
- Envoyer automatiquement les données en attente
- Gérer les erreurs et retry

### Priorité 6 : Multilingue (i18n)

#### 6.1 Installation
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

#### 6.2 Créer les traductions
**Créer : `locales/fr.json`, `locales/ht.json`, `locales/en.json`**

Exemple `locales/ht.json` (Créole haïtien) :
```json
{
  "auth": {
    "login": "Koneksyon",
    "register": "Enskripsyon"
  },
  "dashboard": {
    "agent": "Ajan",
    "pregnancy": "Ansent",
    "birth": "Nesans"
  }
}
```

### Priorité 7 : Interface Utilisateur

#### 7.1 Créer des composants réutilisables
**Créer :**
- `components/forms/FormInput.tsx` - Input personnalisé
- `components/forms/FormDatePicker.tsx` - Sélecteur de date
- `components/cards/CertificateCard.tsx` - Carte de certificat
- `components/modals/CertificateModal.tsx` - Modal d'affichage PDF
- `components/buttons/PrimaryButton.tsx` - Bouton principal

#### 7.2 Améliorer les dashboards
- Graphiques de statistiques (Chart.js ou Victory)
- Animations (déjà inclus avec Reanimated)
- Dark mode (déjà configuré dans Themed)

---

## 📝 Checklist de Développement

### Phase 1 : MVP Fonctionnel (Semaine 1-2)
- [ ] Compléter authentification (login/register)
- [ ] Formulaire de grossesse fonctionnel
- [ ] Formulaire de naissance fonctionnel
- [ ] Persistance locale (AsyncStorage)
- [ ] Synchronisation de base (online/offline)

### Phase 2 : Fonctionnalités Avancées (Semaine 3-4)
- [ ] Génération de PDF de certificat
- [ ] File de validation multi-niveaux
- [ ] Dashboard admin avec statistiques
- [ ] Gestion des certificats

### Phase 3 : Polish & Tests (Semaine 5-6)
- [ ] Multilingue (FR, HT, EN)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Optimisation des performances
- [ ] Accessibilité

### Phase 4 : Déploiement
- [ ] Configuration EAS Build
- [ ] Tests sur appareils réels
- [ ] Publication sur Google Play et App Store

---

## 🛠️ Commandes Utiles

```bash
# Démarrer l'app
npm start

# Android
npm run android

# iOS
npm run ios

# Nettoyer le cache
npm start -- --clear

# Type checking
npx tsc --noEmit
```

---

## 📚 Documentation à Consulter

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

---

## 💡 Conseils de Développement

1. **Commencez petit** : Implémentez d'abord l'authentification, puis un seul formulaire
2. **Testez souvent** : Vérifiez chaque fonctionnalité avant de passer à la suivante
3. **Utilisez les TODOs** : Chaque fichier contient des TODO pour vous guider
4. **Références** : Inspirez-vous des stores et types existants pour créer de nouvelles fonctionnalités

---

## 🐛 Problèmes Connus

- Les liens de navigation peuvent nécessiter `as any` temporairement jusqu'à ce que tous les écrans soient créés
- La synchronisation offline nécessite une stratégie de retry

---

## ✉️ Besoin d'aide ?

Consultez les fichiers source pour voir les TODOs détaillés dans chaque écran et fonctionnalité.

