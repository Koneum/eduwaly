"use client"

import { useState } from "react"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Filiere {
  id: string
  nom: string
}

interface StudentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: string
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
  filieres: Filiere[]
}

export function StudentFormDialog({ 
  open, 
  onOpenChange, 
  schoolId, 
  schoolType, 
  filieres 
}: StudentFormDialogProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    studentNumber: '',
    niveau: '',
    phone: '',
    filiereId: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.studentNumber || !formData.niveau) {
      toast.error('Veuillez remplir tous les champs obligatoires (Prénom, Nom, Matricule, Niveau)')
      return
    }

    setIsCreating(true)
    // Note: Le check de quota se fait côté serveur dans l'API

    try {
      const response = await fetch('/api/school-admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          schoolId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      if (data.credentials) {
        toast.success(
          `Étudiant créé avec succès!\n\nEmail: ${data.credentials.email}\nMot de passe: ${data.credentials.password}\n\nCode d'inscription: ${data.credentials.enrollmentId}`,
          { duration: 10000 }
        )
      } else {
        toast.success(data.message || 'Étudiant créé avec succès')
      }
      
      onOpenChange(false)
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        address: '',
        studentNumber: '',
        niveau: '',
        phone: '',
        filiereId: ''
      })
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ajouter un nouvel étudiant"
      description="Créez un nouveau profil étudiant. Un code d'inscription sera généré automatiquement."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom *</Label>
            <Input 
              id="lastName" 
              placeholder="Ex: Doe" 
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input 
              id="firstName" 
              placeholder="Ex: John" 
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date de naissance</Label>
          <Input 
            id="dateOfBirth" 
            type="date" 
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input 
            id="address" 
            placeholder="Ex: Dakar, Sénégal" 
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="studentNumber">Matricule *</Label>
            <Input 
              id="studentNumber" 
              placeholder="Ex: 2024001" 
              value={formData.studentNumber}
              onChange={(e) => setFormData({...formData, studentNumber: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="+221 77 123 4567" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="niveau">Niveau *</Label>
            <Select 
              value={formData.niveau} 
              onValueChange={(value) => setFormData({...formData, niveau: value})}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un niveau" />
              </SelectTrigger>
              <SelectContent>
                {schoolType === 'HIGH_SCHOOL' ? (
                  <>
                    <SelectItem value="10E">10ème (Seconde)</SelectItem>
                    <SelectItem value="11E">11ème (Première)</SelectItem>
                    <SelectItem value="12E">12ème (Terminale)</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="L1">Licence 1</SelectItem>
                    <SelectItem value="L2">Licence 2</SelectItem>
                    <SelectItem value="L3">Licence 3</SelectItem>
                    <SelectItem value="M1">Master 1</SelectItem>
                    <SelectItem value="M2">Master 2</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filiere">Filière</Label>
            <Select 
              value={formData.filiereId} 
              onValueChange={(value) => setFormData({...formData, filiereId: value})}
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
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            disabled={isCreating}
            className="w-full sm:w-auto"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer l'étudiant"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}
