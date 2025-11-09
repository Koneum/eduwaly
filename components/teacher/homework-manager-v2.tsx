"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Calendar, FileText, Users, Send, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Module {
  id: string
  nom: string
  filiere: {
    id: string
    nom: string
  } | null
}

interface WorkGroup {
  id: string
  name: string
  members: Array<{
    student: {
      id: string
      user: {
        name: string
      }
    }
  }>
}

interface Homework {
  id: string
  title: string
  description: string
  dueDate: string
  assignmentType: string
  module: Module
  workGroup?: WorkGroup
  submissions: Array<{ id: string; studentId: string; status: string }>
  fileUrl?: string
  fileName?: string
}

interface HomeworkManagerV2Props {
  modules: Module[]
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
}

export function HomeworkManagerV2({ modules, schoolType }: HomeworkManagerV2Props) {
  const [homework, setHomework] = useState<Homework[]>([])
  const [receivedHomework, setReceivedHomework] = useState<Homework[]>([])
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  
  // Form states
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // Initialiser avec une date par défaut (demain à 23:59)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 0, 0)
  const [dueDate, setDueDate] = useState(tomorrow.toISOString().slice(0, 16))
  const [assignmentType, setAssignmentType] = useState('INDIVIDUAL')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Group creation states
  const [groupName, setGroupName] = useState('')
  const [groupModule, setGroupModule] = useState('')
  const [groupFiliere, setGroupFiliere] = useState('')
  
  const { toast } = useToast()

  const filieres = Array.from(
    new Set(
      modules
        .filter((m) => m.filiere !== null)
        .map((m) => JSON.stringify({ id: m.filiere!.id, nom: m.filiere!.nom }))
    )
  ).map((f) => JSON.parse(f))

  useEffect(() => {
    loadHomework()
  }, [])

  useEffect(() => {
    if (selectedModule || selectedFiliere) {
      loadWorkGroups()
    }
  }, [selectedModule, selectedFiliere])

  const loadHomework = async () => {
    try {
      const response = await fetch('/api/teacher/homework')
      if (response.ok) {
        const data = await response.json()
        // Séparer les devoirs créés et reçus
        setHomework(data.filter((hw: Homework) => !hw.workGroup))
        setReceivedHomework(data.filter((hw: Homework) => hw.workGroup))
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWorkGroups = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedModule) params.append('moduleId', selectedModule)
      if (selectedFiliere) params.append('filiereId', selectedFiliere)
      
      const response = await fetch(`/api/work-groups?${params}`)
      if (response.ok) {
        const data = await response.json()
        setWorkGroups(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleSubmit = async () => {
    if (!title || !selectedModule || !dueDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      })
      return
    }

    if (assignmentType === 'GROUP' && selectedGroups.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un groupe',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Si plusieurs groupes, créer un devoir par groupe
      const promises = assignmentType === 'GROUP' && selectedGroups.length > 0
        ? selectedGroups.map((groupId) =>
            fetch('/api/teacher/homework', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title,
                description,
                moduleId: selectedModule,
                dueDate,
                assignmentType,
                workGroupId: groupId,
                fileUrl: uploadedFile?.url,
                fileName: uploadedFile?.name,
                fileSize: uploadedFile?.size,
                fileType: uploadedFile?.type,
              }),
            })
          )
        : [
            fetch('/api/teacher/homework', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title,
                description,
                moduleId: selectedModule,
                dueDate,
                assignmentType,
                fileUrl: uploadedFile?.url,
                fileName: uploadedFile?.name,
                fileSize: uploadedFile?.size,
                fileType: uploadedFile?.type,
              }),
            }),
          ]

      await Promise.all(promises)

      toast({
        title: 'Devoir(s) créé(s)',
        description: `${promises.length} devoir(s) créé(s) avec succès`,
      })

      // Reset
      setTitle('')
      setDescription('')
      setSelectedModule('')
      setSelectedFiliere('')
      setDueDate('')
      setAssignmentType('INDIVIDUAL')
      setSelectedGroups([])
      setUploadedFile(null)
      setShowDialog(false)
      loadHomework()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName) {
      toast({
        title: 'Erreur',
        description: 'Nom du groupe requis',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/work-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          moduleId: groupModule,
          filiereId: groupFiliere,
          memberIds: [], // À compléter avec sélection d'étudiants
        }),
      })

      if (response.ok) {
        toast({
          title: 'Groupe créé',
          description: 'Le groupe a été créé avec succès',
        })
        setGroupName('')
        setGroupModule('')
        setGroupFiliere('')
        setShowGroupDialog(false)
        loadWorkGroups()
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (hw: Homework) => {
    const now = new Date()
    const due = new Date(hw.dueDate)
    const submitted = hw.submissions.length

    if (now > due) {
      return <Badge variant="destructive">Expiré</Badge>
    }
    return <Badge variant="default">{submitted} soumission(s)</Badge>
  }

  const renderHomeworkCard = (hw: Homework) => (
    <Card key={hw.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {hw.title}
              {hw.assignmentType === 'GROUP' && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Groupe
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {schoolType === 'UNIVERSITY' 
                ? `${hw.module.nom}${hw.module.filiere ? ` - ${hw.module.filiere.nom}` : ''}`
                : `${hw.module.filiere ? `${hw.module.filiere.nom} - ` : ''}${hw.module.nom}`
              }
              {hw.workGroup && ` - ${hw.workGroup.name}`}
            </CardDescription>
          </div>
          {getStatusBadge(hw)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{hw.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(hw.dueDate), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{hw.submissions.length} soumissions</span>
            </div>
            {hw.fileUrl && (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <a
                  href={hw.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--link)] hover:underline hover:text-[var(--link-hover)]"
                >
                  {hw.fileName}
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return <div>Chargement...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Devoirs</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGroupDialog(true)}>
            <Users className="h-4 w-4 mr-2" />
            Nouveau Groupe
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Devoir
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sent" className="w-full">
        <TabsList>
          <TabsTrigger value="sent">
            <Send className="h-4 w-4 mr-2" />
            Devoirs Créés ({homework.length})
          </TabsTrigger>
          <TabsTrigger value="received">
            <Inbox className="h-4 w-4 mr-2" />
            Devoirs Reçus ({receivedHomework.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="space-y-4">
          {homework.map(renderHomeworkCard)}
          {homework.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun devoir créé. Cliquez sur &quot;Nouveau Devoir&quot; pour commencer.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {receivedHomework.map(renderHomeworkCard)}
          {receivedHomework.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun devoir reçu de groupes de travail.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Nouveau Devoir */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Créer un Devoir</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Assignez un devoir {schoolType === 'UNIVERSITY' ? 'par module' : 'par matière'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-responsive-sm">
                {schoolType === 'UNIVERSITY' ? 'Filière' : 'Classe'} *
              </Label>
              <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                <SelectTrigger className="bg-card text-responsive-sm">
                  <SelectValue placeholder={`Sélectionnez ${schoolType === 'UNIVERSITY' ? 'une filière' : 'une classe'}`} />
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
              <Label className="text-responsive-sm">
                {schoolType === 'UNIVERSITY' ? 'Module' : 'Matière'} *
              </Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="bg-card text-responsive-sm">
                  <SelectValue placeholder={`Sélectionnez ${schoolType === 'UNIVERSITY' ? 'un module' : 'une matière'}`} />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {modules
                    .filter((m) => !selectedFiliere || (m.filiere && m.filiere.id === selectedFiliere))
                    .map((module) => (
                      <SelectItem key={module.id} value={module.id} className="text-responsive-sm">
                        {module.nom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-responsive-sm">Type d&apos;assignation *</Label>
              <Select value={assignmentType} onValueChange={setAssignmentType}>
                <SelectTrigger className="bg-card text-responsive-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="INDIVIDUAL" className="text-responsive-sm">Individuel</SelectItem>
                  <SelectItem value="GROUP" className="text-responsive-sm">Groupe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {assignmentType === 'GROUP' && (
              <div>
                <Label className="text-responsive-sm">Groupes de travail *</Label>
                {workGroups.length === 0 ? (
                  <div className="border rounded-md p-3 sm:p-4 text-center text-responsive-sm text-muted-foreground">
                    Aucun groupe de travail disponible. 
                    <br />
                    Sélectionnez une filière/classe et un module, ou créez un nouveau groupe.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {workGroups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={group.id}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGroups([...selectedGroups, group.id])
                            } else {
                              setSelectedGroups(selectedGroups.filter((id) => id !== group.id))
                            }
                          }}
                        />
                        <label htmlFor={group.id} className="text-responsive-sm cursor-pointer">
                          {group.name} ({group.members.length} membres)
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="title" className="text-responsive-sm">Titre *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Devoir Chapitre 1"
                className="bg-card text-responsive-sm"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-responsive-sm">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions pour le devoir..."
                rows={4}
                className="bg-card text-responsive-sm"
              />
            </div>

            <div>
              <Label htmlFor="dueDate" className="text-responsive-sm">Date limite *</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-card text-responsive-sm"
              />
            </div>

            <div>
              <Label className="text-responsive-sm">Fichier (optionnel)</Label>
              <FileUpload
                onUpload={(files) => setUploadedFile(files[0])}
                onError={(error) => {
                  toast({
                    title: 'Erreur',
                    description: error,
                    variant: 'destructive',
                  })
                }}
                category="document"
                folder="homework"
                multiple={false}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !title || !selectedModule || !dueDate}
              className="bg-primary hover:bg-primary hover:bg-[#E6B000] w-full sm:w-auto"
            >
              {isSubmitting ? 'Création...' : 'Créer le Devoir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouveau Groupe */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Créer un Groupe de Travail</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Les étudiants pourront également créer leurs propres groupes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="groupName" className="text-responsive-sm">Nom du groupe *</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Groupe A"
                className="bg-card text-responsive-sm"
              />
            </div>

            <div>
              <Label className="text-responsive-sm">
                {schoolType === 'UNIVERSITY' ? 'Filière' : 'Classe'}
              </Label>
              <Select value={groupFiliere} onValueChange={setGroupFiliere}>
                <SelectTrigger className="bg-card text-responsive-sm">
                  <SelectValue placeholder="Sélectionnez" />
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
              <Label className="text-responsive-sm">
                {schoolType === 'UNIVERSITY' ? 'Module' : 'Matière'}
              </Label>
              <Select value={groupModule} onValueChange={setGroupModule}>
                <SelectTrigger className="bg-card text-responsive-sm">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {modules
                    .filter((m) => !groupFiliere || (m.filiere && m.filiere.id === groupFiliere))
                    .map((module) => (
                      <SelectItem key={module.id} value={module.id} className="text-responsive-sm">
                        {module.nom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowGroupDialog(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName}
              className="bg-primary hover:bg-primary hover:bg-[#E6B000] w-full sm:w-auto"
            >
              Créer le Groupe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
