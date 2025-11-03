import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"
import { BookOpen, Calendar, CheckCircle2, Clock, XCircle } from "lucide-react"
import Link from "next/link"

export default async function TeacherHomeworkPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }>
}) {
  const currentUser = await getAuthUser()
  const { schoolId } = await params
  
  if (!currentUser) {
    redirect('/login')
  }

  const teacher = await prisma.enseignant.findFirst({
    where: {
      userId: currentUser.id,
      schoolId: schoolId
    }
  })

  if (!teacher) {
    return <div className="p-8">Enseignant non trouvé</div>
  }

  // Récupérer les devoirs créés par l'enseignant
  const homework = await prisma.homework.findMany({
    where: {
      module: {
        schoolId: schoolId
      }
    },
    include: {
      module: {
        include: {
          filiere: true
        }
      },
      submissions: {
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      }
    },
    orderBy: { dueDate: 'desc' }
  })

  // Calculer les statistiques
  const totalHomework = homework.length
  const pendingHomework = homework.filter(h => new Date(h.dueDate) > new Date()).length
  const overdueHomework = homework.filter(h => new Date(h.dueDate) < new Date()).length

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Devoirs & Travaux</h1>
        <p className="text-muted-foreground mt-2">Gérez les devoirs et consultez les soumissions</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Devoirs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalHomework}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{pendingHomework}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">En retard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{overdueHomework}</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des devoirs */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les devoirs</CardTitle>
          <CardDescription>Cliquez sur un devoir pour voir les soumissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {homework.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun devoir pour le moment
              </p>
            ) : (
              homework.map((hw) => {
                const isOverdue = new Date(hw.dueDate) < new Date()
                const submittedCount = hw.submissions.filter(s => s.status === 'SUBMITTED').length
                const gradedCount = hw.submissions.filter(s => s.status === 'GRADED').length
                const totalSubmissions = hw.submissions.length

                return (
                  <Link 
                    key={hw.id} 
                    href={`/teacher/${schoolId}/homework/${hw.id}`}
                  >
                    <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{hw.title}</h3>
                              <Badge variant="outline">{hw.type}</Badge>
                              {isOverdue && (
                                <Badge variant="destructive">En retard</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {hw.module.nom} - {hw.module.filiere?.nom || 'Sans filière'}
                            </p>
                            {hw.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {hw.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Date limite: {new Date(hw.dueDate).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">
                              {submittedCount} soumis
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">
                              {gradedCount} notés
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {totalSubmissions - submittedCount} en attente
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
