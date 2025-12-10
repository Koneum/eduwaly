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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageSquarePlus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Teacher {
  teacher: {
    id: string
    prenom: string
    nom: string
    titre?: string
    userId?: string
  }
  modules: string[]
}

interface Student {
  id: string
  studentNumber: string
  niveau: string
  user?: {
    name: string
  } | null
}

interface NewCorrespondenceDialogProps {
  teachers: Teacher[]
  students: Student[]
  schoolId: string
}

export function NewCorrespondenceDialog({ 
  teachers, 
  students, 
  schoolId 
}: NewCorrespondenceDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!selectedTeacher || !message.trim()) return

    startTransition(async () => {
      try {
        const response = await fetch('/api/correspondence/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherId: selectedTeacher,
            studentId: selectedStudent || null,
            message: message.trim(),
            schoolId
          })
        })

        if (response.ok) {
          const data = await response.json()
          setOpen(false)
          setMessage('')
          setSelectedTeacher('')
          setSelectedStudent('')
          router.push(`/parent/${schoolId}/messages/${data.conversationId}`)
          router.refresh()
        }
      } catch (error) {
        console.error('Erreur:', error)
      }
    })
  }

  const selectedTeacherData = teachers.find(t => t.teacher.id === selectedTeacher)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          Nouveau message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Envoyez un message à un enseignant de vos enfants
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sélection de l'enseignant */}
          <div className="space-y-2">
            <Label htmlFor="teacher">Enseignant *</Label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un enseignant" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(({ teacher, modules }) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    <div className="flex flex-col">
                      <span>{teacher.titre} {teacher.prenom} {teacher.nom}</span>
                      <span className="text-xs text-muted-foreground">
                        {modules.slice(0, 2).join(', ')}{modules.length > 2 ? '...' : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sélection de l'enfant (optionnel) */}
          {students.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="student">Concernant (optionnel)</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un enfant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Général</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.user?.name || student.studentNumber} - {student.niveau}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              rows={4}
            />
          </div>

          {selectedTeacherData && (
            <p className="text-xs text-muted-foreground">
              Ce message sera envoyé à {selectedTeacherData.teacher.titre} {selectedTeacherData.teacher.prenom} {selectedTeacherData.teacher.nom}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedTeacher || !message.trim() || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              'Envoyer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
