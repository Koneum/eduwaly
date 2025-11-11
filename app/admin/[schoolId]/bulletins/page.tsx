import { Card } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"
import BulletinsGenerator from "@/components/admin/bulletins-generator"

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
      />
    </div>
  )
}
