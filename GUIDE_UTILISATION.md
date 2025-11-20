# Guide d'utilisation - GraceRegistry

Ce guide présente l'utilisation complète de l'application GraceRegistry pour tous les types d'utilisateurs.

## Table des matières

1. [Configuration initiale](#configuration-initiale)
2. [Authentification](#authentification)
3. [Module Agent](#module-agent)
4. [Module Hôpital](#module-hôpital)
5. [Module Administrateur](#module-administrateur)
6. [Fonctionnalités communes](#fonctionnalités-communes)

## Configuration initiale

### Prérequis

- Un compte Firebase configuré avec Authentication et Firestore activés
- Les identifiants Firebase dans un fichier `.env` (non inclus dans le repository)
- Node.js et npm installés

### Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
EXPO_PUBLIC_FIREBASE_API_KEY=votre_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

## Authentification

### Connexion

1. Ouvrez l'application
2. Entrez votre adresse email et votre mot de passe
3. Cliquez sur "Se connecter"
4. Vous serez redirigé vers le dashboard correspondant à votre rôle

### Rôles disponibles

- **Agent** : Accès au module d'enregistrement terrain
- **Hôpital** : Accès au module d'enregistrement hospitalier
- **Admin** : Accès complet à tous les modules et fonctionnalités administratives

## Module Agent

### Fonctionnalités principales

- Enregistrement de grossesses
- Enregistrement de naissances
- Consultation de l'historique des enregistrements
- Signalement d'urgences
- Visualisation des preuves d'enregistrement

### Enregistrer une grossesse

1. Accédez au dashboard agent
2. Cliquez sur "Enregistrer une grossesse"
3. Remplissez le formulaire avec les informations de la mère
4. Validez l'enregistrement
5. Une preuve provisoire est générée automatiquement

### Enregistrer une naissance

1. Accédez au dashboard agent
2. Cliquez sur "Enregistrer une naissance"
3. Remplissez les trois étapes du formulaire :
   - Informations de l'enfant
   - Informations des parents
   - Informations des témoins
4. Validez l'enregistrement
5. Une preuve provisoire est générée automatiquement

### Historique

L'historique affiche tous vos enregistrements avec possibilité de :
- Filtrer par type (grossesse/naissance)
- Rechercher par nom ou référence
- Visualiser les preuves d'enregistrement
- Supprimer des enregistrements (si non validés)

### Signalement d'urgence

En cas de situation d'urgence médicale :
1. Accédez à la section "Signalement d'urgence"
2. Remplissez le formulaire avec les détails
3. Sélectionnez le niveau d'urgence
4. Envoyez le signalement
5. L'administrateur sera notifié

## Module Hôpital

### Fonctionnalités principales

- Enregistrement de grossesses
- Enregistrement de naissances
- Consultation de l'historique des enregistrements hospitaliers
- Recherche dans les enregistrements validés

### Enregistrements

Les hôpitaux peuvent enregistrer des grossesses et naissances de la même manière que les agents. Les enregistrements sont automatiquement marqués comme créés par l'hôpital.

### Historique

L'historique hospital affiche uniquement les enregistrements créés par l'hôpital et validés par l'administrateur. Vous pouvez :
- Filtrer par période (semaine, mois, mois dernier)
- Filtrer par type (grossesse/naissance)
- Rechercher dans les enregistrements

### Recherche

La fonction de recherche permet de trouver rapidement des enregistrements par :
- Numéro de référence
- Nom de la mère
- Nom de l'enfant
- Nom du père
- Nom de la personne ayant enregistré

## Module Administrateur

### Fonctionnalités principales

- Validation/rejet des enregistrements
- Gestion des utilisateurs
- Statistiques et rapports
- Gestion des certificats
- Gestion des signalements d'urgence
- Enregistrement direct de grossesses et naissances

### Validation des enregistrements

1. Accédez à la section "Validation"
2. Consultez les enregistrements en attente
3. Pour chaque enregistrement, vous pouvez :
   - Valider : L'enregistrement devient officiel
   - Rejeter : Spécifiez une raison de rejet
   - Voir les détails : Consultez toutes les informations

### Gestion des utilisateurs

1. Accédez à la section "Gestion des utilisateurs"
2. Consultez la liste de tous les utilisateurs
3. Actions disponibles :
   - Créer un nouvel utilisateur
   - Modifier les informations d'un utilisateur
   - Activer/Désactiver un utilisateur
   - Réinitialiser le mot de passe

### Statistiques

Le tableau de bord statistiques affiche :
- Statistiques globales (total, en attente, validés, rejetés)
- Statistiques par période (jour, semaine, mois, année)
- Statistiques par département
- Graphiques d'évolution temporelle

### Gestion des certificats

1. Accédez à la section "Certificats"
2. Consultez tous les certificats de naissance validés
3. Filtrez par statut (en attente, vérifié, approuvé, émis, rejeté)
4. Pour chaque certificat :
   - Marquer comme vérifié
   - Approuver
   - Émettre le certificat (génération automatique du numéro)
   - Rejeter avec raison

### Signalements d'urgence

1. Accédez à la section "Signalements d'urgence"
2. Consultez tous les signalements envoyés par les agents
3. Filtrez par statut (en attente, pris en charge, résolu)
4. Actions disponibles :
   - Marquer comme pris en charge
   - Résoudre avec notes

## Fonctionnalités communes

### Profil utilisateur

Tous les utilisateurs peuvent :
- Consulter leurs informations de profil
- Changer leur mot de passe
- Voir leur date d'inscription

### Paramètres

- Changer le thème (clair/sombre)
- Changer la langue (français/créole haïtien)
- Accéder à l'aide
- Se déconnecter

### Synchronisation

L'application fonctionne en mode hors ligne :
- Les enregistrements sont sauvegardés localement
- La synchronisation avec Firestore se fait automatiquement quand la connexion est disponible
- Un indicateur de connexion est affiché dans le dashboard

### Preuves d'enregistrement

Chaque enregistrement génère automatiquement une preuve provisoire qui contient :
- Numéro de référence unique
- Informations de l'enregistrement
- Date de génération
- Statut (en attente/validé)

### Recherche et filtres

La plupart des écrans d'historique et de liste proposent :
- Recherche par texte
- Filtres par type
- Filtres par période
- Tri par date

## Support

Pour toute question ou problème, contactez l'administrateur système.

