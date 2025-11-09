'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Info, CheckCircle, Bell, Trash2 } from "lucide-react"
import { formatDistance } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from 'sonner'

interface School {
  id: string
  name: string
}

interface Issue {
  id: string
  title: string
  description: string
  priority: string
  status: string
  category: string
  reporterName: string
  reporterEmail: string
  createdAt: Date
  resolvedAt: Date | null
  resolution: string | null
  school: School
}

interface NotificationsManagerProps {
  initialIssues: Issue[]
}

export default function NotificationsManager({ initialIssues }: NotificationsManagerProps) {
  const [issues] = useState<Issue[]>(initialIssues)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [action, setAction] = useState<'view' | 'resolve' | 'delete' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [newStatus, setNewStatus] = useState('')
  const [resolution, setResolution] = useState('')

  const unreadCount = issues.filter(i => i.status === 'OPEN').length

  // Traductions
  const priorityLabels: Record<string, string> = {
    LOW: 'Faible',
    MEDIUM: 'Moyen',
    HIGH: 'Élevé',
    CRITICAL: 'Critique'
  }

  const categoryLabels: Record<string, string> = {
    TECHNICAL: 'Technique',
    BILLING: 'Facturation',
    FEATURE_REQUEST: 'Demande de fonctionnalité',
    OTHER: 'Autre'
  }

  const statusLabels: Record<string, string> = {
    OPEN: 'Ouvert',
    IN_PROGRESS: 'En cours',
    RESOLVED: 'Résolu',
    CLOSED: 'Fermé'
  }

  const handleMarkAllAsRead = async () => {
    setIsLoading(true)
    try {
      const openIssues = issues.filter(i => i.status === 'OPEN')
      
      for (const issue of openIssues) {
        await fetch('/api/super-admin/issues', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: issue.id,
            status: 'IN_PROGRESS'
          })
        })
      }

      toast.success('Tous les signalements marqués comme lus')
      window.location.reload()
    } catch (_error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedIssue) return

    setIsLoading(true)

    try {
      if (action === 'delete') {
        const response = await fetch(`/api/super-admin/issues?id=${selectedIssue.id}`, {
          method: 'DELETE'
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la suppression')
        }

        toast.success('Signalement supprimé')
      } else if (action === 'resolve') {
        const response = await fetch('/api/super-admin/issues', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedIssue.id,
            status: newStatus,
            resolution: resolution || undefined
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la mise à jour')
        }

        toast.success('Signalement mis à jour')
      }

      // Reset and reload
      setSelectedIssue(null)
      setAction(null)
      setNewStatus('')
      setResolution('')
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (issue: Issue, actionType: typeof action) => {
    setSelectedIssue(issue)
    setAction(actionType)
    if (actionType === 'resolve') {
      setNewStatus(issue.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED')
      setResolution(issue.resolution || '')
    }
  }

  const closeDialog = () => {
    setSelectedIssue(null)
    setAction(null)
    setNewStatus('')
    setResolution('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {unreadCount} signalement{unreadCount > 1 ? 's' : ''} non traité{unreadCount > 1 ? 's' : ''}
        </p>
        <Button 
          variant="outline" 
          onClick={handleMarkAllAsRead}
          disabled={isLoading || unreadCount === 0}
        >
          Tout marquer comme lu
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-2xl font-bold">
              {issues.filter(i => i.status === 'OPEN').length}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Info className="h-4 w-4 text-[var(--link)]" />
            </div>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-2xl font-bold text-[var(--link)]">
              {issues.filter(i => i.status === 'IN_PROGRESS').length}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Résolus</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-2xl font-bold text-success">
              {issues.filter(i => i.status === 'RESOLVED').length}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Critiques</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-2xl font-bold text-red-600">
              {issues.filter(i => i.priority === 'CRITICAL').length}
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des signalements */}
      <div className="space-y-4">
        {issues.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun signalement</h3>
              <p className="text-sm text-muted-foreground">
                Tous les signalements des écoles apparaîtront ici
              </p>
            </div>
          </Card>
        ) : (
          issues.map((issue) => {
          const Icon =
            issue.priority === 'CRITICAL' || issue.priority === 'HIGH'
              ? AlertTriangle
              : issue.status === 'RESOLVED'
                ? CheckCircle
                : Info

          const iconColor =
            issue.priority === 'CRITICAL'
              ? 'text-red-600 bg-red-100'
              : issue.priority === 'HIGH'
                ? 'text-[var(--chart-5)] bg-orange-100'
                : issue.status === 'RESOLVED'
                  ? 'text-success bg-green-100'
                  : 'text-[var(--link)] bg-blue-100'

          return (
            <Card key={issue.id} className={issue.status === 'OPEN' ? '' : 'opacity-60'}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{issue.title}</CardTitle>
                        {issue.status === 'OPEN' && (
                          <Badge variant="default">Nouveau</Badge>
                        )}
                        <Badge variant="outline">{priorityLabels[issue.priority] || issue.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-medium text-foreground">
                          {issue.school.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {issue.reporterName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistance(new Date(issue.createdAt), new Date(), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[issue.category] || issue.category}
                        </Badge>
                      </div>
                      {issue.resolution && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Résolution:</p>
                          <p className="text-sm text-muted-foreground">{issue.resolution}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {issue.status !== 'CLOSED' && (
                      <Button 
                        size="sm"
                        onClick={() => openDialog(issue, 'resolve')}
                      >
                        {issue.status === 'OPEN' ? 'Traiter' : 'Résoudre'}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openDialog(issue, 'view')}
                    >
                      Voir détails
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDialog(issue, 'delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })
        )}
      </div>

      {/* Dialog */}
      <Dialog open={!!selectedIssue && !!action} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">
              {action === 'view' && 'Détails du signalement'}
              {action === 'resolve' && 'Traiter le signalement'}
              {action === 'delete' && 'Supprimer le signalement'}
            </DialogTitle>
            <DialogDescription className="text-responsive-sm">
              {selectedIssue && selectedIssue.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {action === 'view' && selectedIssue && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label className="text-responsive-sm">École</Label>
                  <p className="text-responsive-sm mt-1">{selectedIssue.school.name}</p>
                </div>
                <div>
                  <Label className="text-responsive-sm">Rapporté par</Label>
                  <p className="text-responsive-sm mt-1">{selectedIssue.reporterName} ({selectedIssue.reporterEmail})</p>
                </div>
                <div>
                  <Label className="text-responsive-sm">Catégorie</Label>
                  <p className="text-responsive-sm mt-1">{categoryLabels[selectedIssue.category] || selectedIssue.category}</p>
                </div>
                <div>
                  <Label className="text-responsive-sm">Priorité</Label>
                  <p className="text-responsive-sm mt-1">{priorityLabels[selectedIssue.priority] || selectedIssue.priority}</p>
                </div>
                <div>
                  <Label className="text-responsive-sm">Statut</Label>
                  <p className="text-responsive-sm mt-1">{statusLabels[selectedIssue.status] || selectedIssue.status}</p>
                </div>
                <div>
                  <Label className="text-responsive-sm">Description</Label>
                  <p className="text-responsive-sm mt-1">{selectedIssue.description}</p>
                </div>
                {selectedIssue.resolution && (
                  <div>
                    <Label className="text-responsive-sm">Résolution</Label>
                    <p className="text-responsive-sm mt-1">{selectedIssue.resolution}</p>
                  </div>
                )}
              </div>
            )}

            {action === 'resolve' && (
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-responsive-sm">Nouveau statut</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="text-responsive-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_PROGRESS" className="text-responsive-sm">En cours</SelectItem>
                      <SelectItem value="RESOLVED" className="text-responsive-sm">Résolu</SelectItem>
                      <SelectItem value="CLOSED" className="text-responsive-sm">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolution" className="text-responsive-sm">Résolution / Notes</Label>
                  <Textarea
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={4}
                    placeholder="Décrivez la résolution ou ajoutez des notes..."
                    className="text-responsive-sm"
                  />
                </div>
              </div>
            )}

            {action === 'delete' && (
              <p className="text-responsive-sm text-destructive">
                Attention : Cette action est irréversible. Êtes-vous sûr de vouloir supprimer ce signalement ?
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
              {action === 'view' ? 'Fermer' : 'Annuler'}
            </Button>
            {action !== 'view' && (
              <Button 
                onClick={handleAction} 
                disabled={isLoading}
                variant={action === 'delete' ? 'destructive' : 'default'}
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Traitement...' : 'Confirmer'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
