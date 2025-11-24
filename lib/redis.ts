/**
 * Système de cache - Utilise le cache en mémoire par défaut (gratuit)
 * Pour utiliser Redis/Upstash, décommentez le code ci-dessous et installez @upstash/redis
 */

// import { Redis } from '@upstash/redis'
// let redis: Redis | null = null
// if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
//   redis = new Redis({
//     url: process.env.UPSTASH_REDIS_REST_URL,
//     token: process.env.UPSTASH_REDIS_REST_TOKEN,
//   })
// }

// Utiliser le cache en mémoire par défaut
import {
  getCache as memoryCacheGet,
  setCache as memoryCacheSet,
  deleteCache as memoryCacheDelete,
  deleteCachePattern as memoryCacheDeletePattern,
  cacheAside as memoryCacheAside,
  generateCacheKey as memoryCacheGenerateKey,
} from './cache'

const redis = null // Désactivé pour utiliser le cache en mémoire

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
  // Utiliser le cache en mémoire
  return memoryCacheGet<T>(key)
}

/**
 * Définir une valeur dans le cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  // Utiliser le cache en mémoire
  return memoryCacheSet<T>(key, value, ttl)
}

/**
 * Supprimer une valeur du cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  // Utiliser le cache en mémoire
  return memoryCacheDelete(key)
}

/**
 * Supprimer plusieurs clés par pattern
 */
export async function deleteCachePattern(pattern: string): Promise<boolean> {
  // Utiliser le cache en mémoire
  return memoryCacheDeletePattern(pattern)
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
  // Utiliser le cache en mémoire
  return memoryCacheAside<T>(key, fetchFn, ttl)
}

/**
 * Générer une clé de cache standardisée
 */
export function generateCacheKey(
  resource: string,
  identifier?: string | Record<string, unknown>
): string {
  // Utiliser le cache en mémoire
  return memoryCacheGenerateKey(resource, identifier)
}

export { redis }
