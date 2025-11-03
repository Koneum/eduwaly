import FeeStructuresManager from "@/components/school-admin/fee-structures-manager"
import ScholarshipsManager from "@/components/school-admin/scholarships-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import prisma from "@/lib/prisma"
import { requireAdminDashboardAccess } from "@/lib/auth-utils"

export default async function FinanceSettingsPage({ params }: { params: Promise<{ schoolId: string }> }) {
  await requireAdminDashboardAccess()
  const { schoolId } = await params

  // Récupérer le type d'école et les filières
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { 
      schoolType: true,
      name: true
    }
  })

  if (!school) {
    return <div>École non trouvée</div>
  }

  // Récupérer les filières pour le sélecteur
  const filieres = await prisma.filiere.findMany({
    where: { schoolId },
    select: {
      id: true,
      nom: true
    },
    orderBy: { nom: 'asc' }
  })

  // Récupérer toutes les bourses de l'école (attribuées et non attribuées)
  const scholarships = await prisma.scholarship.findMany({
    where: {
      schoolId
    },
    include: {
      student: {
        select: {
          studentNumber: true,
          niveau: true,
          user: {
            select: {
              name: true
            }
          },
          filiere: {
            select: {
              nom: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuration Financière</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les frais de scolarité et les bourses
        </p>
      </div>

      <Tabs defaultValue="fees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fees">Prix de Scolarité</TabsTrigger>
          <TabsTrigger value="scholarships">Bourses</TabsTrigger>
        </TabsList>

        <TabsContent value="fees">
          <FeeStructuresManager 
            schoolId={schoolId}
            schoolType={school.schoolType}
            filieres={filieres}
          />
        </TabsContent>

        <TabsContent value="scholarships">
          <ScholarshipsManager 
            schoolId={schoolId}
            scholarships={scholarships
              .filter(s => s.student !== null)
              .map(s => ({
                id: s.id,
                name: s.name,
                type: s.type,
                percentage: s.percentage,
                amount: s.amount ? Number(s.amount) : null,
                student: s.student!
              }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
