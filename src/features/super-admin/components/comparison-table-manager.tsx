'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, GripVertical, FileText } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  displayName: string
  price: number
  interval: string
}

interface ComparisonValue {
  planId: string
  value: string
  plan: Plan
}

interface ComparisonRow {
  id: string
  category: string
  label: string
  order: number
  isActive: boolean
  values: ComparisonValue[]
}

interface ComparisonTableManagerProps {
  plans: Plan[]
  onPlansUpdate?: () => void
}

export default function ComparisonTableManager({ plans: initialPlans, onPlansUpdate }: ComparisonTableManagerProps) {
  const [rows, setRows] = useState<ComparisonRow[]>([])
  const [selectedRow, setSelectedRow] = useState<ComparisonRow | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [plans, setPlans] = useState<Plan[]>(initialPlans)

  // Fonction pour formater le prix
  const formatPrice = (price: number, interval: string) => {
    if (price === 0) return 'Gratuit'
    return `${price.toLocaleString()} FCFA/${interval === 'MONTHLY' ? 'mois' : 'an'}`
  }

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    label: '',
    order: '0',
    values: {} as Record<string, string>,
    useCheckboxes: false // Mode checkbox pour ✓/✗
  })

  // Charger les lignes
  const fetchRows = async () => {
    try {
      const response = await fetch('/api/super-admin/comparison-rows')
      if (response.ok) {
        const data = await response.json()
        setRows(data.rows)
      }
    } catch (error) {
      console.error('Erreur chargement lignes:', error)
    }
  }

  // Charger les plans dynamiquement
  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
        onPlansUpdate?.()
      }
    } catch (error) {
      console.error('Erreur chargement plans:', error)
    }
  }, [onPlansUpdate])

  useEffect(() => {
    fetchRows()
    fetchPlans()
  }, [fetchPlans])

  // Synchroniser les plans quand les props changent
  useEffect(() => {
    setPlans(initialPlans)
  }, [initialPlans])

  const resetForm = () => {
    setFormData({
      category: '',
      label: '',
      order: '0',
      values: {},
      useCheckboxes: false
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setMode('create')
    setSelectedRow(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (row: ComparisonRow) => {
    const values: Record<string, string> = {}
    let useCheckboxes = false
    
    row.values.forEach(v => {
      values[v.planId] = v.value
      // Détecter si c'est un mode checkbox (✓ ou ✗)
      if (v.value === '✓' || v.value === '✗') {
        useCheckboxes = true
      }
    })

    setFormData({
      category: row.category,
      label: row.label,
      order: row.order.toString(),
      values,
      useCheckboxes
    })
    setMode('edit')
    setSelectedRow(row)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const values = Object.entries(formData.values).map(([planId, value]) => ({
        planId,
        value
      }))

      const body = {
        category: formData.category,
        label: formData.label,
        order: parseInt(formData.order),
        values
      }

      const url = mode === 'create'
        ? '/api/super-admin/comparison-rows'
        : `/api/super-admin/comparison-rows/${selectedRow?.id}`

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      toast.success(mode === 'create' ? 'Ligne créée avec succès' : 'Ligne mise à jour')
      setIsDialogOpen(false)
      resetForm()
      await fetchRows()
      await fetchPlans()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (rowId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/super-admin/comparison-rows/${rowId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      toast.success('Ligne supprimée avec succès')
      await fetchRows()
      await fetchPlans()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsLoading(false)
    }
  }

  // Grouper par catégorie
  const groupedRows = rows.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = []
    }
    acc[row.category].push(row)
    return acc
  }, {} as Record<string, ComparisonRow[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tableau Comparatif</h2>
          <p className="text-muted-foreground text-sm">
            {rows.length} ligne(s) de comparaison
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une Ligne
        </Button>
      </div>

      {/* Liste des lignes par catégorie */}
      <div className="space-y-6">
        {rows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune ligne de comparaison</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Commencez par créer des lignes pour comparer les fonctionnalités entre les plans
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Créer la première ligne
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedRows).map(([category, categoryRows]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>{categoryRows.length} ligne(s)</CardDescription>
              </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{row.label}</p>
                        <div className="flex gap-2 mt-1">
                          {row.values.map((v) => (
                            <span key={v.planId} className="text-xs text-muted-foreground">
                              {v.plan.displayName}: {v.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(row)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Dialog Créer/Modifier - Responsive */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">
              {mode === 'create' ? 'Ajouter une Ligne' : 'Modifier la Ligne'}
            </DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Définissez les valeurs pour chaque plan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-responsive-sm">Catégorie</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Tarifs & Limites"
                  className="h-10 sm:h-11 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order" className="text-responsive-sm">Ordre</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  className="h-10 sm:h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label" className="text-responsive-sm">Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ex: Stockage, API & Webhooks"
                className="h-10 sm:h-11"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <Label className="text-base sm:text-lg font-semibold">Valeurs par Plan</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="useCheckboxes"
                    checked={formData.useCheckboxes}
                    onCheckedChange={(checked) => {
                      const newValues: Record<string, string> = {}
                      if (checked) {
                        // Convertir en mode checkbox
                        plans.forEach(plan => {
                          const currentValue = formData.values[plan.id] || ''
                          newValues[plan.id] = currentValue === '✓' || currentValue.toLowerCase().includes('oui') ? '✓' : '✗'
                        })
                      } else {
                        // Garder les valeurs actuelles
                        Object.assign(newValues, formData.values)
                      }
                      setFormData({ ...formData, useCheckboxes: !!checked, values: newValues })
                    }}
                  />
                  <Label htmlFor="useCheckboxes" className="text-xs sm:text-sm font-normal cursor-pointer">
                    Mode Oui/Non (✓/✗)
                  </Label>
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 border-2 rounded-lg bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col gap-1 min-w-[180px] sm:min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                        <span className="font-bold text-base sm:text-lg text-foreground">
                          {plan.displayName}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground pl-4 font-medium">
                        {formatPrice(plan.price, plan.interval)}
                      </span>
                    </div>
                    <div className="flex-1 pl-4 sm:pl-0">
                      {formData.useCheckboxes ? (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Checkbox
                            checked={formData.values[plan.id] === '✓'}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              values: { ...formData.values, [plan.id]: checked ? '✓' : '✗' }
                            })}
                          />
                          <span className="text-sm sm:text-base font-medium">
                            {formData.values[plan.id] === '✓' ? (
                              <span className="text-green-600 dark:text-green-400">✓ Inclus dans ce plan</span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">✗ Non inclus</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <Input
                          value={formData.values[plan.id] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            values: { ...formData.values, [plan.id]: e.target.value }
                          })}
                          placeholder="Ex: 5 GB, Illimité, 100 utilisateurs"
                          className="h-10 sm:h-11 font-medium"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 p-3 bg-muted/50 rounded-lg">
                {formData.useCheckboxes 
                  ? '💡 Cochez pour indiquer que la fonctionnalité est incluse dans le plan'
                  : '💡 Entrez une valeur personnalisée (Ex: 5 GB, Illimité, 100 utilisateurs)'}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Sauvegarde...' : mode === 'create' ? 'Créer' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
