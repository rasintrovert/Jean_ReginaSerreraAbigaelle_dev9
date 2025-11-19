# 🗺️ Structure de Navigation - GraceRegistry

## 📐 Hiérarchie Actuelle

```
app/
├── _layout.tsx                    # Root Layout (Stack: auth ↔ dashboard)
│
├── (auth)/                        # Section Authentification
│   ├── _layout.tsx                # Layout Auth (Stack)
│   ├── login.tsx
│   └── register.tsx
│
└── (dashboard)/                   # Section Dashboard
    ├── _layout.tsx                # ⚠️ Layout Parent (Tabs masqués)
    ├── index.tsx                  # Redirige vers le bon module selon rôle
    │
    ├── admin/
    │   ├── _layout.tsx            # Layout Admin (Stack)
    │   └── index.tsx              # Dashboard Admin
    │
    ├── agent/
    │   ├── _layout.tsx            # Layout Agent (Stack)
    │   └── index.tsx              # Dashboard Agent
    │
    └── hospital/
        ├── _layout.tsx            # Layout Hospital (Stack)
        └── index.tsx              # Dashboard Hospital
```

---

## ❓ Pourquoi un Layout Parent ?

### Raison Initiale
Le layout parent `app/(dashboard)/_layout.tsx` a été créé pour :
1. **Router vers le bon module** selon le rôle de l'utilisateur
2. **Fournir une navigation commune** (Tabs) entre les modules
3. **Gérer la redirection** automatique

### Problème Actuel
- ✅ Le routing fonctionne via `app/(dashboard)/index.tsx`
- ❌ Les Tabs sont **masqués** pour tous les rôles
- ❌ Chaque module a déjà son propre **Stack layout**
- ⚠️ Le layout parent ne fait plus grand-chose d'utile

---

## 🤔 Est-ce Nécessaire ?

### Option 1 : Garder le Layout Parent (Actuel)
**Avantages :**
- Structure claire et organisée
- Facilite l'ajout de fonctionnalités communes plus tard
- Séparation claire entre auth et dashboard

**Inconvénients :**
- Couche supplémentaire qui ne fait rien (Tabs masqués)
- Code redondant

### Option 2 : Simplifier (Recommandé)
**Supprimer** `app/(dashboard)/_layout.tsx` et utiliser directement les Stack layouts de chaque module.

**Avantages :**
- Structure plus simple
- Moins de code
- Plus direct

**Inconvénients :**
- Perte d'une couche d'abstraction (mais elle n'est pas utilisée)

---

## 💡 Recommandation

**Simplifier** en supprimant le layout parent car :
1. Les Tabs sont masqués pour tous les rôles
2. Chaque module gère déjà sa propre navigation (Stack)
3. La redirection se fait via `index.tsx`
4. Moins de code = moins de confusion

---

## 🔧 Comment Simplifier ?

1. **Supprimer** `app/(dashboard)/_layout.tsx`
2. **Modifier** `app/_layout.tsx` pour router directement vers les modules
3. **Garder** les layouts spécifiques (`admin/_layout.tsx`, `agent/_layout.tsx`, etc.)

**OU**

Garder la structure actuelle mais **simplifier** le layout parent pour qu'il ne fasse que router (sans Tabs).

