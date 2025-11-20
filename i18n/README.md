# Système d'Internationalisation (i18n)

Ce système permet à l'application GraceRegistry de supporter le **français** et le **créole haïtien** de manière globale et cohérente.

## Architecture

### Fichiers principaux

- **`store/languageStore.ts`** : Store Zustand pour gérer la langue actuelle et sa persistance
- **`i18n/fr.ts`** : Toutes les traductions en français
- **`i18n/ht.ts`** : Toutes les traductions en créole haïtien
- **`i18n/index.ts`** : Fonctions utilitaires pour accéder aux traductions
- **`hooks/useTranslation.ts`** : Hook React pour utiliser les traductions dans les composants

### Fonctionnalités

**Gestion globale de la langue** : La langue choisie est stockée dans AsyncStorage et appliquée à toute l'application

**Changement en temps réel** : Quand l'utilisateur change de langue, tous les composants sont mis à jour automatiquement

**Persistance** : La préférence de langue est sauvegardée et rechargée au démarrage de l'application

**Type-safe** : Support TypeScript pour éviter les erreurs de clés

## Utilisation

### Dans un composant React

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export default function MyComponent() {
  const t = useTranslation();
  
  return (
    <ThemedText>
      {t('agent.dashboard.welcome')}
    </ThemedText>
  );
}
```

### Avec paramètres

```tsx
const t = useTranslation();

// Dans les traductions : "{{count}} preuves disponibles"
<ThemedText>
  {t('agent.dashboard.proofsCount', { count: 5 })}
</ThemedText>
// Affiche : "5 preuves disponibles" (fr) ou "5 prèv disponib" (ht)
```

### Accéder à la langue actuelle

```tsx
import { useLanguageStore } from '@/store/languageStore';

export default function MyComponent() {
  const language = useLanguageStore((state) => state.language);
  // language sera 'fr' ou 'ht'
  
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  
  return (
    <Button onPress={() => setLanguage('ht')}>
      Passer en créole
    </Button>
  );
}
```

## Structure des clés de traduction

Les clés suivent une hiérarchie logique :

```
common.*          - Termes communs (save, cancel, etc.)
auth.*            - Authentification
roles.*           - Rôles utilisateurs
agent.dashboard.* - Dashboard agent
agent.navigation.* - Navigation agent
agent.history.*   - Historique agent
agent.pregnancy.* - Enregistrement grossesse
agent.birth.*     - Enregistrement naissance
agent.emergency.* - Urgences
agent.profile.*   - Profil agent
agent.help.*      - Aide
validation.*      - Messages de validation
errors.*          - Messages d'erreur
```

## Ajouter de nouvelles traductions

### 1. Ajouter la clé dans les fichiers de traduction

**`i18n/fr.ts`** :
```typescript
agent: {
  dashboard: {
    // ... traductions existantes
    newFeature: 'Nouvelle fonctionnalité',
  },
}
```

**`i18n/ht.ts`** :
```typescript
agent: {
  dashboard: {
    // ... traductions existantes
    newFeature: 'Nouvo fonksyonalite',
  },
}
```

### 2. Utiliser dans un composant

```tsx
const t = useTranslation();
<ThemedText>{t('agent.dashboard.newFeature')}</ThemedText>
```

## Migration progressive

Pour migrer un écran existant vers le système i18n :

1. Importer `useTranslation`
2. Remplacer les textes hardcodés par `t('clé.traduction')`
3. Vérifier que les traductions existent dans `fr.ts` et `ht.ts`

### Exemple de migration

**Avant** :
```tsx
<ThemedText>Mon Profil</ThemedText>
<ThemedButton>Enregistrer</ThemedButton>
```

**Après** :
```tsx
const t = useTranslation();

<ThemedText>{t('agent.profile.title')}</ThemedText>
<ThemedButton>{t('common.save')}</ThemedButton>
```

## Bonnes pratiques

1. **Toujours utiliser des clés hiérarchiques** : `agent.dashboard.welcome` plutôt que `welcome`
2. **Réutiliser les traductions communes** : Utiliser `common.*` pour les termes fréquents
3. **Tester dans les deux langues** : Vérifier que tout fonctionne en français et en créole
4. **Garder les traductions synchronisées** : Si vous ajoutez une clé en français, ajoutez-la aussi en créole
5. **Éviter les textes hardcodés** : Utiliser toujours `t()` pour les textes affichés à l'utilisateur

## Intégration avec les formulaires de validation

Les messages d'erreur de validation peuvent aussi utiliser les traductions :

```typescript
// Dans utils/validation.ts
import { createUseTranslation } from '@/i18n';
import { useLanguageStore } from '@/store/languageStore';

const language = useLanguageStore.getState().language;
const t = createUseTranslation(language);

export const loginSchema = z.object({
  email: z.string().email(t('validation.email')),
  password: z.string().min(6, t('validation.minLength', { min: 6 })),
});
```

## Support de nouvelles langues

Pour ajouter une nouvelle langue (ex: anglais) :

1. Créer `i18n/en.ts` avec la même structure que `fr.ts` et `ht.ts`
2. Exporter dans `i18n/index.ts` : `export const translations = { fr, ht, en };`
3. Ajouter `'en'` au type `Language` dans `languageStore.ts`
4. Mettre à jour les sélecteurs de langue dans l'application

