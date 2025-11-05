import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, TrendingUp, CheckCircle2 } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

type EvaluationRow = { note: number | null; coefficient: number; moduleId: string }
type AttendanceRow = { status: string }
type StudentRow = {
  id: string
  studentNumber: string
  niveau: string
  filiere?: { nom?: string } | null
  user?: { name?: string | null } | null
  evaluations: EvaluationRow[]
  attendances: AttendanceRow[]
}
type ParentRow = { id: string; students: StudentRow[] }

export default async function ParentChildrenPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  if (!user || user.role !== 'PARENT') redirect('/auth/login')

  const parent = await prisma.parent.findUnique({
    where: { userId: user.id },
    include: {
      students: {
        include: {
          user: true,
          filiere: true,
          evaluations: {
            select: {
              note: true,
              coefficient: true,
              moduleId: true
            }
          },
          attendances: {
            select: {
              status: true
            }
          }
        }
      }
    }
  })

  if (!parent) redirect('/auth/login')

  // Calculer les statistiques globales
  const parentTyped = parent as ParentRow
  const allEvaluations = parentTyped.students.flatMap((s: StudentRow) => s.evaluations)
  const allAttendances = parentTyped.students.flatMap((s: StudentRow) => s.attendances)
  
  const globalAverage = allEvaluations.length > 0
    ? (allEvaluations.reduce((sum: number, e: EvaluationRow) => sum + ((e.note ?? 0) * e.coefficient), 0) / 
       allEvaluations.reduce((sum: number, e: EvaluationRow) => sum + e.coefficient, 0)).toFixed(1)
    : '0.0'
  
  const globalAttendanceRate = allAttendances.length > 0
    ? ((allAttendances.filter((a: AttendanceRow) => a.status === 'PRESENT').length / allAttendances.length) * 100).toFixed(1)
    : '100'

  // Compter les modules uniques
  const uniqueModules = new Set(allEvaluations.map((e: EvaluationRow) => e.moduleId)).size

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes Enfants</h1>
        <p className="text-muted-foreground mt-2">Suivez la scolarité de vos enfants</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
  {parentTyped.students.map((student: StudentRow) => {
          // Calculer les statistiques par étudiant
          const studentAverage = student.evaluations.length > 0
            ? (student.evaluations.reduce((sum: number, e: EvaluationRow) => sum + ((e.note ?? 0) * e.coefficient), 0) / 
               student.evaluations.reduce((sum: number, e: EvaluationRow) => sum + e.coefficient, 0)).toFixed(1)
            : '0.0'
          
          const studentAttendanceRate = student.attendances.length > 0
            ? ((student.attendances.filter((a: AttendanceRow) => a.status === 'PRESENT').length / student.attendances.length) * 100).toFixed(0)
            : '100'
          
          const studentModules = new Set(student.evaluations.map((e: EvaluationRow) => e.moduleId)).size
          const totalModules = studentModules || 1
          const progression = ((studentModules / totalModules) * 100).toFixed(0)

          return (
          <Card key={student.id} className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary font-bold text-lg w-12 h-12 rounded-full flex items-center justify-center">
                    {student.user?.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle>{student.user?.name}</CardTitle>
                    <CardDescription>{student.filiere?.nom || 'Non assigné'} • {student.niveau}</CardDescription>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Actif
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-muted-foreground">Moyenne</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{studentAverage}/20</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-muted-foreground">Présence</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{studentAttendanceRate}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progression annuelle</span>
                  <span className="font-medium text-foreground">{progression}%</span>
                </div>
                <Progress value={parseInt(progression)} className="h-2" />
              </div>

              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Numéro étudiant</span>
                  <span className="font-medium text-foreground">{student.studentNumber}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Niveau</span>
                  <span className="font-medium text-foreground">{student.niveau}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques Globales</CardTitle>
          <CardDescription>Vue d&apos;ensemble de tous vos enfants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{parent.students.length}</p>
              <p className="text-sm text-muted-foreground">Enfants</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{globalAverage}/20</p>
              <p className="text-sm text-muted-foreground">Moyenne générale</p>
            </div>
            <div className="text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{globalAttendanceRate}%</p>
              <p className="text-sm text-muted-foreground">Taux de présence</p>
            </div>
            <div className="text-center">
              <div className="h-8 w-8 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">{uniqueModules}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{uniqueModules}</p>
              <p className="text-sm text-muted-foreground">Matières</p>
            </div>          </div>
        </CardContent>
      </Card>
    </div>
  )
}
