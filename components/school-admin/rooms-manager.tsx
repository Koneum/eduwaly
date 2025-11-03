'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface RoomsManagerProps {
  schoolId: string
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
}

export default function RoomsManager({ schoolId, schoolType }: RoomsManagerProps) {
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '',
    capacity: '',
    building: '',
    floor: '',
    equipment: [] as string[]
  })

  const roomTypes = schoolType === 'HIGH_SCHOOL' 
    ? [
        { value: 'CLASSROOM', label: 'Classe normale' },
        { value: 'LABORATORY', label: 'Laboratoire' },
        { value: 'COMPUTER_LAB', label: 'Salle informatique' },
        { value: 'LIBRARY', label: 'Bibliothèque' },
        { value: 'SPORTS_HALL', label: 'Salle de sport' }
      ]
    : [
        { value: 'AMPHITHEATER', label: 'Amphithéâtre' },
        { value: 'CLASSROOM', label: 'Salle TD' },
        { value: 'LABORATORY', label: 'Salle TP' },
        { value: 'COMPUTER_LAB', label: 'Laboratoire' },
        { value: 'LIBRARY', label: 'Bibliothèque' },
        { value: 'CONFERENCE', label: 'Salle de conférence' }
      ]

  // Générer le code automatiquement
  const generateCode = (name: string, floor: string) => {
    if (!name && !floor) return ''
    
    // Extraire le numéro/nom de l'étage (ex: "2" ou "E2" ou "1er étage")
    let floorCode = floor.trim()
    if (floorCode) {
      // Si c'est juste un nombre, ajouter E devant
      if (/^\d+$/.test(floorCode)) {
        floorCode = `E${floorCode}`
      }
      // Si c'est "1er étage", "2ème étage", extraire le numéro
      const match = floorCode.match(/^(\d+)/)
      if (match) {
        floorCode = `E${match[1]}`
      }
    }
    
    // Extraire le numéro/identifiant du nom
    const nameCode = name.trim()
    
    // Générer le code: E2-3 ou E2-A101 ou juste le nom si pas d'étage
    if (floorCode && nameCode) {
      return `${floorCode}-${nameCode}`
    } else if (nameCode) {
      return nameCode
    }
    return ''
  }

  const handleAddRoom = () => {
    setIsAddDialogOpen(true)
    setFormData({
      name: '',
      code: '',
      type: '',
      capacity: '',
      building: '',
      floor: '',
      equipment: []
    })
  }

  const handleCreateRoom = async () => {
    if (!formData.name || !formData.code || !formData.type || !formData.capacity) {
      toast.error('Veuillez remplir tous les champs obligatoires')
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

      toast.success(data.message || `${schoolType === 'HIGH_SCHOOL' ? 'Classe' : 'Salle'} créée avec succès`)
      setIsAddDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsCreating(false)
    }
  }

  const handleImportFile = async () => {
    if (!importFile) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }

    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('schoolId', schoolId)

      const response = await fetch('/api/school-admin/rooms/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import')
      }

      toast.success(`${data.count || 0} ${schoolType === 'HIGH_SCHOOL' ? 'classe(s)' : 'salle(s)'} importée(s) avec succès`)
      setIsImportDialogOpen(false)
      setImportFile(null)
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'import')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleAddRoom}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une {schoolType === 'HIGH_SCHOOL' ? 'classe' : 'salle'}
      </Button>
      
      <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Importer Excel/CSV
      </Button>

      {/* Dialog Ajouter */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter une {schoolType === 'HIGH_SCHOOL' ? 'classe' : 'salle'}</DialogTitle>
            <DialogDescription>
              Remplissez les informations de la {schoolType === 'HIGH_SCHOOL' ? 'classe' : 'salle'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                placeholder={schoolType === 'HIGH_SCHOOL' ? 'Ex: Terminale S1' : 'Ex: 3 ou A101'}
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value
                  setFormData({
                    ...formData, 
                    name: newName,
                    code: generateCode(newName, formData.floor)
                  })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Étage</Label>
              <Input
                id="floor"
                placeholder="Ex: 2 ou E2 ou 1er étage"
                value={formData.floor}
                onChange={(e) => {
                  const newFloor = e.target.value
                  setFormData({
                    ...formData, 
                    floor: newFloor,
                    code: generateCode(formData.name, newFloor)
                  })
                }}
              />
              
              
              <p className="text-xs text-muted-foreground">
                Format: Étage-Nom (ex: E2-3 pour salle 3 au 2ème étage)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacité *</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="Ex: 40"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building">Bâtiment</Label>
              <Input
                id="building"
                placeholder="Ex: Bâtiment A"
                value={formData.building}
                onChange={(e) => setFormData({...formData, building: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Étage</Label>
              <Label htmlFor="code">Code * (généré auto)</Label>
              <Input
                id="code"
                placeholder={schoolType === 'HIGH_SCHOOL' ? 'Ex: E2-TS1' : 'Ex: E2-3'}
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Le code sera généré automatiquement
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateRoom} disabled={isCreating}>
              {isCreating ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Import */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des {schoolType === 'HIGH_SCHOOL' ? 'classes' : 'salles'}</DialogTitle>
            <DialogDescription>
              Importez une liste depuis un fichier Excel (.xlsx) ou CSV (.csv)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
                id="room-file-upload"
              />
              <label htmlFor="room-file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium">
                  {importFile ? importFile.name : 'Cliquez pour sélectionner un fichier'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Formats acceptés: .xlsx, .xls, .csv
                </p>
              </label>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">📝 Format attendu :</p>
              <p className="text-xs text-muted-foreground">
                Nom, Code, Type, Capacité, Bâtiment, Étage
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsImportDialogOpen(false)
              setImportFile(null)
            }}>
              Annuler
            </Button>
            <Button onClick={handleImportFile} disabled={!importFile || isImporting}>
              {isImporting ? 'Import en cours...' : 'Importer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
