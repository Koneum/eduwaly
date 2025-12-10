/**
 * Limites et features par plan d'abonnement
 * Ce fichier NE contient QUE des constantes, pas de Prisma
 * Peut être importé côté client sans problème
 * 
 * Documentation complète: FONCTIONNALITES_PLANS.md
 */

export const PLAN_LIMITS = {
  // Plan Essai Gratuit (30 jours)
  STARTER: {
    maxStudents: 100,
    maxTeachers: 10,
    maxDocuments: 300,
    maxStorageMB: 1024, // 1 GB
    maxEmails: 50,
    maxSMS: 0,
    maxCampus: 1,
    trialDays: 30,
    features: {
      // Communication
      messaging: false,
      notifications: true,
      smsNotifications: false,
      chatRealTime: false,
      
      // Académique
      attendance: true,
      attendanceQR: false,
      attendanceBiometric: false,
      grades: true,
      gradeWeighting: false,
      homework: true,
      homeworkCorrection: false,
      
      // Financier
      payments: true,
      onlinePayments: false,
      scholarships: false,
      financialReports: false,
      accountingExport: false,
      
      // Rapports
      reports: true,
      advancedReports: false,
      realTimeStats: false,
      predictiveAnalytics: false,
      
      // Personnalisation
      customColors: false,
      customDomain: false,
      pdfTemplates: 1, // 1 modèle
      multiLanguage: false,
      
      // Technique
      api: false,
      webhooks: false,
      importExport: false,
      
      // Support
      emailSupport: true,
      chatSupport: false,
      phoneSupport: false,
      onlineTraining: false,
      onsiteTraining: false,
    },
  },
  
  // Plan Basic (25,000 FCFA/an)
  PROFESSIONAL: {
    maxStudents: 500,
    maxTeachers: 50,
    maxDocuments: 1000,
    maxStorageMB: 10240, // 10 GB
    maxEmails: 500,
    maxSMS: 0,
    maxCampus: 1,
    trialDays: 0,
    features: {
      // Communication
      messaging: true,
      notifications: true,
      smsNotifications: false,
      chatRealTime: false,
      
      // Académique
      attendance: true,
      attendanceQR: true,
      attendanceBiometric: false,
      grades: true,
      gradeWeighting: true,
      homework: true,
      homeworkCorrection: true,
      
      // Financier
      payments: true,
      onlinePayments: true,
      scholarships: true,
      financialReports: true,
      accountingExport: false,
      
      // Rapports
      reports: true,
      advancedReports: true,
      realTimeStats: false,
      predictiveAnalytics: false,
      
      // Personnalisation
      customColors: true,
      customDomain: false,
      pdfTemplates: 3, // 3 modèles
      multiLanguage: false,
      
      // Technique
      api: false,
      webhooks: false,
      importExport: true,
      
      // Support
      emailSupport: true,
      chatSupport: true,
      phoneSupport: false,
      onlineTraining: true,
      onsiteTraining: false,
    },
  },
  
  // Plan Premium (45,000 FCFA/an)
  BUSINESS: {
    maxStudents: Infinity,
    maxTeachers: Infinity,
    maxDocuments: Infinity,
    maxStorageMB: 102400, // 100 GB
    maxEmails: Infinity,
    maxSMS: Infinity,
    maxCampus: Infinity,
    trialDays: 0,
    features: {
      // Communication
      messaging: true,
      notifications: true,
      smsNotifications: true,
      chatRealTime: true,
      
      // Académique
      attendance: true,
      attendanceQR: true,
      attendanceBiometric: true,
      grades: true,
      gradeWeighting: true,
      homework: true,
      homeworkCorrection: true,
      
      // Financier
      payments: true,
      onlinePayments: true,
      scholarships: true,
      financialReports: true,
      accountingExport: true,
      
      // Rapports
      reports: true,
      advancedReports: true,
      realTimeStats: true,
      predictiveAnalytics: true,
      
      // Personnalisation
      customColors: true,
      customDomain: true,
      pdfTemplates: Infinity, // Illimité
      multiLanguage: true,
      
      // Technique
      api: true,
      webhooks: true,
      importExport: true,
      
      // Support
      emailSupport: true,
      chatSupport: true,
      phoneSupport: true,
      onlineTraining: true,
      onsiteTraining: true,
    },
  },
  
  // Alias pour compatibilité
  ENTERPRISE: {
    maxStudents: Infinity,
    maxTeachers: Infinity,
    maxDocuments: Infinity,
    maxStorageMB: Infinity,
    maxEmails: Infinity,
    maxSMS: Infinity,
    maxCampus: Infinity,
    trialDays: 0,
    features: {
      messaging: true,
      notifications: true,
      smsNotifications: true,
      chatRealTime: true,
      attendance: true,
      attendanceQR: true,
      attendanceBiometric: true,
      grades: true,
      gradeWeighting: true,
      homework: true,
      homeworkCorrection: true,
      payments: true,
      onlinePayments: true,
      scholarships: true,
      financialReports: true,
      accountingExport: true,
      reports: true,
      advancedReports: true,
      realTimeStats: true,
      predictiveAnalytics: true,
      customColors: true,
      customDomain: true,
      pdfTemplates: Infinity,
      multiLanguage: true,
      api: true,
      webhooks: true,
      importExport: true,
      emailSupport: true,
      chatSupport: true,
      phoneSupport: true,
      onlineTraining: true,
      onsiteTraining: true,
    },
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS
export type PlanLimits = typeof PLAN_LIMITS[PlanType]
export type PlanFeatures = PlanLimits['features']

/**
 * Obtenir les limites d'un plan
 */
export function getPlanLimits(planName: string): PlanLimits {
  const normalizedName = planName.toUpperCase() as PlanType
  return PLAN_LIMITS[normalizedName] || PLAN_LIMITS.STARTER
}

/**
 * Vérifier si une fonctionnalité est disponible
 */
export function hasFeature(planName: string, feature: keyof PlanFeatures): boolean {
  const limits = getPlanLimits(planName)
  return limits.features[feature] === true || limits.features[feature] === Infinity
}

/**
 * Vérifier si une limite est atteinte
 */
export function isLimitReached(planName: string, limitType: keyof Omit<PlanLimits, 'features' | 'trialDays'>, currentValue: number): boolean {
  const limits = getPlanLimits(planName)
  const limit = limits[limitType]
  if (limit === Infinity) return false
  return currentValue >= (limit as number)
}
