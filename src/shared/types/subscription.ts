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
