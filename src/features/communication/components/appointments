'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CalendarPlus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Teacher {
  teacher: {
    id: string
    prenom: string
    nom: string
    titre?: string
  }
  modules: string[]
}

interface Student {
  id: string
  studentNumber: string
  niveau: string
  user?: { name: string } | null
}

interface NewAppointmentDialogProps {
  teachers: Teacher[]
  students: Student[]
  schoolId: string
}

export function NewAppointmentDialog({ 
  teachers, 
  students, 
  schoolId 
}: NewAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [formData, setFormData] = useState({
    enseignantId: '',
    studentId: students.length === 1 ? students[0].id : '',
    date: '',
    time: '14:00',
    duration: '15',
    location: '',
    subject: '',
    notes: ''
  })

  const handleSubmit = async () => {
    if (!formData.enseignantId || !formData.studentId || !formData.date || !formData.time) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    startTransition(async () => {
      try {
        const dateTime = new Date(`${formData.date}T${formData.time}`)

        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enseignantId: formData.enseignantId,
            studentId: formData.studentId,
            date: dateTime.toISOString(),
            duration: parseInt(formData.duration),
            location: formData.location || null,
            subject: formData.subject || null,
            notes: formData.notes || null,
            schoolId
          })
        })

        if (response.ok) {
          toast.success('Demande de rendez-vous envoyée')
          setOpen(false)
          setFormData({
            enseignantId: '',
            studentId: students.length === 1 ? students[0].id : '',
            date: '',
            time: '14:00',
            duration: '15',
            location: '',
            subject: '',
            notes: ''
          })
          router.refresh()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Erreur lors de la demande')
        }
      } catch (error) {
        console.error('Erreur:', error)
        toast.error('Erreur lors de la demande de rendez-vous')
      }
    })
  }

  const selectedTeacher = teachers.find(t => t.teacher.id === formData.enseignantId)

  // Calculer la date minimum (demain)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="h-4 w-4 mr-2" />
          Demander un RDV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Demander un rendez-vous</DialogTitle>
          <DialogDescription>
            Demandez un rendez-vous avec un enseignant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Enseignant */}
          <div className="space-y-2">
            <Label>Enseignant *</Label>
            <Select 
              value={formData.enseignantId} 
              onValueChange={(value) => setFormData({...formData, enseignantId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un enseignant" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(({ teacher, modules }) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.titre} {teacher.prenom} {teacher.nom}
                    {modules.length > 0 && ` (${modules.slice(0, 2).join(', ')}${modules.length > 2 ? '...' : ''})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enfant (si plusieurs) */}
          {students.length > 1 && (
            <div className="space-y-2">
              <Label>Concernant *</Label>
              <Select 
                value={formData.studentId} 
                onValueChange={(value) => setFormData({...formData, studentId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un enfant" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.user?.name || student.studentNumber} - {student.niveau}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date et heure */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                min={minDate}
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Heure *</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>
          </div>

          {/* Durée */}
          <div className="space-y-2">
            <Label>Durée</Label>
            <Select 
              value={formData.duration} 
              onValueChange={(value) => setFormData({...formData, duration: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lieu */}
          <div className="space-y-2">
            <Label>Lieu (optionnel)</Label>
            <Input
              placeholder="Ex: Salle des professeurs, En ligne..."
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <Label>Sujet du rendez-vous</Label>
            <Input
              placeholder="Ex: Résultats scolaires, Comportement..."
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Message (optionnel)</Label>
            <Textarea
              placeholder="Précisez votre demande..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          {selectedTeacher && (
            <p className="text-xs text-muted-foreground">
              Votre demande sera envoyée à {selectedTeacher.teacher.titre} {selectedTeacher.teacher.prenom} {selectedTeacher.teacher.nom}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.enseignantId || !formData.studentId || !formData.date || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              'Envoyer la demande'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
