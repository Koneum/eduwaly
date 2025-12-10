'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, TrendingUp, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Scholarship {
  id: string
  name: string
  type: string
  percentage: number | null
  amount: number | null
  student: {
    user: {
      name: string
    } | null
    studentNumber: string
    niveau: string
    filiere: {
      nom: string
    } | null
  }
}

interface ScholarshipsManagerProps {
  schoolId: string
  scholarships: Scholarship[]
}

export default function ScholarshipsManager({ schoolId, scholarships }: ScholarshipsManagerProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'MERIT',
    percentage: '',
    amount: '',
    description: ''
  })

  // Séparer les bourses attribuées et non attribuées
  const assignedScholarships = scholarships.filter(s => s.student)
  const unassignedScholarships = scholarships.filter(s => !s.student)

  // Calculer les statistiques
  const totalScholarships = assignedScholarships.length
  const totalReduction = assignedScholarships.reduce((sum, s) => {
    if (s.percentage && s.student) {
      // Estimation basée sur un frais moyen (à améliorer avec les vrais frais)
      return sum + (150000 * (s.percentage / 100))
    }
    if (s.amount) return sum + s.amount
    return sum
  }, 0)

  const getScholarshipTypeLabel = (type: string) => {
    switch (type) {
      case 'MERIT': return 'Mérite'
      case 'NEED_BASED': return 'Sociale'
      case 'DISCOUNT': return 'Réduction'
      case 'SPORTS': return 'Sportive'
      default: return type
    }
  }

  const getScholarshipTypeBadge = (type: string) => {
    switch (type) {
      case 'MERIT': return 'default'
      case 'NEED_BASED': return 'secondary'
      case 'DISCOUNT': return 'outline'
      case 'SPORTS': return 'default'
      default: return 'secondary'
    }
  }

  const handleOpenDialog = (scholarship?: Scholarship) => {
    if (scholarship) {
      setEditingScholarship(scholarship)
      setFormData({
        name: scholarship.name,
        type: scholarship.type,
        percentage: scholarship.percentage?.toString() || '',
        amount: scholarship.amount?.toString() || '',
        description: ''
      })
    } else {
      setEditingScholarship(null)
      setFormData({
        name: '',
        type: 'MERIT',
        percentage: '',
        amount: '',
        description: ''
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.type) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!formData.percentage && !formData.amount) {
      toast.error('Veuillez spécifier un pourcentage ou un montant')
      return
    }

    setLoading(true)
    try {
      const url = editingScholarship 
        ? `/api/school-admin/scholarships/${editingScholarship.id}`
        : '/api/school-admin/scholarships'
      
      const response = await fetch(url, {
        method: editingScholarship ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          name: formData.name,
          type: formData.type,
          percentage: formData.percentage ? parseInt(formData.percentage) : null,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          description: formData.description || null
        })
      })

      if (response.ok) {
        toast.success(editingScholarship ? 'Bourse modifiée avec succès' : 'Bourse créée avec succès')
        setIsDialogOpen(false)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'opération')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'opération')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bourse ?')) return

    try {
      const response = await fetch(`/api/school-admin/scholarships/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Bourse supprimée avec succès')
        router.refresh()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }


  return (
    <>
      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-xs font-medium">
              Bourses Attribuées
            </CardTitle>
            <Users className="icon-responsive text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold">{totalScholarships}</div>
            <p className="text-responsive-xs text-muted-foreground">
              Étudiants bénéficiaires
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-xs font-medium">
              Réduction Totale
            </CardTitle>
            <TrendingUp className="icon-responsive text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold">
              {totalReduction.toLocaleString()} FCFA
            </div>
            <p className="text-responsive-xs text-muted-foreground">
              Montant total des réductions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bourses Attribuées */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-responsive-lg">Bourses Attribuées</CardTitle>
              <CardDescription className="text-responsive-sm">Liste des bourses accordées aux étudiants</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => handleOpenDialog()} className="btn-responsive w-full sm:w-auto">
                <Plus className="icon-responsive mr-2" />
                Créer une Bourse
              </Button>
              <Button variant="outline" onClick={() => router.push(`/admin/${schoolId}/students`)} className="btn-responsive w-full sm:w-auto">
                <Users className="icon-responsive mr-2" />
                Gérer les Étudiants
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={assignedScholarships}
            columns={[
              {
                header: "Étudiant",
                accessor: (s) => s.student?.user?.name || 'Non inscrit',
                priority: "high",
                className: "font-medium"
              },
              {
                header: "Matricule",
                accessor: (s) => s.student?.studentNumber || '-',
                priority: "medium"
              },
              {
                header: "Niveau",
                accessor: (s) => s.student?.niveau || '-',
                priority: "low"
              },
              {
                header: "Filière",
                accessor: (s) => s.student?.filiere?.nom || '-',
                priority: "low"
              },
              {
                header: "Nom de la Bourse",
                accessor: "name",
                priority: "high"
              },
              {
                header: "Type",
                accessor: (s) => (
                  <Badge variant={getScholarshipTypeBadge(s.type) as "default" | "secondary" | "outline" | "destructive"}>
                    {getScholarshipTypeLabel(s.type)}
                  </Badge>
                ),
                priority: "medium"
              },
              {
                header: "Réduction",
                accessor: (s) => s.percentage ? `${s.percentage}%` : s.amount ? `${s.amount.toLocaleString()} FCFA` : '-',
                priority: "high",
                className: "text-right font-semibold"
              }
            ]}
            keyExtractor={(s) => s.id}
            actions={(s) => (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleOpenDialog(s)}
                  title="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDelete(s.id)}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
            emptyMessage="Aucune bourse attribuée. Allez dans la Gestion des Étudiants pour attribuer des bourses."
          />
        </CardContent>
      </Card>

      {/* Bourses Non Attribuées */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-responsive-lg text-orange-800">Bourses Non Attribuées</CardTitle>
              <CardDescription className="text-responsive-sm text-orange-700">
                Bourses créées en attente d&apos;attribution
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-orange-200 text-orange-800">
              {unassignedScholarships.length} bourse{unassignedScholarships.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={unassignedScholarships}
            columns={[
              {
                header: "Nom de la Bourse",
                accessor: "name",
                priority: "high",
                className: "font-medium"
              },
              {
                header: "Type",
                accessor: (s) => (
                  <Badge variant={getScholarshipTypeBadge(s.type) as "default" | "secondary" | "outline" | "destructive"}>
                    {getScholarshipTypeLabel(s.type)}
                  </Badge>
                ),
                priority: "medium"
              },
              {
                header: "Réduction",
                accessor: (s) => s.percentage ? `${s.percentage}%` : s.amount ? `${s.amount.toLocaleString()} FCFA` : '-',
                priority: "high",
                className: "text-right font-semibold"
              }
            ]}
            keyExtractor={(s) => s.id}
            actions={(s) => (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleOpenDialog(s)}
                  title="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDelete(s.id)}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
            emptyMessage="Toutes les bourses sont attribuées."
          />
        </CardContent>
      </Card>

      {/* Informations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-responsive-sm text-blue-800">
            💡 Comment attribuer une bourse ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-responsive-sm text-link">
            Pour attribuer une bourse à un étudiant, rendez-vous dans la section{' '}
            <strong>Gestion des Étudiants</strong>, sélectionnez un étudiant et cliquez sur{' '}
            <strong>&quot;Attribuer une Bourse&quot;</strong>. Vous pourrez définir le type de bourse, 
            le pourcentage ou le montant de réduction.
          </p>
        </CardContent>
      </Card>

      {/* Dialog Créer/Modifier Bourse */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">
              {editingScholarship ? 'Modifier la bourse' : 'Créer une bourse'}
            </DialogTitle>
            <DialogDescription className="text-responsive-sm">
              {editingScholarship 
                ? 'Modifiez les informations de la bourse' 
                : 'Créez une nouvelle bourse qui pourra être attribuée aux étudiants'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-responsive-sm">Nom de la bourse *</Label>
              <Input 
                id="name" 
                placeholder="Ex: Bourse d'excellence"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-responsive-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="type" className="text-responsive-sm">Type de bourse *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="text-responsive-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MERIT" className="text-responsive-sm">Mérite</SelectItem>
                  <SelectItem value="NEED_BASED" className="text-responsive-sm">Sociale</SelectItem>
                  <SelectItem value="SPORTS" className="text-responsive-sm">Sportive</SelectItem>
                  <SelectItem value="OTHER" className="text-responsive-sm">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="percentage" className="text-responsive-sm">Pourcentage (%)</Label>
                <Input 
                  id="percentage" 
                  type="number"
                  min="0"
                  max="100"
                  placeholder="50"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                  className="text-responsive-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="amount" className="text-responsive-sm">Montant (FCFA)</Label>
                <Input 
                  id="amount" 
                  type="number"
                  placeholder="100000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="text-responsive-sm"
                />
              </div>
            </div>

            <p className="text-responsive-xs text-muted-foreground">
              ⚠️ Remplissez soit le pourcentage, soit le montant (pas les deux)
            </p>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description" className="text-responsive-sm">Description (optionnel)</Label>
              <Input 
                id="description" 
                placeholder="Critères d'attribution..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="btn-responsive w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="btn-responsive w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingScholarship ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
