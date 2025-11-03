import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, GraduationCap, Users } from "lucide-react"
import prisma from "@/lib/prisma"
import { requireSchoolAccess } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function ClassesManagementPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  await requireSchoolAccess(schoolId)

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      classes: {
        orderBy: { name: 'asc' }
      }
    }
  })

  if (!school) {
    redirect('/admin')
  }

  // Si c'est une université, rediriger vers la gestion des salles
  if (school.schoolType === 'UNIVERSITY') {
    redirect(`/admin/${schoolId}/rooms`)
  }

  const totalCapacity = school.classes.reduce((sum, cls) => sum + cls.capacity, 0)

  // Grouper par niveau
  const classesByNiveau = school.classes.reduce((acc, cls) => {
    if (!acc[cls.niveau]) {
      acc[cls.niveau] = []
    }
    acc[cls.niveau].push(cls)
    return acc
  }, {} as Record<string, typeof school.classes>)

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Classes</h1>
          <p className="text-muted-foreground mt-2">Gérez les classes de votre établissement</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Classe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                <p className="text-3xl font-bold text-foreground mt-2">{school.classes.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Capacité Totale</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalCapacity}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Niveaux</p>
                <p className="text-3xl font-bold text-foreground mt-2">{Object.keys(classesByNiveau).length}</p>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des Classes</CardTitle>
              <CardDescription>{school.classes.length} classes enregistrées</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(classesByNiveau).map(([niveau, classes]) => (
            <div key={niveau}>
              <h3 className="text-lg font-semibold text-foreground mb-4">{niveau}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">Code: {cls.code}</p>
                        </div>
                        <Badge variant="outline">{cls.niveau}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capacité</span>
                          <span className="font-medium text-foreground">{cls.capacity} élèves</span>
                        </div>
                        {cls.mainRoom && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Salle principale</span>
                            <span className="font-medium text-foreground">{cls.mainRoom}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">Modifier</Button>
                        <Button variant="ghost" size="sm" className="flex-1">Supprimer</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {school.classes.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucune classe</h3>
              <p className="text-muted-foreground mb-4">Commencez par ajouter votre première classe</p>
              <Button>
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
