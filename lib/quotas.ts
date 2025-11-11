/**
 * Fonctions de vérification des quotas côté serveur
 * ATTENTION: Ce fichier importe Prisma et ne doit être utilisé que côté serveur
 * Pour les constantes PLAN_LIMITS, importez depuis @/lib/plan-limits
 */
import prisma from '@/lib/prisma'
import { PLAN_LIMITS, type PlanType } from '@/lib/plan-limits'

// Ré-exporter pour compatibilité
export { PLAN_LIMITS, type PlanType } from '@/lib/plan-limits'

/**
 * Vérifier si une école a atteint ses limites
 */
export async function checkQuota(
  schoolId: string,
  resource: 'students' | 'teachers' | 'documents' | 'storage'
): Promise<{ allowed: boolean; current: number; max: number; message?: string }> {
  try {
    // Récupérer l'école et son abonnement
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    })

    if (!school) {
      return {
        allowed: false,
        current: 0,
        max: 0,
        message: 'École non trouvée',
      }
    }

    // Plan par défaut si pas d'abonnement
    const planName = (school.subscription?.plan?.name?.toUpperCase() || 'STARTER') as PlanType
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.STARTER

    // Compter les ressources actuelles
    let current = 0
    let max = 0

    switch (resource) {
      case 'students':
        current = await prisma.student.count({ where: { schoolId } })
        max = limits.maxStudents
        break

      case 'teachers':
        current = await prisma.enseignant.count({ where: { schoolId } })
        max = limits.maxTeachers
        break

      case 'documents':
        current = await prisma.document.count({ where: { schoolId } })
        max = limits.maxDocuments
        break

      case 'storage':
        // Calculer l'espace de stockage utilisé (simplifié)
        const documents = await prisma.document.findMany({
          where: { schoolId },
          select: { fileSize: true },
        })
        current = Math.round(documents.reduce((sum: number, doc: { fileSize: number | null }) => sum + (doc.fileSize || 0), 0) / (1024 * 1024)) // MB
        max = limits.maxStorageMB
        break
    }

    const allowed = current < max
    const message = !allowed
      ? `Limite atteinte : ${current}/${max} ${resource}`
      : undefined

    return { allowed, current, max, message }
  } catch (error) {
    console.error('Erreur vérification quota:', error)
    return {
      allowed: false,
      current: 0,
      max: 0,
      message: 'Erreur lors de la vérification des quotas',
    }
  }
}

/**
 * Vérifier si une fonctionnalité est disponible pour une école
 */
export async function hasFeature(
  schoolId: string,
  feature: keyof typeof PLAN_LIMITS.STARTER.features
): Promise<boolean> {
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    })

    if (!school) return false

    const planName = (school.subscription?.plan?.name?.toUpperCase() || 'STARTER') as PlanType
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.STARTER

    const featureValue = limits.features[feature as keyof typeof limits.features]
    return typeof featureValue === 'boolean' ? featureValue : Boolean(featureValue)
  } catch (error) {
    console.error('Erreur vérification feature:', error)
    return false
  }
}

/**
 * Obtenir les limites d'une école
 */
export async function getSchoolLimits(schoolId: string) {
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    })

    if (!school) {
      return PLAN_LIMITS.STARTER
    }

    const planName = (school.subscription?.plan?.name?.toUpperCase() || 'STARTER') as PlanType
    return PLAN_LIMITS[planName] || PLAN_LIMITS.STARTER
  } catch (error) {
    console.error('Erreur récupération limites:', error)
    return PLAN_LIMITS.STARTER
  }
}

/**
 * Obtenir l'usage actuel d'une école
 */
export async function getSchoolUsage(schoolId: string) {
  try {
    const [studentsCount, teachersCount, documentsCount, documents] = await Promise.all([
      prisma.student.count({ where: { schoolId } }),
      prisma.enseignant.count({ where: { schoolId } }),
      prisma.document.count({ where: { schoolId } }),
      prisma.document.findMany({
        where: { schoolId },
        select: { fileSize: true },
      }),
    ])

    const storageMB = Math.round(
      documents.reduce((sum: number, doc: { fileSize: number | null }) => sum + (doc.fileSize || 0), 0) / (1024 * 1024)
    )

    return {
      students: studentsCount,
      teachers: teachersCount,
      documents: documentsCount,
      storageMB,
    }
  } catch (error) {
    console.error('Erreur récupération usage:', error)
    return {
      students: 0,
      teachers: 0,
      documents: 0,
      storageMB: 0,
    }
  }
}

/**
 * Middleware pour vérifier les quotas avant une action
 */
export async function requireQuota(
  schoolId: string,
  resource: 'students' | 'teachers' | 'documents' | 'storage'
): Promise<void> {
  const quota = await checkQuota(schoolId, resource)
  
  if (!quota.allowed) {
    throw new Error(quota.message || `Limite de ${resource} atteinte`)
  }
}

/**
 * Middleware pour vérifier une fonctionnalité
 */
export async function requireFeature(
  schoolId: string,
  feature: keyof typeof PLAN_LIMITS.STARTER.features
): Promise<void> {
  const hasAccess = await hasFeature(schoolId, feature)
  
  if (!hasAccess) {
    throw new Error(`Cette fonctionnalité (${String(feature)}) n'est pas disponible dans votre plan`)
  }
}
