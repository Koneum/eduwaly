import { PLAN_CONFIGS, FeatureFlag, PlanName, PlanLimits } from '@/types/subscription'

/**
 * Vérifie si une fonctionnalité est disponible pour un plan donné
 */
export function hasFeature(planName: PlanName, feature: FeatureFlag): boolean {
  const plan = PLAN_CONFIGS[planName]
  return plan.features.includes(feature)
}

/**
 * Récupère les limites d'un plan
 */
export function getPlanLimits(planName: PlanName): PlanLimits {
  return PLAN_CONFIGS[planName].limits
}

/**
 * Vérifie si une limite est dépassée
 */
export function isLimitExceeded(
  planName: PlanName,
  limitType: keyof PlanLimits,
  currentValue: number
): boolean {
  const limits = getPlanLimits(planName)
  const limit = limits[limitType]
  
  // -1 signifie illimité
  if (limit === -1) return false
  
  return currentValue >= limit
}

/**
 * Récupère le pourcentage d'utilisation d'une limite
 */
export function getLimitUsagePercentage(
  planName: PlanName,
  limitType: keyof PlanLimits,
  currentValue: number
): number {
  const limits = getPlanLimits(planName)
  const limit = limits[limitType]
  
  if (limit === -1) return 0 // Illimité
  if (limit === 0) return 100
  
  return Math.min(100, (currentValue / limit) * 100)
}

/**
 * Vérifie si l'utilisateur approche d'une limite (>80%)
 */
export function isApproachingLimit(
  planName: PlanName,
  limitType: keyof PlanLimits,
  currentValue: number
): boolean {
  const percentage = getLimitUsagePercentage(planName, limitType, currentValue)
  return percentage >= 80 && percentage < 100
}

/**
 * Récupère toutes les fonctionnalités d'un plan
 */
export function getPlanFeatures(planName: PlanName): FeatureFlag[] {
  return PLAN_CONFIGS[planName].features
}

/**
 * Compare deux plans et retourne les fonctionnalités supplémentaires
 */
export function getAdditionalFeatures(
  currentPlan: PlanName,
  targetPlan: PlanName
): FeatureFlag[] {
  const currentFeatures = getPlanFeatures(currentPlan)
  const targetFeatures = getPlanFeatures(targetPlan)
  
  return targetFeatures.filter(feature => !currentFeatures.includes(feature))
}

/**
 * Récupère le nom d'affichage d'une fonctionnalité
 */
export function getFeatureDisplayName(feature: FeatureFlag): string {
  const names: Record<FeatureFlag, string> = {
    messaging_internal: 'Messagerie interne',
    notifications_email: 'Notifications email',
    notifications_sms: 'Notifications SMS',
    announcements: 'Annonces',
    homework_assignments: 'Création de devoirs',
    homework_submissions: 'Soumission de devoirs',
    evaluations_individual: 'Évaluations individuelles',
    evaluations_group: 'Évaluations de groupe',
    attendance_basic: 'Présences basiques',
    attendance_advanced: 'Présences avancées',
    grade_reports_basic: 'Bulletins basiques',
    grade_reports_advanced: 'Bulletins avancés',
    documents_pdf_only: 'Documents PDF uniquement',
    documents_all_types: 'Tous types de documents',
    documents_videos: 'Upload de vidéos',
    documents_library: 'Bibliothèque de documents',
    payments_manual: 'Paiements manuels',
    payments_online: 'Paiements en ligne',
    payments_reminders_email: 'Rappels email',
    payments_reminders_sms: 'Rappels SMS',
    scholarships: 'Gestion des bourses',
    financial_reports_basic: 'Rapports financiers basiques',
    financial_reports_advanced: 'Rapports financiers avancés',
    reports_csv_export: 'Export CSV',
    reports_pdf_basic: 'Rapports PDF basiques',
    reports_pdf_advanced: 'Rapports PDF avancés',
    reports_statistics: 'Rapports statistiques',
    reports_predictive: 'Rapports prédictifs',
    permissions_system: 'Système de permissions',
    multi_campus: 'Multi-campus',
    api_access: 'Accès API',
    webhooks: 'Webhooks',
    custom_branding: 'Branding personnalisé',
    sso: 'Single Sign-On',
    two_factor_auth: 'Authentification 2FA',
  }
  
  return names[feature] || feature
}
