'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Trash2, 
  Edit, 
  BarChart3, 
  Users, 
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistance } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PollOption {
  id: string
  text: string
  order: number
  responseCount: number
  percentage: number
}

interface Poll {
  id: string
  title: string
  description: string | null
  targetRoles: string
  targetNiveaux: string | null
  startDate: Date
  endDate: Date
  isActive: boolean
  isAnonymous: boolean
  allowMultiple: boolean
  options: PollOption[]
  totalResponses: number
  uniqueRespondents?: number
}

export default function PollsManager() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetRoles: ['STUDENT', 'PARENT'],
    startDate: '',
    endDate: '',
    isAnonymous: false,
    allowMultiple: false,
    options: ['', '']
  })

  const fetchPolls = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/polls?status=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setPolls(data.polls || [])
      }
    } catch (error) {
      console.error('Erreur chargement sondages:', error)
      toast.error('Erreur lors du chargement des sondages')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPolls()
  }, [filter])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetRoles: ['STUDENT', 'PARENT'],
      startDate: '',
      endDate: '',
      isAnonymous: false,
      allowMultiple: false,
      options: ['', '']
    })
    setSelectedPoll(null)
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }))
  }

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      toast.error('Au moins 2 options sont requises')
      return
    }
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }))
  }

  const handleCreate = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error('Le titre est requis')
      return
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Les dates sont requises')
      return
    }
    const validOptions = formData.options.filter(o => o.trim())
    if (validOptions.length < 2) {
      toast.error('Au moins 2 options sont requises')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          options: validOptions
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur')
      }

      toast.success('Sondage créé avec succès')
      setShowCreateDialog(false)
      resetForm()
      fetchPolls()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (pollId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sondage ?')) return

    try {
      const response = await fetch(`/api/admin/polls/${pollId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur')
      }

      toast.success('Sondage supprimé')
      fetchPolls()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const toggleActive = async (poll: Poll) => {
    try {
      const response = await fetch(`/api/admin/polls/${poll.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !poll.isActive })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur')
      }

      toast.success(poll.isActive ? 'Sondage désactivé' : 'Sondage activé')
      fetchPolls()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const getPollStatus = (poll: Poll) => {
    const now = new Date()
    const start = new Date(poll.startDate)
    const end = new Date(poll.endDate)

    if (!poll.isActive) return { label: 'Inactif', variant: 'secondary' as const, icon: XCircle }
    if (now < start) return { label: 'Planifié', variant: 'outline' as const, icon: Clock }
    if (now > end) return { label: 'Terminé', variant: 'destructive' as const, icon: CheckCircle }
    return { label: 'En cours', variant: 'default' as const, icon: BarChart3 }
  }

  const parseTargetRoles = (roles: string): string[] => {
    try {
      return JSON.parse(roles)
    } catch {
      return ['STUDENT', 'PARENT']
    }
  }

  const roleLabels: Record<string, string> = {
    STUDENT: 'Étudiants',
    PARENT: 'Parents',
    TEACHER: 'Enseignants',
    ALL: 'Tous'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Sondages</h2>
          <p className="text-muted-foreground text-sm">
            Créez et gérez des sondages pour votre communauté scolaire
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Sondage
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          Tous
        </Button>
        <Button 
          variant={filter === 'active' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('active')}
        >
          En cours
        </Button>
        <Button 
          variant={filter === 'ended' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('ended')}
        >
          Terminés
        </Button>
      </div>

      {/* Liste des sondages */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : polls.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun sondage</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre premier sondage pour recueillir l&apos;avis de votre communauté
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un sondage
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => {
            const status = getPollStatus(poll)
            const StatusIcon = status.icon

            return (
              <Card key={poll.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2">{poll.title}</CardTitle>
                      {poll.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {poll.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={status.variant} className="ml-2 shrink-0">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Statistiques */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{poll.totalResponses} votes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDistance(new Date(poll.endDate), new Date(), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Aperçu des résultats */}
                  <div className="space-y-2">
                    {poll.options.slice(0, 3).map((option) => (
                      <div key={option.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="truncate">{option.text}</span>
                          <span className="font-medium">{option.percentage}%</span>
                        </div>
                        <Progress value={option.percentage} className="h-1.5" />
                      </div>
                    ))}
                    {poll.options.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{poll.options.length - 3} autres options
                      </p>
                    )}
                  </div>

                  {/* Cibles */}
                  <div className="flex flex-wrap gap-1">
                    {parseTargetRoles(poll.targetRoles).map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {roleLabels[role] || role}
                      </Badge>
                    ))}
                    {poll.isAnonymous && (
                      <Badge variant="secondary" className="text-xs">Anonyme</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPoll(poll)
                        setShowResultsDialog(true)
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Résultats
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(poll)}
                    >
                      {poll.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(poll.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog Création */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un sondage</DialogTitle>
            <DialogDescription>
              Créez un nouveau sondage pour votre communauté scolaire
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du sondage *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Quel jour préférez-vous pour la réunion parents-professeurs ?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez le contexte de ce sondage..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Public cible</Label>
              <Select
                value={formData.targetRoles.join(',')}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  targetRoles: value.split(',') 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT,PARENT">Étudiants et Parents</SelectItem>
                  <SelectItem value="STUDENT">Étudiants uniquement</SelectItem>
                  <SelectItem value="PARENT">Parents uniquement</SelectItem>
                  <SelectItem value="TEACHER">Enseignants uniquement</SelectItem>
                  <SelectItem value="STUDENT,PARENT,TEACHER">Tout le monde</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Options de réponse *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Réponses anonymes</Label>
                <p className="text-xs text-muted-foreground">
                  Les votes ne seront pas associés aux utilisateurs
                </p>
              </div>
              <Switch
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => setFormData({ ...formData, isAnonymous: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Choix multiples</Label>
                <p className="text-xs text-muted-foreground">
                  Permettre de sélectionner plusieurs options
                </p>
              </div>
              <Switch
                checked={formData.allowMultiple}
                onCheckedChange={(checked) => setFormData({ ...formData, allowMultiple: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le sondage'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Résultats */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Résultats du sondage</DialogTitle>
            <DialogDescription>
              {selectedPoll?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedPoll && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedPoll.totalResponses} votes</span>
                </div>
              </div>

              <div className="space-y-3">
                {selectedPoll.options.map((option, index) => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{option.text}</span>
                      <span className="text-sm font-bold">{option.percentage}%</span>
                    </div>
                    <Progress 
                      value={option.percentage} 
                      className="h-3"
                    />
                    <p className="text-xs text-muted-foreground">
                      {option.responseCount} vote{option.responseCount > 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResultsDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
