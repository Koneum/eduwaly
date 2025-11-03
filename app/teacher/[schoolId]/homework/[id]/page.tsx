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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <Link href={`/teacher/${schoolId}/homework`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux devoirs
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{homework.title}</h1>
              <Badge variant="outline">{homework.type}</Badge>
              {isOverdue && <Badge variant="destructive">En retard</Badge>}
            </div>
            <p className="text-muted-foreground">
              {homework.module.nom} - {homework.module.filiere?.nom || 'Sans filière'}
            </p>
          </div>
        </div>
      </div>

      {/* Détails du devoir */}
      <Card>
        <CardHeader>
          <CardTitle>Détails du devoir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {homework.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{homework.description}</p>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Date limite: {new Date(homework.dueDate).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Soumis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{submittedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Notés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{gradedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Soumissions */}
      <Card>
        <CardHeader>
          <CardTitle>Soumissions des étudiants</CardTitle>
          <CardDescription>
            {homework.submissions.length} soumission(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {homework.submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune soumission pour le moment
              </p>
            ) : (
              homework.submissions.map((submission) => (
                <div 
                  key={submission.id} 
                  className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-primary/10 text-primary font-bold text-lg w-12 h-12 rounded-full flex items-center justify-center">
                        {submission.student.user?.name?.charAt(0) || 'E'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {submission.student.user?.name || 'Étudiant'}
                          </h3>
                          <Badge variant="outline">
                            {submission.student.studentNumber}
                          </Badge>
                          {submission.status === 'SUBMITTED' && (
                            <Badge className="bg-green-600">Soumis</Badge>
                          )}
                          {submission.status === 'GRADED' && (
                            <Badge className="bg-blue-600">Noté</Badge>
                          )}
                          {submission.status === 'PENDING' && (
                            <Badge variant="secondary">En attente</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {submission.student.filiere?.nom || 'Sans filière'} - {submission.student.niveau}
                        </p>
                        {submission.submittedAt && (
                          <p className="text-xs text-muted-foreground">
                            Soumis le {new Date(submission.submittedAt).toLocaleDateString('fr-FR')} à{' '}
                            {new Date(submission.submittedAt).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        )}
                        {submission.content && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {submission.content}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {submission.grade !== null && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{submission.grade}/20</p>
                          <p className="text-xs text-muted-foreground">Note</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {submission.fileUrl && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </Button>
                        )}
                        <Button size="sm">
                          {submission.status === 'GRADED' ? 'Modifier note' : 'Noter'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {submission.feedback && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Commentaire:</p>
                          <p className="text-sm text-muted-foreground">{submission.feedback}</p>
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
