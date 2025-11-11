import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Award, BookOpen } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function StudentGradesPage({ 
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
      evaluations: {
        include: {
          module: true
        },
        orderBy: { date: 'desc' }
      },
      filiere: true
    }
  })

  if (!student) redirect('/login')

  // Calculer les moyennes par module
  type ModuleWithFiliere = typeof student.evaluations[0]['module']
  type EvaluationType = typeof student.evaluations[0]
  
  const moduleStats = student.evaluations.reduce((acc, evaluation) => {
    if (!acc[evaluation.moduleId]) {
      acc[evaluation.moduleId] = {
        module: evaluation.module,
        notes: [],
        totalCoef: 0
      }
    }
    acc[evaluation.moduleId].notes.push(evaluation)
    acc[evaluation.moduleId].totalCoef += evaluation.coefficient
    return acc
  }, {} as Record<string, { module: ModuleWithFiliere; notes: EvaluationType[]; totalCoef: number }>)

  const moduleAverages = Object.entries(moduleStats).map(([moduleId, data]) => {
    const weightedSum = data.notes.reduce((sum, note) => sum + (note.note * note.coefficient), 0)
    const average = data.totalCoef > 0 ? weightedSum / data.totalCoef : 0
    return {
      moduleId,
      moduleName: data.module.nom,
      average: average.toFixed(2),
      noteCount: data.notes.length,
      notes: data.notes
    }
  })

  // Moyenne générale
  const totalWeightedSum = student.evaluations.reduce((sum, evaluation) => sum + (evaluation.note * evaluation.coefficient), 0)
  const totalCoef = student.evaluations.reduce((sum, evaluation) => sum + evaluation.coefficient, 0)
  const generalAverage = totalCoef > 0 ? (totalWeightedSum / totalCoef).toFixed(2) : '0.00'

  const typeLabels: Record<string, string> = {
    DEVOIR: "Devoir",
    CONTROLE: "Contrôle",
    EXAMEN: "Examen",
    ORAL: "Oral",
    TP: "TP",
    PROJET: "Projet"
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Mes Notes</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">Consultez vos résultats et votre progression</p>
      </div>

      {/* Stats globales */}
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
              <p className="text-responsive-xs font-medium text-muted-foreground">Notes Totales</p>
              <p className="text-responsive-lg sm:text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">{student.evaluations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div>
              <p className="text-responsive-xs font-medium text-muted-foreground">Modules</p>
              <p className="text-responsive-lg sm:text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">{moduleAverages.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div>
              <p className="text-responsive-xs font-medium text-muted-foreground">Niveau</p>
              <p className="text-responsive-lg sm:text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">{student.niveau}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moyennes par module */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Moyennes par Module</CardTitle>
          <CardDescription className="text-responsive-sm">Vos résultats détaillés par matière</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moduleAverages.map((module) => {
              const avg = parseFloat(module.average)
              const percentage = (avg / 20) * 100
              const isGood = avg >= 12
              
              return (
                <div key={module.moduleId} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <BookOpen className="icon-responsive text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-responsive-sm sm:text-responsive-base font-medium text-foreground truncate">{module.moduleName}</p>
                        <p className="text-responsive-xs text-muted-foreground">{module.noteCount} notes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-responsive-lg sm:text-responsive-xl font-bold ${
                        isGood ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {module.average}/20
                      </span>
                      {isGood ? (
                        <TrendingUp className="icon-responsive text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="icon-responsive text-orange-600 dark:text-orange-400" />
                      )}
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dernières notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Dernières Notes</CardTitle>
          <CardDescription className="text-responsive-sm">Vos évaluations récentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {student.evaluations.slice(0, 10).map((evaluation) => (
              <div key={evaluation.id} className="p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground">{evaluation.module.nom}</h3>
                      <Badge variant="outline" className="text-responsive-xs">{typeLabels[evaluation.type] || evaluation.type}</Badge>
                      {evaluation.coefficient > 1 && (
                        <Badge variant="secondary" className="text-responsive-xs">Coef. {evaluation.coefficient}</Badge>
                      )}
                    </div>
                    <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">
                      {new Date(evaluation.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    {evaluation.comment && (
                      <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-2 italic">&quot;{evaluation.comment}&quot;</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <p className={`text-responsive-xl sm:text-responsive-2xl font-bold ${
                      evaluation.note >= 12 ? 'text-green-600 dark:text-green-400' : 
                      evaluation.note >= 10 ? 'text-orange-600 dark:text-orange-400' : 
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {evaluation.note}/20
                    </p>
                    {evaluation.validated && (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-responsive-xs">Validée</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
