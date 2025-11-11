import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"
import { ArrowLeft, Calendar, Download, FileText } from "lucide-react"
import Link from "next/link"

export default async function HomeworkDetailPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string; id: string }>
}) {
  const currentUser = await getAuthUser()
  const { schoolId, id } = await params
  
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

  // Récupérer le devoir avec toutes les soumissions
  const homework = await prisma.homework.findUnique({
    where: { id },
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
              user: true,
              filiere: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      }
    }
  })

  if (!homework) {
    return <div className="p-8">Devoir non trouvé</div>
  }

  const isOverdue = new Date(homework.dueDate) < new Date()
  const submittedCount = homework.submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED').length
  const gradedCount = homework.submissions.filter(s => s.status === 'GRADED').length
  const pendingCount = homework.submissions.filter(s => s.status === 'PENDING').length

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Link href={`/teacher/${schoolId}/homework`}>
          <Button variant="ghost" size="sm" className="mb-3 sm:mb-4 text-responsive-xs sm:text-responsive-sm">
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Retour aux devoirs
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <h1 className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{homework.title}</h1>
              <Badge variant="outline" className="text-[10px] sm:text-responsive-xs">{homework.type}</Badge>
              {isOverdue && <Badge variant="destructive" className="text-[10px] sm:text-responsive-xs">En retard</Badge>}
            </div>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">
              {homework.module.nom} - {homework.module.filiere?.nom || 'Sans filière'}
            </p>
          </div>
        </div>
      </div>

      {/* Détails du devoir */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-responsive-base sm:text-responsive-lg">Détails du devoir</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 sm:space-y-4">
          {homework.description && (
            <div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-responsive-sm">Description</h3>
              <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">{homework.description}</p>
            </div>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2 text-responsive-xs sm:text-responsive-sm">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span className="truncate">Date limite: {new Date(homework.dueDate).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-responsive-xs sm:text-responsive-sm font-medium text-muted-foreground">Soumis</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-green-600">{submittedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-responsive-xs sm:text-responsive-sm font-medium text-muted-foreground">Notés</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-blue-600">{gradedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-responsive-xs sm:text-responsive-sm font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-orange-600">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Soumissions */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-responsive-base sm:text-responsive-lg">Soumissions des étudiants</CardTitle>
          <CardDescription className="text-responsive-xs sm:text-responsive-sm">
            {homework.submissions.length} soumission(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="space-y-2 sm:space-y-3">
            {homework.submissions.length === 0 ? (
              <p className="text-center text-responsive-sm text-muted-foreground py-6 sm:py-8">
                Aucune soumission pour le moment
              </p>
            ) : (
              homework.submissions.map((submission) => (
                <div 
                  key={submission.id} 
                  className="p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-2 sm:gap-3 md:gap-4 flex-1">
                      <div className="bg-primary/10 text-primary font-bold text-responsive-sm sm:text-responsive-base w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0">
                        {submission.student.user?.name?.charAt(0) || 'E'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <h3 className="font-semibold text-responsive-sm sm:text-responsive-base text-foreground">
                            {submission.student.user?.name || 'Étudiant'}
                          </h3>
                          <Badge variant="outline" className="text-[10px] sm:text-responsive-xs">
                            {submission.student.studentNumber}
                          </Badge>
                          {submission.status === 'SUBMITTED' && (
                            <Badge className="bg-green-600 text-[10px] sm:text-responsive-xs">Soumis</Badge>
                          )}
                          {submission.status === 'GRADED' && (
                            <Badge className="bg-blue-600 text-[10px] sm:text-responsive-xs">Noté</Badge>
                          )}
                          {submission.status === 'PENDING' && (
                            <Badge variant="secondary" className="text-[10px] sm:text-responsive-xs">En attente</Badge>
                          )}
                        </div>
                        <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mb-1 sm:mb-2">
                          {submission.student.filiere?.nom || 'Sans filière'} - {submission.student.niveau}
                        </p>
                        {submission.submittedAt && (
                          <p className="text-[10px] sm:text-responsive-xs text-muted-foreground">
                            Soumis le {new Date(submission.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à{' '}
                            {new Date(submission.submittedAt).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        )}
                        {submission.content && (
                          <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-1 sm:mt-2 line-clamp-2">
                            {submission.content}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 sm:gap-3">
                      {submission.grade !== null && (
                        <div className="text-center lg:text-right">
                          <p className="text-responsive-lg sm:text-responsive-xl font-bold text-primary">{submission.grade}/20</p>
                          <p className="text-[10px] sm:text-responsive-xs text-muted-foreground">Note</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {submission.fileUrl && (
                          <Button size="sm" variant="outline" className="text-responsive-xs">
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Télécharger</span>
                            <span className="sm:hidden">DL</span>
                          </Button>
                        )}
                        <Button size="sm" className="text-responsive-xs">
                          {submission.status === 'GRADED' ? 'Modifier' : 'Noter'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {submission.feedback && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-responsive-xs sm:text-responsive-sm font-medium">Commentaire:</p>
                          <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">{submission.feedback}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
