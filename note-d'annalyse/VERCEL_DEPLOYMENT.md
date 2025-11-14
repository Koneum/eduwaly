# Configuration Vercel pour Schooly

## Variables d'Environnement Requises

### Base de Données
```
DATABASE_URL="postgresql://..."
```

### Better Auth (CRITIQUE pour Vercel)
```
BETTER_AUTH_URL="https://eduwaly.vercel.app"
BETTER_AUTH_SECRET="your-secret-key-here"
```

**⚠️ IMPORTANT:** Sans `BETTER_AUTH_URL`, Better Auth ne peut pas créer les cookies correctement sur Vercel.

### Application
```
NEXT_PUBLIC_BASE_URL="https://eduwaly.vercel.app"
```

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
- ✅ Ajout de `schoolId` dans les `additionalFields` pour Better Auth

### 2. **middleware.ts** (Simplifié pour Vercel Edge Runtime)
- ✅ Middleware ultra-léger - vérifie uniquement le cookie de session
- ✅ Pas d'appel à `auth.api.getSession()` dans le middleware
- ✅ Compatible avec Vercel Edge Runtime
- ✅ Les redirections sont gérées côté serveur dans les pages

### 3. **lib/auth-client.ts**
- ✅ Détection automatique de `window.location.origin` côté client
- ✅ Support de `NEXT_PUBLIC_VERCEL_URL`
- ✅ Fallback intelligent pour tous les environnements

### 4. **Redirections Côté Serveur** (Nouvelle Approche)
- ✅ `app/page.tsx` - Redirige automatiquement vers le dashboard approprié
- ✅ `app/api/auth/redirect-url/route.ts` - API pour obtenir l'URL de redirection
- ✅ `app/(auth)/login/page.tsx` - Utilise l'API pour rediriger après login
- ✅ `lib/redirect-helper.ts` - Helpers pour les redirections dans toutes les pages

## Pourquoi les Redirections Fonctionnent Maintenant

### Problème Avant
1. **Middleware lent** : Faisait un `fetch` vers `/api/auth/get-session`
2. **Cookie prefix incorrect** : `sissan` au lieu de `schooly`
3. **baseURL manquant** : Better Auth ne savait pas où rediriger
4. **trustedOrigins incomplet** : Bloquait les requêtes Vercel

### Solution Après
1. **Middleware ultra-léger** : Vérifie uniquement le cookie (compatible Edge Runtime)
2. **Redirections côté serveur** : Gérées dans les Server Components
3. **Cookie prefix correct** : `schooly.session_token`
4. **baseURL dynamique** : Détection automatique de l'environnement
5. **trustedOrigins complet** : Inclut VERCEL_URL automatiquement
6. **schoolId dans la session** : Disponible via Better Auth additionalFields

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
