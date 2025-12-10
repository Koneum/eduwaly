'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Calendar, Loader2 } from "lucide-react"
import { DaySelector, getDayKey } from './DaySelector'

interface ScheduleItem {
  id: string
  time: string
  subject: string
  teacher: string
  room: string
  status: 'current' | 'upcoming' | 'completed'
  type?: string
}

interface StudentScheduleViewProps {
  schoolId: string
  filiereId: string | null
  niveau: string
  initialSchedule: ScheduleItem[]
}

export function StudentScheduleView({ 
  schoolId, 
  filiereId, 
  niveau,
  initialSchedule 
}: StudentScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  })
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule)
  const [isLoading, setIsLoading] = useState(false)
  const [nextCourse, setNextCourse] = useState<ScheduleItem | null>(null)

  // Charger l'emploi du temps quand la date change
  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/schedule/day?date=${selectedDate.toISOString()}&schoolId=${schoolId}&niveau=${niveau}&filiereId=${filiereId || ''}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setSchedule(data.schedule || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Ne pas recharger si c'est la date initiale (aujourd'hui)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate.toDateString() !== today.toDateString()) {
      loadSchedule()
    }
  }, [selectedDate, schoolId, niveau, filiereId])

  // Calculer le prochain cours
  useEffect(() => {
    const next = schedule.find(c => c.status === 'upcoming') || schedule.find(c => c.status === 'current')
    setNextCourse(next || null)
  }, [schedule])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sélecteur de jour */}
      <Card>
        <CardContent className="p-4">
          <DaySelector 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate}
          />
        </CardContent>
      </Card>

      {/* Cours du jour */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Cours du jour</CardTitle>
          <CardDescription className="text-responsive-sm">
            {getDayKey(selectedDate) === 'DIMANCHE' 
              ? 'Dimanche - Pas de cours' 
              : `Vos cours de la journée`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : schedule.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-responsive-base sm:text-responsive-lg font-semibold text-foreground mb-2">
                Aucun cours ce jour
              </h3>
              <p className="text-responsive-sm text-muted-foreground">
                {getDayKey(selectedDate) === 'DIMANCHE' 
                  ? 'Les dimanches sont généralement libres' 
                  : 'Profitez de votre journée !'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg transition-colors ${
                    item.status === "current"
                      ? "border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/30"
                      : item.status === "completed"
                        ? "border-border bg-muted opacity-60"
                        : "border-border hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        item.status === "current"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : item.status === "completed"
                            ? "bg-muted"
                            : "bg-primary/10 dark:bg-primary/20"
                      }`}
                    >
                      <Clock
                        className={`h-5 w-5 ${item.status === "current" ? "text-green-600 dark:text-green-400" : "text-primary"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground">
                          {item.subject}
                        </h3>
                        {item.status === "current" && (
                          <Badge variant="default" className="bg-green-600 dark:bg-green-700 text-responsive-xs">
                            En cours
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                        <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground truncate">
                          {item.teacher}
                        </p>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">
                            {item.room}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-responsive-xs sm:text-responsive-sm font-medium text-foreground">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prochain cours */}
      {nextCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-lg">Prochain Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-responsive-lg sm:text-responsive-xl font-bold text-foreground">
                {nextCourse.subject}
              </p>
              <p className="text-responsive-sm text-muted-foreground">{nextCourse.teacher}</p>
              <div className="flex items-center gap-2 mt-3">
                <Clock className="h-5 w-5 text-primary" />
                <p className="text-responsive-xs sm:text-responsive-sm font-medium">{nextCourse.time}</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <p className="text-responsive-xs sm:text-responsive-sm font-medium">{nextCourse.room}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
