import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"
import GradingSystemConfig from "@/components/admin/grading-system-config"
import EvaluationTypesManager from "@/components/admin/evaluation-types-manager"
import GradingPeriodsManager from "@/components/admin/grading-periods-manager"

export default async function GradingConfigPage({ 
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
    include: {
      evaluationTypes: {
        where: { isActive: true },
        orderBy: { name: 'asc' }
      },
      gradingPeriods: {
        orderBy: { startDate: 'asc' }
      }
    }
  })

  if (!school) {
    return <div className="p-8">École non trouvée</div>
  }

  const isHighSchool = school.schoolType === 'HIGH_SCHOOL'

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">
          Configuration du Système de Notation
        </h1>
        <p className="text-responsive-sm text-muted-foreground mt-1 sm:mt-2">
          Configurez le système de notation, les types d&apos;évaluations et les périodes
        </p>
      </div>

      {/* Système de notation */}
      <GradingSystemConfig 
        school={school}
        isHighSchool={isHighSchool}
      />

      {/* Types d'évaluations */}
      <EvaluationTypesManager 
        evaluationTypes={school.evaluationTypes}
        schoolId={schoolId}
        isHighSchool={isHighSchool}
      />

      {/* Périodes de notation */}
      <GradingPeriodsManager 
        gradingPeriods={school.gradingPeriods}
        schoolId={schoolId}
        gradingSystem={school.gradingSystem}
      />
    </div>
  )
}
