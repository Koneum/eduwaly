'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Check, X, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MODULE_STRUCTURE, PREMIUM_FEATURES } from "@/lib/modules"
import { toast } from 'sonner'

// Types pour les modules
type ModuleKey = keyof typeof MODULE_STRUCTURE

export interface Plan {
  id: string
  name: string
  displayName: string
  price: number
  interval: string
  description: string | null
  features: string | string[] | null
  modulesIncluded: string | string[] | null
  maxStudents: number
  maxTeachers: number
  isActive: boolean
  isPopular: boolean
}

// Helper pour parser les modules
function parseModules(modules: string | string[] | undefined | null): string[] {
  if (!modules) return Object.keys(MODULE_STRUCTURE)
  if (Array.isArray(modules)) return modules
  try {
    const parsed = JSON.parse(modules)
    return Array.isArray(parsed) ? parsed : Object.keys(MODULE_STRUCTURE)
  } catch {
    return Object.keys(MODULE_STRUCTURE)
  }
}

// Générer automatiquement les features depuis les modules activés
function generateFeaturesFromModules(
  modules: string[], 
  maxStudents: number, 
  maxTeachers: number
): string[] {
  const features: string[] = []
  
  // Limites
  features.push(`Jusqu'à ${maxStudents === -1 ? 'illimité' : maxStudents} étudiants`)
  features.push(`Jusqu'à ${maxTeachers === -1 ? 'illimité' : maxTeachers} enseignants`)
  
  // Modules activés avec leurs sous-modules
  Object.entries(MODULE_STRUCTURE).forEach(([key, mod]) => {
    if (modules.includes(key)) {
      const subModules = Object.values(mod.children).map(c => c.label).join(', ')
      features.push(`${mod.label} (${subModules})`)
    }
  })
  
  // Features premium
  Object.entries(PREMIUM_FEATURES).forEach(([key, feature]) => {
    if (modules.includes(key)) {
      features.push(feature.label)
    }
  })
  
  return features
}

// Helper pour parser les features
function parseFeatures(features: string | string[] | undefined | null): string[] {
  // Si c'est undefined, null ou vide, retourner un tableau vide
  if (!features) {
    return []
  }
  
  // Si c'est déjà un tableau, le retourner directement
  if (Array.isArray(features)) {
    return features
  }
  
  // Si c'est une chaîne, essayer de parser du JSON
  try {
    const parsed = JSON.parse(features)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Si le parsing JSON échoue, traiter comme une chaîne séparée par des sauts de ligne
    return features.split('\n').filter(f => f.trim())
  }
}

interface PlansManagerProps {
  initialPlans: Plan[]
}

interface ComparisonRow {
  id: string
  category: string
  label: string
  order: number
  values: Array<{
    planId: string
    value: string
    plan: {
      displayName: string
    }
  }>
}

export default function PlansManager({ initialPlans }: PlansManagerProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>([])

  // Fonction pour recharger les plans
  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/super-admin/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Erreur chargement plans:', error)
    }
  }

  // Fonction pour charger les lignes de comparaison
  const fetchComparisonRows = async () => {
    try {
      const response = await fetch('/api/super-admin/comparison-rows')
      if (response.ok) {
        const data = await response.json()
        setComparisonRows(data.rows || [])
      }
    } catch (error) {
      console.error('Erreur chargement lignes comparaison:', error)
    }
  }

  // Recharger les plans et lignes au montage
  useEffect(() => {
    fetchPlans()
    fetchComparisonRows()
  }, [])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    price: 0,
    interval: 'MONTHLY',
    description: '',
    features: '',
    maxStudents: '',
    maxTeachers: '',
    isActive: true,
    isPopular: false
  })
  
  // Modules state
  const [editingModules, setEditingModules] = useState<string[]>(Object.keys(MODULE_STRUCTURE))
  const [activeTab, setActiveTab] = useState("info")

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      price: 0,
      interval: 'MONTHLY',
      description: '',
      features: '',
      maxStudents: '',
      maxTeachers: '',
      isActive: true,
      isPopular: false
    })
    setEditingModules(Object.keys(MODULE_STRUCTURE))
    setActiveTab("info")
  }

  const openCreateDialog = () => {
    resetForm()
    setMode('create')
    setSelectedPlan(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (plan: Plan) => {
    setFormData({
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      interval: plan.interval,
      description: plan.description || '',
      features: parseFeatures(plan.features).join('\n'),
      maxStudents: plan.maxStudents.toString(),
      maxTeachers: plan.maxTeachers.toString(),
      isActive: plan.isActive,
      isPopular: plan.isPopular
    })
    setEditingModules(parseModules(plan.modulesIncluded))
    setActiveTab("info")
    setMode('edit')
    setSelectedPlan(plan)
    setIsDialogOpen(true)
  }

  // Toggle un module
  const toggleModule = (moduleKey: string) => {
    if (editingModules.includes(moduleKey)) {
      setEditingModules(prev => prev.filter(m => m !== moduleKey))
    } else {
      setEditingModules(prev => [...prev, moduleKey])
    }
  }

  // Compter les modules activés
  const getActiveModulesCount = (modules: string[]) => {
    return modules.filter(m => Object.keys(MODULE_STRUCTURE).includes(m)).length
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)

      const body = {
        name: formData.name,
        displayName: formData.displayName,
        price: formData.price,
        interval: formData.interval,
        description: formData.description,
        features: featuresArray,
        modulesIncluded: editingModules,
        maxStudents: parseInt(formData.maxStudents),
        maxTeachers: parseInt(formData.maxTeachers),
        isActive: formData.isActive,
        isPopular: formData.isPopular
      }

      const url = mode === 'create' 
        ? '/api/super-admin/plans'
        : `/api/super-admin/plans/${selectedPlan?.id}`

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      toast.success(mode === 'create' ? 'Plan créé avec succès' : 'Plan mis à jour')
      setIsDialogOpen(false)
      resetForm()
      await fetchPlans()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/super-admin/plans/${planId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      toast.success('Plan supprimé avec succès')
      await fetchPlans()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number, interval: string) => {
    if (price === 0) return 'Gratuit'
    return `${price.toLocaleString()} FCFA/${interval === 'MONTHLY' ? 'mois' : 'an'}`
  }

  // State pour l'affichage mensuel/annuel
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  
  // Calcul du prix annuel avec 5% de réduction
  const getAnnualPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return 0
    const yearlyTotal = monthlyPrice * 12
    const discount = yearlyTotal * 0.05 // 5% de réduction
    return Math.round(yearlyTotal - discount)
  }

  // Prix affiché selon la période
  const getDisplayPrice = (plan: Plan) => {
    if (plan.price === 0) return 'Gratuit'
    if (billingPeriod === 'yearly') {
      return `${getAnnualPrice(plan.price).toLocaleString()} FCFA`
    }
    return `${plan.price.toLocaleString()} FCFA`
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Plans Disponibles</h2>
          <p className="text-muted-foreground text-sm">
            {plans.length} plan(s) configuré(s)
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un Plan
        </Button>
      </div>

      {/* Onglets Mensuel / Annuel */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted">
          <Button
            variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('monthly')}
            className="rounded-lg"
          >
            Mensuel
          </Button>
          <Button
            variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('yearly')}
            className="rounded-lg relative"
          >
            Annuel
            <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0">
              -5%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Grille des plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.isPopular ? 'border-primary border-2' : ''} ${!plan.isActive ? 'opacity-60' : ''}`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Recommandé
                </Badge>
              </div>
            )}

            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {plan.name}
                  </CardDescription>
                </div>
                <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                  {plan.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              <div className="mt-4">
                <div className="text-3xl font-bold text-primary">
                  {getDisplayPrice(plan)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {billingPeriod === 'yearly' ? 'par an' : 'par mois'}
                  {billingPeriod === 'yearly' && plan.price > 0 && (
                    <span className="ml-2 text-xs line-through text-muted-foreground/60">
                      {(plan.price * 12).toLocaleString()} FCFA
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{plan.maxStudents} étudiants max</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{plan.maxTeachers} enseignants max</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">Fonctionnalités :</div>
                <ul className="space-y-1">
                  {parseFeatures(plan.features).slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <Check className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {parseFeatures(plan.features).length > 4 && (
                    <li className="text-xs text-muted-foreground">
                      +{parseFeatures(plan.features).length - 4} autres...
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(plan)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(plan.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Créer/Modifier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Créer un nouveau plan' : `Modifier - ${selectedPlan?.displayName}`}
            </DialogTitle>
            <DialogDescription>
              Configurez les détails et les modules du plan
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="modules">
                Modules ({getActiveModulesCount(editingModules)}/{Object.keys(MODULE_STRUCTURE).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom technique *</Label>
                <Input
                  id="name"
                  placeholder="STARTER"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Nom affiché *</Label>
                <Input
                  id="displayName"
                  placeholder="Starter"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prix (FCFA) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="5000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Intervalle *</Label>
                <select
                  id="interval"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                >
                  <option value="MONTHLY">Mensuel</option>
                  <option value="YEARLY">Annuel</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Pour les petites écoles qui débutent..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxStudents">Étudiants max *</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  placeholder="100"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTeachers">Enseignants max *</Label>
                <Input
                  id="maxTeachers"
                  type="number"
                  placeholder="10"
                  value={formData.maxTeachers}
                  onChange={(e) => setFormData({ ...formData, maxTeachers: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Fonctionnalités (une par ligne) *</Label>
              <Textarea
                id="features"
                placeholder="Jusqu'à 100 étudiants&#10;10 enseignants&#10;Gestion des présences basique"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Entrez une fonctionnalité par ligne
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="isActive">Plan actif</Label>
                <p className="text-xs text-muted-foreground">
                  Les plans inactifs ne sont pas visibles
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="isPopular">Plan recommandé</Label>
                <p className="text-xs text-muted-foreground">
                  Affiche un badge &quot;Recommandé&quot;
                </p>
              </div>
              <Switch
                id="isPopular"
                checked={formData.isPopular}
                onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
              />
            </div>
            </TabsContent>

            <TabsContent value="modules" className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Activez ou désactivez les modules pour ce plan. Les écoles sur ce plan ne verront pas les modules désactivés.
              </p>

              {/* Modules principaux avec sous-modules */}
              <div className="space-y-3">
                {Object.entries(MODULE_STRUCTURE).map(([moduleKey, mod]) => {
                  const Icon = mod.icon
                  const isEnabled = editingModules.includes(moduleKey)
                  
                  return (
                    <Card key={moduleKey} className={`transition-all ${isEnabled ? '' : 'opacity-60'}`}>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                              <Icon className={`h-4 w-4 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-medium">{mod.label}</CardTitle>
                              <CardDescription className="text-xs">{mod.description}</CardDescription>
                            </div>
                          </div>
                          <Switch 
                            checked={isEnabled}
                            onCheckedChange={() => toggleModule(moduleKey)}
                          />
                        </div>
                      </CardHeader>
                      
                      {/* Sous-modules (affichés quand le module est activé) */}
                      {isEnabled && (
                        <CardContent className="pt-0 pb-3 px-4">
                          <div className="grid grid-cols-2 gap-2 pl-11">
                            {Object.entries(mod.children).map(([subKey, sub]) => (
                              <div 
                                key={subKey}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs"
                              >
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span>{sub.label}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>

              {/* Fonctionnalités Premium */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3 text-sm">Fonctionnalités Premium</h4>
                <div className="space-y-2">
                  {Object.entries(PREMIUM_FEATURES).map(([featureKey, feature]) => {
                    const Icon = feature.icon
                    const isEnabled = editingModules.includes(featureKey)
                    
                    return (
                      <div 
                        key={featureKey}
                        className={`flex items-center justify-between p-3 rounded-lg border ${isEnabled ? 'bg-blue-500/5 border-blue-500/20' : 'bg-muted/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-500/10' : 'bg-muted'}`}>
                            <Icon className={`h-4 w-4 ${isEnabled ? 'text-blue-500' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{feature.label}</p>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={isEnabled}
                          onCheckedChange={() => toggleModule(featureKey)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <strong>Note:</strong> Le super admin peut toujours activer/désactiver des modules individuellement pour chaque école via les overrides.
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Sauvegarde...' : mode === 'create' ? 'Créer' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tableau comparatif depuis la DB */}
      <Card>
        <CardHeader>
          <CardTitle>Tableau Comparatif des Plans</CardTitle>
          <CardDescription>
            Vue d&apos;ensemble des fonctionnalités par plan (géré dans l&apos;onglet Tableau Comparatif)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comparisonRows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune ligne de comparaison configurée.</p>
              <p className="text-sm mt-2">Allez dans l&apos;onglet &quot;Tableau Comparatif&quot; pour créer des lignes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Fonctionnalité</th>
                    {plans.filter(p => p.isActive).map(plan => (
                      <th key={plan.id} className="text-center p-4 font-semibold">
                        {plan.displayName}
                        <div className="text-xs font-normal text-muted-foreground mt-1">
                          {formatPrice(plan.price, plan.interval)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="p-4 font-medium">{row.label}</td>
                      {plans.filter(p => p.isActive).map(plan => {
                        const value = row.values.find(v => v.planId === plan.id)
                        return (
                          <td key={plan.id} className="text-center p-4">
                            {value?.value === '✓' ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : value?.value === '✗' ? (
                              <X className="h-5 w-5 text-gray-300 mx-auto" />
                            ) : (
                              <span>{value?.value || '-'}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
