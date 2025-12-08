/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { StudentScheduleView } from "@/components/schedule/StudentScheduleView"

export default async function StudentSchedulePage({ 
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
      school: true
    }
  })

  if (!student) redirect('/auth/login')

  // Récupérer l'emploi du temps du jour
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayNames = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
  const currentDay = dayNames[today.getDay()]

  const emploiDuTemps: any = await prisma.emploiDuTemps.findMany({
    where: {
      schoolId: student.schoolId,
      niveau: student.niveau,
      OR: [
        { filiereId: student.filiereId },
        { ueCommune: true }
      ],
      dateDebut: { lte: tomorrow },
      dateFin: { gte: today },
      joursCours: {
        contains: currentDay
      }
    },
    include: {
      module: true,
      enseignant: true
    },
    orderBy: {
      heureDebut: 'asc'
    }
  })

  // Déterminer le statut de chaque cours
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  const initialSchedule = emploiDuTemps.map((cours: any) => {
    let status: 'current' | 'upcoming' | 'completed' = 'upcoming'
    if (currentTime > cours.heureFin) {
      status = 'completed'
    } else if (currentTime >= cours.heureDebut && currentTime <= cours.heureFin) {
      status = 'current'
    }
    
    return {
      id: cours.id,
      time: `${cours.heureDebut} - ${cours.heureFin}`,
      subject: cours.module.nom,
      teacher: cours.enseignant 
        ? `${cours.enseignant.titre || ''} ${cours.enseignant.prenom} ${cours.enseignant.nom}`.trim()
        : 'Non assigné',
      room: cours.salle || 'Non définie',
      status,
      type: cours.module.type
    }
  })

  // Statistiques de la semaine
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  const weekSchedule = await prisma.emploiDuTemps.findMany({
    where: {
      schoolId: student.schoolId,
      niveau: student.niveau,
      OR: [
        { filiereId: student.filiereId },
        { ueCommune: true }
      ],
      dateDebut: { lte: endOfWeek },
      dateFin: { gte: startOfWeek }
    },
    include: {
      module: true
    }
  })

  const totalHoursWeek = weekSchedule.reduce((sum, cours) => {
    const [startH, startM] = cours.heureDebut.split(':').map(Number)
    const [endH, endM] = cours.heureFin.split(':').map(Number)
    const hours = (endH * 60 + endM - startH * 60 - startM) / 60
    return sum + hours
  }, 0)

  const uniqueModules = new Set(weekSchedule.map(c => c.moduleId)).size

  // Calculer le taux de présence
  const totalAbsences = await prisma.absence.count({
    where: { studentId: student.id }
  })
  const totalSessions = await prisma.attendance.count({
    where: {
      module: {
        OR: [
          { filiereId: student.filiereId },
          { isUeCommune: true }
        ]
      }
    }
  })
  const attendanceRate = totalSessions > 0 ? Math.round(((totalSessions - totalAbsences) / totalSessions) * 100) : 100

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Mon Emploi du Temps</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">Consultez vos cours par jour</p>
      </div>

      {/* Vue du jour avec sélecteur */}
      <StudentScheduleView
        schoolId={schoolId}
        filiereId={student.filiereId}
        niveau={student.niveau}
        initialSchedule={initialSchedule}
      />

      {/* Statistiques de la semaine */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Statistiques de la Semaine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{Math.round(totalHoursWeek)}h</p>
              <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Heures de cours</p>
            </div>
            <div className="text-center">
              <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{uniqueModules}</p>
              <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Matières</p>
            </div>
            <div className="text-center">
              <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-green-600 dark:text-green-400">{attendanceRate}%</p>
              <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Présence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
