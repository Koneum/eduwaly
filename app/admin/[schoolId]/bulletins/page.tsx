import { Card } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"
import BulletinsGenerator from "@/components/admin/bulletins-generator"
import BulletinsList, { BulletinListItem } from "@/components/admin/bulletins-list"

export default async function BulletinsPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }>
}) {
  const currentUser = await getAuthUser()
  const { schoolId } = await params
  
  if (!currentUser || currentUser.role !== 'SCHOOL_ADMIN') {
    redirect('/login')
  }

  // Récupérer l'école avec sa configuration
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
      phone: true,
      email: true,
      schoolType: true,
      gradingSystem: true,
      gradingFormula: true
    }
  })

  if (!school) {
    return <div className="p-8">École non trouvée</div>
  }

  // Récupérer les périodes de notation
  const gradingPeriods = await prisma.gradingPeriod.findMany({
    where: { schoolId, isActive: true },
    orderBy: { startDate: 'asc' }
  })

  // Récupérer les filières/classes
  const isHighSchool = school.schoolType === 'HIGH_SCHOOL'
  const filieres = !isHighSchool ? await prisma.filiere.findMany({
    where: { schoolId },
    select: { id: true, nom: true }
  }) : []

  const classes = isHighSchool ? await prisma.class.findMany({
    where: { schoolId },
    select: { id: true, name: true }
  }) : []

  // Récupérer les étudiants
  const students = await prisma.student.findMany({
    where: { schoolId, isEnrolled: true },
    select: {
      id: true,
      studentNumber: true,
      niveau: true,
      enrollmentYear: true,
      user: {
        select: {
          name: true,
          email: true
        }
      },
      filiere: {
        select: {
          nom: true
        }
      }
    },
    orderBy: {
      user: {
        name: 'asc'
      }
    }
  })

  // Récupérer les templates de bulletins
  const bulletinTemplates = await prisma.pDFTemplate.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' }
  })

  // Récupérer l'abonnement pour connaître la limite de templates
  const subscription = await prisma.subscription.findFirst({
    where: { schoolId },
    include: { plan: true }
  })

  let maxBulletinTemplates = 1
  if (subscription?.plan) {
    const rawFeatures = subscription.plan.features as unknown
    const features = typeof rawFeatures === 'string'
      ? JSON.parse(rawFeatures)
      : rawFeatures || {}

    maxBulletinTemplates = features?.bulletinTemplatesLimit ?? 1
  }

  // Récupérer les bulletins générés pour l'historique (après avoir les filtres)
  const bulletinsRaw = await prisma.bulletin.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    include: {
      gradingPeriod: true,
      filiere: true,
      student: {
        include: {
          user: true,
        },
      },
    },
  })

  const bulletins: BulletinListItem[] = bulletinsRaw.map((b) => {
    const startYear = b.gradingPeriod.startDate.getFullYear()
    const academicYear = `${startYear}-${startYear + 1}`

    return {
      id: b.id,
      createdAt: b.createdAt.toISOString(),
      generalAverage: b.generalAverage,
      gradingPeriodId: b.gradingPeriodId,
      gradingPeriodName: b.gradingPeriod.name,
      academicYear,
      filiereId: b.filiereId,
      filiereName: b.filiere?.nom ?? null,
      studentId: b.studentId,
      studentName: b.student?.user?.name ?? null,
      studentNumber: b.student?.studentNumber ?? null,
    }
  })

  const periodOptions = gradingPeriods.map((p) => ({ id: p.id, label: p.name }))
  const academicYearSet = new Set<string>()
  bulletins.forEach((b) => academicYearSet.add(b.academicYear))
  const academicYearOptions = Array.from(academicYearSet).sort().map((year) => ({
    id: year,
    label: year,
  }))
  const filiereOptions = (
    isHighSchool
      ? classes.map((c) => ({ id: c.id, label: c.name }))
      : filieres.map((f) => ({ id: f.id, label: f.nom }))
  )
  const studentOptions = students.map((s) => ({
    id: s.id,
    label: `${s.user?.name || 'Étudiant'} (${s.studentNumber})`,
  }))

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">
          Génération de Bulletins
        </h1>
        <p className="text-responsive-sm text-muted-foreground mt-1 sm:mt-2">
          Générez des bulletins de notes individuels ou par groupe
        </p>
      </div>

      {/* Générateur */}
      <BulletinsGenerator 
        school={school}
        gradingPeriods={gradingPeriods}
        filieres={isHighSchool ? classes.map(c => ({ id: c.id, nom: c.name })) : filieres}
        students={students}
        isHighSchool={isHighSchool}
        bulletinTemplates={bulletinTemplates}
        maxBulletinTemplates={maxBulletinTemplates}
      />

      {/* Historique des bulletins générés */}
      <BulletinsList
        bulletins={bulletins}
        periods={periodOptions}
        filieres={filiereOptions}
        students={studentOptions}
        academicYears={academicYearOptions}
      />
    </div>
  )
}
