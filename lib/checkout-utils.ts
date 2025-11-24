/**
 * Utilitaires pour la page de checkout
 */

/**
 * Rediriger vers la page de checkout avec les paramètres nécessaires
 */
export function redirectToCheckout(planId: string, schoolId: string) {
  const url = `/checkout?planId=${planId}&schoolId=${schoolId}`
  window.location.href = url
}

/**
 * Générer l'URL de checkout
 */
export function getCheckoutUrl(planId: string, schoolId: string): string {
  return `/checkout?planId=${planId}&schoolId=${schoolId}`
}

/**
 * Vérifier si les paramètres de checkout sont valides
 */
export function validateCheckoutParams(planId: string | null, schoolId: string | null): boolean {
  return !!(planId && schoolId)
}
