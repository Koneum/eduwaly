'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, CheckCircle, Clock, Eye, Trash2, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/navigation'

interface Issue {
  id: string
  schoolId: string
  reportedBy: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  category: 'TECHNICAL' | 'BILLING' | 'FEATURE_REQUEST' | 'BUG' | 'OTHER'
  resolution?: string | null
  resolvedBy?: string | null
  resolvedAt?: Date | null
  createdAt: Date
  school: {
    name: string
  }
}

export default function IssuesManager() {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isResolveOpen, setIsResolveOpen] = useState(false)
  const [resolution, setResolution] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadIssues()
  }, [statusFilter])

  const loadIssues = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/super-admin/issues'
        : `/api/super-admin/issues?status=${statusFilter}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setIssues(data.issues || [])
      }
    } catch (error) {
      console.error('Erreur chargement signalements:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (issue: Issue) => {
    setSelectedIssue(issue)
    setIsDetailOpen(true)
  }

  const handleResolve = (issue: Issue) => {
    setSelectedIssue(issue)
    setResolution('')
    setIsResolveOpen(true)
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selectedIssue) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/super-admin/issues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedIssue.id,
          status,
          resolution: status === 'RESOLVED' || status === 'CLOSED' ? resolution : undefined
        })
      })

      if (response.ok) {
        toast.success('Statut mis à jour')
        setIsResolveOpen(false)
        setIsDetailOpen(false)
        loadIssues()
        router.refresh()
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) return

    try {
      const response = await fetch(`/api/super-admin/issues?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Signalement supprimé')
        loadIssues()
        router.refresh()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      LOW: { variant: "secondary", label: "Faible" },
      MEDIUM: { variant: "default", label: "Moyen" },
      HIGH: { variant: "destructive", label: "Élevé" },
      CRITICAL: { variant: "destructive", label: "Critique" }
    }
    const config = variants[priority] || variants.MEDIUM
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: React.ReactNode, label: string, className: string }> = {
      OPEN: { icon: <AlertCircle className="h-3 w-3" />, label: "Ouvert", className: "bg-red-100 text-red-800" },
      IN_PROGRESS: { icon: <Clock className="h-3 w-3" />, label: "En cours", className: "bg-primary/10 text-primary" },
      RESOLVED: { icon: <CheckCircle className="h-3 w-3" />, label: "Résolu", className: "badge-success" },
      CLOSED: { icon: <CheckCircle className="h-3 w-3" />, label: "Fermé", className: "bg-muted text-foreground" }
    }
    const config = variants[status] || variants.OPEN
    return (
      <Badge className={config.className}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    )
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      TECHNICAL: "Technique",
      BILLING: "Facturation",
      FEATURE_REQUEST: "Demande de fonctionnalité",
      BUG: "Bug",
      OTHER: "Autre"
    }
    return labels[category] || category
  }

  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'OPEN').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--link)]">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Résolus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des signalements */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Signalements & Problèmes</CardTitle>
              <CardDescription>Gérez les signalements des écoles</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="OPEN">Ouverts</SelectItem>
                <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                <SelectItem value="RESOLVED">Résolus</SelectItem>
                <SelectItem value="CLOSED">Fermés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Aucun signalement trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>École</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.school.name}</TableCell>
                    <TableCell>{issue.title}</TableCell>
                    <TableCell>{getCategoryLabel(issue.category)}</TableCell>
                    <TableCell>{getPriorityBadge(issue.priority)}</TableCell>
                    <TableCell>{getStatusBadge(issue.status)}</TableCell>
                    <TableCell>{new Date(issue.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewDetails(issue)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {issue.status !== 'RESOLVED' && issue.status !== 'CLOSED' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleResolve(issue)}
                          >
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(issue.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du Signalement</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">École</Label>
                  <p className="font-medium">{selectedIssue.school.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Catégorie</Label>
                  <p className="font-medium">{getCategoryLabel(selectedIssue.category)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priorité</Label>
                  <div className="mt-1">{getPriorityBadge(selectedIssue.priority)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <div className="mt-1">{getStatusBadge(selectedIssue.status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Titre</Label>
                <p className="font-medium">{selectedIssue.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedIssue.description}</p>
              </div>
              {selectedIssue.resolution && (
                <div>
                  <Label className="text-muted-foreground">Résolution</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedIssue.resolution}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Créé le {new Date(selectedIssue.createdAt).toLocaleString('fr-FR')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Résoudre */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Traiter le Signalement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution">Note de résolution (optionnel)</Label>
              <Textarea
                id="resolution"
                placeholder="Décrivez comment le problème a été résolu..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="secondary"
              onClick={() => handleUpdateStatus('IN_PROGRESS')}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Marquer en cours
            </Button>
            <Button 
              onClick={() => handleUpdateStatus('RESOLVED')}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Marquer résolu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
