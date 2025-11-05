import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Download } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

// Local types to avoid implicit `any` in callbacks
type DocRow = { id: string; createdAt: string | Date; title: string; fileUrl: string; module?: { nom?: string } }
type HomeworkRow = { id: string; dueDate: string | Date }
type TeacherLite = { titre?: string | null; prenom?: string | null; nom?: string | null }
type ModuleRow = {
  id: string
  nom: string
  type: string
  emplois: Array<{ enseignant?: TeacherLite }>
  documents: DocRow[]
  homework: HomeworkRow[]
}
type EvalRow = { moduleId: string; note: number; coefficient: number; type?: string }
type StudentRow = { id: string; schoolId: string; filiereId?: string | null; evaluations: EvalRow[] }

export default async function StudentCoursesPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  if (!user || user.role !== 'STUDENT') redirect('/auth/login')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      filiere: true,
      school: true,
      evaluations: {
        include: {
          module: true
        }
      }
    }
  })

  if (!student) redirect('/auth/login')

  // Récupérer les modules de la filière de l'étudiant
  const modules: ModuleRow[] = await prisma.module.findMany({
    where: {
      schoolId: student.schoolId,
      OR: [
        { filiereId: student.filiereId },
        { isUeCommune: true }
      ]
    },
    include: {
      emplois: {
        where: {
          niveau: student.niveau
        },
        include: {
          enseignant: true
        },
        take: 1
      },
      documents: true,
      homework: true
    }
  })

  // Calculer les statistiques pour chaque module
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-cyan-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500"]
  
  const courses = modules.map((module: ModuleRow, index: number) => {
    // Calculer la moyenne pour ce module
    const moduleEvaluations: EvalRow[] = student.evaluations.filter((e: EvalRow) => e.moduleId === module.id)
    const totalWeighted = moduleEvaluations.reduce((sum: number, e: EvalRow) => sum + (e.note * e.coefficient), 0)
    const totalCoef = moduleEvaluations.reduce((sum: number, e: EvalRow) => sum + e.coefficient, 0)
    const average = totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(1) : '0'

    // Calculer la progression (pourcentage de devoirs rendus)
  const moduleHomework: HomeworkRow[] = module.homework.filter((h: HomeworkRow) => new Date(h.dueDate) >= new Date())
  const submittedHomework = student.evaluations.filter((e: EvalRow) => e.moduleId === module.id && e.type === 'DEVOIR')
  const progress = moduleHomework.length > 0 ? Math.round((submittedHomework.length / moduleHomework.length) * 100) : 0

    // Enseignant principal
    const teacher = module.emplois[0]?.enseignant
      ? `${module.emplois[0].enseignant.titre ?? ''} ${module.emplois[0].enseignant.prenom ?? ''} ${module.emplois[0].enseignant.nom ?? ''}`.trim()
      : 'Non assigné'

    return {
      id: module.id,
      name: module.nom,
      teacher,
      average: Number(average),
      progress,
      resources: module.documents.length,
      color: colors[index % colors.length],
      type: module.type
    }
  })

  // Récupérer les documents récents
  const recentDocuments: DocRow[] = await prisma.document.findMany({
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
      createdAt: 'desc'
    },
    take: 5
  })

  // Calculer le temps écoulé pour chaque document
  /* eslint-disable-next-line react-hooks/purity */
  const now = Date.now()
  const documentsWithTime = (recentDocuments as DocRow[]).map((doc: DocRow) => {
    const timeAgo = Math.floor((now - new Date(doc.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    const dateText = timeAgo === 0 ? "Aujourd'hui" : timeAgo === 1 ? "Hier" : `Il y a ${timeAgo}j`
    return { ...doc, dateText }
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes Cours</h1>
        <p className="text-muted-foreground mt-2">Consultez vos matières et ressources</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`w-1 h-12 ${course.color} rounded-full mb-3`} />
              <CardTitle className="text-lg">{course.name}</CardTitle>
              <CardDescription>{course.teacher}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Moyenne</span>
                  <span className="text-2xl font-bold text-foreground">{course.average}/20</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium text-foreground">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{course.resources} ressources</span>
                </div>
                <Button variant="ghost" size="sm">
                  Voir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ressources Récentes</CardTitle>
          <CardDescription>Documents et supports de cours disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          {documentsWithTime.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucune ressource disponible</h3>
              <p className="text-muted-foreground">Les documents de cours seront ajoutés par vos enseignants</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documentsWithTime.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{doc.module?.nom || 'Module'}</Badge>
                        <span className="text-xs text-muted-foreground">{doc.dateText}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
