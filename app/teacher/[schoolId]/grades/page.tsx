import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"
import GradesManager from "@/components/teacher/grades-manager"
import StudentsGradesList from "@/components/teacher/students-grades-list"

export default async function TeacherGradesPage({ 
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

  // Récupérer les filières OU classes selon le type d'école
  const filieres = !isHighSchool ? await prisma.filiere.findMany({
    where: { schoolId: schoolId },
    select: { id: true, nom: true }
  }) : []

  // Récupérer les modules de l'école
  const modules = await prisma.module.findMany({
    where: { schoolId: schoolId },
    include: {
      filiere: true,
      evaluations: {
        include: {
          student: {
            include: {
              user: true
            }
          }
        },
        orderBy: { date: 'desc' }
      }
    }
  })

  // Récupérer toutes les évaluations
  const allEvaluations = modules.flatMap(m => m.evaluations)

  // Calculer les statistiques
  const totalGrades = allEvaluations.length
  
  const allGrades = allEvaluations.map(e => Number(e.note))
  const classAverage = allGrades.length > 0 
    ? allGrades.reduce((sum: number, grade: number) => sum + grade, 0) / allGrades.length 
    : 0

  // Récupérer les classes de l'école (pour lycées)
  const classes = isHighSchool ? await prisma.class.findMany({
    where: {
      schoolId: schoolId
    },
    select: {
      id: true,
      name: true
    }
  }) : []

  // Grouper les évaluations par module et type
  const evaluationGroups = new Map<string, typeof allEvaluations>()
  allEvaluations.forEach(evaluation => {
    const foundModule = modules.find(m => m.id === evaluation.moduleId)
    if (!foundModule) return
    
    const key = `${evaluation.moduleId}-${evaluation.type}-${evaluation.date.toISOString().split('T')[0]}`
    if (!evaluationGroups.has(key)) {
      evaluationGroups.set(key, [])
    }
    evaluationGroups.get(key)!.push(evaluation)
  })

  // Formater les évaluations avec moyenne
  const formattedEvaluations = Array.from(evaluationGroups.entries()).map(([key, evals]) => {
    const firstEval = evals[0]
    const foundModule = modules.find(m => m.id === firstEval.moduleId)!
    const grades = evals.map(e => Number(e.note))
    const averageGrade = grades.length > 0 
      ? grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length 
      : undefined

    return {
      id: key,
      type: firstEval.type,
      subject: foundModule.nom,
      date: firstEval.date,
      coefficient: Number(firstEval.coefficient),
      classId: foundModule.filiereId || 'none',
      className: foundModule.filiere?.nom || 'Non assigné',
      averageGrade
    }
  })

  // Récupérer les absences de la semaine
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Lundi
  startOfWeek.setHours(0, 0, 0, 0)

  const absences = await prisma.absence.findMany({
    where: {
      student: {
        schoolId: schoolId
      },
      date: {
        gte: startOfWeek
      }
    },
    include: {
      student: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  // Grouper par jour de la semaine
  const weekDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const absencesByDay = new Map<string, { present: number; absent: number; late: number }>()
  
  // Récupérer le nombre total d'étudiants pour calculer les présents
  const totalStudents = await prisma.student.count({
    where: { schoolId: schoolId }
  })

  // Initialiser les jours de la semaine
  for (let i = 1; i <= 5; i++) { // Lundi à Vendredi
    absencesByDay.set(weekDays[i], { present: totalStudents, absent: 0, late: 0 })
  }

  // Compter les absences par jour
  absences.forEach(absence => {
    const dayName = weekDays[absence.date.getDay()]
    const dayData = absencesByDay.get(dayName)
    if (dayData) {
      if (absence.justified) {
        dayData.late++ // Considérer les absences justifiées comme retards
      } else {
        dayData.absent++
      }
      dayData.present = totalStudents - dayData.absent - dayData.late
    }
  })

  const weekAttendance = Array.from(absencesByDay.entries()).map(([day, data]) => ({
    day,
    ...data
  }))

  // Calculer le taux de présence
  const totalAbsences = absences.filter(a => !a.justified).length
  const totalPossibleAttendances = totalStudents * 5 // 5 jours de la semaine
  const attendanceRate = totalPossibleAttendances > 0
    ? Math.round(((totalPossibleAttendances - totalAbsences) / totalPossibleAttendances) * 100)
    : 100

  const stats = {
    totalGrades,
    classAverage,
    attendanceRate
  }

  // Formater les classes OU filières selon le type d'école
  const formattedClasses = isHighSchool 
    ? classes.map(c => ({ id: c.id, name: c.name }))
    : filieres.map(f => ({ id: f.id, name: f.nom }))

  // Récupérer tous les étudiants avec leurs infos
  const students = await prisma.student.findMany({
    where: { schoolId: schoolId },
    select: {
      id: true,
      studentNumber: true,
      niveau: true,
      enrollmentYear: true,
      user: {
        select: {
          name: true,
          email: true
        }
      },
      filiere: {
        select: {
          nom: true
        }
      }
    },
    orderBy: {
      user: {
        name: 'asc'
      }
    }
  })

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <GradesManager 
        evaluations={formattedEvaluations} 
        stats={stats}
        classes={formattedClasses}
        isHighSchool={isHighSchool}
      />

      {/* Liste des étudiants avec filtres et promotion */}
      <StudentsGradesList 
        students={students}
        filieres={formattedClasses.map(c => ({ id: c.id, nom: c.name }))}
        isHighSchool={isHighSchool}
      />

      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-responsive-base sm:text-responsive-lg">Présences de la Semaine</CardTitle>
          <CardDescription className="text-responsive-xs sm:text-responsive-sm">
            Suivi des absences et retards (du {startOfWeek.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à aujourd&apos;hui)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          {weekAttendance.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {weekAttendance.map((day) => (
                <div key={day.day} className="p-3 sm:p-4 border border-border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="font-semibold text-responsive-sm sm:text-responsive-base text-foreground">{day.day}</h3>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="text-center">
                        <p className="text-responsive-xs text-muted-foreground">Présents</p>
                        <p className="font-bold text-responsive-sm sm:text-responsive-base text-green-600">{day.present}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-responsive-xs text-muted-foreground">Absents</p>
                        <p className="font-bold text-responsive-sm sm:text-responsive-base text-red-600">{day.absent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-responsive-xs text-muted-foreground">Justifiés</p>
                        <p className="font-bold text-responsive-sm sm:text-responsive-base text-orange-600">{day.late}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-responsive-sm text-muted-foreground py-6 sm:py-8">
              Aucune donnée de présence pour cette semaine
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
