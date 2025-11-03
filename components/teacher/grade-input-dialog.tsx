'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner'
import { Save, Download } from 'lucide-react'

interface Student {
  id: string
  name: string
  studentNumber: string
  note?: number
  isAbsent?: boolean
}

interface GradeInputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evaluation: {
    id: string
    subject: string
    className: string
    type: string
    coefficient: number
    date: Date
  } | null
}

export default function GradeInputDialog({ open, onOpenChange, evaluation }: GradeInputDialogProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && evaluation) {
      loadStudents()
    }
  }, [open, evaluation])

  const loadStudents = async () => {
    if (!evaluation) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/teacher/evaluations/${evaluation.id}/students`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        toast.error('Erreur lors du chargement des étudiants')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleNoteChange = (studentId: string, value: string) => {
    const note = parseFloat(value)
    if (value === '' || (note >= 0 && note <= 20)) {
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, note: value === '' ? undefined : note } : s
      ))
    }
  }

  const handleAbsentToggle = (studentId: string) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, isAbsent: !s.isAbsent, note: s.isAbsent ? s.note : undefined } : s
    ))
  }

  const handleSave = async () => {
    if (!evaluation) return

    setSaving(true)
    try {
      const response = await fetch(`/api/teacher/evaluations/${evaluation.id}/grades`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: students })
      })

      if (response.ok) {
        toast.success('Notes enregistrées avec succès')
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const calculateAverage = () => {
    const validGrades = students.filter(s => !s.isAbsent && s.note !== undefined)
    if (validGrades.length === 0) return 0
    const sum = validGrades.reduce((acc, s) => acc + (s.note || 0), 0)
    return sum / validGrades.length
  }

  const getGradeColor = (note?: number) => {
    if (note === undefined) return 'text-muted-foreground'
    if (note >= 16) return 'text-green-600'
    if (note >= 14) return 'text-green-500'
    if (note >= 12) return 'text-blue-600'
    if (note >= 10) return 'text-orange-500'
    return 'text-red-600'
  }

  if (!evaluation) return null

  const average = calculateAverage()
  const gradedCount = students.filter(s => !s.isAbsent && s.note !== undefined).length
  const absentCount = students.filter(s => s.isAbsent).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Saisir les notes - {evaluation.subject}
          </DialogTitle>
          <DialogDescription>
            {evaluation.className} • {evaluation.type} • Coef. {evaluation.coefficient} • {new Date(evaluation.date).toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-4 py-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Total étudiants</p>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Notes saisies</p>
            <p className="text-2xl font-bold text-blue-600">{gradedCount}</p>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Absents</p>
            <p className="text-2xl font-bold text-orange-600">{absentCount}</p>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Moyenne</p>
            <p className={`text-2xl font-bold ${getGradeColor(average)}`}>
              {average > 0 ? average.toFixed(2) : '-'}/20
            </p>
          </div>
        </div>

        {/* Liste des étudiants */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Chargement des étudiants...
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Aucun étudiant trouvé pour cette évaluation
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium">Matricule</th>
                  <th className="text-left p-3 font-medium">Nom</th>
                  <th className="text-center p-3 font-medium">Note /20</th>
                  <th className="text-center p-3 font-medium">Absent</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr 
                    key={student.id} 
                    className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'} ${student.isAbsent ? 'opacity-50' : ''}`}
                  >
                    <td className="p-3 text-sm">{student.studentNumber}</td>
                    <td className="p-3 font-medium">{student.name}</td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        value={student.note ?? ''}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                        disabled={student.isAbsent}
                        className={`w-24 mx-auto text-center ${getGradeColor(student.note)}`}
                        placeholder="--"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={student.isAbsent || false}
                          onCheckedChange={() => handleAbsentToggle(student.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            variant="outline"
            onClick={() => toast.info('Export disponible prochainement')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
