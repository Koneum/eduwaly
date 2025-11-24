# 🚀 GUIDE IMPLÉMENTATION REDIS CACHE

## 📦 Installation

```bash
npm install @upstash/redis
# OU pour Redis local
npm install ioredis
```

---

## 🔧 Configuration

### Option 1: Upstash (Recommandé - Gratuit)

1. Créer un compte sur [Upstash](https://upstash.com/)
2. Créer une base Redis
3. Copier les credentials dans `.env` :

```env
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

### Option 2: Redis Local

```env
REDIS_URL="redis://localhost:6379"
```

---

## 💡 Utilisation dans les APIs

### Exemple 1: API Filières (Liste simple)

```typescript
import { cacheAside, generateCacheKey, CACHE_TTL, deleteCachePattern } from '@/lib/redis'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const schoolId = authUser.schoolId
    
    // ✅ Utiliser le cache
    const cacheKey = generateCacheKey('filieres', schoolId)
    
    const filieres = await cacheAside(
      cacheKey,
      async () => {
        // Cette fonction s'exécute seulement si cache MISS
        return await prisma.filiere.findMany({
          where: { schoolId },
          select: {
            id: true,
            nom: true,
            schoolId: true,
            _count: {
              select: {
                modules: true,
                emplois: true,
                students: true
              }
            }
          },
          orderBy: { nom: 'asc' }
        })
      },
      CACHE_TTL.LONG // 30 minutes
    )

    return NextResponse.json(filieres)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ✅ Invalider le cache lors de la création
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const filiere = await prisma.filiere.create({
      data: {
        nom: data.nom,
        schoolId: data.schoolId,
      }
    })

    // Invalider le cache
    await deleteCachePattern(`schooly:filieres:${data.schoolId}*`)

    return NextResponse.json(filiere)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
```

### Exemple 2: API Messages Available Users (Complexe)

```typescript
import { cacheAside, generateCacheKey, CACHE_TTL } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = session.user
    
    // ✅ Clé de cache basée sur userId + role
    const cacheKey = generateCacheKey('available-users', {
      userId: user.id,
      role: user.role
    })

    const users = await cacheAside(
      cacheKey,
      async () => {
        // Logique existante optimisée
        if (user.role === 'STUDENT') {
          const student = await prisma.student.findUnique({
            where: { userId: user.id },
            select: { id: true, schoolId: true, filiereId: true, niveau: true }
          })

          if (!student) throw new Error('Étudiant non trouvé')

          return await prisma.user.findMany({
            where: {
              id: { not: user.id },
              OR: [
                { student: { schoolId: student.schoolId, filiereId: student.filiereId, niveau: student.niveau } },
                { role: 'TEACHER', schoolId: student.schoolId },
                { role: 'SCHOOL_ADMIN', schoolId: student.schoolId },
                { role: 'PARENT', parent: { students: { some: { id: student.id } } } }
              ]
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true
            },
            orderBy: [{ role: 'asc' }, { name: 'asc' }]
          })
        }
        
        // ... autres rôles
      },
      CACHE_TTL.MEDIUM // 5 minutes
    )

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
```

### Exemple 3: API Emploi du Temps (Avec paramètres)

```typescript
import { cacheAside, generateCacheKey, CACHE_TTL } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const isRecent = url.searchParams.get('recent') === 'true'
    const schoolId = url.searchParams.get('schoolId')

    // ✅ Clé de cache dynamique basée sur les paramètres
    const cacheKey = generateCacheKey('emploi', {
      schoolId: schoolId || 'all',
      recent: isRecent
    })

    const emplois = await cacheAside(
      cacheKey,
      async () => {
        // Logique existante optimisée
        const whereClause: Record<string, unknown> = {}
        
        if (schoolId) {
          whereClause.schoolId = schoolId
        } else {
          const anneeUniv = await prisma.anneeUniversitaire.findFirst({
            orderBy: { createdAt: 'desc' }
          })
          if (anneeUniv) whereClause.anneeUnivId = anneeUniv.id
        }

        return await prisma.emploiDuTemps.findMany({
          where: whereClause,
          select: {
            id: true,
            titre: true,
            dateDebut: true,
            dateFin: true,
            heureDebut: true,
            heureFin: true,
            salle: true,
            niveau: true,
            semestre: true,
            module: {
              select: {
                id: true,
                nom: true,
                filiere: { select: { id: true, nom: true } }
              }
            },
            enseignant: {
              select: { id: true, nom: true, prenom: true, titre: true }
            }
          },
          orderBy: isRecent 
            ? [{ createdAt: 'desc' }] 
            : [{ dateDebut: 'asc' }, { heureDebut: 'asc' }],
          take: isRecent ? 5 : 100
        })
      },
      isRecent ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM
    )

    return NextResponse.json(emplois)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
```

---

## 🎯 Stratégies de Cache

### 1. Données Très Stables (1 heure)
- Plans d'abonnement
- Permissions système
- Configuration école

### 2. Données Stables (30 minutes)
- Filières
- Modules
- Enseignants
- Salles

### 3. Données Moyennement Volatiles (5 minutes)
- Emploi du temps
- Documents
- Available users
- Conversations

### 4. Données Volatiles (1 minute)
- Messages récents
- Notifications non lues
- Présences du jour

---

## ⚡ Invalidation du Cache

### Invalidation Simple

```typescript
import { deleteCache, generateCacheKey } from '@/lib/redis'

// Après création/modification/suppression
await deleteCache(generateCacheKey('filieres', schoolId))
```

### Invalidation par Pattern

```typescript
import { deleteCachePattern } from '@/lib/redis'

// Invalider toutes les filières d'une école
await deleteCachePattern(`schooly:filieres:${schoolId}*`)

// Invalider tous les emplois
await deleteCachePattern('schooly:emploi:*')
```

### Invalidation en Cascade

```typescript
// Exemple: Modification d'un module affecte plusieurs caches
export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json()
    
    const module = await prisma.module.update({
      where: { id },
      data
    })

    // Invalider les caches liés
    await Promise.all([
      deleteCachePattern(`schooly:modules:${module.schoolId}*`),
      deleteCachePattern(`schooly:emploi:*`), // Emplois utilisent modules
      deleteCachePattern(`schooly:filieres:${module.schoolId}*`), // Filières ont des modules
    ])

    return NextResponse.json(module)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
```

---

## 📊 Gains Estimés avec Redis

| API | Sans Cache | Avec Cache | Gain |
|-----|-----------|------------|------|
| Filières | ~200ms | ~10ms | **-95%** |
| Emploi | ~300ms | ~15ms | **-95%** |
| Available Users | ~250ms | ~12ms | **-95%** |
| Messages Conversations | ~400ms | ~20ms | **-95%** |

### Impact Global
- **Temps de réponse** : -80% à -95%
- **Charge DB** : -70% à -90%
- **Coût serveur** : -50% à -70%

---

## 🔍 Monitoring

### Logs de Cache

Les logs affichent automatiquement :
- ✅ `Cache HIT: schooly:filieres:school123` - Données servies depuis le cache
- ❌ `Cache MISS: schooly:filieres:school123` - Données récupérées de la DB

### Métriques à Surveiller

1. **Hit Rate** : % de requêtes servies par le cache (objectif: >80%)
2. **Miss Rate** : % de requêtes allant en DB (objectif: <20%)
3. **Latence** : Temps de réponse moyen (objectif: <50ms)

---

## ⚠️ Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours invalider le cache** après CREATE/UPDATE/DELETE
2. **Utiliser des TTL appropriés** selon la volatilité des données
3. **Générer des clés standardisées** avec `generateCacheKey()`
4. **Gérer les erreurs Redis** (l'app doit fonctionner sans cache)

### ❌ À ÉVITER

1. **Ne PAS cacher** les données sensibles (mots de passe, tokens)
2. **Ne PAS cacher** les données temps réel (notifications push)
3. **Ne PAS oublier** d'invalider le cache
4. **Ne PAS utiliser** de TTL trop longs pour données volatiles

---

## 🚀 Déploiement

### Variables d'Environnement

```env
# .env.local (développement)
UPSTASH_REDIS_REST_URL="https://your-dev-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-dev-token"

# .env.production (production)
UPSTASH_REDIS_REST_URL="https://your-prod-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-prod-token"
```

### Vérifier que Redis fonctionne

```typescript
// Dans n'importe quelle API
import { redis } from '@/lib/redis'

if (redis) {
  console.log('✅ Redis connecté')
} else {
  console.log('⚠️ Redis non configuré - Mode sans cache')
}
```

---

**Créé le** : 16 Novembre 2025  
**Par** : Cascade AI  
**Status** : ✅ Prêt pour implémentation
