/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, BookOpen, PartyPopper, AlertTriangle, Info } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

const eventTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  EXAM: { label: 'Examen', icon: BookOpen, color: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  HOLIDAY: { label: 'Vacances', icon: PartyPopper, color: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' },
  MEETING: { label: 'Réunion', icon: Users, color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  EVENT: { label: 'Événement', icon: Calendar, color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  DEADLINE: { label: 'Échéance', icon: AlertTriangle, color: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  OTHER: { label: 'Autre', icon: Info, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
}

export default async function StudentCalendarPage({ 
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
      filiere: true,
      school: true
    }
  })

  if (!student) redirect('/auth/login')

  // Récupérer les événements à venir
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const events = await prisma.calendarEvent.findMany({
    where: {
      schoolId,
      startDate: { gte: today }
    },
    orderBy: { startDate: 'asc' }
  })

  // Filtrer par rôle et filière
  const filteredEvents = events.filter(event => {
    try {
      // Vérifier le rôle
      const targetRoles = JSON.parse(event.targetRoles)
      if (targetRoles.length > 0 && !targetRoles.includes('STUDENT')) {
        return false
      }

      // Vérifier la filière si spécifiée
      if (event.targetFilieres && student.filiereId) {
        const targetFilieres = JSON.parse(event.targetFilieres)
        if (targetFilieres.length > 0 && !targetFilieres.includes(student.filiereId)) {
          return false
        }
      }

      // Vérifier le niveau si spécifié
      if (event.targetNiveaux) {
        const targetNiveaux = JSON.parse(event.targetNiveaux)
        if (targetNiveaux.length > 0 && !targetNiveaux.includes(student.niveau)) {
          return false
        }
      }

      return true
    } catch {
      return true
    }
  })

  // Séparer les événements par période
  const thisWeek: typeof filteredEvents = []
  const thisMonth: typeof filteredEvents = []
  const later: typeof filteredEvents = []

  const endOfWeek = new Date(today)
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
  
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  filteredEvents.forEach(event => {
    const eventDate = new Date(event.startDate)
    if (eventDate <= endOfWeek) {
      thisWeek.push(event)
    } else if (eventDate <= endOfMonth) {
      thisMonth.push(event)
    } else {
      later.push(event)
    }
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderEventCard = (event: typeof events[0]) => {
    const config = eventTypeConfig[event.type] || eventTypeConfig.OTHER
    const Icon = config.icon

    return (
      <div 
        key={event.id}
        className={`p-4 border rounded-lg ${config.color}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-responsive-sm sm:text-responsive-base font-semibold">
                {event.title}
              </h3>
              <Badge variant="outline" className="text-[10px]">
                {config.label}
              </Badge>
            </div>
            {event.description && (
              <p className="text-responsive-xs text-current/70 mt-1 line-clamp-2">
                {event.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-responsive-xs">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(event.startDate)}</span>
              </div>
              {!event.allDay && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(event.startDate)}</span>
                </div>
              )}
              {event.allDay && (
                <Badge variant="secondary" className="text-[10px]">Toute la journée</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Agenda</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">
          Événements et dates importantes
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-primary">{thisWeek.length}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{thisMonth.length}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{filteredEvents.length}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Cette semaine */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Cette Semaine</CardTitle>
          <CardDescription className="text-responsive-sm">
            Événements des 7 prochains jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {thisWeek.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-responsive-sm text-muted-foreground">
                Aucun événement cette semaine
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {thisWeek.map(renderEventCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ce mois */}
      {thisMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-lg">Ce Mois</CardTitle>
            <CardDescription className="text-responsive-sm">
              Événements du reste du mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {thisMonth.map(renderEventCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plus tard */}
      {later.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-lg">À Venir</CardTitle>
            <CardDescription className="text-responsive-sm">
              Événements futurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {later.slice(0, 5).map(renderEventCard)}
              {later.length > 5 && (
                <p className="text-center text-responsive-sm text-muted-foreground">
                  +{later.length - 5} autres événements
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
