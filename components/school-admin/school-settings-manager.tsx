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
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList className="bg-card">
        <TabsTrigger value="general">Informations Générales</TabsTrigger>
        <TabsTrigger value="years">Années Scolaires</TabsTrigger>
        <TabsTrigger value="rooms">{schoolType === 'HIGH_SCHOOL' ? 'Classes' : 'Salles'}</TabsTrigger>
      </TabsList>

      {/* Onglet Informations Générales */}
      <TabsContent value="general" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Informations de l&apos;école</CardTitle>
            <CardDescription>Gérez les informations de base de votre établissement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schoolName">Nom de l&apos;école *</Label>
                <Input 
                  id="schoolName" 
                  placeholder="École Excellence" 
                  defaultValue={schoolData?.name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolType">Type d&apos;établissement</Label>
                <Input 
                  id="schoolType" 
                  value={schoolType === 'HIGH_SCHOOL' ? 'Lycée' : 'Université'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolEmail">Email *</Label>
                <Input 
                  id="schoolEmail" 
                  type="email" 
                  placeholder="contact@ecole.com" 
                  defaultValue={schoolData?.email || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolPhone">Téléphone</Label>
                <Input 
                  id="schoolPhone" 
                  type="tel" 
                  placeholder="+221 77 123 4567" 
                  defaultValue={schoolData?.phone || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolAddress">Adresse</Label>
                <Input 
                  id="schoolAddress" 
                  placeholder="Dakar, Sénégal" 
                  defaultValue={schoolData?.address || ''}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => toast.success('Informations mises à jour')}>
                Enregistrer les modifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Onglet Années Scolaires */}
      <TabsContent value="years" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Années Scolaires</CardTitle>
                <CardDescription>Gérez les années scolaires/universitaires</CardDescription>
              </div>
              <Button onClick={() => {
                setYearFormData({ annee: '', startDate: '', endDate: '' })
                setIsYearDialogOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Année</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                      Aucune année scolaire configurée
                    </TableCell>
                  </TableRow>
                ) : (
                  annees.map((annee, index) => (
                    <TableRow key={annee.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {annee.annee}
                          {index === 0 && <Badge>Actuelle</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(annee.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditYear(annee)}>
                            <Pencil className="h-4 w-4" />
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
      <TabsContent value="rooms" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{schoolType === 'HIGH_SCHOOL' ? 'Classes' : 'Salles'}</CardTitle>
                <CardDescription>
                  Gérez les {schoolType === 'HIGH_SCHOOL' ? 'classes' : 'salles'} de votre établissement
                </CardDescription>
              </div>
              <Button onClick={() => {
                setFormData({ name: '', code: '', capacity: '', type: 'CLASSROOM' })
                setIsRoomDialogOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>Aucune {schoolType === 'HIGH_SCHOOL' ? 'classe' : 'salle'} configurée.</p>
                <p className="text-sm mt-2">Cliquez sur &quot;Ajouter&quot; pour commencer.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>{schoolType === 'HIGH_SCHOOL' ? 'Niveau' : 'Type'}</TableHead>
                    <TableHead className="text-right">Capacité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell>{room.code}</TableCell>
                      <TableCell>
                        {schoolType === 'HIGH_SCHOOL' ? room.niveau : 
                         room.type === 'AMPHITHEATER' ? 'Amphithéâtre' :
                         room.type === 'LABORATORY' ? 'Laboratoire' :
                         room.type === 'COMPUTER_LAB' ? 'Salle informatique' :
                         'Salle de classe'}
                      </TableCell>
                      <TableCell className="text-right">{room.capacity} places</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditRoom(room)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteRoom(room.id)}
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
      </TabsContent>

      {/* Dialog Ajouter Salle/Classe */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter {schoolType === 'HIGH_SCHOOL' ? 'une classe' : 'une salle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomName">Nom *</Label>
              <Input 
                id="roomName" 
                placeholder={schoolType === 'HIGH_SCHOOL' ? "Ex: Terminale S1" : "Ex: Salle A101"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomCode">Code *</Label>
              <Input 
                id="roomCode" 
                placeholder={schoolType === 'HIGH_SCHOOL' ? "Ex: TS1" : "Ex: A101"}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomType">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {schoolType === 'HIGH_SCHOOL' ? (
                    <>
                      <SelectItem value="CLASSROOM">Classe normale</SelectItem>
                      <SelectItem value="LABORATORY">Laboratoire</SelectItem>
                      <SelectItem value="COMPUTER_LAB">Salle informatique</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="AMPHITHEATER">Amphithéâtre</SelectItem>
                      <SelectItem value="CLASSROOM">Salle de classe</SelectItem>
                      <SelectItem value="LABORATORY">Laboratoire</SelectItem>
                      <SelectItem value="COMPUTER_LAB">Salle informatique</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomCapacity">Capacité *</Label>
              <Input 
                id="roomCapacity" 
                type="number" 
                placeholder="40"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoomDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateRoom} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier Salle/Classe */}
      <Dialog open={isEditRoomDialogOpen} onOpenChange={setIsEditRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier {schoolType === 'HIGH_SCHOOL' ? 'la classe' : 'la salle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editRoomName">Nom *</Label>
              <Input 
                id="editRoomName" 
                placeholder={schoolType === 'HIGH_SCHOOL' ? "Ex: Terminale S1" : "Ex: Salle A101"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRoomCode">Code *</Label>
              <Input 
                id="editRoomCode" 
                placeholder={schoolType === 'HIGH_SCHOOL' ? "Ex: TS1" : "Ex: A101"}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRoomType">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {schoolType === 'HIGH_SCHOOL' ? (
                    <>
                      <SelectItem value="CLASSROOM">Classe normale</SelectItem>
                      <SelectItem value="LABORATORY">Laboratoire</SelectItem>
                      <SelectItem value="COMPUTER_LAB">Salle informatique</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="AMPHITHEATER">Amphithéâtre</SelectItem>
                      <SelectItem value="CLASSROOM">Salle de classe</SelectItem>
                      <SelectItem value="LABORATORY">Laboratoire</SelectItem>
                      <SelectItem value="COMPUTER_LAB">Salle informatique</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRoomCapacity">Capacité *</Label>
              <Input 
                id="editRoomCapacity" 
                type="number" 
                placeholder="40"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoomDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateRoom} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ajouter Année Scolaire */}
      <Dialog open={isYearDialogOpen} onOpenChange={setIsYearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une année scolaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="yearName">Année *</Label>
              <Input 
                id="yearName" 
                placeholder="Ex: 2024-2025"
                value={yearFormData.annee}
                onChange={(e) => setYearFormData({ ...yearFormData, annee: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearStart">Date de début (optionnel)</Label>
              <Input 
                id="yearStart" 
                type="date"
                value={yearFormData.startDate}
                onChange={(e) => setYearFormData({ ...yearFormData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearEnd">Date de fin (optionnel)</Label>
              <Input 
                id="yearEnd" 
                type="date"
                value={yearFormData.endDate}
                onChange={(e) => setYearFormData({ ...yearFormData, endDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsYearDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateYear} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier Année Scolaire */}
      <Dialog open={isEditYearDialogOpen} onOpenChange={setIsEditYearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;année scolaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editYearName">Année *</Label>
              <Input 
                id="editYearName" 
                placeholder="Ex: 2024-2025"
                value={yearFormData.annee}
                onChange={(e) => setYearFormData({ ...yearFormData, annee: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editYearStart">Date de début (optionnel)</Label>
              <Input 
                id="editYearStart" 
                type="date"
                value={yearFormData.startDate}
                onChange={(e) => setYearFormData({ ...yearFormData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editYearEnd">Date de fin (optionnel)</Label>
              <Input 
                id="editYearEnd" 
                type="date"
                value={yearFormData.endDate}
                onChange={(e) => setYearFormData({ ...yearFormData, endDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditYearDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateYear} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}