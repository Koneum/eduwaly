import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, GraduationCap, Users } from "lucide-react"
import prisma from "@/lib/prisma"

// Local lightweight type for Class model (avoid depending on generated Prisma types)
type ClassModel = {
  id: string
  name: string
  code: string
  niveau: string
  capacity: number
  mainRoom?: string | null
}
import { requireSchoolAccess } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function ClassesManagementPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  await requireSchoolAccess(schoolId)

  const school = (await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      classes: {
        orderBy: { name: 'asc' }
      }
    }
  })) as unknown as ({ classes: ClassModel[] } & Record<string, unknown>) | null

  if (!school) {
    redirect('/admin')
  }

  // Si c'est une université, rediriger vers la gestion des salles
  if (school.schoolType === 'UNIVERSITY') {
    redirect(`/admin/${schoolId}/rooms`)
  }

  const totalCapacity = school!.classes.reduce<number>((sum: number, cls: ClassModel) => sum + cls.capacity, 0)

  // Grouper par niveau
  const classesByNiveau = school!.classes.reduce((acc: Record<string, ClassModel[]>, cls: ClassModel) => {
    if (!acc[cls.niveau]) {
      acc[cls.niveau] = []
    }
    acc[cls.niveau].push(cls)
    return acc
  }, {} as Record<string, ClassModel[]>)

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-responsive-xl font-bold text-foreground">Gestion des Classes</h1>
          <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">Gérez les classes de votre établissement</p>
        </div>
        <Button className="text-responsive-sm w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Classe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Total Classes</p>
                <p className="text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">{school.classes.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Capacité Totale</p>
                <p className="text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">{totalCapacity}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Niveaux</p>
                <p className="text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">{Object.keys(classesByNiveau).length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des classes par niveau */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <CardTitle className="text-responsive-lg">Liste des Classes</CardTitle>
              <CardDescription className="text-responsive-sm">{school.classes.length} classes enregistrées</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9 text-responsive-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {Object.entries(classesByNiveau).map(([niveau, classes]) => (
            <div key={niveau}>
              <h3 className="text-responsive-base font-semibold text-foreground mb-3 sm:mb-4">{niveau}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {classes.map((cls) => (
                  <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-responsive-base">{cls.name}</CardTitle>
                          <p className="text-responsive-xs text-muted-foreground mt-1">Code: {cls.code}</p>
                        </div>
                        <Badge variant="outline" className="text-responsive-xs">{cls.niveau}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-responsive-xs">
                          <span className="text-muted-foreground">Capacité</span>
                          <span className="font-medium text-foreground">{cls.capacity} élèves</span>
                        </div>
                        {cls.mainRoom && (
                          <div className="flex items-center justify-between text-responsive-xs">
                            <span className="text-muted-foreground">Salle principale</span>
                            <span className="font-medium text-foreground">{cls.mainRoom}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 text-responsive-xs">Modifier</Button>
                        <Button variant="ghost" size="sm" className="flex-1 text-responsive-xs">Supprimer</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {school.classes.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-responsive-base font-semibold text-foreground mb-2">Aucune classe</h3>
              <p className="text-responsive-sm text-muted-foreground mb-3 sm:mb-4">Commencez par ajouter votre première classe</p>
              <Button className="text-responsive-sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une classe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
