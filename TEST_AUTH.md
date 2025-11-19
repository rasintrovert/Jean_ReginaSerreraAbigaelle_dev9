# 🧪 Guide de Test - Authentification Firebase

## 📋 Prérequis

1. ✅ Firebase configuré (fichier `.env` avec les clés)
2. ✅ Firestore activé dans Firebase Console
3. ✅ Firebase Authentication activé (Email/Password)

---

## 🚀 Étape 1: Démarrer l'application

```bash
npm start
```

Puis scanner le QR code avec Expo Go ou lancer sur un émulateur.

---

## 📝 Étape 2: Activer Email/Password dans Firebase Authentication

### ⚠️ IMPORTANT : Activer la méthode de connexion d'abord !

Avant de pouvoir créer des utilisateurs, vous devez activer la méthode Email/Password :

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet `graceregistry`
3. Dans le menu de gauche, cliquez sur **Authentication**
4. Cliquez sur l'onglet **Sign-in method** (ou "Méthodes de connexion")
5. Vous verrez une liste de méthodes de connexion disponibles
6. Cliquez sur **Email/Password** (ou "E-mail/Mot de passe")
7. Activez le premier toggle : **Enable** (ou "Activer")
8. **Optionnel** : Activez aussi "Email link (passwordless sign-in)" si vous voulez, mais ce n'est pas nécessaire
9. Cliquez sur **Save** (ou "Enregistrer")

✅ Maintenant vous pouvez créer des utilisateurs !

---

## 📝 Étape 3: Créer les comptes de test

### 3.1 Créer l'utilisateur AGENT (si pas déjà fait)

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet `graceregistry`
3. Allez dans **Authentication** > **Users**
4. Cliquez sur **Add user**
5. Entrez :
   - **Email** : `agent@test.com`
   - **Password** : `test123456`
6. Cliquez sur **Add user**
7. **Copiez l'UID** de l'utilisateur créé

### 3.2 Créer l'utilisateur ADMIN

1. Dans **Authentication** > **Users**, cliquez sur **Add user**
2. Entrez :
   - **Email** : `admin@test.com`
   - **Password** : `test123456`
3. Cliquez sur **Add user**
4. **Copiez l'UID** de l'utilisateur créé

### 3.3 Créer l'utilisateur HOSPITAL

1. Dans **Authentication** > **Users**, cliquez sur **Add user**
2. Entrez :
   - **Email** : `hospital@test.com`
   - **Password** : `test123456`
3. Cliquez sur **Add user**
4. **Copiez l'UID** de l'utilisateur créé

### 3.4 Créer les profils utilisateurs dans Firestore

Pour **chaque utilisateur** (Agent, Admin, Hospital), créez un document dans Firestore :

1. Dans Firebase Console, allez dans **Firestore Database**
2. Si la collection `users` n'existe pas :
   - Cliquez sur **Start collection** (ou "Créer une collection")
   - **Collection ID** : Entrez `users` et cliquez sur **Next** (ou "Suivant")
3. Si la collection `users` existe déjà :
   - Cliquez sur **Add document** (ou "Ajouter un document")

4. **Document ID** : 
   - **IMPORTANT** : Copiez l'**UID** de l'utilisateur depuis **Authentication > Users**
   - Collez-le dans le champ "Document ID"
   - ⚠️ **Ne pas utiliser Auto-ID** - il faut utiliser l'UID exact de l'utilisateur !

5. **Ajouter les champs** (cliquez sur "Ajouter un champ" pour chaque champ) :

   **Champ 1 : `name`**
   - **Champ** : `name`
   - **Type** : Sélectionnez `string` (chaîne)
   - **Valeur** : `Test User`
   - Cliquez sur **Done** (ou "Terminé")

   **Champ 2 : `email`**
   - Cliquez sur **"Ajouter un champ"**
   - **Champ** : `email`
   - **Type** : Sélectionnez `string` (chaîne)
   - **Valeur** : `test@example.com`
   - Cliquez sur **Done**

   **Champ 3 : `role`**
   - Cliquez sur **"Ajouter un champ"**
   - **Champ** : `role`
   - **Type** : Sélectionnez `string` (chaîne)
   - **Valeur** : `agent` (ou `admin` ou `hospital`)
   - Cliquez sur **Done**

   **Champ 4 : `createdAt`**
   - Cliquez sur **"Ajouter un champ"**
   - **Champ** : `createdAt`
   - **Type** : Sélectionnez `timestamp` (horodatage)
   - **Valeur** : Cliquez sur le bouton pour générer la date/heure actuelle
   - Cliquez sur **Done**

   **Champ 5 : `updatedAt`**
   - Cliquez sur **"Ajouter un champ"**
   - **Champ** : `updatedAt`
   - **Type** : Sélectionnez `timestamp` (horodatage)
   - **Valeur** : Cliquez sur le bouton pour générer la date/heure actuelle
   - Cliquez sur **Done**

6. Cliquez sur **Save** (ou "Enregistrer") pour créer le document

**📝 Résumé des champs à créer pour CHAQUE utilisateur :**

#### Pour l'AGENT :
- `name` (string) : `Agent Test`
- `email` (string) : `agent@test.com`
- `role` (string) : `agent`
- `createdAt` (timestamp) : Date actuelle
- `updatedAt` (timestamp) : Date actuelle

#### Pour l'ADMIN :
- `name` (string) : `Admin Test`
- `email` (string) : `admin@test.com`
- `role` (string) : `admin`
- `createdAt` (timestamp) : Date actuelle
- `updatedAt` (timestamp) : Date actuelle

#### Pour l'HOSPITAL :
- `name` (string) : `Hôpital Test`
- `email` (string) : `hospital@test.com`
- `role` (string) : `hospital`
- `createdAt` (timestamp) : Date actuelle
- `updatedAt` (timestamp) : Date actuelle

**Rôles disponibles** :
- `agent` - Agent de terrain
- `admin` - Administrateur
- `hospital` - Hôpital

**💡 Astuce** : Vous pouvez créer les 3 utilisateurs d'un coup, puis créer les 3 profils dans Firestore.

---

## 🔐 Étape 4: Tester la connexion avec les différents rôles

### 4.1 Tester avec l'AGENT

1. Dans l'application, allez sur l'écran de connexion
2. Entrez :
   - **Email** : `agent@test.com`
   - **Password** : `test123456`
   - **Rôle** : Sélectionnez n'importe quel rôle (il sera ignoré, le vrai rôle vient de Firestore)
3. Cliquez sur **Se connecter**

**✅ Résultat attendu** : Redirection vers le Dashboard Agent

### 4.2 Tester avec l'ADMIN

1. Déconnectez-vous (Profil > Déconnexion)
2. Connectez-vous avec :
   - **Email** : `admin@test.com`
   - **Password** : `test123456`
3. Cliquez sur **Se connecter**

**✅ Résultat attendu** : Redirection vers le Dashboard Admin

### 4.3 Tester avec l'HOSPITAL

1. Déconnectez-vous
2. Connectez-vous avec :
   - **Email** : `hospital@test.com`
   - **Password** : `test123456`
3. Cliquez sur **Se connecter**

**✅ Résultat attendu** : Redirection vers le Dashboard Hospital

### ❌ Si erreur

- Vérifiez les logs dans le terminal
- Vérifiez que le profil utilisateur existe dans Firestore
- Vérifiez que le champ `role` est bien présent et valide

---

## 📱 Étape 5: Tester l'inscription (Optionnel)

Pour tester l'inscription depuis l'application, vous devez d'abord créer un écran d'inscription. Pour l'instant, utilisez Firebase Console.

---

## 🔄 Étape 6: Tester la persistance de session

1. Connectez-vous avec un compte
2. **Fermez complètement l'application** (pas juste mettre en arrière-plan)
3. **Rouvrez l'application**

### ✅ Résultat attendu

- ✅ L'utilisateur reste connecté
- ✅ Redirection automatique vers le dashboard (pas vers login)

---

## 🚪 Étape 7: Tester la déconnexion

1. Allez dans **Profil** (icône en bas à droite)
2. Cliquez sur **Déconnexion**
3. Confirmez

### ✅ Résultat attendu

- ✅ Déconnexion réussie
- ✅ Redirection vers l'écran de login

---

## 🐛 Dépannage

### Erreur : "User profile not found"

**Cause** : Le profil utilisateur n'existe pas dans Firestore.

**Solution** :
1. Vérifiez que le document existe dans `users/{userId}`
2. Vérifiez que les champs `name`, `email`, `role` sont présents

### Erreur : "Invalid email" ou "Wrong password"

**Cause** : Les identifiants sont incorrects.

**Solution** :
1. Vérifiez l'email et le mot de passe
2. Vérifiez que l'utilisateur existe dans Firebase Authentication

### Erreur : "Network request failed"

**Cause** : Problème de connexion ou configuration Firebase.

**Solution** :
1. Vérifiez votre connexion internet
2. Vérifiez que les clés dans `.env` sont correctes
3. Vérifiez que Firestore est activé en mode "Test" ou avec les bonnes règles

### L'application ne redirige pas après connexion

**Cause** : Le rôle dans Firestore ne correspond pas aux routes.

**Solution** :
1. Vérifiez que le rôle est exactement : `agent`, `admin`, ou `hospital` (en minuscules)
2. Vérifiez les logs dans le terminal pour voir le rôle récupéré

---

## 📊 Vérifier dans Firebase Console

### Authentication
- **Users** : Liste des utilisateurs authentifiés
- **Sign-in method** : Email/Password doit être activé

### Firestore Database
- **Collection `users`** : Contient les profils utilisateurs
- Chaque document doit avoir : `name`, `email`, `role`, `createdAt`, `updatedAt`

---

## ✅ Checklist de test

- [ ] Connexion avec un compte existant
- [ ] Redirection vers le bon dashboard selon le rôle
- [ ] Persistance de session (fermer/rouvrir l'app)
- [ ] Déconnexion fonctionnelle
- [ ] Messages d'erreur affichés correctement
- [ ] Profil utilisateur créé dans Firestore lors de l'inscription (si écran créé)

---

## 🎯 Prochaines étapes

Une fois l'authentification testée et fonctionnelle :

1. Créer un écran d'inscription
2. Ajouter la validation des rôles
3. Implémenter la récupération de mot de passe
4. Ajouter la gestion des permissions par rôle

