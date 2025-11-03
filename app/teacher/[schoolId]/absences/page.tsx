"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { UserX, Calendar as CalendarIcon, CheckCircle2, XCircle, Search } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Student {
  id: string
  user: { name: string }
  studentNumber: string
  niveau: string
  filiere?: { nom: string }
}

interface Absence {
  id: string
  date: Date
  justified: boolean
  justification?: string
  student: Student
}

export default function TeacherAbsencesPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterNiveau, setFilterNiveau] = useState<string>("all")

  useEffect(() => {
    fetchStudents()
    fetchAbsences()
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchAbsences = async () => {
    try {
      const res = await fetch('/api/absences')
      const data = await res.json()
      setAbsences(data.absences || [])
    } catch (error) {
      console.error('Error fetching absences:', error)
    }
  }

  const handleMarkAbsent = async () => {
    if (selectedStudents.size === 0) {
      alert('Veuillez sélectionner au moins un étudiant')
      return
    }

    setLoading(true)
    try {
      const promises = Array.from(selectedStudents).map(studentId =>
        fetch('/api/absences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            date: selectedDate.toISOString(),
            justified: false
          })
        })
      )

      await Promise.all(promises)
      
      setSelectedStudents(new Set())
      fetchAbsences()
      alert('Absences enregistrées avec succès')
    } catch (error) {
      console.error('Error marking absences:', error)
      alert('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const handleJustifyAbsence = async (absenceId: string, justification: string) => {
    try {
      await fetch('/api/absences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: absenceId,
          justified: true,
          justification
        })
      })
      
      fetchAbsences()
      alert('Absence justifiée')
    } catch (error) {
      console.error('Error justifying absence:', error)
    }
  }

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesNiveau = filterNiveau === "all" || student.niveau === filterNiveau
    return matchesSearch && matchesNiveau
  })

  const todayAbsences = absences.filter(abs => 
    format(new Date(abs.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  )

  const niveaux = Array.from(new Set(students.map(s => s.niveau)))

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Absences</h1>
          <p className="text-muted-foreground mt-2">Enregistrez et suivez les absences</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absences Aujourd&apos;hui</p>
                <p className="text-3xl font-bold text-foreground mt-2">{todayAbsences.length}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Non Justifiées</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {absences.filter(a => !a.justified).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Justifiées</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {absences.filter(a => a.justified).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taux de Présence</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">94%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Prise d'absences */}
        <Card>
          <CardHeader>
            <CardTitle>Enregistrer les Absences</CardTitle>
            <CardDescription>Sélectionnez les étudiants absents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection de la date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterNiveau} onValueChange={setFilterNiveau}>
                <SelectTrigger>
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  {niveaux.map(niveau => (
                    <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Liste des étudiants */}
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                  onClick={() => toggleStudent(student.id)}
                >
                  <Checkbox
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{student.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.studentNumber} • {student.niveau}
                    </p>
                  </div>
                  {student.filiere && (
                    <Badge variant="outline">{student.filiere.nom}</Badge>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={handleMarkAbsent}
              disabled={loading || selectedStudents.size === 0}
              className="w-full"
            >
              <UserX className="h-4 w-4 mr-2" />
              Enregistrer {selectedStudents.size} absence(s)
            </Button>
          </CardContent>
        </Card>

        {/* Liste des absences récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Absences Récentes</CardTitle>
            <CardDescription>Dernières absences enregistrées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {absences.slice(0, 20).map(absence => (
                <Card key={absence.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{absence.student.user.name}</p>
                          {absence.justified ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Justifiée
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Non justifiée
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(absence.date), 'PPP', { locale: fr })}
                        </p>
                        {absence.justification && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            &quot;{absence.justification}&quot;
                          </p>
                        )}
                      </div>
                      {!absence.justified && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Justifier</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Justifier l&apos;absence</DialogTitle>
                              <DialogDescription>
                                {absence.student.user.name} - {format(new Date(absence.date), 'PPP', { locale: fr })}
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                              e.preventDefault()
                              const formData = new FormData(e.currentTarget)
                              const justification = formData.get('justification') as string
                              handleJustifyAbsence(absence.id, justification)
                            }}>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="justification">Motif</Label>
                                  <Textarea
                                    id="justification"
                                    name="justification"
                                    placeholder="Raison de l'absence..."
                                    required
                                  />
                                </div>
                                <Button type="submit" className="w-full">
                                  Valider
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
