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
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">Devoirs & Travaux</h1>
        <p className="text-responsive-sm text-muted-foreground mt-1 sm:mt-2">Gérez les devoirs et consultez les soumissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-responsive-xs sm:text-responsive-sm font-medium text-muted-foreground">Total Devoirs</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{totalHomework}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-responsive-xs sm:text-responsive-sm font-medium text-muted-foreground">En cours</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-blue-600">{pendingHomework}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-responsive-xs sm:text-responsive-sm font-medium text-muted-foreground">En retard</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-red-600">{overdueHomework}</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des devoirs */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-responsive-base sm:text-responsive-lg">Tous les devoirs</CardTitle>
          <CardDescription className="text-responsive-xs sm:text-responsive-sm">Cliquez sur un devoir pour voir les soumissions</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {homework.length === 0 ? (
              <p className="text-center text-responsive-sm text-muted-foreground py-6 sm:py-8">
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
                    <div className="p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-2 sm:gap-3 md:gap-4 flex-1">
                          <div className="bg-primary/10 p-2 sm:p-3 rounded-lg shrink-0">
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                              <h3 className="font-semibold text-responsive-sm sm:text-responsive-base text-foreground">{hw.title}</h3>
                              <Badge variant="outline" className="text-[10px] sm:text-responsive-xs">{hw.type}</Badge>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-[10px] sm:text-responsive-xs">En retard</Badge>
                              )}
                            </div>
                            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mb-1 sm:mb-2">
                              {hw.module.nom} - {hw.module.filiere?.nom || 'Sans filière'}
                            </p>
                            {hw.description && (
                              <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground line-clamp-2">
                                {hw.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-responsive-xs sm:text-responsive-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="truncate">
                                  {new Date(hw.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex lg:flex-col gap-3 sm:gap-4 lg:gap-2 lg:text-right">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                            <span className="text-responsive-xs sm:text-responsive-sm font-medium whitespace-nowrap">
                              {submittedCount} soumis
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                            <span className="text-responsive-xs sm:text-responsive-sm font-medium whitespace-nowrap">
                              {gradedCount} notés
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                            <span className="text-responsive-xs sm:text-responsive-sm font-medium whitespace-nowrap">
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
