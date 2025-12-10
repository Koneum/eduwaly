"use client"

import { useState } from "react"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TeacherFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: string
}

export function TeacherFormDialog({ 
  open, 
  onOpenChange, 
  schoolId
}: TeacherFormDialogProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    qualification: '',
    specialization: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email)')
      return
    }

    setIsCreating(true)
    // Note: Le check de quota se fait côté serveur dans l'API

    try {
      const response = await fetch('/api/school-admin/teachers', {
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

      toast.success(data.message || 'Enseignant ajouté avec succès')
      
      onOpenChange(false)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        qualification: '',
        specialization: ''
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
      title="Ajouter un enseignant"
      description="Créez un nouveau profil enseignant pour votre école."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom *</Label>
            <Input 
              id="lastName" 
              placeholder="Ex: Dupont" 
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input 
              id="firstName" 
              placeholder="Ex: Marie" 
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input 
              id="email" 
              type="email"
              placeholder="marie.dupont@example.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
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

        <div className="space-y-2">
          <Label htmlFor="subject">Matière principale</Label>
          <Input 
            id="subject" 
            placeholder="Ex: Mathématiques" 
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="qualification">Qualification</Label>
            <Input 
              id="qualification" 
              placeholder="Ex: Master en Mathématiques" 
              value={formData.qualification}
              onChange={(e) => setFormData({...formData, qualification: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Spécialisation</Label>
            <Input 
              id="specialization" 
              placeholder="Ex: Algèbre" 
              value={formData.specialization}
              onChange={(e) => setFormData({...formData, specialization: e.target.value})}
            />
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
                Ajout en cours...
              </>
            ) : (
              "Ajouter l'enseignant"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}
