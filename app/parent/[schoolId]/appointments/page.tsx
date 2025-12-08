/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { NewAppointmentDialog } from "@/components/appointments/NewAppointmentDialog"
import { AppointmentActions } from "@/components/appointments/AppointmentActions"

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertCircle },
  CONFIRMED: { label: 'Confirmé', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
  COMPLETED: { label: 'Terminé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: CheckCircle },
}

export default async function ParentAppointmentsPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  if (!user || user.role !== 'PARENT') redirect('/auth/login')

  const parent = await prisma.parent.findFirst({
    where: { 
      userId: user.id,
      students: { some: { schoolId } }
    },
    include: {
      students: {
        where: { schoolId },
        include: {
          user: true,
          filiere: true
        }
      }
    }
  })

  if (!parent) redirect('/auth/login')

  // Récupérer les RDV du parent
  const appointments = await prisma.appointment.findMany({
    where: {
      parentId: parent.id,
      schoolId
    },
    include: {
      enseignant: {
        include: { user: true }
      },
      student: {
        include: { user: true }
      }
    },
    orderBy: { date: 'asc' }
  })

  // Récupérer les enseignants disponibles pour les enfants
  const filiereIds = parent.students.map(s => s.filiereId).filter(Boolean)
  const niveaux = [...new Set(parent.students.map(s => s.niveau))]

  const emploisDuTemps = await prisma.emploiDuTemps.findMany({
    where: {
      schoolId,
      niveau: { in: niveaux },
      OR: [
        { filiereId: { in: filiereIds as string[] } },
        { ueCommune: true }
      ]
    },
    include: {
      enseignant: {
        include: { user: true }
      },
      module: true
    }
  })

  const teacherMap = new Map<string, { teacher: any; modules: string[] }>()
  emploisDuTemps.forEach(emploi => {
    if (emploi.enseignant) {
      const existing = teacherMap.get(emploi.enseignant.id)
      if (existing) {
        if (emploi.module && !existing.modules.includes(emploi.module.nom)) {
          existing.modules.push(emploi.module.nom)
        }
      } else {
        teacherMap.set(emploi.enseignant.id, {
          teacher: emploi.enseignant,
          modules: emploi.module ? [emploi.module.nom] : []
        })
      }
    }
  })

  const teachers = Array.from(teacherMap.values())

  // Séparer les RDV
  const now = new Date()
  const upcoming = appointments.filter(a => new Date(a.date) >= now && a.status !== 'CANCELLED')
  const past = appointments.filter(a => new Date(a.date) < now || a.status === 'CANCELLED')

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-responsive-xl font-bold text-foreground">Rendez-vous</h1>
          <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">
            Gérez vos rendez-vous avec les enseignants
          </p>
        </div>
        <NewAppointmentDialog 
          teachers={teachers}
          students={parent.students}
          schoolId={schoolId}
        />
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-primary">{upcoming.length}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">À venir</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-yellow-600">{appointments.filter(a => a.status === 'PENDING').length}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{appointments.length}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* RDV à venir */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Rendez-vous à Venir</CardTitle>
          <CardDescription className="text-responsive-sm">
            Vos prochains rendez-vous avec les enseignants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-responsive-base sm:text-responsive-lg font-semibold text-foreground mb-2">
                Aucun rendez-vous prévu
              </h3>
              <p className="text-responsive-sm text-muted-foreground">
                Demandez un rendez-vous avec un enseignant
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((appointment) => {
                const status = statusConfig[appointment.status] || statusConfig.PENDING
                const StatusIcon = status.icon
                const teacherName = `${appointment.enseignant.titre || ''} ${appointment.enseignant.prenom} ${appointment.enseignant.nom}`.trim()
                const initials = `${appointment.enseignant.prenom?.[0] || ''}${appointment.enseignant.nom?.[0] || ''}`.toUpperCase()

                return (
                  <div 
                    key={appointment.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={appointment.enseignant.user?.avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground">
                            {teacherName}
                          </h3>
                          <Badge className={`text-[10px] ${status.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        
                        <p className="text-responsive-xs text-muted-foreground mt-1">
                          Concernant : {appointment.student.user?.name || 'Élève'}
                        </p>

                        {appointment.subject && (
                          <p className="text-responsive-xs text-foreground mt-1">
                            Sujet : {appointment.subject}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 mt-3 text-responsive-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(appointment.date)} ({appointment.duration} min)</span>
                          </div>
                          {appointment.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{appointment.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {appointment.status === 'PENDING' && appointment.initiatedBy === 'TEACHER' && (
                        <AppointmentActions 
                          appointmentId={appointment.id}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique */}
      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-lg">Historique</CardTitle>
            <CardDescription className="text-responsive-sm">
              Rendez-vous passés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {past.slice(0, 5).map((appointment) => {
                const status = statusConfig[appointment.status] || statusConfig.PENDING
                const teacherName = `${appointment.enseignant.titre || ''} ${appointment.enseignant.prenom} ${appointment.enseignant.nom}`.trim()

                return (
                  <div 
                    key={appointment.id}
                    className="flex items-center gap-4 p-3 border border-border rounded-lg opacity-60"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-responsive-sm font-medium text-foreground truncate">
                        {teacherName}
                      </p>
                      <p className="text-responsive-xs text-muted-foreground">
                        {formatDate(appointment.date)}
                      </p>
                    </div>
                    <Badge className={`text-[10px] ${status.color}`}>
                      {status.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
