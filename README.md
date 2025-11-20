# GraceRegistry

Application mobile pour l'enregistrement et la gestion des certificats de naissance en Haïti.

## Description

GraceRegistry est une application mobile développée avec React Native et Expo qui garantit que chaque enfant né en Haïti reçoive immédiatement un certificat de naissance légal, même dans les zones rurales dépourvues d'accès à Internet.

## Modules principaux

- **Enregistrement de grossesse** : Suivi des parents et de la grossesse
- **Enregistrement de naissance** : Informations détaillées sur l'enfant, les parents, le lieu et les témoins
- **Gestion et validation multi-niveaux** : Contrôle administratif à plusieurs niveaux
- **Synchronisation hors ligne** : Travail possible sans connexion Internet
- **Tableau de bord administratif** : Statistiques et rapports en temps réel

## Démarrage rapide

### Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn
- Expo CLI globalement installé

### Installation

```bash
# Cloner le repository
git clone [URL]
cd GraceRegistry

# Installer les dépendances
npm install

# Démarrer l'application
npm start
```

### Démarrage sur différents plateformes

```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

### Dépannage

Si l'app ne démarre pas :

```bash
# Nettoyer le cache
npx expo start --clear

# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

## Structure du projet

```
GraceRegistry/
├── app/                    # Expo Router (navigation)
│   ├── (auth)/            # Authentification
│   └── (dashboard)/       # Tableaux de bord par rôle
│       ├── agent/         # Module Agent
│       ├── hospital/      # Module Hôpital
│       └── admin/         # Module Administrateur
├── components/            # Composants réutilisables
│   ├── ScreenContainer.tsx  # Wrapper SafeAreaView pour écrans
│   ├── ThemedComponents.tsx # Composants thématiques
│   └── ...
├── store/                 # Zustand stores (état global)
├── types/                 # Types TypeScript
├── utils/                 # Fonctions utilitaires
├── constants/             # Constantes de configuration
├── theme/                 # Système de thème
├── i18n/                  # Internationalisation (FR/HT)
└── assets/               # Images, fonts, etc.
```

### Notes importantes

- Tous les écrans doivent utiliser `ScreenContainer` de `@/components/ScreenContainer` pour gérer les safe areas
- Les composants thématiques sont dans `ThemedComponents.tsx`
- Le système de thème supporte light/dark mode
- L'internationalisation supporte français et créole haïtien

## Rôles utilisateurs

- **Agent de terrain** : Enregistrement des grossesses et naissances
- **Hôpital** : Enregistrement des grossesses et naissances
- **Administrateur** : Gestion complète, validation des enregistrements et génération de certificats

## Technologies utilisées

- React Native (0.81.5)
- Expo (SDK 54)
- Expo Router (navigation basée sur les fichiers)
- TypeScript
- Zustand (gestion d'état)
- React Hook Form + Zod (formulaires et validation)
- NetInfo (détection de connexion)
- Firebase (Authentification et Firestore)
- SQLite (stockage local)

## Documentation

Voir [GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md) pour un guide complet d'utilisation de l'application.

## Licence

[À déterminer]
