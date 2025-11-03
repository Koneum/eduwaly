'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bourses Attribuées
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScholarships}</div>
            <p className="text-xs text-muted-foreground">
              Étudiants bénéficiaires
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Réduction Totale
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalReduction.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              Montant total des réductions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bourses Attribuées */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Bourses Attribuées</CardTitle>
              <CardDescription>Liste des bourses accordées aux étudiants</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une Bourse
              </Button>
              <Button variant="outline" onClick={() => router.push(`/admin/${schoolId}/students`)}>
                <Users className="mr-2 h-4 w-4" />
                Gérer les Étudiants
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {assignedScholarships.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Aucune bourse attribuée pour le moment.</p>
              <p className="text-sm mt-2">
                Allez dans la <strong>Gestion des Étudiants</strong> pour attribuer des bourses.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Nom de la Bourse</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Réduction</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedScholarships.map((scholarship) => (
                  <TableRow key={scholarship.id}>
                    <TableCell className="font-medium">
                      {scholarship.student?.user?.name || 'Non inscrit'}
                    </TableCell>
                    <TableCell>{scholarship.student?.studentNumber || '-'}</TableCell>
                    <TableCell>{scholarship.student?.niveau || '-'}</TableCell>
                    <TableCell>{scholarship.student?.filiere?.nom || '-'}</TableCell>
                    <TableCell>{scholarship.name}</TableCell>
                    <TableCell>
                      <Badge variant={getScholarshipTypeBadge(scholarship.type) as "default" | "secondary" | "outline" | "destructive"}>
                        {getScholarshipTypeLabel(scholarship.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {scholarship.percentage 
                        ? `${scholarship.percentage}%` 
                        : scholarship.amount 
                          ? `${scholarship.amount.toLocaleString()} FCFA` 
                          : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenDialog(scholarship)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(scholarship.id)}
                          title="Supprimer"
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

      {/* Bourses Non Attribuées */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-orange-800">Bourses Non Attribuées</CardTitle>
              <CardDescription className="text-orange-700">
                Bourses créées en attente d&apos;attribution
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-orange-200 text-orange-800">
              {unassignedScholarships.length} bourse{unassignedScholarships.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {unassignedScholarships.length === 0 ? (
            <div className="text-center py-6 text-orange-700">
              <p>Toutes les bourses sont attribuées.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de la Bourse</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Réduction</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedScholarships.map((scholarship) => (
                  <TableRow key={scholarship.id}>
                    <TableCell className="font-medium">{scholarship.name}</TableCell>
                    <TableCell>
                      <Badge variant={getScholarshipTypeBadge(scholarship.type) as "default" | "secondary" | "outline" | "destructive"}>
                        {getScholarshipTypeLabel(scholarship.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {scholarship.percentage 
                        ? `${scholarship.percentage}%` 
                        : scholarship.amount 
                          ? `${scholarship.amount.toLocaleString()} FCFA` 
                          : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenDialog(scholarship)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(scholarship.id)}
                          title="Supprimer"
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

      {/* Informations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 text-sm">
            💡 Comment attribuer une bourse ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--link)] text-sm">
            Pour attribuer une bourse à un étudiant, rendez-vous dans la section{' '}
            <strong>Gestion des Étudiants</strong>, sélectionnez un étudiant et cliquez sur{' '}
            <strong>&quot;Attribuer une Bourse&quot;</strong>. Vous pourrez définir le type de bourse, 
            le pourcentage ou le montant de réduction.
          </p>
        </CardContent>
      </Card>

      {/* Dialog Créer/Modifier Bourse */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingScholarship ? 'Modifier la bourse' : 'Créer une bourse'}
            </DialogTitle>
            <DialogDescription>
              {editingScholarship 
                ? 'Modifiez les informations de la bourse' 
                : 'Créez une nouvelle bourse qui pourra être attribuée aux étudiants'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la bourse *</Label>
              <Input 
                id="name" 
                placeholder="Ex: Bourse d'excellence"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de bourse *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MERIT">Mérite</SelectItem>
                  <SelectItem value="NEED_BASED">Sociale</SelectItem>
                  <SelectItem value="DISCOUNT">Réduction</SelectItem>
                  <SelectItem value="SPORTS">Sportive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="percentage">Pourcentage (%)</Label>
                <Input 
                  id="percentage" 
                  type="number"
                  min="0"
                  max="100"
                  placeholder="20"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: e.target.value, amount: '' })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant (FCFA)</Label>
                <Input 
                  id="amount" 
                  type="number"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value, percentage: '' })}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              * Spécifiez soit un pourcentage, soit un montant fixe
            </p>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input 
                id="description" 
                placeholder="Critères d'attribution..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingScholarship ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
