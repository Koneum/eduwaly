'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, ClipboardCheck } from "lucide-react"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Module {
  id: string
  nom: string
  filiere: {
    nom: string
  } | null
}

interface ModuleActionsProps {
  module: Module
  schoolId: string
}

export default function ModuleActions({ module, schoolId }: ModuleActionsProps) {
  const router = useRouter()
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Array<{ id: string; name: string; status: 'present' | 'absent' | 'late' }>>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Charger les étudiants quand le dialogue s'ouvre
  const handleOpenAttendance = async () => {
    setIsAttendanceOpen(true)
    setLoadingStudents(true)
    
    try {
      const response = await fetch(`/api/teacher/modules/${module.id}/students`)
      if (!response.ok) throw new Error('Erreur')
      
      const data = await response.json()
      setStudents(data.students.map((s: { id: string; name: string }) => ({
        id: s.id,
        name: s.name,
        status: 'present' as const
      })))
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger les étudiants')
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleAttendanceSubmit = async () => {
    try {
      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          date: attendanceDate,
          attendances: students.map(s => ({
            studentId: s.id,
            status: s.status.toUpperCase()
          }))
        })
      })

      if (!response.ok) throw new Error('Erreur')

      toast.success('Présences enregistrées avec succès')
      setIsAttendanceOpen(false)
      setStudents([])
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  const toggleStudentStatus = (studentId: string) => {
    setStudents(students.map(s => {
      if (s.id === studentId) {
        const statuses: Array<'present' | 'absent' | 'late'> = ['present', 'absent', 'late']
        const currentIndex = statuses.indexOf(s.status)
        const nextStatus = statuses[(currentIndex + 1) % statuses.length]
        return { ...s, status: nextStatus }
      }
      return s
    }))
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={handleOpenAttendance} className="flex-1 sm:flex-none">
          Présences
        </Button>
        <Button size="sm" onClick={() => setIsDetailsOpen(true)} className="flex-1 sm:flex-none">
          Voir détails
        </Button>
      </div>

      {/* Dialog Présences */}
      <Dialog open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Prendre les présences - {module.nom}</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              {module.filiere?.nom || 'Sans filière'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attendance-date" className="text-responsive-sm">Date</Label>
              <Input
                id="attendance-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="text-responsive-sm"
              />
            </div>
            {loadingStudents && (
              <p className="text-responsive-sm text-muted-foreground">Chargement des étudiants...</p>
            )}
            {students.length > 0 && (
              <div className="space-y-2">
                <Label className="text-responsive-sm">Étudiants ({students.length})</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-[300px] overflow-y-auto">
                  {students.map((student) => (
                    <div 
                      key={student.id} 
                      className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                      onClick={() => toggleStudentStatus(student.id)}
                    >
                      <span className="text-responsive-sm">{student.name}</span>
                      <div className="flex items-center gap-2">
                        {student.status === 'present' && (
                          <span className="flex items-center gap-1 text-success text-responsive-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            Présent
                          </span>
                        )}
                        {student.status === 'absent' && (
                          <span className="flex items-center gap-1 text-red-600 text-responsive-sm">
                            <XCircle className="h-4 w-4" />
                            Absent
                          </span>
                        )}
                        {student.status === 'late' && (
                          <span className="flex items-center gap-1 text-[var(--chart-5)] text-responsive-sm">
                            <ClipboardCheck className="h-4 w-4" />
                            Retard
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-responsive-xs text-muted-foreground">
                  Cliquez sur un étudiant pour changer son statut
                </p>
              </div>
            )}
            {!loadingStudents && students.length === 0 && (
              <p className="text-responsive-sm text-muted-foreground text-center py-4">
                Aucun étudiant trouvé pour ce module
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsAttendanceOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleAttendanceSubmit} disabled={students.length === 0} className="w-full sm:w-auto">
              Enregistrer les présences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Détails du Module */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">{module.nom}</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              {module.filiere?.nom || 'Sans filière'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-responsive-sm text-muted-foreground">Module</Label>
                <p className="font-medium text-responsive-sm">{module.nom}</p>
              </div>
              <div>
                <Label className="text-responsive-sm text-muted-foreground">Filière</Label>
                <p className="font-medium text-responsive-sm">{module.filiere?.nom || 'Non définie'}</p>
              </div>
            </div>
            
            <div className="border-t pt-3 sm:pt-4">
              <h3 className="font-semibold mb-3 text-responsive-base">Actions rapides</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setIsDetailsOpen(false)
                    handleOpenAttendance()
                  }}
                >
                  Prendre les présences
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    router.push(`/teacher/${schoolId}/grades?module=${module.id}`)
                  }}
                >
                  Voir les notes
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    router.push(`/teacher/${schoolId}/homework?module=${module.id}`)
                  }}
                >
                  Devoirs
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    router.push(`/teacher/${schoolId}/schedule?module=${module.id}`)
                  }}
                >
                  Emploi du temps
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="w-full sm:w-auto">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
