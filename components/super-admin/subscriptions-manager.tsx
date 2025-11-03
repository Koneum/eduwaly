'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDistance } from "date-fns"
import { fr } from "date-fns/locale"
import { RefreshCw, Pause, Play, Trash2 } from "lucide-react"
import { toast } from 'sonner'

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
  school: School
  plan: Plan
}

interface SubscriptionsManagerProps {
  initialSubscriptions: Subscription[]
  plans: Plan[]
}

export default function SubscriptionsManager({ initialSubscriptions, plans }: SubscriptionsManagerProps) {
  const [subscriptions] = useState<Subscription[]>(initialSubscriptions)
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [action, setAction] = useState<'renew' | 'suspend' | 'activate' | 'change_plan' | 'delete' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [renewMonths, setRenewMonths] = useState('1')
  const [newPlanId, setNewPlanId] = useState('')

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

  const openDialog = (sub: Subscription, actionType: typeof action) => {
    setSelectedSub(sub)
    setAction(actionType)
    if (actionType === 'change_plan') {
      setNewPlanId(sub.plan.id)
    }
  }

  const closeDialog = () => {
    setSelectedSub(null)
    setAction(null)
    setRenewMonths('1')
    setNewPlanId('')
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
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>École</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.school.name}</TableCell>
                    <TableCell>{sub.plan.name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        sub.status === 'ACTIVE' ? 'default' :
                        sub.status === 'TRIAL' ? 'secondary' :
                        sub.status === 'PAST_DUE' ? 'destructive' : 'outline'
                      }>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistance(new Date(sub.currentPeriodStart), new Date(), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistance(new Date(sub.currentPeriodEnd), new Date(), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(sub.plan.price).toLocaleString()} FCFA
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(sub, 'renew')}
                          title="Renouveler"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {sub.status === 'ACTIVE' || sub.status === 'TRIAL' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(sub, 'suspend')}
                            title="Suspendre"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(sub, 'activate')}
                            title="Activer"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDialog(sub, 'delete')}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={!!selectedSub && !!action} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'renew' && 'Renouveler l\'abonnement'}
              {action === 'suspend' && 'Suspendre l\'abonnement'}
              {action === 'activate' && 'Activer l\'abonnement'}
              {action === 'change_plan' && 'Changer de plan'}
              {action === 'delete' && 'Supprimer l\'abonnement'}
            </DialogTitle>
            <DialogDescription>
              {selectedSub && `École: ${selectedSub.school.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {action === 'renew' && (
              <div className="space-y-2">
                <Label htmlFor="months">Nombre de mois</Label>
                <Input
                  id="months"
                  type="number"
                  min="1"
                  max="12"
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(e.target.value)}
                />
              </div>
            )}

            {action === 'change_plan' && (
              <div className="space-y-2">
                <Label htmlFor="plan">Nouveau plan</Label>
                <Select value={newPlanId} onValueChange={setNewPlanId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {Number(plan.price).toLocaleString()} FCFA/{plan.interval}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {action === 'suspend' && (
              <p className="text-sm text-muted-foreground">
                Êtes-vous sûr de vouloir suspendre cet abonnement ?
              </p>
            )}

            {action === 'activate' && (
              <p className="text-sm text-muted-foreground">
                Êtes-vous sûr de vouloir activer cet abonnement ?
              </p>
            )}

            {action === 'delete' && (
              <p className="text-sm text-destructive">
                Attention : Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cet abonnement ?
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={isLoading}
              variant={action === 'delete' ? 'destructive' : 'default'}
            >
              {isLoading ? 'Traitement...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
