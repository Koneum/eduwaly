"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Check, X, Clock, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Module {
  id: string
  nom: string
  filiere: {
    id: string
    nom: string
  }
}

interface Student {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  filiere: {
    nom: string
  }
}

interface Attendance {
  id: string
  studentId: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  notes?: string
}

interface AttendanceManagerProps {
  modules: Module[]
}

export function AttendanceManager({ modules }: AttendanceManagerProps) {
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [students, setStudents] = useState<Student[]>([])
  const [attendances, setAttendances] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const filieres = Array.from(
    new Set(modules.map((m) => JSON.stringify({ id: m.filiere.id, nom: m.filiere.nom })))
  ).map((f) => JSON.parse(f))

  useEffect(() => {
    if (selectedModule && selectedFiliere) {
      loadStudents()
    }
  }, [selectedModule, selectedFiliere, selectedDate])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/teacher/attendance?moduleId=${selectedModule}&filiereId=${selectedFiliere}&date=${selectedDate}`
      )
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
        
        // Charger les présences existantes
        const existingAttendances: Record<string, string> = {}
        data.attendances.forEach((att: Attendance) => {
          existingAttendances[att.studentId] = att.status
        })
        setAttendances(existingAttendances)
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des étudiants',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const handleSave = async () => {
    if (!selectedModule || !selectedDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un module et une date',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      const attendanceData = Object.entries(attendances).map(([studentId, status]) => ({
        studentId,
        status,
      }))

      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: selectedModule,
          date: selectedDate,
          attendances: attendanceData,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement')
      }

      toast({
        title: 'Présences enregistrées',
        description: `${attendanceData.length} présences enregistrées`,
      })
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-success">Présent</Badge>
      case 'ABSENT':
        return <Badge variant="destructive">Absent</Badge>
      case 'LATE':
        return <Badge className="bg-[var(--chart-5)]">Retard</Badge>
      case 'EXCUSED':
        return <Badge className="bg-primary">Excusé</Badge>
      default:
        return <Badge variant="outline">Non marqué</Badge>
    }
  }

  const stats = {
    present: Object.values(attendances).filter((s) => s === 'PRESENT').length,
    absent: Object.values(attendances).filter((s) => s === 'ABSENT').length,
    late: Object.values(attendances).filter((s) => s === 'LATE').length,
    excused: Object.values(attendances).filter((s) => s === 'EXCUSED').length,
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <h2 className="heading-responsive-h2">Gestion des Présences</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Sélection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label className="text-responsive-sm">Filière</Label>
              <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                <SelectTrigger className="bg-card text-responsive-sm">
                  <SelectValue placeholder="Sélectionnez une filière" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {filieres.map((filiere: { id: string; nom: string }) => (
                    <SelectItem key={filiere.id} value={filiere.id} className="text-responsive-sm">
                      {filiere.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-responsive-sm">Module</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="bg-card text-responsive-sm">
                  <SelectValue placeholder="Sélectionnez un module" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {modules
                    .filter((m) => !selectedFiliere || m.filiere.id === selectedFiliere)
                    .map((module) => (
                      <SelectItem key={module.id} value={module.id} className="text-responsive-sm">
                        {module.nom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-responsive-sm">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-card text-responsive-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <>
          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-responsive-sm text-muted-foreground">Présents</p>
                    <p className="text-responsive-2xl font-bold">{stats.present}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-responsive-sm text-muted-foreground">Absents</p>
                    <p className="text-responsive-2xl font-bold">{stats.absent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-responsive-sm text-muted-foreground">Retards</p>
                    <p className="text-responsive-2xl font-bold">{stats.late}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[var(--link)]" />
                  <div>
                    <p className="text-responsive-sm text-muted-foreground">Excusés</p>
                    <p className="text-responsive-2xl font-bold">{stats.excused}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des étudiants */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <CardTitle className="text-responsive-lg">Liste des Étudiants ({students.length})</CardTitle>
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-3 sm:gap-0"
                  >
                    <div>
                      <p className="font-medium text-responsive-sm">{student.user.name}</p>
                      <p className="text-responsive-xs text-muted-foreground">{student.user.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(attendances[student.id])}
                      <Select
                        value={attendances[student.id] || ''}
                        onValueChange={(value) => handleStatusChange(student.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-32 bg-card text-responsive-sm">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="PRESENT" className="text-responsive-sm">Présent</SelectItem>
                          <SelectItem value="ABSENT" className="text-responsive-sm">Absent</SelectItem>
                          <SelectItem value="LATE" className="text-responsive-sm">Retard</SelectItem>
                          <SelectItem value="EXCUSED" className="text-responsive-sm">Excusé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!loading && students.length === 0 && selectedModule && selectedFiliere && (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center text-muted-foreground text-responsive-sm">
            Aucun étudiant trouvé pour cette filière
          </CardContent>
        </Card>
      )}
    </div>
  )
}
