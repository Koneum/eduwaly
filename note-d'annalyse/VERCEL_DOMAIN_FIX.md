# 🔴 PROBLÈME CRITIQUE - Domaines Multiples Vercel

## 🎯 Problème Identifié

Vous accédez via **deux domaines différents** :
1. `eduwaly.vercel.app` (domaine de production)
2. `eduwaly-7eu6wh3ar-kone-moussas-projects.vercel.app` (preview deployment)

### Ce qui se passe :

```
1. Vous visitez: https://eduwaly.vercel.app/login
2. Vous vous connectez
3. Better Auth crée cookie pour: eduwaly-7eu6wh3ar...vercel.app
4. Vous êtes redirigé vers: https://eduwaly.vercel.app/admin/xxx
5. Cookie n'existe PAS sur eduwaly.vercel.app
6. ❌ 401 Unauthorized
7. ❌ Reste bloqué sur /login
```

**Les cookies ne sont PAS partagés entre domaines différents !**

## ✅ SOLUTION 1 : Définir BETTER_AUTH_URL (RECOMMANDÉ)

### Sur Vercel Dashboard

1. Aller sur **Settings** → **Environment Variables**
2. Ajouter cette variable :

```
Name: BETTER_AUTH_URL
Value: https://eduwaly.vercel.app
Environment: Production, Preview, Development (cocher les 3)
```

3. **Redéployer** le projet

### Résultat

Tous les déploiements (production ET preview) utiliseront `eduwaly.vercel.app` pour les cookies.

**⚠️ ATTENTION :** Les preview deployments ne fonctionneront PAS de manière isolée. Ils partageront tous le même domaine de cookies.

## ✅ SOLUTION 2 : Utiliser Uniquement Production

### Méthode Simple

**Accédez TOUJOURS via :** https://eduwaly.vercel.app

**N'utilisez JAMAIS les URLs :** 
- ❌ `eduwaly-7eu6wh3ar-xxx.vercel.app`
- ❌ `eduwaly-git-main-xxx.vercel.app`

### Comment

1. Dashboard Vercel → Votre projet
2. Cliquer sur "Visit" ou copier l'URL de production
3. **Marquer en favori** : https://eduwaly.vercel.app

## ✅ SOLUTION 3 : Preview Indépendants (AVANCÉ)

Si vous voulez que chaque preview fonctionne indépendamment :

### 1. NE PAS définir BETTER_AUTH_URL

Laissez le code utiliser `VERCEL_URL` automatiquement.

### 2. Accéder via l'URL de Preview

Quand vous testez un preview, utilisez **toujours** son URL complète :
```
https://eduwaly-7eu6wh3ar-kone-moussas-projects.vercel.app
```

### 3. Vérifier les Logs

Dans les logs Vercel, vous devriez voir :
```
⚠️ [AUTH] Using VERCEL_URL: https://eduwaly-7eu6wh3ar-xxx.vercel.app
```

## 🧪 Test de Vérification

### Après avoir appliqué la solution 1 (BETTER_AUTH_URL)

```bash
# 1. Vérifier la variable
vercel env ls

# 2. Redéployer
git commit --allow-empty -m "redeploy: test BETTER_AUTH_URL"
git push

# 3. Attendre 2-3 minutes
```

### Tester

1. Ouvrir https://eduwaly.vercel.app
2. F12 → Console
3. Chercher le log :
   ```
   🔧 [AUTH] Using BETTER_AUTH_URL: https://eduwaly.vercel.app
   ```
4. Se connecter
5. ✅ Devrait fonctionner !

## 📊 Comparaison des Solutions

| Solution | Avantages | Inconvénients |
|----------|-----------|---------------|
| **1. BETTER_AUTH_URL** | ✅ Fonctionne partout<br>✅ Production stable | ⚠️ Previews partagent DB prod |
| **2. Production uniquement** | ✅ Simple<br>✅ Pas de config | ❌ Pas de test preview |
| **3. Preview indépendants** | ✅ Tests isolés | ❌ Complexe<br>❌ Besoin d'accéder via URL preview |

## 🎯 Recommandation

Pour votre cas (schooly multi-écoles), utilisez **SOLUTION 1** :

```env
BETTER_AUTH_URL=https://eduwaly.vercel.app
```

### Workflow de Développement

```
1. Développer en local (localhost:3000)
2. Commit + Push → Vercel build
3. Tester sur https://eduwaly.vercel.app
4. ✅ Production prête
```

## 🔍 Debug : Vérifier le Domaine Actuel

Ajoutez ce code temporaire dans votre page pour voir le domaine :

```typescript
// app/(auth)/login/page.tsx
useEffect(() => {
  console.log('🌐 Current domain:', window.location.hostname)
  console.log('🌐 Current URL:', window.location.href)
}, [])
```

Vous devriez voir :
```
🌐 Current domain: eduwaly.vercel.app
```

**Si vous voyez autre chose** → Vous êtes sur un domaine différent !

## ✅ Checklist Finale

- [ ] BETTER_AUTH_URL défini sur Vercel
- [ ] Redéployé le projet
- [ ] Accès via https://eduwaly.vercel.app (PAS preview)
- [ ] Logs montrent "Using BETTER_AUTH_URL"
- [ ] Login fonctionne ✅
- [ ] Redirection fonctionne ✅

## 🎉 Résultat Attendu

Après correction :

```
🔧 [AUTH] Using BETTER_AUTH_URL: https://eduwaly.vercel.app
🔐 [LOGIN] Tentative de connexion...
✅ [LOGIN] SignIn réussi
🍪 [REDIRECT-API] Cookies reçus: OUI
✅ [REDIRECT-API] Utilisateur trouvé
🚀 [LOGIN] Redirection vers: /admin/xxx
→ SUCCÈS ✅
```
