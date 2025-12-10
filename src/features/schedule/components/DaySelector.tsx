'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DaySelectorProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  className?: string
}

export function DaySelector({ selectedDate, onDateChange, className }: DaySelectorProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isToday = selectedDate.toDateString() === today.toDateString()

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(today)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Générer les 7 jours de la semaine
  const startOfWeek = new Date(selectedDate)
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1) // Lundi

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    return day
  })

  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <div className={cn("space-y-4", className)}>
      {/* Navigation principale */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={goToPreviousDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <p className="text-responsive-base sm:text-responsive-lg font-semibold text-foreground capitalize">
            {formatDate(selectedDate)}
          </p>
          {!isToday && (
            <Button 
              variant="link" 
              size="sm" 
              onClick={goToToday}
              className="text-responsive-xs text-primary p-0 h-auto"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Revenir à aujourd&apos;hui
            </Button>
          )}
        </div>

        <Button variant="outline" size="icon" onClick={goToNextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Sélecteur de jour de la semaine */}
      <div className="flex justify-center gap-1 sm:gap-2">
        {weekDays.map((day, idx) => {
          const isSelected = day.toDateString() === selectedDate.toDateString()
          const isDayToday = day.toDateString() === today.toDateString()
          const isWeekend = idx >= 5

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateChange(day)}
              className={cn(
                "flex flex-col items-center justify-center w-10 h-14 sm:w-12 sm:h-16 rounded-lg transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : isDayToday
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : isWeekend
                      ? "bg-muted/50 text-muted-foreground hover:bg-muted"
                      : "bg-muted text-foreground hover:bg-accent"
              )}
            >
              <span className="text-[10px] sm:text-xs font-medium">{dayLabels[idx]}</span>
              <span className="text-responsive-sm sm:text-responsive-base font-bold">{day.getDate()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Hook pour gérer la date sélectionnée
export function useDaySelector(initialDate?: Date) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const date = initialDate || new Date()
    date.setHours(0, 0, 0, 0)
    return date
  })

  return {
    selectedDate,
    setSelectedDate,
    dayKey: getDayKey(selectedDate),
  }
}

// Helper pour obtenir le nom du jour en majuscules
export function getDayKey(date: Date): string {
  const dayNames = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
  return dayNames[date.getDay()]
}
