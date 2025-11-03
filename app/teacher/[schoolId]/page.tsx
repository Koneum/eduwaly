import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Calendar, TrendingUp } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils';
import { redirect } from "next/navigation"
import Link from "next/link"
import QuickActions from "@/components/teacher/quick-actions"
import ModuleActions from "@/components/teacher/module-actions";

export default async function TeacherDashboard({ 
  params 
}: { 
  params: Promise<{ schoolId: string }>
}) {
  const currentUser = await getAuthUser()
  const { schoolId } = await params
  
  if (!currentUser) {
    redirect('/login')
  }

  // Récupérer l'enseignant connecté
  const teacher = await prisma.enseignant.findFirst({
    where: {
      userId: currentUser.id,
      schoolId: schoolId
    },
    include: {
      school: true
    }
  })

  if (!teacher) {
    return <div className="p-8">Enseignant non trouvé</div>
  }

  // Récupérer tous les modules de l'école pour les statistiques
  const modules = await prisma.module.findMany({
    where: {
      schoolId: schoolId
    },
    include: {
      filiere: true
    }
  })

  // Calculer les statistiques réelles
  const totalModules = modules.length
  
  // Compter tous les étudiants de l'école
  const totalStudents = await prisma.student.count({
    where: {
      schoolId: schoolId
    }
  })
  
  // Compter les cours de cette semaine
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)
  
  const coursesThisWeek = await prisma.emploiDuTemps.count({
    where: {
      enseignantId: teacher.id,
      dateDebut: {
        gte: startOfWeek,
        lt: endOfWeek
      }
    }
  })
  
  // Calculer le taux de présence
  const totalAttendances = await prisma.attendance.count({
    where: {
      teacherId: teacher.id,
      date: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)) // 30 derniers jours
      }
    }
  })
  
  const presentAttendances = await prisma.attendance.count({
    where: {
      teacherId: teacher.id,
      status: 'PRESENT',
      date: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30))
      }
    }
  })
  
  const attendanceRate = totalAttendances > 0 
    ? Math.round((presentAttendances / totalAttendances) * 100) 
    : 0
  
  // Récupérer les notes récentes
  const recentGrades = await prisma.evaluation.findMany({
    where: {
      moduleId: { in: modules.map(m => m.id) }
    },
    include: {
      student: {
        include: {
          user: true
        }
      },
      module: true
    },
    orderBy: { date: 'desc' },
    take: 4
  })

  // Stats avec données réelles
  const stats = [
    { label: "Modules", value: totalModules.toString(), icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Étudiants", value: totalStudents.toString(), icon: Users, color: "text-green-600", bg: "bg-green-100" },
    { label: "Cours cette semaine", value: coursesThisWeek.toString(), icon: Calendar, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Taux de présence", value: `${attendanceRate}%`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Enseignant</h1>
        <p className="text-muted-foreground mt-2">Bienvenue, {teacher.nom} {teacher.prenom}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Modules */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mes Modules</CardTitle>
              <CardDescription>Gérez vos modules et consultez les détails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{module.nom}</h3>
                        <p className="text-sm text-muted-foreground">
                          {module.filiere?.nom || 'Aucune filière'}
                        </p>
                      </div>
                    </div>
                    <ModuleActions 
                      module={module}
                      schoolId={schoolId}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Grades */}
          <Card>
            <CardHeader>
              <CardTitle>Notes Récentes</CardTitle>
              <CardDescription>Dernières notes saisies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">
                        {grade.student.user?.name || 'Étudiant'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {grade.module.nom}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">{grade.note}/20</p>
                      <p className="text-xs text-muted-foreground">{grade.type}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href={`/teacher/${schoolId}/grades`}>
                <Button variant="outline" className="w-full mt-4">
                  Voir toutes les notes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActions 
            modules={modules.map(m => ({
              id: m.id,
              nom: m.nom,
              filiere: m.filiere ? { nom: m.filiere.nom } : null
            }))} 
            schoolId={schoolId}
          />
        </div>
      </div>
    </div>
  )
}
