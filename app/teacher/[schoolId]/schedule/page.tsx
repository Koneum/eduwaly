import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {  Clock } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"

export default async function TeacherSchedulePage({ 
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
      school: true
    }
  })

  if (!teacher) {
    return <div className="p-8">Enseignant non trouvé</div>
  }

  // Récupérer l'emploi du temps de l'enseignant
  const schedules = await prisma.emploiDuTemps.findMany({
    where: {
      enseignantId: teacher.id,
      schoolId: schoolId
    },
    include: {
      module: true,
      filiere: true
    },
    orderBy: [
      { heureDebut: 'asc' }
    ]
  })

  // Obtenir la date d'aujourd'hui
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Dimanche, 1 = Lundi, etc.
  
  // Mapper les jours
  const dayMapping: Record<number, string> = {
    1: 'LUNDI',
    2: 'MARDI',
    3: 'MERCREDI',
    4: 'JEUDI',
    5: 'VENDREDI',
    6: 'SAMEDI'
  }

  const currentDay = dayMapping[dayOfWeek]

  // Cours d'aujourd'hui - vérifier si le jour actuel est dans joursCours
  const todaySchedules = schedules.filter(s => {
    try {
      const joursCours = JSON.parse(s.joursCours)
      return Array.isArray(joursCours) && joursCours.includes(currentDay)
    } catch {
      return false
    }
  })

  // Statistiques
  const totalHours = schedules.reduce((sum, s) => {
    const [startH, startM] = s.heureDebut.split(':').map(Number)
    const [endH, endM] = s.heureFin.split(':').map(Number)
    const duration = (endH * 60 + endM) - (startH * 60 + startM)
    return sum + duration / 60
  }, 0)

  const uniqueClasses = new Set(schedules.map(s => s.filiereId).filter(Boolean)).size
  const uniqueRooms = new Set(schedules.map(s => s.salle).filter(Boolean)).size

  // Jours de la semaine
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const dayKeys = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
  
  // Créneaux horaires uniques
  const allTimeSlots = new Set<string>()
  schedules.forEach(s => {
    allTimeSlots.add(`${s.heureDebut} - ${s.heureFin}`)
  })
  const timeSlots = Array.from(allTimeSlots).sort()

  // Organiser les cours par jour et créneau
  const scheduleGrid: Record<string, Record<string, typeof schedules[0][]>> = {}
  timeSlots.forEach(slot => {
    scheduleGrid[slot] = {}
    dayKeys.forEach(day => {
      scheduleGrid[slot][day] = []
    })
  })

  schedules.forEach(schedule => {
    const slot = `${schedule.heureDebut} - ${schedule.heureFin}`
    try {
      const joursCours = JSON.parse(schedule.joursCours)
      if (Array.isArray(joursCours)) {
        joursCours.forEach(jour => {
          if (dayKeys.includes(jour)) {
            scheduleGrid[slot][jour].push(schedule)
          }
        })
      }
    } catch {
      // Ignorer les erreurs de parsing
    }
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mon Emploi du Temps</h1>
        <p className="text-muted-foreground mt-2">Consultez votre planning de la semaine</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semaine en cours</CardTitle>
          <CardDescription>Vos cours programmés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-border p-2 bg-muted text-left">Horaire</th>
                  {daysOfWeek.map((day) => (
                    <th key={day} className="border border-border p-2 bg-muted text-center">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-border p-8 text-center text-muted-foreground">
                      Aucun cours programmé pour le moment
                    </td>
                  </tr>
                ) : (
                  timeSlots.map((slot) => (
                    <tr key={slot}>
                      <td className="border border-border p-2 text-sm font-medium text-muted-foreground">
                        {slot}
                      </td>
                      {dayKeys.map((dayKey) => {
                        const coursesInSlot = scheduleGrid[slot][dayKey]
                        return (
                          <td key={`${dayKey}-${slot}`} className="border border-border p-2">
                            <div className="min-h-[60px] space-y-1">
                              {coursesInSlot.map((schedule, idx) => (
                                <div key={idx} className="bg-primary/10 border-l-4 border-primary p-2 rounded text-xs">
                                  <p className="font-semibold text-foreground">
                                    {schedule.module.nom}
                                  </p>
                                  {schedule.filiere && (
                                    <p className="text-muted-foreground">
                                      {schedule.filiere.nom}
                                    </p>
                                  )}
                                  {schedule.salle && (
                                    <p className="text-muted-foreground">
                                      {schedule.salle}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cours Aujourd&apos;hui</CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun cours programmé aujourd&apos;hui
              </p>
            ) : (
              <div className="space-y-3">
                {todaySchedules.map((schedule, idx) => (
                  <div 
                    key={schedule.id} 
                    className={`p-4 border border-border rounded-lg ${idx === 0 ? 'bg-accent/50' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className={`h-4 w-4 ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-medium">{schedule.heureDebut} - {schedule.heureFin}</span>
                    </div>
                    <p className="font-semibold text-foreground">
                      {schedule.module.nom}{schedule.filiere && ` - ${schedule.filiere.nom}`}
                    </p>
                    {schedule.salle && (
                      <p className="text-sm text-muted-foreground">{schedule.salle}</p>
                    )}
                  </div>
                ))}
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
              <span className="font-bold text-foreground">{totalHours.toFixed(1)}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Classes différentes</span>
              <span className="font-bold text-foreground">{uniqueClasses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Salles utilisées</span>
              <span className="font-bold text-foreground">{uniqueRooms}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
