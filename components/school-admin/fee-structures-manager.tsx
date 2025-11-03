'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface FeeStructure {
  id: string
  name: string
  amount: number
  type: string
  niveau: string | null
  filiereId: string | null
  dueDate: Date | null
  filiere?: {
    nom: string
  } | null
}

interface Filiere {
  id: string
  nom: string
}

interface FeeStructuresManagerProps {
  schoolId: string
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
  filieres: Filiere[]
}

const feeTypes = [
  { value: 'TUITION', label: 'Frais de scolarité' },
  { value: 'REGISTRATION', label: 'Frais d\'inscription' },
  { value: 'EXAM', label: 'Frais d\'examen' },
  { value: 'LIBRARY', label: 'Frais de bibliothèque' },
  { value: 'SPORT', label: 'Frais sportifs' },
  { value: 'OTHER', label: 'Autres frais' },
]

export default function FeeStructuresManager({ schoolId, schoolType, filieres }: FeeStructuresManagerProps) {
  const router = useRouter()
  const [fees, setFees] = useState<FeeStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'TUITION',
    niveau: '',
    filiereId: '',
    dueDate: ''
  })

  const niveaux = schoolType === 'HIGH_SCHOOL'
    ? ['10E', '11E', '12E']
    : ['L1', 'L2', 'L3', 'M1', 'M2']

  const loadFees = async () => {
    try {
      const response = await fetch(`/api/school-admin/fee-structures?schoolId=${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setFees(data)
      }
    } catch (error) {
      console.error('Erreur chargement frais:', error)
      toast.error('Erreur lors du chargement des frais')
    } finally {
      setLoading(false)
    }
  }

  // Charger les frais au montage
  useEffect(() => {
    loadFees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId])

  const handleOpenDialog = (fee?: FeeStructure) => {
    console.log('handleOpenDialog appelé', fee ? 'Modification' : 'Ajout')
    if (fee) {
      setEditingFee(fee)
      setFormData({
        name: fee.name,
        amount: fee.amount.toString(),
        type: fee.type,
        niveau: fee.niveau || '',
        filiereId: fee.filiereId || '',
        dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : ''
      })
    } else {
      setEditingFee(null)
      setFormData({
        name: '',
        amount: '',
        type: 'TUITION',
        niveau: '',
        filiereId: '',
        dueDate: ''
      })
    }
    setIsDialogOpen(true)
    console.log('Dialog ouvert:', true)
  }

  const handleSubmit = async () => {
    if (!formData.filiereId || !formData.niveau || !formData.amount || !formData.type) {
      toast.error('Veuillez remplir tous les champs obligatoires (Filière, Niveau, Type, Montant)')
      return
    }

    setSubmitting(true)
    try {
      const url = editingFee
        ? `/api/school-admin/fee-structures/${editingFee.id}`
        : '/api/school-admin/fee-structures'

      const payload = {
        schoolId,
        name: formData.name,
        amount: parseFloat(formData.amount),
        type: formData.type,
        niveau: formData.niveau || null,
        filiereId: formData.filiereId || null,
        dueDate: formData.dueDate || null
      }

      console.log('Envoi des données:', payload)

      const response = await fetch(url, {
        method: editingFee ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('Réponse API:', data)

      if (response.ok) {
        toast.success(editingFee ? 'Frais modifié avec succès' : 'Frais créé avec succès')
        setIsDialogOpen(false)
        // Recharger immédiatement la liste
        await loadFees()
        // Forcer le rechargement de la page après un court délai
        setTimeout(() => {
          router.refresh()
        }, 100)
      } else {
        console.error('Erreur API:', data)
        toast.error(data.error || 'Erreur lors de l\'opération')
        if (data.details) {
          console.error('Détails:', data.details)
        }
        if (data.missing) {
          console.error('Champs manquants:', data.missing)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce frais ?')) return

    try {
      const response = await fetch(`/api/school-admin/fee-structures/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Frais supprimé')
        loadFees()
        router.refresh()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Prix de Scolarité</CardTitle>
              <CardDescription>Gérez les frais de scolarité par niveau et filière</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un frais
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Aucun frais configuré. Cliquez sur &quot;Ajouter un frais&quot; pour commencer.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>{schoolType === 'HIGH_SCHOOL' ? 'Série' : 'Filière'}</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Date Limite</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.name}</TableCell>
                    <TableCell>
                      {feeTypes.find(t => t.value === fee.type)?.label || fee.type}
                    </TableCell>
                    <TableCell>{fee.niveau || '-'}</TableCell>
                    <TableCell>{fee.filiere?.nom || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {fee.amount.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>
                      {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDialog(fee)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(fee.id)
                          }}
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

      {/* Dialog Ajouter/Modifier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFee ? 'Modifier le frais' : 'Ajouter un frais'}
            </DialogTitle>
            <DialogDescription>
              {editingFee ? 'Modifiez les informations du frais de scolarité' : 'Créez un nouveau frais de scolarité pour une filière et un niveau'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Filière/Série *</Label>
              <Select 
                value={formData.filiereId} 
                onValueChange={(value) => {
                  const selectedFiliere = filieres.find(f => f.id === value)
                  setFormData({ 
                    ...formData, 
                    filiereId: value,
                    name: selectedFiliere ? `Frais de scolarité ${selectedFiliere.nom}` : ''
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une filière" />
                </SelectTrigger>
                <SelectContent>
                  {filieres.map((filiere) => (
                    <SelectItem key={filiere.id} value={filiere.id}>
                      {filiere.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Le nom sera: Frais de scolarité {formData.filiereId && filieres.find(f => f.id === formData.filiereId)?.nom}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de frais *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="niveau">Niveau *</Label>
              <Select value={formData.niveau} onValueChange={(value) => setFormData({ ...formData, niveau: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {niveaux.map((niveau) => (
                    <SelectItem key={niveau} value={niveau}>
                      {niveau}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Montant (FCFA) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="500000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Date limite de paiement</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingFee ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
