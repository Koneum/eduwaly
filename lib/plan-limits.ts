/**
 * Limites et features par plan d'abonnement
 * Ce fichier NE contient QUE des constantes, pas de Prisma
 * Peut être importé côté client sans problème
 */

export const PLAN_LIMITS = {
  STARTER: {
    maxStudents: 100,
    maxTeachers: 10,
    maxDocuments: 300,
    maxStorageMB: 5120, // 5 GB
    maxEmails: 100,
    maxSMS: 0,
    maxCampus: 1,
    features: {
      messaging: false,
      reports: true,
      advancedAnalytics: false,
      multipleSchools: false,
      payments: false, // Paiement en ligne
      homework: false, // Devoirs & soumissions
      api: false,
      sms: false,
    },
  },
  PROFESSIONAL: {
    maxStudents: 500,
    maxTeachers: 50,
    maxDocuments: 1000,
    maxStorageMB: 51200, // 50 GB
    maxEmails: 500,
    maxSMS: 0,
    maxCampus: 1,
    features: {
      messaging: true,
      reports: true,
      advancedAnalytics: true,
      multipleSchools: false,
      payments: false,
      homework: true,
      api: false,
      sms: false,
    },
  },
  BUSINESS: {
    maxStudents: 2000,
    maxTeachers: 200,
    maxDocuments: 5000,
    maxStorageMB: 204800, // 200 GB
    maxEmails: 1000,
    maxSMS: 1000,
    maxCampus: 5,
    features: {
      messaging: true,
      reports: true,
      advancedAnalytics: true,
      multipleSchools: true,
      payments: true, // Paiement en ligne
      homework: true,
      api: true,
      sms: true,
    },
  },
  ENTERPRISE: {
    maxStudents: Infinity,
    maxTeachers: Infinity,
    maxDocuments: Infinity,
    maxStorageMB: Infinity,
    maxEmails: Infinity,
    maxSMS: Infinity,
    maxCampus: Infinity,
    features: {
      messaging: true,
      reports: true,
      advancedAnalytics: true,
      multipleSchools: true,
      payments: true,
      homework: true,
      api: true,
      sms: true,
    },
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS
export type PlanLimits = typeof PLAN_LIMITS[PlanType]
export type PlanFeatures = PlanLimits['features']
