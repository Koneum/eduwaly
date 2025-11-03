# Script pour créer le système complet de gestion des abonnements
# Optimisé pour réduire l'utilisation des crédits

Write-Host "🚀 Création du système de gestion des abonnements..." -ForegroundColor Cyan

# Créer les dossiers nécessaires
$folders = @(
    "lib/subscription",
    "types",
    "middleware",
    "components/pricing"
)

foreach ($folder in $folders) {
    $path = "d:\react\UE-GI app\schooly\$folder"
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "✅ Dossier créé: $folder" -ForegroundColor Green
    }
}

# 1. Types pour les plans et features
Write-Host "`n📝 Création des types TypeScript..." -ForegroundColor Yellow
$typesContent = @'
// Types pour le système d'abonnement et feature flags

export type PlanName = 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE'

export type FeatureFlag = 
  // Communication
  | 'messaging_internal'
  | 'notifications_email'
  | 'notifications_sms'
  | 'announcements'
  
  // Académique
  | 'homework_assignments'
  | 'homework_submissions'
  | 'evaluations_individual'
  | 'evaluations_group'
  | 'attendance_basic'
  | 'attendance_advanced'
  | 'grade_reports_basic'
  | 'grade_reports_advanced'
  
  // Documents
  | 'documents_pdf_only'
  | 'documents_all_types'
  | 'documents_videos'
  | 'documents_library'
  
  // Finance
  | 'payments_manual'
  | 'payments_online'
  | 'payments_reminders_email'
  | 'payments_reminders_sms'
  | 'scholarships'
  | 'financial_reports_basic'
  | 'financial_reports_advanced'
  
  // Rapports
  | 'reports_csv_export'
  | 'reports_pdf_basic'
  | 'reports_pdf_advanced'
  | 'reports_statistics'
  | 'reports_predictive'
  
  // Système
  | 'permissions_system'
  | 'multi_campus'
  | 'api_access'
  | 'webhooks'
  | 'custom_branding'
  | 'sso'
  | 'two_factor_auth'

export interface PlanLimits {
  maxStudents: number
  maxTeachers: number
  maxAdminStaff: number
  maxClasses: number
  maxModules: number
  maxRooms: number
  storageGB: number
  emailsPerMonth: number
  smsPerMonth: number
  maxCampus: number
}

export interface PlanFeatures {
  name: PlanName
  displayName: string
  price: number
  currency: 'XOF'
  interval: 'MONTHLY' | 'YEARLY'
  limits: PlanLimits
  features: FeatureFlag[]
  support: 'EMAIL' | 'EMAIL_CHAT' | 'PRIORITY' | 'DEDICATED_24_7'
  backup: 'WEEKLY' | 'DAILY' | 'REALTIME'
}

export const PLAN_CONFIGS: Record<PlanName, PlanFeatures> = {
  STARTER: {
    name: 'STARTER',
    displayName: 'Starter',
    price: 5000,
    currency: 'XOF',
    interval: 'MONTHLY',
    limits: {
      maxStudents: 100,
      maxTeachers: 10,
      maxAdminStaff: 3,
      maxClasses: 5,
      maxModules: 20,
      maxRooms: 10,
      storageGB: 5,
      emailsPerMonth: 0,
      smsPerMonth: 0,
      maxCampus: 1,
    },
    features: [
      'announcements',
      'evaluations_individual',
      'attendance_basic',
      'grade_reports_basic',
      'documents_pdf_only',
      'payments_manual',
      'financial_reports_basic',
      'reports_csv_export',
      'reports_pdf_basic',
    ],
    support: 'EMAIL',
    backup: 'WEEKLY',
  },
  PROFESSIONAL: {
    name: 'PROFESSIONAL',
    displayName: 'Professional',
    price: 12500,
    currency: 'XOF',
    interval: 'MONTHLY',
    limits: {
      maxStudents: 500,
      maxTeachers: 50,
      maxAdminStaff: 10,
      maxClasses: -1, // illimité
      maxModules: -1,
      maxRooms: -1,
      storageGB: 50,
      emailsPerMonth: 500,
      smsPerMonth: 0,
      maxCampus: 1,
    },
    features: [
      'announcements',
      'messaging_internal',
      'notifications_email',
      'homework_assignments',
      'homework_submissions',
      'evaluations_individual',
      'evaluations_group',
      'attendance_basic',
      'attendance_advanced',
      'grade_reports_basic',
      'grade_reports_advanced',
      'documents_all_types',
      'documents_videos',
      'documents_library',
      'payments_manual',
      'payments_reminders_email',
      'scholarships',
      'financial_reports_basic',
      'financial_reports_advanced',
      'reports_csv_export',
      'reports_pdf_basic',
      'reports_pdf_advanced',
      'reports_statistics',
      'permissions_system',
    ],
    support: 'EMAIL_CHAT',
    backup: 'DAILY',
  },
  BUSINESS: {
    name: 'BUSINESS',
    displayName: 'Business',
    price: 25000,
    currency: 'XOF',
    interval: 'MONTHLY',
    limits: {
      maxStudents: 2000,
      maxTeachers: 200,
      maxAdminStaff: 30,
      maxClasses: -1,
      maxModules: -1,
      maxRooms: -1,
      storageGB: 200,
      emailsPerMonth: -1, // illimité
      smsPerMonth: 1000,
      maxCampus: 5,
    },
    features: [
      'announcements',
      'messaging_internal',
      'notifications_email',
      'notifications_sms',
      'homework_assignments',
      'homework_submissions',
      'evaluations_individual',
      'evaluations_group',
      'attendance_basic',
      'attendance_advanced',
      'grade_reports_basic',
      'grade_reports_advanced',
      'documents_all_types',
      'documents_videos',
      'documents_library',
      'payments_manual',
      'payments_online',
      'payments_reminders_email',
      'payments_reminders_sms',
      'scholarships',
      'financial_reports_basic',
      'financial_reports_advanced',
      'reports_csv_export',
      'reports_pdf_basic',
      'reports_pdf_advanced',
      'reports_statistics',
      'reports_predictive',
      'permissions_system',
      'multi_campus',
      'api_access',
      'webhooks',
      'two_factor_auth',
    ],
    support: 'PRIORITY',
    backup: 'REALTIME',
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    price: 0, // Sur devis
    currency: 'XOF',
    interval: 'MONTHLY',
    limits: {
      maxStudents: -1,
      maxTeachers: -1,
      maxAdminStaff: -1,
      maxClasses: -1,
      maxModules: -1,
      maxRooms: -1,
      storageGB: 1000,
      emailsPerMonth: -1,
      smsPerMonth: -1,
      maxCampus: -1,
    },
    features: [
      'announcements',
      'messaging_internal',
      'notifications_email',
      'notifications_sms',
      'homework_assignments',
      'homework_submissions',
      'evaluations_individual',
      'evaluations_group',
      'attendance_basic',
      'attendance_advanced',
      'grade_reports_basic',
      'grade_reports_advanced',
      'documents_all_types',
      'documents_videos',
      'documents_library',
      'payments_manual',
      'payments_online',
      'payments_reminders_email',
      'payments_reminders_sms',
      'scholarships',
      'financial_reports_basic',
      'financial_reports_advanced',
      'reports_csv_export',
      'reports_pdf_basic',
      'reports_pdf_advanced',
      'reports_statistics',
      'reports_predictive',
      'permissions_system',
      'multi_campus',
      'api_access',
      'webhooks',
      'two_factor_auth',
      'custom_branding',
      'sso',
    ],
    support: 'DEDICATED_24_7',
    backup: 'REALTIME',
  },
}
'@

Set-Content -Path "d:\react\UE-GI app\schooly\types\subscription.ts" -Value $typesContent
Write-Host "✅ types/subscription.ts créé" -ForegroundColor Green

# 2. Utilitaires de vérification des features
Write-Host "`n📝 Création des utilitaires..." -ForegroundColor Yellow
$utilsContent = @'
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
'@

Set-Content -Path "d:\react\UE-GI app\schooly\lib\subscription\features.ts" -Value $utilsContent
Write-Host "✅ lib/subscription/features.ts créé" -ForegroundColor Green

Write-Host "`n✨ Système de base créé avec succès!" -ForegroundColor Green
Write-Host "📦 Fichiers créés:" -ForegroundColor Cyan
Write-Host "  - types/subscription.ts" -ForegroundColor White
Write-Host "  - lib/subscription/features.ts" -ForegroundColor White
Write-Host "`n⏭️  Exécutez le script suivant pour créer les composants et middleware:" -ForegroundColor Yellow
Write-Host "  .\scripts\create-subscription-components.ps1" -ForegroundColor White
