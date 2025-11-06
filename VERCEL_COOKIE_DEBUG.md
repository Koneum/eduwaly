# 🔧 Debug Cookies Vercel - Better Auth

## 🎯 Problème

Après login sur Vercel, l'utilisateur reste bloqué sur `/login` au lieu d'être redirigé vers son dashboard.

### Logs Vercel
```
HEAD 204 /login
GET 200 /register
GET 200 /register
```

Aucune redirection visible après le POST `/api/auth/sign-in/email`.

## 🔍 Cause Racine

D'après la documentation Better Auth et les tests:

1. ❌ **Les cookies ne sont pas inclus dans le fetch** `/api/auth/redirect-url`
2. ❌ **`credentials: 'include'` manquant** dans la requête fetch
3. ❌ **`BETTER_AUTH_URL` potentiellement mal configuré** sur Vercel

## ✅ Solutions Appliquées

### 1. **Configuration Better Auth** (`lib/auth.ts`)

```typescript
advanced: {
  // CRITIQUE: Toujours utiliser secure cookies
  useSecureCookies: true,  // Force HTTPS en production
  cookiePrefix: 'schooly',
}
```

**Pourquoi :** Les cookies doivent être `secure` sur HTTPS (Vercel)

### 2. **Page Login** (`app/(auth)/login/page.tsx`)

```typescript
// AVANT (❌ Ne marche pas)
const redirectResponse = await fetch('/api/auth/redirect-url')

// APRÈS (✅ Fonctionne)
const redirectResponse = await fetch('/api/auth/redirect-url', {
  credentials: 'include',  // CRITIQUE: Envoie les cookies
  headers: {
    'Content-Type': 'application/json',
  },
})
```

**Pourquoi :** Par défaut, `fetch` n'envoie pas les cookies en production

### 3. **Variables Vercel** (OBLIGATOIRES)

Sur Vercel, vérifiez ces variables:

```env
BETTER_AUTH_URL=https://eduwaly.vercel.app
BETTER_AUTH_SECRET=votre-clé-64-caractères
DATABASE_URL=postgresql://...
```

## 🧪 Test sur Vercel

### Vérifier les Cookies

1. Ouvrez **DevTools** (F12)
2. Onglet **Application** → **Cookies**
3. Cherchez `schooly.session_token`

**Attributs attendus:**
```
Name: schooly.session_token
Value: [long string]
Domain: .eduwaly.vercel.app ou eduwaly.vercel.app
Path: /
Secure: ✅ (doit être coché)
HttpOnly: ✅ (doit être coché)
SameSite: Lax
```

### Vérifier le Flux de Redirection

Ouvrez **Network** dans DevTools et suivez:

```
1. POST /api/auth/sign-in/email
   Status: 200 ✅
   Response: { success: true, user: {...} }
   
2. GET /api/auth/get-session
   Status: 200 ✅
   Request Cookies: schooly.session_token ✅
   Response: { user: {...}, session: {...} }

3. GET /api/auth/redirect-url
   Status: 200 ✅
   Request Cookies: schooly.session_token ✅
   Response: { redirectUrl: "/admin/xxx" }

4. Navigation: window.location.href = "/admin/xxx"
   Status: 200 ✅
```

## 🐛 Si Ça Ne Fonctionne Toujours Pas

### Debug 1: Vérifier les Cookies

Ajoutez temporairement ces logs dans `app/api/auth/redirect-url/route.ts`:

```typescript
export async function GET(req: Request) {
  console.log('🍪 Cookies reçus:', req.headers.get('cookie'))
  
  const user = await getAuthUser()
  console.log('👤 User récupéré:', user ? 'OUI' : 'NON')
  
  if (!user) {
    console.error('❌ Pas d\'utilisateur - cookies:', req.headers.get('cookie'))
    return NextResponse.json({ redirectUrl: '/login' })
  }
  
  // ... reste du code
}
```

### Debug 2: Vérifier BETTER_AUTH_URL

Dans les logs Vercel, cherchez:

```
Better Auth URL: https://eduwaly.vercel.app
```

Si vous voyez `http://localhost:3000` ou autre chose, c'est le problème !

### Debug 3: Fallback Simplifié

Si le problème persiste, simplifiez la redirection:

```typescript
// app/(auth)/login/page.tsx
const result = await signIn(email, password)

if (result?.error) {
  setError('Email ou mot de passe incorrect')
  return
}

// Redirection simple vers la page d'accueil
// Elle gérera la redirection selon le rôle
window.location.href = '/'
```

## 📋 Checklist Vercel

Avant de re-déployer:

- [ ] `BETTER_AUTH_URL` défini sur Vercel
- [ ] `BETTER_AUTH_SECRET` défini (64 caractères min)
- [ ] `DATABASE_URL` correctement configuré
- [ ] `credentials: 'include'` dans le fetch login
- [ ] `useSecureCookies: true` dans auth.ts
- [ ] Re-déployer après les changements

## 🚀 Commandes de Déploiement

```bash
# 1. Commit les changements
git add .
git commit -m "fix: cookies Vercel avec credentials include"

# 2. Push vers Vercel
git push origin main

# 3. Vérifier le déploiement
# Aller sur dashboard Vercel et attendre le build
```

## 📚 Documentation Référence

- [Better Auth - Cookies](https://www.better-auth.com/docs/concepts/cookies)
- [Better Auth - Next.js Integration](https://www.better-auth.com/docs/integrations/next)
- [MDN - fetch credentials](https://developer.mozilla.org/en-US/docs/Web/API/fetch#credentials)

## 🎉 Résultat Attendu

Après correction:

1. Login → Cookie `schooly.session_token` créé ✅
2. Fetch `/api/auth/redirect-url` avec cookie ✅
3. Redirection vers `/admin/{schoolId}` ✅
4. Dashboard affiché ✅

**Les redirections devraient maintenant fonctionner sur Vercel !** 🚀
