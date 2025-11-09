import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Calendar, AlertTriangle } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function StudentAbsencesPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }>
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  if (!user || user.role !== 'STUDENT') redirect('/login')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      absences: {
        orderBy: { date: 'desc' }
      }
    }
  })

  if (!student) redirect('/login')

  const totalAbsences = student.absences.length
  const justifiedAbsences = student.absences.filter(a => a.justified).length
  const unjustifiedAbsences = totalAbsences - justifiedAbsences
  const attendanceRate = totalAbsences > 0 ? ((1 - (totalAbsences / 100)) * 100).toFixed(1) : '100'

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Mes Absences</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">Consultez votre historique de présence</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Taux de Présence</p>
                <p className="text-responsive-lg sm:text-responsive-xl font-bold text-green-600 mt-1 sm:mt-2">{attendanceRate}%</p>
              </div>
              <div className="bg-green-100 p-2 sm:p-3 rounded-xl">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Absences</p>
              <p className="text-3xl font-bold text-foreground mt-2">{totalAbsences}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Justifiées</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{justifiedAbsences}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Non Justifiées</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{unjustifiedAbsences}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de progression */}
      <Card>
        <CardHeader>
          <CardTitle>Assiduité</CardTitle>
          <CardDescription>Votre taux de présence global</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Présence</span>
              <span className="text-sm font-medium text-green-600">{attendanceRate}%</span>
            </div>
            <Progress value={parseFloat(attendanceRate)} className="h-3" />
            {unjustifiedAbsences > 5 && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <p className="text-sm text-orange-700">
                  Attention : Vous avez {unjustifiedAbsences} absences non justifiées
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des absences */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Absences</CardTitle>
          <CardDescription>Liste de toutes vos absences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {student.absences.map((absence) => (
              <div key={absence.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${absence.justified ? 'bg-green-100' : 'bg-orange-100'}`}>
                      <Calendar className={`h-5 w-5 ${absence.justified ? 'text-green-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {new Date(absence.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      {absence.justification && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          &quot;{absence.justification}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {absence.justified ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Justifiée
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Non justifiée
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {student.absences.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucune absence</h3>
                <p className="text-muted-foreground">Vous avez une présence parfaite !</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
