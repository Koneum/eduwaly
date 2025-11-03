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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes Notes</h1>
        <p className="text-muted-foreground mt-2">Consultez vos résultats et votre progression</p>
      </div>

      {/* Stats globales */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Moyenne Générale</p>
                <p className="text-3xl font-bold text-foreground mt-2">{generalAverage}/20</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes Totales</p>
              <p className="text-3xl font-bold text-foreground mt-2">{student.evaluations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Modules</p>
              <p className="text-3xl font-bold text-foreground mt-2">{moduleAverages.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Niveau</p>
              <p className="text-3xl font-bold text-foreground mt-2">{student.niveau}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moyennes par module */}
      <Card>
        <CardHeader>
          <CardTitle>Moyennes par Module</CardTitle>
          <CardDescription>Vos résultats détaillés par matière</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moduleAverages.map((module) => {
              const avg = parseFloat(module.average)
              const percentage = (avg / 20) * 100
              const isGood = avg >= 12
              
              return (
                <div key={module.moduleId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{module.moduleName}</p>
                        <p className="text-sm text-muted-foreground">{module.noteCount} notes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${isGood ? 'text-green-600' : 'text-orange-600'}`}>
                        {module.average}/20
                      </span>
                      {isGood ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-orange-600" />
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
          <CardTitle>Dernières Notes</CardTitle>
          <CardDescription>Vos évaluations récentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {student.evaluations.slice(0, 10).map((evaluation) => (
              <div key={evaluation.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{evaluation.module.nom}</h3>
                      <Badge variant="outline">{typeLabels[evaluation.type] || evaluation.type}</Badge>
                      {evaluation.coefficient > 1 && (
                        <Badge variant="secondary">Coef. {evaluation.coefficient}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(evaluation.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    {evaluation.comment && (
                      <p className="text-sm text-muted-foreground mt-2 italic">&quot;{evaluation.comment}&quot;</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${
                      evaluation.note >= 12 ? 'text-green-600' : 
                      evaluation.note >= 10 ? 'text-orange-600' : 
                      'text-red-600'
                    }`}>
                      {evaluation.note}/20
                    </p>
                    {evaluation.validated && (
                      <Badge className="bg-green-100 text-green-700 mt-2">Validée</Badge>
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
