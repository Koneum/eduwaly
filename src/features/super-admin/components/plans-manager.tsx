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
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  displayName: string
  price: number
  interval: string
  description: string | null
  features: string | string[] | null // Peut être un JSON string, un tableau direct, ou null
  maxStudents: number
  maxTeachers: number
  isActive: boolean
  isPopular: boolean
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
    setMode('edit')
    setSelectedPlan(plan)
    setIsDialogOpen(true)
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
                  {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} FCFA`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {plan.interval === 'MONTHLY' ? 'par mois' : 'par an'}
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
              {mode === 'create' ? 'Créer un nouveau plan' : 'Modifier le plan'}
            </DialogTitle>
            <DialogDescription>
              Configurez les détails du plan d&apos;abonnement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
          </div>

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
