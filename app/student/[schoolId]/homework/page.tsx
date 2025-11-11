/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { SubmitHomeworkDialog } from "@/components/homework/SubmitHomeworkDialog"

export default async function StudentHomeworkPage() {
  const user = await getAuthUser()
  if (!user || user.role !== 'STUDENT') redirect('/auth/login')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      filiere: true,
      school: true,
      submissions: {
        include: {
          homework: {
            include: {
              module: true
            }
          }
        }
      }
    }
  })

  if (!student) redirect('/auth/login')

  // Récupérer tous les devoirs de la filière
  const allHomework: any = await prisma.homework.findMany({
    where: {
      module: {
        OR: [
          { filiereId: student.filiereId },
          { isUeCommune: true }
        ]
      }
    },
    include: {
      module: true
    },
    orderBy: {
      dueDate: 'desc'
    }
  })

  // Séparer les devoirs en catégories
  const now = new Date()
  const submittedIds = student.submissions.map((s: any) => s.homeworkId)
  
  const pendingHomework = allHomework.filter((h: any) => 
    !submittedIds.includes(h.id) && h.dueDate >= now
  )
  
  const overdueHomework = allHomework.filter((h: any) => 
    !submittedIds.includes(h.id) && h.dueDate < now
  )
  
  const submittedHomework = allHomework.filter((h: any) => 
    submittedIds.includes(h.id)
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-orange-600" />
      case 'overdue': return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'submitted': return <CheckCircle className="h-5 w-5 text-green-600" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">À faire</Badge>
      case 'overdue': return <Badge variant="destructive">En retard</Badge>
      case 'submitted': return <Badge className="bg-green-600">Rendu</Badge>
      default: return <Badge>Inconnu</Badge>
    }
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Mes Devoirs</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">Gérez vos devoirs et soumissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">À faire</p>
                <p className="text-responsive-lg sm:text-responsive-xl font-bold text-orange-600 mt-1 sm:mt-2">{pendingHomework.length}</p>
              </div>
              <div className="bg-orange-100 p-2 sm:p-3 rounded-xl">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">En retard</p>
                <p className="text-responsive-lg sm:text-responsive-xl font-bold text-red-600 dark:text-red-400 mt-1 sm:mt-2">{overdueHomework.length}</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-2 sm:p-3 rounded-xl">
                <AlertCircle className="icon-responsive text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Rendus</p>
                <p className="text-responsive-lg sm:text-responsive-xl font-bold text-green-600 dark:text-green-400 mt-1 sm:mt-2">{submittedHomework.length}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-xl">
                <CheckCircle className="icon-responsive text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div>
              <p className="text-responsive-xs font-medium text-muted-foreground">Total</p>
              <p className="text-responsive-lg sm:text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">{allHomework.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devoirs en retard */}
      {overdueHomework.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-responsive-lg text-red-600 dark:text-red-400">Devoirs en Retard</CardTitle>
            <CardDescription className="text-responsive-sm">Ces devoirs ont dépassé leur date limite</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueHomework.map((homework: any) => (
                <div key={homework.id} className="p-3 sm:p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getStatusIcon('overdue')}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground">{homework.title}</h3>
                        <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-1">{homework.module.nom}</p>
                        {homework.description && (
                          <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-2">{homework.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-responsive-xs sm:text-responsive-sm text-red-600 dark:text-red-400 font-medium">
                            Échéance: {new Date(homework.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge('overdue')}
                      <SubmitHomeworkDialog
                        homeworkId={homework.id}
                        homeworkTitle={homework.title}
                        moduleName={homework.module.nom}
                        dueDate={homework.dueDate}
                        isOverdue={true}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Devoirs à faire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Devoirs à Faire</CardTitle>
          <CardDescription className="text-responsive-sm">Devoirs à rendre prochainement</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingHomework.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 mb-4" />
              <h3 className="text-responsive-base sm:text-responsive-lg font-semibold text-foreground mb-2">Aucun devoir en attente</h3>
              <p className="text-responsive-sm text-muted-foreground">Vous êtes à jour !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingHomework.map((homework: any) => (
                <div key={homework.id} className="p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getStatusIcon('pending')}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground">{homework.title}</h3>
                        <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-1">{homework.module.nom}</p>
                        {homework.description && (
                          <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-2">{homework.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">
                            Échéance: {new Date(homework.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge('pending')}
                      <SubmitHomeworkDialog
                        homeworkId={homework.id}
                        homeworkTitle={homework.title}
                        moduleName={homework.module.nom}
                        dueDate={homework.dueDate}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Devoirs rendus */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Devoirs Rendus</CardTitle>
          <CardDescription className="text-responsive-sm">Vos soumissions passées</CardDescription>
        </CardHeader>
        <CardContent>
          {submittedHomework.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-responsive-base sm:text-responsive-lg font-semibold text-foreground mb-2">Aucun devoir rendu</h3>
              <p className="text-responsive-sm text-muted-foreground">Vos soumissions apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submittedHomework.map((homework: any) => {
                const submission = student.submissions.find(s => s.homeworkId === homework.id)
                return (
                  <div key={homework.id} className="p-3 sm:p-4 border border-border rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getStatusIcon('submitted')}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground">{homework.title}</h3>
                          <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-1">{homework.module.nom}</p>
                          {submission && submission.submittedAt && (
                            <p className="text-responsive-xs sm:text-responsive-sm text-green-600 dark:text-green-400 mt-2">
                              Rendu le {new Date(submission.submittedAt).toLocaleDateString('fr-FR')}   
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge('submitted')}
                        {submission?.grade && (
                          <Badge className="bg-blue-600 dark:bg-blue-700 text-responsive-xs">Note: {submission.grade}/20</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
