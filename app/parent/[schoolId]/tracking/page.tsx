import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Award, Calendar, AlertTriangle } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function ParentTrackingPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }>
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  if (!user || user.role !== 'PARENT') redirect('/login')

  const parent = await prisma.parent.findUnique({
    where: { userId: user.id },
    include: {
      students: {
        include: {
          user: true,
          filiere: true,
          evaluations: {
            include: { module: true },
            orderBy: { date: 'desc' }
          },
          absences: {
            orderBy: { date: 'desc' }
          }
        }
      }
    }
  })

  if (!parent) redirect('/login')

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Suivi Scolaire</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">Notes et absences de vos enfants</p>
      </div>

      <Tabs defaultValue={parent.students[0]?.id} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: parent.students.length <= 2 ? `repeat(${parent.students.length}, 1fr)` : 'repeat(auto-fit, minmax(120px, 1fr))' }}>
          {parent.students.map(student => (
            <TabsTrigger key={student.id} value={student.id}>
              {student.user?.name || 'Étudiant'}
            </TabsTrigger>
          ))}
        </TabsList>

        {parent.students.map(student => {
          const totalEvals = student.evaluations.length
          const totalAbsences = student.absences.length
          const unjustifiedAbsences = student.absences.filter(a => !a.justified).length
          
          const totalWeightedSum = student.evaluations.reduce((sum, e) => sum + (e.note * e.coefficient), 0)
          const totalCoef = student.evaluations.reduce((sum, e) => sum + e.coefficient, 0)
          const generalAverage = totalCoef > 0 ? (totalWeightedSum / totalCoef).toFixed(2) : '0.00'
          const attendanceRate = totalAbsences > 0 ? ((1 - (totalAbsences / 100)) * 100).toFixed(1) : '100'

          return (
            <TabsContent key={student.id} value={student.id} className="space-y-4 sm:space-y-6">
              {/* Stats de l'enfant */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <Card>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-responsive-xs font-medium text-muted-foreground">Moyenne Générale</p>
                        <p className="text-responsive-lg sm:text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">{generalAverage}/20</p>
                      </div>
                      <div className="bg-blue-100 p-2 sm:p-3 rounded-xl">
                        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div>
                      <p className="text-responsive-xs font-medium text-muted-foreground">Présence</p>
                      <p className="text-responsive-lg sm:text-responsive-xl font-bold text-green-600 mt-1 sm:mt-2">{attendanceRate}%</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div>
                      <p className="text-responsive-xs font-medium text-muted-foreground">Notes</p>
                      <p className="text-responsive-lg sm:text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">{totalEvals}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div>
                      <p className="text-responsive-xs font-medium text-muted-foreground">Absences</p>
                      <p className={`text-responsive-lg sm:text-responsive-xl font-bold mt-1 sm:mt-2 ${unjustifiedAbsences > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {totalAbsences}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alertes */}
              {unjustifiedAbsences > 3 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900">Attention aux absences</p>
                        <p className="text-sm text-orange-700">
                          {student.user?.name || 'Étudiant'} a {unjustifiedAbsences} absences non justifiées
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Notes récentes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notes Récentes</CardTitle>
                    <CardDescription>Dernières évaluations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {student.evaluations.slice(0, 5).map(evaluation => (
                        <div key={evaluation.id} className="p-3 border border-border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{evaluation.module.nom}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(evaluation.date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${
                                evaluation.note >= 12 ? 'text-green-600' : 
                                evaluation.note >= 10 ? 'text-orange-600' : 
                                'text-red-600'
                              }`}>
                                {evaluation.note}/20
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Absences récentes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Absences Récentes</CardTitle>
                    <CardDescription>Historique de présence</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {student.absences.slice(0, 5).map(absence => (
                        <div key={absence.id} className="p-3 border border-border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {new Date(absence.date).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long'
                                  })}
                                </p>
                                {absence.justification && (
                                  <p className="text-sm text-muted-foreground italic">
                                    {absence.justification}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge variant={absence.justified ? "default" : "destructive"}>
                              {absence.justified ? 'Justifiée' : 'Non justifiée'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {student.absences.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">Aucune absence</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progression */}
              <Card>
                <CardHeader>
                  <CardTitle>Progression Académique</CardTitle>
                  <CardDescription>Performance globale</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Moyenne générale</span>
                      <span className="text-sm font-medium text-blue-600">{generalAverage}/20</span>
                    </div>
                    <Progress value={(parseFloat(generalAverage) / 20) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Taux de présence</span>
                      <span className="text-sm font-medium text-green-600">{attendanceRate}%</span>
                    </div>
                    <Progress value={parseFloat(attendanceRate)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
