'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Loader2, Badge } from "lucide-react"
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'

interface AnneeUniversitaire {
  id: string
  annee: string
  dateDebut?: Date | null
  dateFin?: Date | null
  estActive?: boolean
  createdAt: Date
}

interface RoomOrClass {
  id: string
  name: string
  code: string
  capacity: number
  type?: string // Pour Room
  niveau?: string // Pour Class
}

interface SchoolSettingsManagerProps {
  schoolId: string
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
  schoolData?: {
    name: string
    email: string | null
    phone: string | null
    address: string | null
  }
  annees?: AnneeUniversitaire[]
  rooms?: RoomOrClass[]
}

export default function SchoolSettingsManager({ schoolId, schoolType, schoolData, annees: initialAnnees, rooms: initialRooms }: SchoolSettingsManagerProps) {
  const router = useRouter()
  
  // États pour les dialogs
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [isEditRoomDialogOpen, setIsEditRoomDialogOpen] = useState(false)
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false)
  const [isEditYearDialogOpen, setIsEditYearDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: '',
    type: 'CLASSROOM'
  })
  
  const [yearFormData, setYearFormData] = useState({
    annee: '',
    startDate: '',
    endDate: ''
  })
  
  // Données réelles
  const [annees, setAnnees] = useState<AnneeUniversitaire[]>(initialAnnees || [])
  const [rooms, setRooms] = useState<RoomOrClass[]>(initialRooms || [])
  const [loading, setLoading] = useState(false)

  // Charger les données
  useEffect(() => {
    if (!initialAnnees) {
      loadAnnees()
    }
    if (!initialRooms) {
      loadRooms()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId])

  const loadAnnees = async () => {
    try {
      const response = await fetch(`/api/school-admin/academic-years?schoolId=${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setAnnees(data)
      }
    } catch (error) {
      console.error('Erreur chargement années:', error)
    }
  }

  const loadRooms = async () => {
    try {
      const response = await fetch(`/api/school-admin/rooms?schoolId=${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Erreur chargement salles:', error)
    }
  }

  const handleCreateRoom = async () => {
    if (!formData.name || !formData.code || !formData.capacity) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/school-admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          name: formData.name,
          code: formData.code,
          capacity: parseInt(formData.capacity),
          type: formData.type
        })
      })

      if (response.ok) {
        toast.success(`${schoolType === 'HIGH_SCHOOL' ? 'Classe' : 'Salle'} créée avec succès`)
        setIsRoomDialogOpen(false)
        setFormData({ name: '', code: '', capacity: '', type: 'CLASSROOM' })
        await loadRooms()
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async (id: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette ${schoolType === 'HIGH_SCHOOL' ? 'classe' : 'salle'} ?`)) return

    try {
      const type = schoolType === 'HIGH_SCHOOL' ? 'class' : 'room'
      const response = await fetch(`/api/school-admin/rooms/${id}?type=${type}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(`${schoolType === 'HIGH_SCHOOL' ? 'Classe' : 'Salle'} supprimée`)
        await loadRooms()
        router.refresh()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleEditRoom = (room: RoomOrClass) => {
    setSelectedItem(room)
    setFormData({
      name: room.name,
      code: room.code,
      capacity: room.capacity.toString(),
      type: room.type || 'CLASSROOM'
    })
    setIsEditRoomDialogOpen(true)
  }

  const handleUpdateRoom = async () => {
    if (!selectedItem || !formData.name || !formData.code || !formData.capacity) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/school-admin/rooms/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          capacity: parseInt(formData.capacity),
          type: formData.type
        })
      })

      if (response.ok) {
        toast.success(`${schoolType === 'HIGH_SCHOOL' ? 'Classe' : 'Salle'} modifiée avec succès`)
        setIsEditRoomDialogOpen(false)
        setSelectedItem(null)
        await loadRooms()
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  // Fonctions pour les années scolaires
  const handleCreateYear = async () => {
    if (!yearFormData.annee) {
      toast.error('⚠️ Veuillez saisir l\'année scolaire')
      return
    }

    // Vérifier si l'année existe déjà côté client
    const duplicate = annees.find(a => a.annee === yearFormData.annee)
    if (duplicate) {
      toast.error(`❌ L'année ${yearFormData.annee} existe déjà !`, {
        description: 'Veuillez choisir une autre année ou modifier l\'existante.',
        duration: 4000
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        schoolId,
        annee: yearFormData.annee,
        dateDebut: yearFormData.startDate || undefined,
        dateFin: yearFormData.endDate || undefined
      }
      console.log('📤 Envoi des données:', payload)

      const response = await fetch('/api/school-admin/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const newYear = await response.json()
        toast.success(`✅ Année ${newYear.annee} créée avec succès !`, {
          description: newYear.dateDebut ? `Du ${new Date(newYear.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(newYear.dateFin || '').toLocaleDateString('fr-FR')}` : undefined,
          duration: 3000
        })
        setIsYearDialogOpen(false)
        setYearFormData({ annee: '', startDate: '', endDate: '' })
        await loadAnnees()
        router.refresh()
      } else {
        const error = await response.json()
        console.error('❌ Erreur API:', error)
        toast.error(`❌ ${error.error || 'Erreur lors de la création'}`, {
          description: 'Veuillez vérifier les données saisies.',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('❌ Erreur lors de la création', {
        description: 'Une erreur inattendue s\'est produite.',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditYear = (year: AnneeUniversitaire) => {
    setSelectedItem(year)
    setYearFormData({
      annee: year.annee,
      startDate: year.dateDebut ? new Date(year.dateDebut).toISOString().split('T')[0] : '',
      endDate: year.dateFin ? new Date(year.dateFin).toISOString().split('T')[0] : ''
    })
    setIsEditYearDialogOpen(true)
  }

  const handleUpdateYear = async () => {
    if (!selectedItem || !yearFormData.annee) {
      toast.error('⚠️ Veuillez saisir l\'année scolaire')
      return
    }

    // Vérifier si l'année existe déjà (sauf si c'est la même)
    const duplicate = annees.find(a => a.annee === yearFormData.annee && a.id !== selectedItem.id)
    if (duplicate) {
      toast.error(`❌ L'année ${yearFormData.annee} existe déjà !`, {
        description: 'Veuillez choisir une autre année.',
        duration: 4000
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/school-admin/academic-years/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annee: yearFormData.annee,
          dateDebut: yearFormData.startDate || undefined,
          dateFin: yearFormData.endDate || undefined
        })
      })

      if (response.ok) {
        const updatedYear = await response.json()
        toast.success(`✅ Année ${updatedYear.annee} modifiée avec succès !`, {
          description: updatedYear.dateDebut ? `Du ${new Date(updatedYear.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(updatedYear.dateFin || '').toLocaleDateString('fr-FR')}` : undefined,
          duration: 3000
        })
        setIsEditYearDialogOpen(false)
        setSelectedItem(null)
        await loadAnnees()
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(`❌ ${error.error || 'Erreur lors de la modification'}`, {
          description: 'Veuillez vérifier les données saisies.',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('❌ Erreur lors de la modification', {
        description: 'Une erreur inattendue s\'est produite.',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="general" className="space-y-3 sm:space-y-4">
      <TabsList className="bg-card w-full sm:w-auto flex-col sm:flex-row h-auto sm:h-10">
        <TabsTrigger value="general" className="text-responsive-sm w-full sm:w-auto">Informations Générales</TabsTrigger>
        <TabsTrigger value="years" className="text-responsive-sm w-full sm:w-auto">Années Scolaires</TabsTrigger>
        <TabsTrigger value="rooms" className="text-responsive-sm w-full sm:w-auto">{schoolType === 'HIGH_SCHOOL' ? 'Classes' : 'Salles'}</TabsTrigger>
      </TabsList>

      {/* Onglet Informations Générales */}
      <TabsContent value="general" className="space-y-3 sm:space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-lg">Informations de l&apos;école</CardTitle>
            <CardDescription className="text-responsive-sm">Gérez les informations de base de votre établissement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="schoolName" className="text-responsive-sm">Nom de l&apos;école *</Label>
                <Input 
                  id="schoolName" 
                  placeholder="École Excellence" 
                  defaultValue={schoolData?.name || ''}
                  className="text-responsive-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="schoolType" className="text-responsive-sm">Type d&apos;établissement</Label>
                <Input 
                  id="schoolType" 
                  value={schoolType === 'HIGH_SCHOOL' ? 'Lycée' : 'Université'}
                  disabled
                  className="bg-muted text-responsive-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="schoolEmail" className="text-responsive-sm">Email *</Label>
                <Input 
                  id="schoolEmail" 
                  type="email" 
                  placeholder="contact@ecole.com" 
                  defaultValue={schoolData?.email || ''}
                  className="text-responsive-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="schoolPhone" className="text-responsive-sm">Téléphone</Label>
                <Input 
                  id="schoolPhone" 
                  type="tel" 
                  placeholder="+221 77 123 4567" 
                  defaultValue={schoolData?.phone || ''}
                  className="text-responsive-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="schoolAddress" className="text-responsive-sm">Adresse</Label>
                <Input 
                  id="schoolAddress" 
                  placeholder="Dakar, Sénégal" 
                  defaultValue={schoolData?.address || ''}
                  className="text-responsive-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => toast.success('Informations mises à jour')} className="btn-responsive w-full sm:w-auto">
                Enregistrer les modifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Onglet Années Scolaires */}
      <TabsContent value="years" className="space-y-3 sm:space-y-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-responsive-lg">Années Scolaires</CardTitle>
                <CardDescription className="text-responsive-sm">Gérez les années scolaires/universitaires</CardDescription>
              </div>
              <Button onClick={() => {
                setYearFormData({ annee: '', startDate: '', endDate: '' })
                setIsYearDialogOpen(true)
              }} className="btn-responsive w-full sm:w-auto">
                <Plus className="icon-responsive mr-2" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-responsive-sm">Année</TableHead>
                  <TableHead className="text-responsive-sm">Date de création</TableHead>
                  <TableHead className="text-right text-responsive-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-responsive-sm text-muted-foreground">
                      Aucune année scolaire configurée
                    </TableCell>
                  </TableRow>
                ) : (
                  annees.map((annee, index) => (
                    <TableRow key={annee.id}>
                      <TableCell className="font-medium text-responsive-sm">
                        <div className="flex items-center gap-2">
                          {annee.annee}
                          {index === 0 && <Badge className="text-responsive-xs">Actuelle</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-responsive-sm">{new Date(annee.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditYear(annee)}>
                            <Pencil className="icon-responsive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>


      {/* Onglet Salles/Classes */}
      <TabsContent value="rooms" className="space-y-3 sm:space-y-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-responsive-lg">{schoolType === 'HIGH_SCHOOL' ? 'Classes' : 'Salles'}</CardTitle>
                <CardDescription className="text-responsive-sm">
                  Gérez les {schoolType === 'HIGH_SCHOOL' ? 'classes' : 'salles'} de votre établissement
                </CardDescription>
              </div>
              <Button onClick={() => {
                setFormData({ name: '', code: '', capacity: '', type: 'CLASSROOM' })
                setIsRoomDialogOpen(true)
              }} className="btn-responsive w-full sm:w-auto">
                <Plus className="icon-responsive mr-2" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-responsive-sm">Aucune {schoolType === 'HIGH_SCHOOL' ? 'classe' : 'salle'} configurée.</p>
                <p className="text-responsive-xs mt-2">Cliquez sur &quot;Ajouter&quot; pour commencer.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-responsive-sm">Nom</TableHead>
                    <TableHead className="text-responsive-sm">Code</TableHead>
                    <TableHead className="text-responsive-sm">{schoolType === 'HIGH_SCHOOL' ? 'Niveau' : 'Type'}</TableHead>
                    <TableHead className="text-right text-responsive-sm">Capacité</TableHead>
                    <TableHead className="text-right text-responsive-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium text-responsive-sm">{room.name}</TableCell>
                      <TableCell className="text-responsive-sm">{room.code}</TableCell>
                      <TableCell className="text-responsive-sm">
                        {schoolType === 'HIGH_SCHOOL' ? room.niveau : 
                         room.type === 'AMPHITHEATER' ? 'Amphithéâtre' :
                         room.type === 'LABORATORY' ? 'Laboratoire' :
                         room.type === 'COMPUTER_LAB' ? 'Salle informatique' :
                         'Salle de classe'}
                      </TableCell>
                      <TableCell className="text-right text-responsive-sm">{room.capacity} places</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditRoom(room)}
                          >
                            <Pencil className="icon-responsive" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            <Trash2 className="icon-responsive text-destructive" />
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
      </TabsContent>

      {/* Dialog Ajouter Salle/Classe */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Ajouter {schoolType === 'HIGH_SCHOOL' ? 'une classe' : 'une salle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="roomName" className="text-responsive-sm">Nom *</Label>
              <Input 
                id="roomName" 
                placeholder={schoolType === 'HIGH_SCHOOL' ? "Ex: Terminale S1" : "Ex: Salle A101"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="roomCode" className="text-responsive-sm">Code *</Label>
              <Input 
                id="roomCode" 
                placeholder={schoolType === 'HIGH_SCHOOL' ? "Ex: TS1" : "Ex: A101"}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="roomType" className="text-responsive-sm">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="text-responsive-sm">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {schoolType === 'HIGH_SCHOOL' ? (
                    <>
                      <SelectItem value="CLASSROOM" className="text-responsive-sm">Classe normale</SelectItem>
                      <SelectItem value="LABORATORY" className="text-responsive-sm">Laboratoire</SelectItem>
                      <SelectItem value="COMPUTER_LAB" className="text-responsive-sm">Salle informatique</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="AMPHITHEATER" className="text-responsive-sm">Amphithéâtre</SelectItem>
                      <SelectItem value="CLASSROOM" className="text-responsive-sm">Salle de classe</SelectItem>
                      <SelectItem value="LABORATORY" className="text-responsive-sm">Laboratoire</SelectItem>
                      <SelectItem value="COMPUTER_LAB" className="text-responsive-sm">Salle informatique</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="roomCapacity" className="text-responsive-sm">Capacité *</Label>
              <Input 
                id="roomCapacity" 
                type="number" 
                placeholder="40"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsRoomDialogOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleCreateRoom} disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier Salle/Classe */}
      <Dialog open={isEditRoomDialogOpen} onOpenChange={setIsEditRoomDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Modifier {schoolType === 'HIGH_SCHOOL' ? 'la classe' : 'la salle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="editRoomName" className="text-responsive-sm">Nom *</Label>
              <Input 
                id="editRoomName" 
                placeholder={schoolType === 'HIGH_SCHOOL' ? "Ex: Terminale S1" : "Ex: Salle A101"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="editRoomCode" className="text-responsive-sm">Code *</Label>
              <Input 
                id="editRoomCode" 
                placeholder={schoolType === 'HIGH_SCHOOL' ? "Ex: TS1" : "Ex: A101"}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="editRoomType" className="text-responsive-sm">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="text-responsive-sm">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {schoolType === 'HIGH_SCHOOL' ? (
                    <>
                      <SelectItem value="CLASSROOM" className="text-responsive-sm">Classe normale</SelectItem>
                      <SelectItem value="LABORATORY" className="text-responsive-sm">Laboratoire</SelectItem>
                      <SelectItem value="COMPUTER_LAB" className="text-responsive-sm">Salle informatique</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="AMPHITHEATER" className="text-responsive-sm">Amphithéâtre</SelectItem>
                      <SelectItem value="CLASSROOM" className="text-responsive-sm">Salle de classe</SelectItem>
                      <SelectItem value="LABORATORY" className="text-responsive-sm">Laboratoire</SelectItem>
                      <SelectItem value="COMPUTER_LAB" className="text-responsive-sm">Salle informatique</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="editRoomCapacity" className="text-responsive-sm">Capacité *</Label>
              <Input 
                id="editRoomCapacity" 
                type="number" 
                placeholder="40"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsEditRoomDialogOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleUpdateRoom} disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ajouter Année Scolaire */}
      <Dialog open={isYearDialogOpen} onOpenChange={setIsYearDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Ajouter une année scolaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="yearName" className="text-responsive-sm">Année *</Label>
              <Input 
                id="yearName" 
                placeholder="Ex: 2024-2025"
                value={yearFormData.annee}
                onChange={(e) => setYearFormData({ ...yearFormData, annee: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="yearStart" className="text-responsive-sm">Date de début (optionnel)</Label>
              <Input 
                id="yearStart" 
                type="date"
                value={yearFormData.startDate}
                onChange={(e) => setYearFormData({ ...yearFormData, startDate: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="yearEnd" className="text-responsive-sm">Date de fin (optionnel)</Label>
              <Input 
                id="yearEnd" 
                type="date"
                value={yearFormData.endDate}
                onChange={(e) => setYearFormData({ ...yearFormData, endDate: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsYearDialogOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleCreateYear} disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier Année Scolaire */}
      <Dialog open={isEditYearDialogOpen} onOpenChange={setIsEditYearDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Modifier l&apos;année scolaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="editYearName" className="text-responsive-sm">Année *</Label>
              <Input 
                id="editYearName" 
                placeholder="Ex: 2024-2025"
                value={yearFormData.annee}
                onChange={(e) => setYearFormData({ ...yearFormData, annee: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="editYearStart" className="text-responsive-sm">Date de début (optionnel)</Label>
              <Input 
                id="editYearStart" 
                type="date"
                value={yearFormData.startDate}
                onChange={(e) => setYearFormData({ ...yearFormData, startDate: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="editYearEnd" className="text-responsive-sm">Date de fin (optionnel)</Label>
              <Input 
                id="editYearEnd" 
                type="date"
                value={yearFormData.endDate}
                onChange={(e) => setYearFormData({ ...yearFormData, endDate: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsEditYearDialogOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleUpdateYear} disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}