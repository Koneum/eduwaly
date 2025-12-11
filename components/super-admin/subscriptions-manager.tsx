'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { formatDistance } from "date-fns"
import { fr } from "date-fns/locale"
import { RefreshCw, Pause, Play, Trash2, Settings, Eye, ArrowRightLeft, Building2, Users, GraduationCap, AlertTriangle, Check, X } from "lucide-react"
import { toast } from 'sonner'
import { MODULE_STRUCTURE, PREMIUM_FEATURES } from "@/lib/modules"

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
  const [modulesOverride, setModulesOverride] = useState<Record<string, boolean>>({})

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
          body.features = JSON.stringify({ modulesOverride })
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
      // Parse existing overrides
      try {
        const existing = sub.features ? JSON.parse(sub.features) : {}
        setModulesOverride(existing.modulesOverride || {})
      } catch {
        setModulesOverride({})
      }
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
    setModulesOverride({})
    setSchoolDetails(null)
  }

  const toggleModuleOverride = (moduleKey: string, enabled: boolean) => {
    setModulesOverride(prev => ({
      ...prev,
      [moduleKey]: enabled
    }))
  }

  const removeModuleOverride = (moduleKey: string) => {
    setModulesOverride(prev => {
      const newOverrides = { ...prev }
      delete newOverrides[moduleKey]
      return newOverrides
    })
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

      {/* Dialog - Design amélioré */}
      <Dialog open={!!selectedSub && !!action} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className={`max-w-[95vw] max-h-[90vh] overflow-y-auto ${action === 'customize' ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
          <DialogHeader className="space-y-3">
            {/* Icône et titre avec couleur selon l'action */}
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                action === 'renew' ? 'bg-blue-100 dark:bg-blue-900/30' :
                action === 'suspend' ? 'bg-amber-100 dark:bg-amber-900/30' :
                action === 'activate' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                action === 'change_plan' ? 'bg-purple-100 dark:bg-purple-900/30' :
                action === 'delete' ? 'bg-red-100 dark:bg-red-900/30' :
                action === 'customize' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                'bg-slate-100 dark:bg-slate-900/30'
              }`}>
                {action === 'renew' && <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                {action === 'suspend' && <Pause className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                {action === 'activate' && <Play className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                {action === 'change_plan' && <ArrowRightLeft className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                {action === 'delete' && <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />}
                {action === 'customize' && <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                {action === 'view_school' && <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {action === 'renew' && 'Renouveler l\'abonnement'}
                  {action === 'suspend' && 'Suspendre l\'abonnement'}
                  {action === 'activate' && 'Activer l\'abonnement'}
                  {action === 'change_plan' && 'Changer de plan'}
                  {action === 'delete' && 'Supprimer l\'abonnement'}
                  {action === 'customize' && 'Personnaliser les modules'}
                  {action === 'view_school' && 'Informations de l\'école'}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {selectedSub?.school.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            {/* RENOUVELER */}
            {action === 'renew' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-3">
                    Prolonger l&apos;abonnement de cette école
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="months" className="text-sm font-medium">Durée de renouvellement</Label>
                    <div className="flex gap-2">
                      {['1', '3', '6', '12'].map((m) => (
                        <Button
                          key={m}
                          type="button"
                          variant={renewMonths === m ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setRenewMonths(m)}
                          className="flex-1"
                        >
                          {m} mois
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <span className="text-sm">Nouvelle date de fin:</span>
                  <span className="font-medium">
                    {selectedSub && new Date(new Date(selectedSub.currentPeriodEnd).getTime() + parseInt(renewMonths) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            )}

            {/* CHANGER DE PLAN */}
            {action === 'change_plan' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-3">
                    Plan actuel: <span className="font-medium text-foreground">{selectedSub?.plan.name}</span>
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="plan" className="text-sm font-medium">Nouveau plan</Label>
                    <Select value={newPlanId} onValueChange={setNewPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex items-center justify-between gap-4">
                              <span>{plan.name}</span>
                              <span className="text-muted-foreground">
                                {Number(plan.price).toLocaleString()} FCFA
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* SUSPENDRE */}
            {action === 'suspend' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">Suspension de l&apos;abonnement</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        L&apos;école n&apos;aura plus accès à la plateforme jusqu&apos;à réactivation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVER */}
            {action === 'activate' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-800 dark:text-emerald-200">Réactivation de l&apos;abonnement</p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                        L&apos;école retrouvera immédiatement l&apos;accès à la plateforme.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUPPRIMER */}
            {action === 'delete' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <X className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">Suppression définitive</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Cette action est irréversible. L&apos;abonnement sera définitivement supprimé.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOMISER LES MODULES */}
            {action === 'customize' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Activez ou désactivez des modules spécifiquement pour cette école, indépendamment de son plan.
                </p>

                {/* Modules principaux */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Modules</h4>
                  <div className="grid gap-2">
                    {Object.entries(MODULE_STRUCTURE).map(([moduleKey, mod]) => {
                      const Icon = mod.icon
                      const hasOverride = moduleKey in modulesOverride
                      const isEnabled = hasOverride ? modulesOverride[moduleKey] : true
                      
                      return (
                        <div 
                          key={moduleKey}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            hasOverride 
                              ? isEnabled 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-muted/30 border-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${hasOverride ? (isEnabled ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-red-100 dark:bg-red-800') : 'bg-muted'}`}>
                              <Icon className={`h-4 w-4 ${hasOverride ? (isEnabled ? 'text-emerald-600' : 'text-red-600') : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{mod.label}</p>
                              <p className="text-xs text-muted-foreground">{mod.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasOverride && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeModuleOverride(moduleKey)}
                                className="h-8 px-2 text-xs"
                              >
                                Réinitialiser
                              </Button>
                            )}
                            <Switch 
                              checked={isEnabled}
                              onCheckedChange={(checked) => toggleModuleOverride(moduleKey, checked)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Features Premium */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="text-sm font-medium">Fonctionnalités Premium</h4>
                  <div className="grid gap-2">
                    {Object.entries(PREMIUM_FEATURES).map(([featureKey, feature]) => {
                      const Icon = feature.icon
                      const hasOverride = featureKey in modulesOverride
                      const isEnabled = hasOverride ? modulesOverride[featureKey] : false
                      
                      return (
                        <div 
                          key={featureKey}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            hasOverride && isEnabled
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'bg-muted/30 border-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${hasOverride && isEnabled ? 'bg-blue-100 dark:bg-blue-800' : 'bg-muted'}`}>
                              <Icon className={`h-4 w-4 ${hasOverride && isEnabled ? 'text-blue-600' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{feature.label}</p>
                              <p className="text-xs text-muted-foreground">{feature.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasOverride && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeModuleOverride(featureKey)}
                                className="h-8 px-2 text-xs"
                              >
                                Réinitialiser
                              </Button>
                            )}
                            <Switch 
                              checked={isEnabled}
                              onCheckedChange={(checked) => toggleModuleOverride(featureKey, checked)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Résumé des overrides */}
                {Object.keys(modulesOverride).length > 0 && (
                  <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200">
                      {Object.keys(modulesOverride).length} personnalisation(s) active(s)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* VOIR L'ÉCOLE */}
            {action === 'view_school' && schoolDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Nom</p>
                    <p className="font-medium">{schoolDetails.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <Badge variant="outline">{schoolDetails.schoolType}</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm">{schoolDetails.email}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Téléphone</p>
                    <p className="text-sm">{schoolDetails.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                    <GraduationCap className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{schoolDetails._count.students}</p>
                    <p className="text-xs text-muted-foreground">Étudiants</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center">
                    <Users className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
                    <p className="text-2xl font-bold text-emerald-600">{schoolDetails._count.enseignants}</p>
                    <p className="text-xs text-muted-foreground">Enseignants</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Statut</span>
                  <Badge variant={schoolDetails.isActive ? 'default' : 'destructive'}>
                    {schoolDetails.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row border-t pt-4">
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
