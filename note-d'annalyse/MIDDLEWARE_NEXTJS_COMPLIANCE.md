# ✅ Middleware Conforme aux Règles Next.js

## 📚 Documentation Officielle

**Source:** https://nextjs.org/docs/app/api-reference/file-conventions/middleware

## 🔧 Corrections Appliquées

### 1. Matcher Optimisé

#### ❌ Avant
```typescript
// Matcher incluait /api - ERREUR
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
]
```

**Problème:** Le middleware s'exécutait sur `/api/*`, causant des conflits avec CORS.

#### ✅ Après
```typescript
// Matcher exclut /api - CORRECT
matcher: [
  "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
]
```

**Selon la doc Next.js:**
> Match all request paths except:
> - api (API routes)
> - _next/static (static files)
> - _next/image (image optimization files)
> - favicon.ico, sitemap.xml, robots.txt (metadata files)

### 2. CORS Géré dans Route Handlers

#### ❌ Avant
```typescript
// CORS dans middleware - MAUVAISE PRATIQUE
if (pathname.startsWith("/api")) {
  response.headers.set("Access-Control-Allow-Origin", "*")
  // ...
}
```

**Problème:** Le middleware ne devrait PAS gérer CORS. C'est le rôle des Route Handlers.

#### ✅ Après

**Middleware simplifié:**
```typescript
// Middleware ne touche PAS /api
export const config = {
  matcher: ["/((?!api|...).*)", ]
}
```

**CORS dans Route Handler (`lib/cors.ts`):**
```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export function handleCorsOptions() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}
```

**Utilisation dans webhook:**
```typescript
// app/api/vitepay/webhook/route.ts
export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(request: NextRequest) {
  // ...
  return corsJsonResponse(data)
}
```

**Selon la doc Next.js:**
> You can configure CORS headers for individual routes in Route Handlers.

### 3. Règles du Matcher

**Selon la documentation officielle, les matchers:**

1. ✅ **DOIVENT commencer par `/`**
   ```typescript
   matcher: '/about/:path*' // ✅ Correct
   ```

2. ✅ **Peuvent inclure des paramètres nommés**
   ```typescript
   '/about/:path' // Match /about/a et /about/b
   ```

3. ✅ **Peuvent utiliser des modificateurs**
   - `*` = zéro ou plus
   - `?` = zéro ou un
   - `+` = un ou plus
   ```typescript
   '/about/:path*' // Match /about/a/b/c
   ```

4. ✅ **Peuvent utiliser regex**
   ```typescript
   '/about/(.*)' // Équivalent à /about/:path*
   ```

5. ✅ **Sont ancrés au début du path**
   ```typescript
   '/about' // Match /about et /about/team
            // Mais PAS /blog/about
   ```

### 4. Negative Lookahead (Exclusions)

**Pattern recommandé par Next.js:**
```typescript
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
```

**C'est exactement ce que nous utilisons maintenant !** ✅

## 📊 Architecture Finale

### Middleware (`middleware.ts`)
```
Responsabilités:
├── Protection routes (vérification cookie)
├── Routes publiques (/login, /register, etc.)
└── Redirection vers /login si pas de session

N'exécute PAS sur:
├── /api/* (géré par Route Handlers)
├── /_next/static/* (fichiers statiques)
├── /_next/image/* (optimisation images)
└── Fichiers metadata (favicon, sitemap, robots)
```

### Route Handlers (`app/api/*/route.ts`)
```
Responsabilités:
├── Logique métier API
├── CORS (headers + OPTIONS)
├── Validation des données
└── Réponses JSON

Exemple: /api/vitepay/webhook/route.ts
├── export async function OPTIONS() → CORS preflight
└── export async function POST() → Traitement webhook
```

## 🎯 Avantages de cette Architecture

### ✅ Performance
- Middleware ultra-léger (Edge Runtime)
- Pas de fetch/DB dans middleware
- CORS géré uniquement où nécessaire

### ✅ Sécurité
- Protection des routes sensibles
- Validation côté serveur (Server Components)
- CORS contrôlé par route

### ✅ Maintenabilité
- Séparation des responsabilités
- Code conforme aux standards Next.js
- Facile à tester et déboguer

## 📝 Checklist Conformité Next.js

- [x] Matcher exclut `/api`
- [x] Matcher exclut `_next/static`, `_next/image`
- [x] Matcher exclut fichiers metadata
- [x] CORS géré dans Route Handlers
- [x] OPTIONS handler pour preflight
- [x] Middleware léger (pas de fetch/DB)
- [x] Negative lookahead correct
- [x] Pattern recommandé par la doc

## 🚀 Résultat

**Middleware 100% conforme aux règles Next.js !**

### Avant
```
❌ CORS dans middleware
❌ Matcher incluait /api
❌ Conflits avec webhooks
❌ Erreurs CORS VitePay
```

### Après
```
✅ CORS dans Route Handlers
✅ Matcher exclut /api
✅ Webhooks fonctionnent
✅ Pas d'erreur CORS
```

## 📚 Références

- [Next.js Middleware Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/middleware)
- [Route Handlers CORS](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Matcher Configuration](https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher)
- [path-to-regexp](https://github.com/pillarjs/path-to-regexp)

## 🎓 Leçons Apprises

1. **Middleware = Protection basique uniquement**
   - Vérification cookie
   - Redirections simples
   - Pas de logique métier

2. **CORS = Route Handlers**
   - Contrôle granulaire par route
   - OPTIONS handler explicite
   - Headers personnalisés

3. **Matcher = Exclusions importantes**
   - Toujours exclure `/api`
   - Toujours exclure `_next/*`
   - Toujours exclure metadata files

4. **Documentation = Source de vérité**
   - Toujours vérifier la doc officielle
   - Suivre les patterns recommandés
   - Éviter les "hacks"

**Le système est maintenant 100% conforme Next.js !** 🎉
