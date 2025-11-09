'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { formatDistance } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  targetAudience: string[]
  isActive: boolean
  publishedAt: string
  expiresAt: string | null
  authorName: string
  authorRole: string
  school?: { id: string; name: string } | null
}

interface Props {
  isSuperAdmin?: boolean
}

export default function AnnouncementsManager({ isSuperAdmin = false }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<string>('NORMAL')
  const [targetAudience, setTargetAudience] = useState<string[]>(['ALL'])
  const [expiresAt, setExpiresAt] = useState('')

  const apiEndpoint = isSuperAdmin ? '/api/super-admin/announcements' : '/api/admin/announcements'

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      const response = await fetch(apiEndpoint)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement)
      setTitle(announcement.title)
      setContent(announcement.content)
      setPriority(announcement.priority)
      setTargetAudience(announcement.targetAudience)
      setExpiresAt(announcement.expiresAt || '')
    } else {
      setEditingAnnouncement(null)
      setTitle('')
      setContent('')
      setPriority('NORMAL')
      setTargetAudience(['ALL'])
      setExpiresAt('')
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const method = editingAnnouncement ? 'PUT' : 'POST'
      const body = {
        ...(editingAnnouncement && { id: editingAnnouncement.id }),
        title, content, priority, targetAudience,
        expiresAt: expiresAt || null
      }

      const response = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        loadAnnouncements()
        setDialogOpen(false)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive })
      })
      loadAnnouncements()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return
    try {
      await fetch(`${apiEndpoint}?id=${id}`, { method: 'DELETE' })
      loadAnnouncements()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'NORMAL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'LOW': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const priorityLabels: Record<string, string> = {
    LOW: 'Faible', NORMAL: 'Normal', HIGH: 'Élevé', URGENT: 'Urgent'
  }

  const toggleAudience = (role: string) => {
    if (role === 'ALL') {
      setTargetAudience(['ALL'])
    } else {
      const newAudience = targetAudience.includes(role)
        ? targetAudience.filter(a => a !== role)
        : [...targetAudience.filter(a => a !== 'ALL'), role]
      setTargetAudience(newAudience.length > 0 ? newAudience : ['ALL'])
    }
  }

  if (loading) return <div className="text-responsive-sm text-muted-foreground">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-responsive-xl font-bold">Annonces</h2>
          <p className="text-responsive-sm text-muted-foreground">
            {isSuperAdmin ? 'Annonces globales pour toutes les écoles' : 'Annonces pour votre établissement'}
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle annonce
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {announcements.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-responsive-lg font-semibold mb-2">Aucune annonce</h3>
              <p className="text-responsive-sm text-muted-foreground">Créez votre première annonce</p>
            </div>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className={!announcement.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <CardTitle className="text-responsive-base">{announcement.title}</CardTitle>
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {priorityLabels[announcement.priority]}
                      </Badge>
                      {!announcement.isActive && <Badge variant="outline">Désactivée</Badge>}
                    </div>
                    <p className="text-responsive-sm text-muted-foreground">{announcement.content}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-responsive-xs text-muted-foreground">
                      <span>{announcement.authorName}</span>
                      <span>
                        {formatDistance(new Date(announcement.publishedAt), new Date(), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </span>
                      <span>Public: {announcement.targetAudience.join(', ')}</span>
                      {announcement.school && <span>École: {announcement.school.name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(announcement.id, announcement.isActive)}
                    >
                      {announcement.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDialog(announcement)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAnnouncement(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">{editingAnnouncement ? 'Modifier' : 'Nouvelle'} annonce</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              {isSuperAdmin
                ? 'Cette annonce sera visible par toutes les écoles'
                : 'Cette annonce sera visible par votre établissement'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="title" className="text-responsive-sm">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de l'annonce"
                className="text-responsive-sm"
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-responsive-sm">Contenu</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Contenu de l'annonce"
                className="text-responsive-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="priority" className="text-responsive-sm">Priorité</Label>
                <Select value={priority || 'NORMAL'} onValueChange={setPriority}>
                  <SelectTrigger className="text-responsive-sm">
                    <SelectValue placeholder="Sélectionner une priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW" className="text-responsive-sm">Faible</SelectItem>
                    <SelectItem value="NORMAL" className="text-responsive-sm">Normal</SelectItem>
                    <SelectItem value="HIGH" className="text-responsive-sm">Élevé</SelectItem>
                    <SelectItem value="URGENT" className="text-responsive-sm">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiresAt" className="text-responsive-sm">Date d&apos;expiration (optionnel)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="text-responsive-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-responsive-sm">Public cible</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {['ALL', 'TEACHER', 'STUDENT', 'PARENT'].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={role}
                      checked={targetAudience.includes(role)}
                      onCheckedChange={() => toggleAudience(role)}
                    />
                    <label htmlFor={role} className="text-responsive-sm cursor-pointer">
                      {role === 'ALL' ? 'Tous' : role === 'TEACHER' ? 'Enseignants' : role === 'STUDENT' ? 'Étudiants' : 'Parents'}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleSubmit} className="w-full sm:w-auto">
              {editingAnnouncement ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
