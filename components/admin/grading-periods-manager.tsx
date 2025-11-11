"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface GradingPeriod {
  id: string
  name: string
  startDate: Date
  endDate: Date
  isActive: boolean
}

interface GradingPeriodsManagerProps {
  gradingPeriods: GradingPeriod[]
  schoolId: string
  gradingSystem: string
}

export default function GradingPeriodsManager({ gradingPeriods, schoolId, gradingSystem }: GradingPeriodsManagerProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<GradingPeriod | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setIsSaving(true)

    try {
      const url = editingPeriod 
        ? `/api/admin/grading/periods/${editingPeriod.id}`
        : '/api/admin/grading/periods'
      
      const response = await fetch(url, {
        method: editingPeriod ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          ...formData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la sauvegarde')
        return
      }

      toast.success(editingPeriod ? 'Période modifiée' : 'Période créée')
      setIsDialogOpen(false)
      setEditingPeriod(null)
      setFormData({ name: '', startDate: '', endDate: '' })
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditDialog = (period: GradingPeriod) => {
    setEditingPeriod(period)
    setFormData({
      name: period.name,
      startDate: format(new Date(period.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(period.endDate), 'yyyy-MM-dd')
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
                Périodes de Notation
              </CardTitle>
              <CardDescription className="text-responsive-xs sm:text-responsive-sm">
                {gradingSystem === 'TRIMESTER' ? 'Trimestres' : 'Semestres'} de l&apos;année scolaire
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto text-responsive-sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gradingPeriods.map((period) => (
              <div
                key={period.id}
                className="p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-responsive-sm">{period.name}</h3>
                  <Badge variant={period.isActive ? 'default' : 'secondary'} className="text-[10px]">
                    {period.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="space-y-1 text-responsive-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Début: {format(new Date(period.startDate), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Fin: {format(new Date(period.endDate), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(period)}
                  className="w-full mt-3 text-responsive-xs"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
              </div>
            ))}
            {gradingPeriods.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground text-responsive-sm">
                Aucune période définie. Cliquez sur &quot;Ajouter&quot; pour commencer.
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
              {editingPeriod ? 'Modifier' : 'Ajouter'} une Période
            </DialogTitle>
            <DialogDescription className="text-responsive-xs sm:text-responsive-sm">
              Définissez le nom et les dates de la période
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-responsive-sm">Nom *</Label>
              <Input
                placeholder="Ex: Trimestre 1, Semestre 1..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-card text-responsive-sm"
              />
            </div>

            <div>
              <Label className="text-responsive-sm">Date de début *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-card text-responsive-sm"
              />
            </div>

            <div>
              <Label className="text-responsive-sm">Date de fin *</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="bg-card text-responsive-sm"
              />
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
