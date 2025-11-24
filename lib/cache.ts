/**
 * Système de cache en mémoire (gratuit, sans dépendance externe)
 * Alternative à Redis/Upstash pour éviter les coûts
 * 
 * IMPORTANT: Ce cache est en mémoire et sera réinitialisé à chaque redémarrage du serveur.
 * Pour un cache persistant, utilisez Redis ou une autre solution de cache externe.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Nettoyer le cache toutes les 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Nettoyer les entrées expirées
   */
  private cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    
    if (keysToDelete.length > 0) {
      console.log(`[CACHE] Nettoyage: ${keysToDelete.length} entrées expirées supprimées`)
    }
  }

  /**
   * Récupérer une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Vérifier si l'entrée est expirée
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  /**
   * Définir une valeur dans le cache
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): boolean {
    try {
      const expiresAt = Date.now() + (ttlSeconds * 1000)
      this.cache.set(key, { value, expiresAt })
      return true
    } catch (error) {
      console.error('[CACHE] Erreur lors de la définition:', error)
      return false
    }
  }

  /**
   * Supprimer une valeur du cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Supprimer plusieurs clés par pattern (simple matching)
   */
  deletePattern(pattern: string): boolean {
    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      const keysToDelete: string[] = []

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key)
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key))
      return true
    } catch (error) {
      console.error('[CACHE] Erreur lors de la suppression par pattern:', error)
      return false
    }
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Obtenir la taille du cache
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Arrêter le nettoyage automatique
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

// Instance singleton du cache
const memoryCache = new MemoryCache()

// Durées de cache par défaut (en secondes)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute - Données très volatiles
  MEDIUM: 300, // 5 minutes - Données moyennement volatiles
  LONG: 1800, // 30 minutes - Données stables
  VERY_LONG: 3600, // 1 heure - Données très stables
} as const

/**
 * Récupérer une valeur du cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  return memoryCache.get<T>(key)
}

/**
 * Définir une valeur dans le cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  return memoryCache.set(key, value, ttl)
}

/**
 * Supprimer une valeur du cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  return memoryCache.delete(key)
}

/**
 * Supprimer plusieurs clés par pattern
 */
export async function deleteCachePattern(pattern: string): Promise<boolean> {
  return memoryCache.deletePattern(pattern)
}

/**
 * Wrapper pour cache-aside pattern
 * Essaie de récupérer du cache, sinon exécute la fonction et met en cache
 */
export async function cacheAside<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Essayer de récupérer du cache
  const cached = await getCache<T>(key)
  if (cached !== null) {
    console.log(`✅ Cache HIT: ${key}`)
    return cached
  }

  // Cache miss - récupérer les données
  console.log(`❌ Cache MISS: ${key}`)
  const data = await fetchFn()

  // Mettre en cache pour la prochaine fois
  await setCache(key, data, ttl)

  return data
}

/**
 * Générer une clé de cache standardisée
 */
export function generateCacheKey(
  resource: string,
  identifier?: string | Record<string, unknown>
): string {
  if (!identifier) {
    return `schooly:${resource}`
  }

  if (typeof identifier === 'string') {
    return `schooly:${resource}:${identifier}`
  }

  // Pour les objets, créer une clé basée sur les paramètres
  const params = Object.entries(identifier)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

  return `schooly:${resource}:${params}`
}

/**
 * Vider tout le cache (utile pour les tests ou le développement)
 */
export function clearCache(): void {
  memoryCache.clear()
  console.log('[CACHE] Cache vidé')
}

/**
 * Obtenir les statistiques du cache
 */
export function getCacheStats() {
  return {
    size: memoryCache.size(),
    type: 'memory'
  }
}

export default memoryCache
