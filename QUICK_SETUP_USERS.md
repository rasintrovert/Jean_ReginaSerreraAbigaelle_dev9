# 🚀 Guide Rapide : Créer les Utilisateurs de Test

## 📋 Résumé des Comptes à Créer

| Rôle | Email | Password | UID (à copier) |
|------|-------|----------|----------------|
| **Agent** | `agent@test.com` | `test123456` | Copier depuis Firebase Auth |
| **Admin** | `admin@test.com` | `test123456` | Copier depuis Firebase Auth |
| **Hospital** | `hospital@test.com` | `test123456` | Copier depuis Firebase Auth |

---

## ⚡ Étapes Rapides

### 1️⃣ Créer les 3 utilisateurs dans Firebase Authentication

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. **Authentication** > **Users** > **Add user**
3. Créez les 3 utilisateurs avec les emails ci-dessus
4. **Copiez l'UID de chaque utilisateur** (vous en aurez besoin pour Firestore)

### 2️⃣ Créer les 3 profils dans Firestore

Pour **chaque utilisateur**, créez un document dans la collection `users` :

1. **Firestore Database** > Collection `users` > **Add document**
2. **Document ID** : Collez l'**UID** de l'utilisateur (⚠️ pas Auto-ID !)
3. Ajoutez ces champs :

#### Pour l'AGENT :
```
name (string) : Agent Test
email (string) : agent@test.com
role (string) : agent
createdAt (timestamp) : Date actuelle
updatedAt (timestamp) : Date actuelle
```

#### Pour l'ADMIN :
```
name (string) : Admin Test
email (string) : admin@test.com
role (string) : admin
createdAt (timestamp) : Date actuelle
updatedAt (timestamp) : Date actuelle
```

#### Pour l'HOSPITAL :
```
name (string) : Hôpital Test
email (string) : hospital@test.com
role (string) : hospital
createdAt (timestamp) : Date actuelle
updatedAt (timestamp) : Date actuelle
```

---

## ✅ Tester dans l'App

1. **Agent** : `agent@test.com` / `test123456` → Dashboard Agent
2. **Admin** : `admin@test.com` / `test123456` → Dashboard Admin  
3. **Hospital** : `hospital@test.com` / `test123456` → Dashboard Hospital

---

## 📖 Guide Complet

Pour plus de détails, voir `TEST_AUTH.md`

