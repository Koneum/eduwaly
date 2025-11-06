# Configuration Vercel pour Schooly

## Variables d'Environnement Requises

### Base de Données
```
DATABASE_URL="postgresql://..."
```

### Application
```
NEXT_PUBLIC_BASE_URL="https://eduwaly.vercel.app"
```

### Auth Better Auth
Les cookies et sessions sont automatiquement configurés via `lib/auth.ts`.

## Configuration Automatique

Le système détecte automatiquement l'environnement Vercel via :
- `VERCEL_URL` (fourni automatiquement par Vercel)
- `NEXT_PUBLIC_BASE_URL` (à définir manuellement)

## Corrections Appliquées

### 1. **lib/auth.ts**
- ✅ Ajout de `baseURL` dynamique avec détection Vercel
- ✅ Correction du `cookiePrefix` de `sissan` à `schooly`
- ✅ Configuration `trustedOrigins` avec support VERCEL_URL
- ✅ Ajout de `basePath: '/api/auth'`

### 2. **middleware.ts**
- ✅ Remplacement du `fetch` par appel direct à `auth.api.getSession()`
- ✅ Suppression de l'import inutile `getAuthUser`
- ✅ Optimisation des performances (pas de requête HTTP interne)

### 3. **lib/auth-client.ts**
- ✅ Détection automatique de `window.location.origin` côté client
- ✅ Support de `NEXT_PUBLIC_VERCEL_URL`
- ✅ Fallback intelligent pour tous les environnements

## Pourquoi les Redirections Fonctionnent Maintenant

### Problème Avant
1. **Middleware lent** : Faisait un `fetch` vers `/api/auth/get-session`
2. **Cookie prefix incorrect** : `sissan` au lieu de `schooly`
3. **baseURL manquant** : Better Auth ne savait pas où rediriger
4. **trustedOrigins incomplet** : Bloquait les requêtes Vercel

### Solution Après
1. **Middleware rapide** : Appel direct à `auth.api.getSession()` (pas de HTTP)
2. **Cookie prefix correct** : `schooly.session_token`
3. **baseURL dynamique** : Détection automatique de l'environnement
4. **trustedOrigins complet** : Inclut VERCEL_URL automatiquement

## Test en Local

```bash
npm run dev
```

Les redirections devraient être **instantanées** maintenant.

## Déploiement sur Vercel

1. Assurez-vous que `NEXT_PUBLIC_BASE_URL` est défini dans les variables d'environnement Vercel
2. Déployez normalement
3. Les redirections fonctionneront immédiatement après connexion

## Debugging

Si les redirections ne fonctionnent toujours pas :

1. Vérifiez les logs Vercel pour voir les messages de `[AUTH-UTIL]`
2. Vérifiez que le cookie `schooly.session_token` est bien créé
3. Vérifiez que `DATABASE_URL` est correctement configuré
