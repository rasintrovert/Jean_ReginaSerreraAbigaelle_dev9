# 🏗️ Architecture Backend & Synchronisation Offline - GraceRegistry

## 📊 Analyse de la Proposition

### ✅ **Pourquoi cette architecture est excellente :**

1. **Firestore (Base principale)**
   - ✅ Gratuit jusqu'à 50K lectures/jour (parfait pour débuter)
   - ✅ Temps réel (updates automatiques)
   - ✅ Scalable (gère des millions de documents)
   - ✅ Offline natif (mais limité, d'où SQLite)
   - ✅ Sécurité intégrée (règles Firestore)
   - ✅ Pas de serveur à maintenir

2. **SQLite (Cache local)**
   - ✅ Base de données relationnelle locale
   - ✅ Persistance garantie (même si app fermée)
   - ✅ Requêtes complexes possibles
   - ✅ Parfait pour queue de synchronisation
   - ✅ Intégré à Expo (`expo-sqlite`)

3. **MMKV (Option alternative)**
   - ✅ Ultra-rapide (10-30x plus rapide qu'AsyncStorage)
   - ✅ Parfait pour petites données (settings, cache)
   - ⚠️ Moins adapté pour données structurées complexes

---

## 🎯 Architecture Recommandée

### **Stack Technique pour Expo**

```
┌─────────────────────────────────────────┐
│         APPLICATION (React Native)      │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Zustand    │  │   React Hook  │   │
│  │    Stores    │  │     Form      │   │
│  └──────┬───────┘  └──────┬───────┘   │
│         │                 │            │
│         └────────┬────────┘            │
│                  │                     │
│         ┌────────▼────────┐            │
│         │  Sync Service  │            │
│         │  (Orchestrator)│            │
│         └────────┬────────┘            │
│                  │                     │
│    ┌─────────────┴─────────────┐      │
│    │                           │      │
│    ▼                           ▼      │
│ ┌─────────┐              ┌─────────┐ │
│ │ SQLite  │              │ Firestore│ │
│ │ (Local) │              │ (Cloud)  │ │
│ └─────────┘              └─────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### **Packages à Installer**

```bash
# Firestore (SDK Web - compatible Expo)
npm install firebase

# SQLite (intégré Expo)
npx expo install expo-sqlite

# MMKV (optionnel, pour settings rapides)
npm install react-native-mmkv
```

---

## 🔄 Flux de Synchronisation

### **1. Enregistrement (Mode Offline)**

```
[Agent remplit formulaire]
         │
         ▼
[Validation avec Zod]
         │
         ▼
[Enregistrement dans SQLite]
  - Status: 'pending'
  - synced: false
  - createdAt: timestamp
         │
         ▼
[Affichage confirmation]
  "Enregistré localement"
         │
         ▼
[Vérification connexion]
         │
    ┌────┴────┐
    │         │
  OFFLINE   ONLINE
    │         │
    │         ▼
    │    [Tentative sync immédiate]
    │         │
    │    ┌────┴────┐
    │    │         │
    │  SUCCESS   FAIL
    │    │         │
    │    ▼         ▼
    │ [Supprimer] [Garder en SQLite]
    │              │
    └──────────────┘
```

### **2. Synchronisation Automatique**

```
[Connexion détectée]
         │
         ▼
[Lire SQLite - Tous les 'pending']
         │
         ▼
[Pour chaque enregistrement]
         │
         ▼
[Envoyer à Firestore]
         │
    ┌────┴────┐
    │         │
  SUCCESS   ERROR
    │         │
    ▼         ▼
[Supprimer] [Marquer 'retry']
[de SQLite] [Garder en SQLite]
```

### **3. Récupération (Pull)**

```
[App démarre / Connexion OK]
         │
         ▼
[Lire Firestore]
  - Dernière sync: timestamp
         │
         ▼
[Comparer avec SQLite]
         │
         ▼
[Mettre à jour SQLite]
  - Nouvelles données
  - Updates
```

---

## 📁 Structure de Fichiers Proposée

```
services/
├── firebase/
│   ├── config.ts          # Configuration Firestore
│   ├── auth.ts            # Authentification Firebase
│   ├── firestore.ts       # Service Firestore
│   └── collections.ts     # Définitions collections
│
├── database/
│   ├── sqlite.ts          # Configuration SQLite
│   ├── schema.ts          # Schémas de tables
│   ├── migrations.ts      # Migrations DB
│   └── queries.ts         # Requêtes SQL
│
└── sync/
    ├── syncService.ts     # Orchestrateur principal
    ├── syncQueue.ts       # Gestion de la queue
    ├── conflictResolver.ts # Résolution conflits
    └── syncStatus.ts      # État de synchronisation
```

---

## 💾 Structure SQLite

### **Table: `pending_records`**

```sql
CREATE TABLE pending_records (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'pregnancy' | 'birth'
  data TEXT NOT NULL,            -- JSON stringifié
  status TEXT DEFAULT 'pending', -- 'pending' | 'syncing' | 'failed'
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_pending_status ON pending_records(status);
CREATE INDEX idx_pending_type ON pending_records(type);
```

### **Table: `sync_metadata`**

```sql
CREATE TABLE sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

---

## 🔥 Structure Firestore

### **Collections**

```
firestore/
├── pregnancies/
│   └── {pregnancyId}/
│       ├── motherInfo: {...}
│       ├── pregnancyInfo: {...}
│       ├── status: 'pending' | 'validated' | 'rejected'
│       ├── recordedBy: {userId, type, name}
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── births/
│   └── {birthId}/
│       ├── childInfo: {...}
│       ├── motherInfo: {...}
│       ├── fatherInfo: {...}
│       ├── witnesses: [...]
│       ├── status: 'pending' | 'validated' | 'rejected'
│       ├── recordedBy: {userId, type, name}
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
└── users/
    └── {userId}/
        ├── profile: {...}
        ├── lastSync: timestamp
        └── ...
```

---

## 🚀 Implémentation Étape par Étape

### **Phase 1: Setup Initial**

1. ✅ Installer packages
2. ✅ Configurer Firebase
3. ✅ Créer structure SQLite
4. ✅ Créer services de base

### **Phase 2: Enregistrement Local**

1. ✅ Modifier `pregnancyStore.addPregnancy()`
2. ✅ Modifier `birthStore.addBirth()`
3. ✅ Sauvegarder dans SQLite
4. ✅ Retourner immédiatement (UX fluide)

### **Phase 3: Synchronisation**

1. ✅ Créer `syncService`
2. ✅ Détecter connexion
3. ✅ Lire queue SQLite
4. ✅ Envoyer à Firestore
5. ✅ Gérer erreurs et retry

### **Phase 4: Récupération**

1. ✅ Pull depuis Firestore
2. ✅ Mettre à jour SQLite
3. ✅ Résoudre conflits

---

## ⚡ Avantages de cette Architecture

1. **Zéro perte de données** : SQLite garantit la persistance
2. **UX fluide** : Enregistrement instantané (pas d'attente réseau)
3. **Synchronisation automatique** : Dès que connexion revient
4. **Scalable** : Firestore gère la montée en charge
5. **Gratuit au début** : Firestore free tier généreux
6. **Offline-first** : Application fonctionne sans internet

---

## ⚠️ Points d'Attention

1. **Conflits** : Si même enregistrement modifié offline et online
   - Solution : Last-write-wins ou merge intelligent

2. **Taille SQLite** : Peut grandir si beaucoup de données
   - Solution : Nettoyer après sync réussie

3. **Sécurité Firestore** : Configurer règles strictes
   - Solution : Règles par rôle (agent, hospital, admin)

4. **Coûts Firestore** : Augmentent avec usage
   - Solution : Monitoring et optimisations

---

## 📊 Comparaison SQLite vs MMKV

| Critère | SQLite | MMKV |
|---------|--------|------|
| **Vitesse** | Rapide | Ultra-rapide |
| **Structure** | Relationnelle | Key-Value |
| **Requêtes** | SQL complexe | Simple get/set |
| **Taille** | Illimitée | Illimitée |
| **Use Case** | Données structurées | Settings, cache |
| **Recommandation** | ✅ **Pour données** | ✅ **Pour settings** |

**Conclusion** : Utiliser **SQLite pour les enregistrements** et **MMKV pour les settings** (langue, thème, etc.)

---

## 🎯 Recommandation Finale

**✅ Architecture recommandée :**

```
Firestore (Cloud) + SQLite (Local) + MMKV (Settings)
```

**Pourquoi :**
- Firestore : Base principale, temps réel, scalable
- SQLite : Queue de sync, données structurées
- MMKV : Settings rapides (langue, thème)

**Prochaine étape :** Implémenter cette architecture étape par étape ! 🚀

