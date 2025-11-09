/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Calendar } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

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
  
  const schedule = emploiDuTemps.map((cours: any) => {
    let status = 'upcoming'
    if (currentTime > cours.heureFin) {
      status = 'completed'
    } else if (currentTime >= cours.heureDebut && currentTime <= cours.heureFin) {
      status = 'current'
    }
    
    return {
      time: `${cours.heureDebut} - ${cours.heureFin}`,
      subject: cours.module.nom,
      teacher: `${cours.enseignant.titre} ${cours.enseignant.prenom} ${cours.enseignant.nom}`,
      room: cours.salle,
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

  // Prochain cours
  const nextCourse = schedule.find((c: any) => c.status === 'upcoming') || schedule.find((c: any) => c.status === 'current')

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Mon Emploi du Temps</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">Vos cours du jour - {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aujourd&apos;hui</CardTitle>
          <CardDescription>Vos cours de la journée</CardDescription>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucun cours aujourd&apos;hui</h3>
              <p className="text-muted-foreground">Profitez de votre journée libre !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`flex items-center gap-4 p-4 border rounded-lg ${
                  item.status === "current"
                    ? "border-green-500 bg-green-50"
                    : item.status === "completed"
                      ? "border-border bg-muted opacity-60"
                      : "border-border"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      item.status === "current"
                        ? "bg-green-100"
                        : item.status === "completed"
                          ? "bg-muted"
                          : "bg-primary/10"
                    }`}
                  >
                    <Clock
                      className={`h-5 w-5 ${item.status === "current" ? "text-green-600" : "text-primary"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{item.subject}</h3>
                      {item.status === "current" && (
                        <Badge variant="default" className="bg-green-600">
                          En cours
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-muted-foreground">{item.teacher}</p>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{item.room}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{item.time}</p>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prochain Cours</CardTitle>
          </CardHeader>
          <CardContent>
            {nextCourse ? (
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">{nextCourse.subject}</p>
                <p className="text-muted-foreground">{nextCourse.teacher}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">{nextCourse.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">{nextCourse.room}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Aucun cours à venir aujourd&apos;hui</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Heures cette semaine</span>
              <span className="font-bold text-foreground">{Math.round(totalHoursWeek)}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Matières</span>
              <span className="font-bold text-foreground">{uniqueModules}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taux de présence</span>
              <span className="font-bold text-green-600">{attendanceRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
