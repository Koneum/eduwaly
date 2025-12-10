"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sun, Moon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Student {
  id: string
  courseSchedule: string
  [key: string]: unknown
}

interface StudentsScheduleTabsProps {
  students: Student[]
  renderStudentsList: (students: Student[]) => React.ReactNode
}

export default function StudentsScheduleTabs({ students, renderStudentsList }: StudentsScheduleTabsProps) {
  const dayStudents = students.filter(s => s.courseSchedule === 'DAY')
  const eveningStudents = students.filter(s => s.courseSchedule === 'EVENING')

  return (
    <Tabs defaultValue="day" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="day" className="text-responsive-xs sm:text-responsive-sm">
          <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Cours du Jour</span>
          <span className="sm:hidden">Jour</span>
          <Badge variant="secondary" className="ml-1.5 sm:ml-2 text-[10px]">
            {dayStudents.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="evening" className="text-responsive-xs sm:text-responsive-sm">
          <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Cours du Soir</span>
          <span className="sm:hidden">Soir</span>
          <Badge variant="secondary" className="ml-1.5 sm:ml-2 text-[10px]">
            {eveningStudents.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="day" className="mt-4">
        {dayStudents.length > 0 ? (
          renderStudentsList(dayStudents)
        ) : (
          <div className="text-center py-8 text-muted-foreground text-responsive-sm">
            Aucun étudiant en cours du jour
          </div>
        )}
      </TabsContent>

      <TabsContent value="evening" className="mt-4">
        {eveningStudents.length > 0 ? (
          renderStudentsList(eveningStudents)
        ) : (
          <div className="text-center py-8 text-muted-foreground text-responsive-sm">
            Aucun étudiant en cours du soir
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
