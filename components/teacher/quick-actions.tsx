'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ClipboardCheck, BookOpen, Users, CheckCircle2, XCircle } from "lucide-react"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Module {
  id: string
  nom: string
  filiere: {
    nom: string
  } | null
}

interface QuickActionsProps {
  modules: Module[]
  schoolId: string
}

export default function QuickActions({ modules, schoolId }: QuickActionsProps) {
  const router = useRouter()
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [isHomeworkOpen, setIsHomeworkOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  
  // États pour les formulaires
  const [selectedModule, setSelectedModule] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Array<{ id: string; name: string; status: 'present' | 'absent' | 'late' }>>([])
  
  const [homeworkData, setHomeworkData] = useState({
    moduleId: '',
    title: '',
    description: '',
    dueDate: '',
    type: 'ASSIGNMENT'
  })

  const [contactData, setContactData] = useState({
    recipientType: 'all', // 'all' ou 'specific'
    studentId: '',
    subject: '',
    message: '',
    sendByEmail: false
  })

  const [selectedModuleForParents, setSelectedModuleForParents] = useState('')
  const [studentsForContact, setStudentsForContact] = useState<{ id: string, name: string, studentNumber: string }[]>([])

  const [loadingStudents, setLoadingStudents] = useState(false)

  // Charger les étudiants quand un module est sélectionné pour les présences
  const handleModuleSelect = async (moduleId: string) => {
    setSelectedModule(moduleId)
    if (!moduleId) {
      setStudents([])
      return
    }

    setLoadingStudents(true)
    try {
      const response = await fetch(`/api/teacher/modules/${moduleId}/students`)
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
    if (!selectedModule) {
      toast.error('Veuillez sélectionner un module')
      return
    }

    try {
      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: selectedModule,
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
      setSelectedModule('')
      setStudents([])
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  const handleHomeworkSubmit = async () => {
    if (!homeworkData.moduleId || !homeworkData.title || !homeworkData.dueDate) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const response = await fetch('/api/teacher/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(homeworkData)
      })

      if (!response.ok) throw new Error('Erreur')

      toast.success('Devoir créé avec succès')
      setIsHomeworkOpen(false)
      setHomeworkData({
        moduleId: '',
        title: '',
        description: '',
        dueDate: '',
        type: 'ASSIGNMENT'
      })
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création')
    }
  }

  const handleContactSubmit = async () => {
    if (!contactData.subject || !contactData.message) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (contactData.recipientType === 'specific' && !contactData.studentId) {
      toast.error('Veuillez sélectionner un étudiant')
      return
    }

    // TODO: Appel API pour envoyer le message
    if (contactData.recipientType === 'all') {
      toast.success('Message envoyé à tous les parents')
    } else {
      toast.success('Message envoyé au parent de l\'étudiant')
    }
    
    setIsContactOpen(false)
    setContactData({
      recipientType: 'all',
      studentId: '',
      subject: '',
      message: '',
      sendByEmail: false
    })
    setSelectedModuleForParents('')
    setStudentsForContact([])
  }

  const handleModuleSelectForParents = async (moduleId: string) => {
    setSelectedModuleForParents(moduleId)
    if (!moduleId) {
      setStudentsForContact([])
      return
    }

    try {
      const response = await fetch(`/api/teacher/modules/${moduleId}/students`)
      if (!response.ok) throw new Error('Erreur')
      
      const data = await response.json()
      setStudentsForContact(data.students)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger les étudiants')
      setStudentsForContact([])
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
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => setIsAttendanceOpen(true)}
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Prendre les présences
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => setIsHomeworkOpen(true)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Créer un devoir
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => setIsContactOpen(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Contacter parents
          </Button>
        </CardContent>
      </Card>

      {/* Dialog Prendre les présences */}
      <Dialog open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prendre les présences</DialogTitle>
            <DialogDescription>
              Enregistrez les présences pour votre cours
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attendance-module">Module *</Label>
              <Select value={selectedModule} onValueChange={handleModuleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((mod) => (
                    <SelectItem key={mod.id} value={mod.id}>
                      {mod.nom} - {mod.filiere?.nom || 'Sans filière'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendance-date">Date</Label>
              <Input
                id="attendance-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>
            {loadingStudents && (
              <p className="text-sm text-muted-foreground">Chargement des étudiants...</p>
            )}
            {selectedModule && students.length > 0 && (
              <div className="space-y-2">
                <Label>Étudiants</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-[300px] overflow-y-auto">
                  {students.map((student) => (
                    <div 
                      key={student.id} 
                      className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                      onClick={() => toggleStudentStatus(student.id)}
                    >
                      <span className="text-sm">{student.name}</span>
                      <div className="flex items-center gap-2">
                        {student.status === 'present' && (
                          <span className="flex items-center gap-1 text-success text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            Présent
                          </span>
                        )}
                        {student.status === 'absent' && (
                          <span className="flex items-center gap-1 text-red-600 text-sm">
                            <XCircle className="h-4 w-4" />
                            Absent
                          </span>
                        )}
                        {student.status === 'late' && (
                          <span className="flex items-center gap-1 text-[var(--chart-5)] text-sm">
                            <ClipboardCheck className="h-4 w-4" />
                            Retard
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cliquez sur un étudiant pour changer son statut
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAttendanceSubmit} disabled={students.length === 0}>
              Enregistrer les présences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Créer un devoir */}
      <Dialog open={isHomeworkOpen} onOpenChange={setIsHomeworkOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un devoir</DialogTitle>
            <DialogDescription>
              Créez un nouveau devoir pour vos étudiants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="homework-module">Module *</Label>
              <Select 
                value={homeworkData.moduleId} 
                onValueChange={(value) => setHomeworkData({...homeworkData, moduleId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((mod) => (
                    <SelectItem key={mod.id} value={mod.id}>
                      {mod.nom} - {mod.filiere?.nom || 'Sans filière'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="homework-title">Titre *</Label>
              <Input
                id="homework-title"
                placeholder="Ex: Exercices Chapitre 3"
                value={homeworkData.title}
                onChange={(e) => setHomeworkData({...homeworkData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homework-type">Type</Label>
              <Select 
                value={homeworkData.type} 
                onValueChange={(value) => setHomeworkData({...homeworkData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSIGNMENT">Devoir</SelectItem>
                  <SelectItem value="PROJECT">Projet</SelectItem>
                  <SelectItem value="READING">Lecture</SelectItem>
                  <SelectItem value="EXERCISE">Exercice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="homework-description">Description</Label>
              <Textarea
                id="homework-description"
                placeholder="Décrivez le devoir..."
                rows={4}
                value={homeworkData.description}
                onChange={(e) => setHomeworkData({...homeworkData, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homework-dueDate">Date limite *</Label>
              <Input
                id="homework-dueDate"
                type="date"
                value={homeworkData.dueDate}
                onChange={(e) => setHomeworkData({...homeworkData, dueDate: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHomeworkOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleHomeworkSubmit}>
              Créer le devoir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Contacter parents */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contacter les parents</DialogTitle>
            <DialogDescription>
              Envoyez un message aux parents d&apos;étudiants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destinataire *</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="all-parents"
                    name="recipient"
                    checked={contactData.recipientType === 'all'}
                    onChange={() => {
                      setContactData({...contactData, recipientType: 'all', studentId: ''})
                      setSelectedModuleForParents('')
                      setStudentsForContact([])
                    }}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="all-parents" className="cursor-pointer font-normal">
                    Tous les parents
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="specific-parent"
                    name="recipient"
                    checked={contactData.recipientType === 'specific'}
                    onChange={() => setContactData({...contactData, recipientType: 'specific'})}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="specific-parent" className="cursor-pointer font-normal">
                    Un parent spécifique
                  </Label>
                </div>
              </div>
            </div>

            {contactData.recipientType === 'specific' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="contact-module">Module *</Label>
                  <Select 
                    value={selectedModuleForParents} 
                    onValueChange={handleModuleSelectForParents}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((mod) => (
                        <SelectItem key={mod.id} value={mod.id}>
                          {mod.nom} - {mod.filiere?.nom || 'Sans filière'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {studentsForContact.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="contact-student">Étudiant *</Label>
                    <Select 
                      value={contactData.studentId} 
                      onValueChange={(value) => setContactData({...contactData, studentId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un étudiant" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentsForContact.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} - {student.studentNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="contact-subject">Sujet *</Label>
              <Input
                id="contact-subject"
                placeholder="Ex: Réunion parents-professeurs"
                value={contactData.subject}
                onChange={(e) => setContactData({...contactData, subject: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">Message *</Label>
              <Textarea
                id="contact-message"
                placeholder="Votre message..."
                rows={6}
                value={contactData.message}
                onChange={(e) => setContactData({...contactData, message: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contact-sendByEmail"
                checked={contactData.sendByEmail}
                onCheckedChange={(checked) => 
                  setContactData({...contactData, sendByEmail: checked as boolean})
                }
              />
              <Label htmlFor="contact-sendByEmail" className="cursor-pointer">
                Envoyer également par email
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleContactSubmit}>
              Envoyer le message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
