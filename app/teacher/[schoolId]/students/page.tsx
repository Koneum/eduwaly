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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes Étudiants</h1>
        <p className="text-muted-foreground mt-2">Liste et gestion de vos étudiants</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des Étudiants</CardTitle>
              <CardDescription>{students.length} étudiants au total</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-9 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary font-bold text-lg w-12 h-12 rounded-full flex items-center justify-center">
                      {student.user?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{student.user?.name || 'Étudiant'}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-muted-foreground">{student.studentNumber}</p>
                        <Badge variant="outline">{student.filiere?.nom || 'Non assigné'}</Badge>
                        <Badge variant="secondary">{student.niveau}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      Voir profil
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Étudiants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{students.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {enrolledCount} inscrits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isHighSchool ? 'Classes' : 'Filières'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{filiereCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isHighSchool ? 'Classes différentes' : 'Filières différentes'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux d'inscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{enrollmentRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {enrolledCount}/{students.length} étudiants
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
