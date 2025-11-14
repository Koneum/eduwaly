# 🔧 FIX - Redirection sur Vercel après Login

## 🎯 Problème

Après login sur Vercel, l'utilisateur reste sur la page `/login` au lieu d'être redirigé vers son dashboard.

## 🔍 Cause Racine

Better Auth nécessite la variable d'environnement **`BETTER_AUTH_URL`** pour créer correctement les cookies de session. Sans cette variable, les cookies ne sont pas créés avec le bon domaine, ce qui empêche la session de persister.

## ✅ Solution en 3 Étapes

### Étape 1 : Ajouter `BETTER_AUTH_URL` sur Vercel

1. Allez sur votre dashboard Vercel
2. Sélectionnez votre projet `eduwaly`
3. Allez dans **Settings → Environment Variables**
4. Ajoutez cette variable :

```
Nom: BETTER_AUTH_URL
Valeur: https://eduwaly.vercel.app
Environnement: Production, Preview, Development
```

### Étape 2 : Ajouter `BETTER_AUTH_SECRET` (si pas déjà fait)

Si vous n'avez pas encore de `BETTER_AUTH_SECRET` :

```
Nom: BETTER_AUTH_SECRET
Valeur: [générer une clé aléatoire sécurisée]
Environnement: Production, Preview, Development
```

Pour générer une clé sécurisée :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Étape 3 : Re-déployer

Après avoir ajouté les variables d'environnement :

1. Allez dans **Deployments**
2. Cliquez sur le dernier déploiement
3. Cliquez sur les 3 points (⋯) → **Redeploy**
4. Cochez "Use existing Build Cache" (optionnel)
5. Cliquez sur **Redeploy**

## 📋 Variables d'Environnement Complètes pour Vercel

Voici toutes les variables nécessaires :

```env
# Base de données (REQUIRED)
DATABASE_URL="postgresql://..."

# Better Auth (REQUIRED)
BETTER_AUTH_URL="https://eduwaly.vercel.app"
BETTER_AUTH_SECRET="votre-clé-secrète-64-caractères"

# Application (OPTIONAL mais recommandé)
NEXT_PUBLIC_BASE_URL="https://eduwaly.vercel.app"

# AWS S3 (si vous utilisez upload de fichiers)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="schooly-files"

# VitePay (si vous utilisez les paiements)
VITEPAY_API_KEY="..."
VITEPAY_API_SECRET="..."
VITEPAY_MODE="sandbox"
```

## 🧪 Test après Re-déploiement

1. Allez sur `https://eduwaly.vercel.app`
2. Connectez-vous avec votre compte Super Admin
3. **Résultat attendu** : Redirection instantanée vers `/super-admin`

## 🔍 Vérification des Logs

Si le problème persiste après re-déploiement :

1. Allez dans **Deployments → [Dernier déploiement]**
2. Cliquez sur **View Function Logs**
3. Recherchez les logs `[AUTH-UTIL]`
4. Vous devriez voir :
   ```
   [AUTH-UTIL] Session OK. Rôle: SUPER_ADMIN, School ID: N/A
   ```

## 🐛 Debug

Si ça ne fonctionne toujours pas :

### Vérifier que `BETTER_AUTH_URL` est bien prise en compte

Ajoutez temporairement ce log dans `lib/auth.ts` :

```typescript
console.log('Better Auth URL:', getBaseURL())
```

Vous devriez voir dans les logs Vercel :
```
Better Auth URL: https://eduwaly.vercel.app
```

### Vérifier les cookies

Après login, ouvrez la console du navigateur :
- F12 → Application → Cookies
- Recherchez `schooly.session_token`
- **Domain** devrait être `.eduwaly.vercel.app` ou `eduwaly.vercel.app`
- **Secure** devrait être `true`
- **HttpOnly** devrait être `true`

Si le cookie n'existe pas ou a le mauvais domaine, c'est que `BETTER_AUTH_URL` n'est pas correctement configurée.

## 📚 Références

- [Better Auth Documentation](https://www.better-auth.com/docs/installation)
- [Better Auth Options](https://www.better-auth.com/docs/reference/options)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

## ✨ Pourquoi Cette Solution Fonctionne

1. **`BETTER_AUTH_URL`** : Better Auth l'utilise pour créer les cookies avec le bon domaine
2. **Middleware simplifié** : Compatible avec Vercel Edge Runtime
3. **Redirections côté serveur** : Plus fiable que les redirections middleware
4. **`schoolId` dans la session** : Disponible pour toutes les redirections

## 🎉 Résultat Final

Après ces modifications :
- ✅ Login fonctionne en local
- ✅ Login fonctionne sur Vercel
- ✅ Redirections instantanées vers le bon dashboard
- ✅ Session persistante entre les pages
