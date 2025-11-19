# ✅ Vérification des Utilisateurs Créés

## 🔍 Checklist de Vérification

### 1️⃣ Firebase Authentication

Vérifiez que les 3 utilisateurs existent dans **Authentication > Users** :

- [ ] `agent@test.com`
- [ ] `admin@test.com`
- [ ] `hospital@test.com`

**Action** : Si un utilisateur manque, créez-le avec **Add user**

---

### 2️⃣ Firestore Database

Vérifiez que les 3 profils existent dans **Firestore Database > Collection `users`** :

#### Pour chaque utilisateur, vérifiez :

- [ ] **Document ID** = UID de l'utilisateur (pas Auto-ID !)
- [ ] **Champ `name`** (string) : présent
- [ ] **Champ `email`** (string) : présent et correspond à l'email
- [ ] **Champ `role`** (string) : présent avec la bonne valeur
  - `agent` pour agent@test.com
  - `admin` pour admin@test.com
  - `hospital` pour hospital@test.com
- [ ] **Champ `createdAt`** (timestamp) : présent
- [ ] **Champ `updatedAt`** (timestamp) : présent

**Action** : Si un profil manque ou est incomplet, créez-le ou modifiez-le

---

## 🧪 Tests à Effectuer

### Test 1 : Agent

1. Ouvrez l'application
2. Connectez-vous avec :
   - Email : `agent@test.com`
   - Password : `test123456`
   - Rôle : (peut être ignoré, le vrai rôle vient de Firestore)
3. **Résultat attendu** : Redirection vers le Dashboard Agent

### Test 2 : Admin

1. Déconnectez-vous (Profil > Déconnexion)
2. Connectez-vous avec :
   - Email : `admin@test.com`
   - Password : `test123456`
3. **Résultat attendu** : Redirection vers le Dashboard Admin

### Test 3 : Hospital

1. Déconnectez-vous
2. Connectez-vous avec :
   - Email : `hospital@test.com`
   - Password : `test123456`
3. **Résultat attendu** : Redirection vers le Dashboard Hospital

---

## ❌ Problèmes Courants

### Erreur : "User not found" ou "Wrong password"
- ✅ Vérifiez que l'utilisateur existe dans Firebase Authentication
- ✅ Vérifiez que le mot de passe est correct (`test123456`)

### Erreur : Redirection vers login après connexion
- ✅ Vérifiez que le profil existe dans Firestore
- ✅ Vérifiez que le Document ID = UID de l'utilisateur
- ✅ Vérifiez que le champ `role` est bien rempli (`agent`, `admin`, ou `hospital`)

### Erreur : Redirection vers le mauvais dashboard
- ✅ Vérifiez que le champ `role` dans Firestore correspond au rôle attendu
- ✅ Vérifiez les logs dans le terminal pour voir quel rôle est détecté

---

## 📝 Notes

- Le champ "Rôle" dans le formulaire de login est **optionnel** et peut être ignoré
- Le **vrai rôle** vient du profil utilisateur dans Firestore
- Le Document ID dans Firestore **DOIT** être l'UID de l'utilisateur (pas Auto-ID)

