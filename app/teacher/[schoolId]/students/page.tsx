import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Mail } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"

export default async function TeacherStudentsPage({ 
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
    },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          schoolType: true
        }
      }
    }
  })

  if (!teacher) {
    return <div className="p-8">Enseignant non trouvé</div>
  }

  const isHighSchool = teacher.school.schoolType === 'HIGH_SCHOOL'

  // Récupérer les étudiants de l'école
  const students = await prisma.student.findMany({
    where: {
      schoolId: schoolId
    },
    include: {
      user: true,
      filiere: true
    },
    take: 20,
    orderBy: { 
      user: {
        name: 'asc'
      }
    }
  })

  // Compter les filières uniques
  const uniqueFilieres = new Set(students.map(s => s.filiereId).filter(Boolean))
  const filiereCount = uniqueFilieres.size

  // Calculer le taux d'inscription
  const enrolledCount = students.filter(s => s.isEnrolled).length
  const enrollmentRate = students.length > 0 
    ? Math.round((enrolledCount / students.length) * 100) 
    : 0

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">Mes Étudiants</h1>
        <p className="text-responsive-sm text-muted-foreground mt-1 sm:mt-2">Liste et gestion de vos étudiants</p>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-responsive-base sm:text-responsive-lg">Liste des Étudiants</CardTitle>
              <CardDescription className="text-responsive-xs sm:text-responsive-sm">{students.length} étudiants au total</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-8 sm:pl-9 text-responsive-xs sm:text-responsive-sm" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="space-y-2 sm:space-y-3">
            {students.map((student) => (
              <div key={student.id} className="p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1">
                    <div className="bg-primary/10 text-primary font-bold text-responsive-sm sm:text-responsive-base w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0">
                      {student.user?.name?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-responsive-sm sm:text-responsive-base text-foreground truncate">{student.user?.name || 'Étudiant'}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mt-1">
                        <p className="text-responsive-xs text-muted-foreground">{student.studentNumber}</p>
                        <Badge variant="outline" className="text-[10px] sm:text-responsive-xs">{student.filiere?.nom || 'Non assigné'}</Badge>
                        <Badge variant="secondary" className="text-[10px] sm:text-responsive-xs">{student.niveau}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-responsive-xs sm:text-responsive-sm">
                      <span className="hidden sm:inline">Voir profil</span>
                      <span className="sm:hidden">Profil</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-responsive-xs sm:text-responsive-sm font-medium text-muted-foreground">Total Étudiants</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{students.length}</p>
            <p className="text-[10px] sm:text-responsive-xs text-muted-foreground mt-1">
              {enrolledCount} inscrits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-responsive-xs sm:text-responsive-sm font-medium text-muted-foreground">
              {isHighSchool ? 'Classes' : 'Filières'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{filiereCount}</p>
            <p className="text-[10px] sm:text-responsive-xs text-muted-foreground mt-1">
              {isHighSchool ? 'Classes différentes' : 'Filières différentes'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-responsive-xs sm:text-responsive-sm font-medium text-muted-foreground">Taux d&apos;inscription</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-green-600">{enrollmentRate}%</p>
            <p className="text-[10px] sm:text-responsive-xs text-muted-foreground mt-1">
              {enrolledCount}/{students.length} étudiants
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
