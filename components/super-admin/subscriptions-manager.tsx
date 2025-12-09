'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDistance } from "date-fns"
import { fr } from "date-fns/locale"
import { RefreshCw, Pause, Play, Trash2, Info, Settings, Eye, ArrowRightLeft } from "lucide-react"
import { toast } from 'sonner'
import { Textarea } from "@/components/ui/textarea"

interface Plan {
  id: string
  name: string
  price: number
  interval: string
}

interface School {
  id: string
  name: string
}

interface Subscription {
  id: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  features?: string // JSON pour customisation Enterprise
  school: School
  plan: Plan
}

interface SchoolDetails {
  name: string
  email: string
  phone: string | null
  address: string | null
  schoolType: string
  isActive: boolean
  createdAt: Date
  _count: {
    students: number
    enseignants: number
  }
}

interface SubscriptionsManagerProps {
  initialSubscriptions: Subscription[]
  plans: Plan[]
}

export default function SubscriptionsManager({ initialSubscriptions, plans }: SubscriptionsManagerProps) {
  const [subscriptions] = useState<Subscription[]>(initialSubscriptions)
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [action, setAction] = useState<'renew' | 'suspend' | 'activate' | 'change_plan' | 'delete' | 'customize' | 'view_school' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails | null>(null)
  
  // Form state
  const [renewMonths, setRenewMonths] = useState('1')
  const [newPlanId, setNewPlanId] = useState('')
  const [customFeatures, setCustomFeatures] = useState('')

  const stats = {
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    trial: subscriptions.filter(s => s.status === 'TRIAL').length,
    pastDue: subscriptions.filter(s => s.status === 'PAST_DUE').length,
    canceled: subscriptions.filter(s => s.status === 'CANCELED').length,
  }

  const handleAction = async () => {
    if (!selectedSub || !action) return

    setIsLoading(true)

    try {
      if (action === 'delete') {
        const response = await fetch(`/api/super-admin/subscriptions?id=${selectedSub.id}`, {
          method: 'DELETE'
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la suppression')
        }

        toast.success('Abonnement supprimé')
      } else {
        const body: Record<string, unknown> = {
          subscriptionId: selectedSub.id,
          action
        }

        if (action === 'renew') {
          body.months = parseInt(renewMonths)
        } else if (action === 'change_plan') {
          body.planId = newPlanId
        } else if (action === 'customize') {
          body.features = customFeatures
        }

        const response = await fetch('/api/super-admin/subscriptions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la mise à jour')
        }

        toast.success('Abonnement mis à jour')
      }

      // Reset and reload
      setSelectedSub(null)
      setAction(null)
      setRenewMonths('1')
      setNewPlanId('')
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = async (sub: Subscription, actionType: typeof action) => {
    setSelectedSub(sub)
    setAction(actionType)
    if (actionType === 'change_plan') {
      setNewPlanId(sub.plan.id)
    } else if (actionType === 'customize') {
      setCustomFeatures(sub.features || '')
    } else if (actionType === 'view_school') {
      // Charger les détails de l'école
      try {
        const response = await fetch(`/api/schools/${sub.school.id}`)
        if (response.ok) {
          const data = await response.json()
          setSchoolDetails(data)
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des détails')
      }
    }
  }

  const closeDialog = () => {
    setSelectedSub(null)
    setAction(null)
    setRenewMonths('1')
    setNewPlanId('')
    setCustomFeatures('')
    setSchoolDetails(null)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Essai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--link)]">{stats.trial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--chart-5)]">{stats.pastDue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annulés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.canceled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les Abonnements</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={subscriptions}
            columns={[
              {
                header: "École",
                accessor: (sub) => sub.school.name,
                priority: "high",
                className: "font-medium"
              },
              {
                header: "Plan",
                accessor: (sub) => sub.plan.name,
                priority: "high"
              },
              {
                header: "Statut",
                accessor: (sub) => (
                  <Badge variant={
                    sub.status === 'ACTIVE' ? 'default' :
                    sub.status === 'TRIAL' ? 'secondary' :
                    sub.status === 'PAST_DUE' ? 'destructive' : 'outline'
                  }>
                    {sub.status}
                  </Badge>
                ),
                priority: "high"
              },
              {
                header: "Début",
                accessor: (sub) => formatDistance(new Date(sub.currentPeriodStart), new Date(), { 
                  addSuffix: true, 
                  locale: fr 
                }),
                priority: "medium"
              },
              {
                header: "Fin",
                accessor: (sub) => formatDistance(new Date(sub.currentPeriodEnd), new Date(), { 
                  addSuffix: true, 
                  locale: fr 
                }),
                priority: "medium"
              },
              {
                header: "Prix",
                accessor: (sub) => `${Number(sub.plan.price).toLocaleString()} FCFA`,
                priority: "medium",
                className: "text-right font-medium"
              }
            ]}
            keyExtractor={(sub) => sub.id}
            actions={(sub) => (
              <div className="flex gap-1 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="btn-outline-adaptive"
                  onClick={() => openDialog(sub, 'view_school')}
                  title="Voir infos école"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="btn-outline-adaptive"
                  onClick={() => openDialog(sub, 'customize')}
                  title="Customiser plan"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="btn-outline-adaptive"
                  onClick={() => openDialog(sub, 'change_plan')}
                  title="Changer de plan"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="btn-outline-adaptive"
                  onClick={() => openDialog(sub, 'renew')}
                  title="Renouveler"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {sub.status === 'ACTIVE' || sub.status === 'TRIAL' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="btn-outline-adaptive"
                    onClick={() => openDialog(sub, 'suspend')}
                    title="Suspendre"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="btn-outline-adaptive"
                    onClick={() => openDialog(sub, 'activate')}
                    title="Activer"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="btn-destructive-adaptive"
                  onClick={() => openDialog(sub, 'delete')}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            emptyMessage="Aucun abonnement"
          />
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={!!selectedSub && !!action} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">
              {action === 'renew' && 'Renouveler l\'abonnement'}
              {action === 'suspend' && 'Suspendre l\'abonnement'}
              {action === 'activate' && 'Activer l\'abonnement'}
              {action === 'change_plan' && 'Changer de plan'}
              {action === 'delete' && 'Supprimer l\'abonnement'}
              {action === 'customize' && 'Customiser le plan'}
              {action === 'view_school' && 'Informations de l\'école'}
            </DialogTitle>
            <DialogDescription className="text-responsive-sm">
              {selectedSub && `École: ${selectedSub.school.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {action === 'renew' && (
              <div className="space-y-2">
                <Label htmlFor="months" className="text-responsive-sm">Nombre de mois</Label>
                <Input
                  id="months"
                  type="number"
                  min="1"
                  max="12"
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(e.target.value)}
                  className="text-responsive-sm"
                />
              </div>
            )}

            {action === 'change_plan' && (
              <div className="space-y-2">
                <Label htmlFor="plan" className="text-responsive-sm">Nouveau plan</Label>
                <Select value={newPlanId} onValueChange={setNewPlanId}>
                  <SelectTrigger className="text-responsive-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id} className="text-responsive-sm">
                        {plan.name} - {Number(plan.price).toLocaleString()} FCFA/{plan.interval}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {action === 'suspend' && (
              <p className="text-responsive-sm text-muted-foreground">
                Êtes-vous sûr de vouloir suspendre cet abonnement ?
              </p>
            )}

            {action === 'activate' && (
              <p className="text-responsive-sm text-muted-foreground">
                Êtes-vous sûr de vouloir activer cet abonnement ?
              </p>
            )}

            {action === 'delete' && (
              <p className="text-responsive-sm text-destructive">
                Attention : Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cet abonnement ?
              </p>
            )}

            {action === 'customize' && (
              <div className="space-y-2">
                <Label htmlFor="features" className="text-responsive-sm">
                  Fonctionnalités personnalisées (JSON)
                </Label>
                <Textarea
                  id="features"
                  value={customFeatures}
                  onChange={(e) => setCustomFeatures(e.target.value)}
                  placeholder='{"maxStudents": 5000, "customFeature": true}'
                  rows={6}
                  className="text-responsive-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Format JSON pour les fonctionnalités Enterprise personnalisées
                </p>
              </div>
            )}

            {action === 'view_school' && schoolDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nom</p>
                    <p className="text-sm font-semibold">{schoolDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{schoolDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                    <p className="text-sm">{schoolDetails.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p className="text-sm">{schoolDetails.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Statut</p>
                    <Badge variant={schoolDetails.isActive ? 'default' : 'destructive'}>
                      {schoolDetails.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                    <p className="text-sm">
                      {new Date(schoolDetails.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Statistiques</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{schoolDetails._count.students} étudiants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{schoolDetails._count.enseignants} enseignants</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
              {action === 'view_school' ? 'Fermer' : 'Annuler'}
            </Button>
            {action !== 'view_school' && (
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
