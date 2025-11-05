import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, BookOpen } from "lucide-react"
import prisma from "@/lib/prisma"
import { requireSchoolAccess } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { SchedulePageWrapper } from "@/components/admin/schedule-page-wrapper"

type EmploiModel = {
  id: string
  module: { nom: string }
  enseignant: { nom: string; prenom: string }
  filiere?: { nom?: string } | null
  vh: number
  joursCours?: string | null
  heureDebut: string
  heureFin: string
  salle: string
  niveau: string
}

export default async function ScheduleManagementPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  await requireSchoolAccess(schoolId)

  const school = await prisma.school.findUnique({
    where: { id: schoolId }
  })

  if (!school) {
    redirect('/admin')
  }

  // Récupérer les emplois du temps
  const emplois = (await prisma.emploiDuTemps.findMany({
    where: { schoolId: schoolId },
    include: {
      module: true,
      enseignant: true,
      filiere: true
    },
    orderBy: { heureDebut: 'asc' },
    take: 50
  })) as unknown as EmploiModel[]

  // Récupérer les enseignants, modules et filières pour le formulaire
  const enseignants = await prisma.enseignant.findMany({
    where: { schoolId: schoolId },
    select: {
      id: true,
      nom: true,
      prenom: true
    }
  })

  const modules = await prisma.module.findMany({
    where: { schoolId: schoolId },
    include: {
      filiere: true
    }
  })

  const filieres = await prisma.filiere.findMany({
    where: { schoolId: schoolId },
    select: {
      id: true,
      nom: true
    }
  })

  // Grouper par jour
  const emploisByDay = emplois.reduce((acc: Record<string, EmploiModel[]>, emploi: EmploiModel) => {
    const jours = JSON.parse(emploi.joursCours || '[]')
    jours.forEach((jour: string) => {
      if (!acc[jour]) {
        acc[jour] = []
      }
      acc[jour].push(emploi)
    })
    return acc
  }, {} as Record<string, EmploiModel[]>)

  const daysOfWeek = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Emplois du Temps</h1>
          <p className="text-muted-foreground mt-2">
            Planifiez et assignez les cours aux {school.schoolType === 'UNIVERSITY' ? 'salles' : 'classes'}
          </p>
        </div>
        <SchedulePageWrapper 
          modules={modules}
          enseignants={enseignants}
          filieres={filieres}
          schoolId={schoolId}
          schoolType={school.schoolType}
        />
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cours</p>
                <p className="text-3xl font-bold text-foreground mt-2">{emplois.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enseignants</p>
                <p className="text-3xl font-bold text-foreground mt-2">{enseignants.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Modules</p>
                <p className="text-3xl font-bold text-foreground mt-2">{modules.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Heures/Semaine</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {emplois.reduce<number>((sum, e: EmploiModel) => sum + e.vh, 0)}h
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning par jour */}
      <Card>
        <CardHeader>
          <CardTitle>Planning Hebdomadaire</CardTitle>
          <CardDescription>Vue d&apos;ensemble des cours de la semaine</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {daysOfWeek.map((day) => {
            const dayEmplois = emploisByDay[day] || []
            
            return (
              <div key={day}>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                  <Badge variant="outline" className="ml-2">{dayEmplois.length} cours</Badge>
                </h3>
                
                {dayEmplois.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ">
                    {dayEmplois.map((emploi) => (
                      <Card key={emploi.id} className="hover:shadow-lg transition-shadow bg-card2">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{emploi.module.nom}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {emploi.enseignant.nom} {emploi.enseignant.prenom}
                              </p>
                            </div>
                            <Badge variant="outline">{emploi.niveau}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{emploi.heureDebut} - {emploi.heureFin}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{emploi.salle}</span>
                          </div>
                          {emploi.filiere && (
                            <Badge className="bg-blue-100 text-blue-700">{emploi.filiere.nom}</Badge>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1">Modifier</Button>
                            <Button variant="ghost" size="sm" className="flex-1">Supprimer</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">Aucun cours planifié pour ce jour</p>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
