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

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: string
}

export function RoomFormDialog({ 
  open, 
  onOpenChange, 
  schoolId
}: RoomFormDialogProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    building: '',
    floor: '',
    type: 'CLASSROOM'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.capacity) {
      toast.error('Veuillez remplir tous les champs obligatoires (Nom, Capacité)')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/school-admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity),
          schoolId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      toast.success(data.message || 'Salle ajoutée avec succès')
      
      onOpenChange(false)
      setFormData({
        name: '',
        capacity: '',
        building: '',
        floor: '',
        type: 'CLASSROOM'
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
      title="Ajouter une salle"
      description="Créez une nouvelle salle de classe pour votre école."
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la salle *</Label>
            <Input 
              id="name" 
              placeholder="Ex: Salle A1" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacité *</Label>
            <Input 
              id="capacity" 
              type="number"
              placeholder="Ex: 40" 
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="building">Bâtiment</Label>
            <Input 
              id="building" 
              placeholder="Ex: Bâtiment Principal" 
              value={formData.building}
              onChange={(e) => setFormData({...formData, building: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floor">Étage</Label>
            <Input 
              id="floor" 
              placeholder="Ex: 1er étage" 
              value={formData.floor}
              onChange={(e) => setFormData({...formData, floor: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type de salle</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({...formData, type: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLASSROOM">Salle de classe</SelectItem>
              <SelectItem value="LAB">Laboratoire</SelectItem>
              <SelectItem value="AMPHITHEATER">Amphithéâtre</SelectItem>
              <SelectItem value="LIBRARY">Bibliothèque</SelectItem>
              <SelectItem value="OFFICE">Bureau</SelectItem>
              <SelectItem value="OTHER">Autre</SelectItem>
            </SelectContent>
          </Select>
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
              "Ajouter la salle"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}
