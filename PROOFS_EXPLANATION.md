# 📄 Concept des "Preuves" dans GraceRegistry

## 🎯 Qu'est-ce qu'une "Preuve" ?

Une **preuve** est un **document provisoire** généré immédiatement après l'enregistrement d'une grossesse ou d'une naissance. C'est un document temporaire qui sert de **justificatif** en attendant la validation officielle et l'émission du certificat officiel.

---

## 📋 Utilité des Preuves

### 1. **Document Provisoire Immédiat**
- ✅ Généré **instantanément** après l'enregistrement
- ✅ Permet aux parents d'avoir une **preuve d'enregistrement** immédiate
- ✅ Utile dans les zones rurales où l'accès à Internet est limité

### 2. **Contenu d'une Preuve**
- 📄 **PDF provisoire** avec les informations de base
- 🔲 **QR Code** pour vérification rapide
- 📝 **Numéro de référence unique** (ex: `PREGN-20250115-001`)
- 📅 **Date de génération**
- 👤 **Informations de la personne** (mère pour grossesse, enfant pour naissance)

### 3. **Cas d'Usage**
- 🏥 **Hôpitaux** : Justifier l'enregistrement pour les soins médicaux
- 🏛️ **Administrations** : Preuve d'enregistrement en attente de validation
- 👨‍👩‍👧‍👦 **Parents** : Document temporaire en attendant le certificat officiel
- 📱 **Vérification** : Le QR code permet de vérifier rapidement l'enregistrement

---

## 🔄 Flux de Validation

```
1. Agent enregistre → Preuve générée (immédiat)
   ↓
2. Données sauvegardées localement (SQLite)
   ↓
3. Synchronisation avec Firestore (si en ligne)
   ↓
4. Validation par l'administration
   ↓
5. Émission du certificat officiel
```

---

## 💡 Pourquoi les Preuves sont Importantes

### Contexte Haïtien
- ⏱️ Les certificats officiels peuvent prendre du **temps** à être émis
- 📍 Dans les **zones rurales**, l'accès à Internet est limité
- 🚨 Les parents ont besoin d'une **preuve immédiate** de l'enregistrement
- 🏥 Les hôpitaux peuvent demander une preuve pour les soins médicaux

### Avantages
- ✅ **Rapidité** : Génération immédiate
- ✅ **Accessibilité** : Disponible même hors ligne
- ✅ **Traçabilité** : Numéro de référence unique
- ✅ **Vérification** : QR code pour validation rapide

---

## 🔧 Améliorations Possibles

### 1. Génération Réelle de PDF
- Actuellement : Simulation
- À implémenter : Génération réelle avec `react-native-pdf` ou `expo-print`

### 2. Génération de QR Code
- Actuellement : Simulation
- À implémenter : Génération réelle avec `react-native-qrcode-svg`

### 3. Partage de Preuve
- Permettre aux parents de partager la preuve (email, SMS, WhatsApp)
- Stockage dans la galerie du téléphone

### 4. Vérification en Ligne
- Scanner le QR code pour vérifier l'état de validation
- Afficher les détails de l'enregistrement

---

## 📊 Statuts des Preuves

- **Pending** (En attente) : Preuve générée, en attente de validation
- **Valid** (Validée) : Enregistrement synchronisé et validé

---

## 🎯 Conclusion

Les preuves sont essentielles pour :
1. ✅ Donner une **preuve immédiate** aux parents
2. ✅ Permettre la **traçabilité** des enregistrements
3. ✅ Faciliter la **vérification** rapide
4. ✅ Améliorer l'**expérience utilisateur** dans les zones rurales

Elles servent de **pont** entre l'enregistrement initial et le certificat officiel final.

