"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface EvaluationType {
  id: string
  name: string
  category: string
  weight: number
}

interface EvaluationTypesManagerProps {
  evaluationTypes: EvaluationType[]
  schoolId: string
  isHighSchool: boolean
}

export default function EvaluationTypesManager({ evaluationTypes, schoolId, isHighSchool }: EvaluationTypesManagerProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<EvaluationType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'HOMEWORK',
    weight: '1.0'
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Veuillez entrer un nom')
      return
    }

    setIsSaving(true)

    try {
      const url = editingType 
        ? `/api/admin/grading/evaluation-types/${editingType.id}`
        : '/api/admin/grading/evaluation-types'
      
      const response = await fetch(url, {
        method: editingType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          ...formData,
          weight: parseFloat(formData.weight)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la sauvegarde')
        return
      }

      toast.success(editingType ? 'Type modifié' : 'Type créé')
      setIsDialogOpen(false)
      setEditingType(null)
      setFormData({ name: '', category: 'HOMEWORK', weight: '1.0' })
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce type d\'évaluation ?')) return

    try {
      const response = await fetch(`/api/admin/grading/evaluation-types/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la suppression')
        return
      }

      toast.success('Type supprimé')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const openEditDialog = (type: EvaluationType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      category: type.category,
      weight: type.weight.toString()
    })
    setIsDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-responsive-base sm:text-responsive-lg">
                Types d&apos;Évaluations
              </CardTitle>
              <CardDescription className="text-responsive-xs sm:text-responsive-sm">
                Gérez les types d&apos;évaluations et leurs poids dans le calcul
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto text-responsive-sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="space-y-2">
            {evaluationTypes.map((type) => (
              <div
                key={type.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-2"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-responsive-sm">{type.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant={type.category === 'EXAM' ? 'default' : 'secondary'} className="text-[10px] sm:text-responsive-xs">
                      {type.category === 'EXAM' ? 'Examen' : 'Devoir'}
                    </Badge>
                    <span className="text-responsive-xs text-muted-foreground">
                      Poids: {type.weight}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(type)}
                    className="text-responsive-xs"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                    className="text-responsive-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {evaluationTypes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-responsive-sm">
                Aucun type d&apos;évaluation. Cliquez sur &quot;Ajouter&quot; pour commencer.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[98vw] sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-responsive-base sm:text-responsive-lg">
              {editingType ? 'Modifier' : 'Ajouter'} un Type
            </DialogTitle>
            <DialogDescription className="text-responsive-xs sm:text-responsive-sm">
              Définissez le nom, la catégorie et le poids
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-responsive-sm">Nom *</Label>
              <Input
                placeholder="Ex: Devoir, Examen, Projet..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-card text-responsive-sm"
              />
            </div>

            <div>
              <Label className="text-responsive-sm">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-card text-responsive-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="HOMEWORK" className="text-responsive-sm">Devoir (Homework)</SelectItem>
                  <SelectItem value="EXAM" className="text-responsive-sm">Examen (Exam)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-responsive-sm">Poids *</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="1.0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="bg-card text-responsive-sm"
              />
              <p className="text-[10px] sm:text-responsive-xs text-muted-foreground mt-1">
                Exemple: 2.0 pour doubler le poids dans le calcul
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="w-full sm:w-auto text-responsive-sm"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto text-responsive-sm"
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
