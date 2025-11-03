'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Loader2, Trash2, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Module {
  id: string
  nom: string
  vh: number
  filiere: {
    id: string
    nom: string
  } | null
}

interface Enseignant {
  id: string
  nom: string
  prenom: string
}

interface Filiere {
  id: string
  nom: string
}

interface TimeSlot {
  id: string
  moduleId: string
  heureDebut: string
  heureFin: string
  vh: number
}

interface ScheduleCreatorProps {
  modules: Module[]
  enseignants: Enseignant[]
  filieres: Filiere[]
  schoolId: string
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
  onSuccess: () => void
}

const JOURS_SEMAINE = [
  { value: 'LUNDI', label: 'Lundi' },
  { value: 'MARDI', label: 'Mardi' },
  { value: 'MERCREDI', label: 'Mercredi' },
  { value: 'JEUDI', label: 'Jeudi' },
  { value: 'VENDREDI', label: 'Vendredi' },
  { value: 'SAMEDI', label: 'Samedi' },
]

const NIVEAUX_UNIVERSITE = ['L1', 'L2', 'L3', 'M1', 'M2']
const NIVEAUX_LYCEE = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale']
const SEMESTRES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']
const TRIMESTRES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3']

// Salles prédéfinies communes
const SALLES_PREDEFINIES = [
  'A101', 'A102', 'A103', 'A104', 'A105',
  'B201', 'B202', 'B203', 'B204', 'B205',
  'C301', 'C302', 'C303', 'C304', 'C305',
  'Amphi 1', 'Amphi 2', 'Amphi 3',
  'Labo Info 1', 'Labo Info 2', 'Labo Physique', 'Labo Chimie',
  'Salle des Profs', 'Bibliothèque'
]

export function ScheduleCreatorV2({ modules, enseignants, filieres, schoolId, schoolType, onSuccess }: ScheduleCreatorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [salles, setSalles] = useState<string[]>([])
  
  // Form state
  const [enseignantId, setEnseignantId] = useState('')
  const [filiereId, setFiliereId] = useState('')
  const [niveau, setNiveau] = useState('')
  const [semestre, setSemestre] = useState(schoolType === 'UNIVERSITY' ? 'S1' : 'Trimestre 1')
  
  // Labels dynamiques selon le type d'établissement
  const periodeLabel = schoolType === 'UNIVERSITY' ? 'Semestre' : 'Trimestre'
  const periodeOptions = schoolType === 'UNIVERSITY' ? SEMESTRES : TRIMESTRES
  const niveauxOptions = schoolType === 'UNIVERSITY' ? NIVEAUX_UNIVERSITE : NIVEAUX_LYCEE
  const [selectedJours, setSelectedJours] = useState<string[]>([])
  
  // Salle state
  const [salleMode, setSalleMode] = useState<'select' | 'create'>('select')
  const [selectedSalle, setSelectedSalle] = useState('')
  const [nouvelleSalle, setNouvelleSalle] = useState('')
  
  // Multiple time slots
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [currentSlot, setCurrentSlot] = useState<Partial<TimeSlot>>({
    moduleId: '',
    heureDebut: '',
    heureFin: '',
    vh: 0
  })

  // Charger les salles existantes
  useEffect(() => {
    const fetchSalles = async () => {
      try {
        const response = await fetch(`/api/admin/salles?schoolId=${schoolId}`)
        if (response.ok) {
          const data = await response.json()
          // Combiner salles prédéfinies et salles existantes
          const allSalles = [...new Set([...SALLES_PREDEFINIES, ...data.map((s: any) => s.nom)])]
          setSalles(allSalles)
        } else {
          setSalles(SALLES_PREDEFINIES)
        }
      } catch (error) {
        console.error('Erreur chargement salles:', error)
        setSalles(SALLES_PREDEFINIES)
      }
    }
    if (open) {
      fetchSalles()
    }
  }, [open, schoolId])

  // Auto-fill VH when module is selected
  useEffect(() => {
    if (currentSlot.moduleId) {
      const module = modules.find(m => m.id === currentSlot.moduleId)
      if (module) {
        setCurrentSlot(prev => ({ ...prev, vh: module.vh }))
        if (module.filiere && !filiereId) {
          setFiliereId(module.filiere.id)
        }
      }
    }
  }, [currentSlot.moduleId, modules, filiereId])

  const addTimeSlot = () => {
    if (!currentSlot.moduleId || !currentSlot.heureDebut || !currentSlot.heureFin) {
      toast.error('Veuillez remplir tous les champs du créneau')
      return
    }

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      moduleId: currentSlot.moduleId!,
      heureDebut: currentSlot.heureDebut!,
      heureFin: currentSlot.heureFin!,
      vh: currentSlot.vh || 0
    }

    setTimeSlots([...timeSlots, newSlot])
    setCurrentSlot({
      moduleId: '',
      heureDebut: '',
      heureFin: '',
      vh: 0
    })
    toast.success('Créneau ajouté')
  }

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id))
  }

  const handleSubmit = async () => {
    // Validation
    if (!enseignantId || !filiereId || !niveau || !semestre || selectedJours.length === 0) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    if (timeSlots.length === 0) {
      toast.error('Veuillez ajouter au moins un créneau horaire')
      return
    }

    const salle = salleMode === 'select' ? selectedSalle : nouvelleSalle
    if (!salle) {
      toast.error('Veuillez sélectionner ou créer une salle')
      return
    }

    setLoading(true)
    try {
      // Créer un emploi du temps pour chaque créneau
      const promises = timeSlots.map(slot =>
        fetch('/api/admin/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId,
            moduleId: slot.moduleId,
            enseignantId,
            filiereId,
            niveau,
            semestre,
            salle,
            heureDebut: slot.heureDebut,
            heureFin: slot.heureFin,
            joursCours: selectedJours,
            vh: slot.vh,
          }),
        })
      )

      const results = await Promise.all(promises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        toast.success(`${timeSlots.length} cours ajoutés à l'emploi du temps`)
        resetForm()
        setOpen(false)
        onSuccess()
      } else {
        toast.error(`${failedCount} cours n'ont pas pu être créés`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création des cours')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEnseignantId('')
    setFiliereId('')
    setNiveau('')
    setSemestre('S1')
    setSelectedSalle('')
    setNouvelleSalle('')
    setSelectedJours([])
    setTimeSlots([])
    setCurrentSlot({
      moduleId: '',
      heureDebut: '',
      heureFin: '',
      vh: 0
    })
    setSalleMode('select')
  }

  const toggleJour = (jour: string) => {
    setSelectedJours(prev =>
      prev.includes(jour)
        ? prev.filter(j => j !== jour)
        : [...prev, jour]
    )
  }

  const getModuleName = (moduleId: string) => {
    return modules.find(m => m.id === moduleId)?.nom || 'Module inconnu'
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nouveau Cours
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-black">
          <DialogHeader>
            <DialogTitle>Ajouter des Cours à l&apos;Emploi du Temps</DialogTitle>
            <DialogDescription>
              Planifiez plusieurs cours avec différents modules et horaires
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informations communes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations Communes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enseignant */}
                <div>
                  <Label>Enseignant *</Label>
                  <Select value={enseignantId} onValueChange={setEnseignantId}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Sélectionnez un enseignant" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {enseignants.map((ens) => (
                        <SelectItem key={ens.id} value={ens.id}>
                          {ens.nom} {ens.prenom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filière */}
                <div>
                  <Label>Filière / Classe *</Label>
                  <Select value={filiereId} onValueChange={setFiliereId}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Sélectionnez une filière" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {filieres.map((fil) => (
                        <SelectItem key={fil.id} value={fil.id}>
                          {fil.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Niveau */}
                  <div>
                    <Label>Niveau *</Label>
                    <Select value={niveau} onValueChange={setNiveau}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Sélectionnez un niveau" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {niveauxOptions.map((niv) => (
                          <SelectItem key={niv} value={niv}>
                            {niv}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Semestre / Trimestre */}
                  <div>
                    <Label>{periodeLabel} *</Label>
                    <Select value={semestre} onValueChange={setSemestre}>
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {periodeOptions.map((periode) => (
                          <SelectItem key={periode} value={periode}>
                            {periode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Salle avec tabs */}
                <div>
                  <Label className="mb-2 block">Salle *</Label>
                  <Tabs value={salleMode} onValueChange={(v) => setSalleMode(v as 'select' | 'create')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="select">Choisir une salle</TabsTrigger>
                      <TabsTrigger value="create">Créer une salle</TabsTrigger>
                    </TabsList>
                    <TabsContent value="select" className="mt-2">
                      <Select value={selectedSalle} onValueChange={setSelectedSalle}>
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder="Sélectionnez une salle" />
                        </SelectTrigger>
                        <SelectContent className="bg-card max-h-60">
                          {salles.map((salle) => (
                            <SelectItem key={salle} value={salle}>
                              {salle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TabsContent>
                    <TabsContent value="create" className="mt-2">
                      <Input
                        value={nouvelleSalle}
                        onChange={(e) => setNouvelleSalle(e.target.value)}
                        placeholder="Ex: Salle D401"
                        className="bg-card"
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Jours de cours */}
                <div>
                  <Label className="mb-3 block">Jours de cours *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {JOURS_SEMAINE.map((jour) => (
                      <div key={jour.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={jour.value}
                          checked={selectedJours.includes(jour.value)}
                          onCheckedChange={() => toggleJour(jour.value)}
                        />
                        <label
                          htmlFor={jour.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {jour.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedJours.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedJours.length} jour(s) sélectionné(s)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Créneaux horaires */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Créneaux Horaires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Liste des créneaux ajoutés */}
                {timeSlots.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <Label>Créneaux ajoutés ({timeSlots.length})</Label>
                    {timeSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                        <div className="flex-1">
                          <p className="font-medium">{getModuleName(slot.moduleId)}</p>
                          <p className="text-sm text-muted-foreground">
                            {slot.heureDebut} - {slot.heureFin} ({slot.vh}h)
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(slot.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ajouter un créneau */}
                <div className="border-t pt-4">
                  <Label className="mb-3 block">Ajouter un créneau</Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Module / Matière</Label>
                      <Select 
                        value={currentSlot.moduleId} 
                        onValueChange={(value) => setCurrentSlot({ ...currentSlot, moduleId: value })}
                      >
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder="Sélectionnez un module" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {modules.map((module) => (
                            <SelectItem key={module.id} value={module.id}>
                              {module.nom} ({module.vh}h)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm">Heure début</Label>
                        <Input
                          type="time"
                          value={currentSlot.heureDebut}
                          onChange={(e) => setCurrentSlot({ ...currentSlot, heureDebut: e.target.value })}
                          className="bg-card"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Heure fin</Label>
                        <Input
                          type="time"
                          value={currentSlot.heureFin}
                          onChange={(e) => setCurrentSlot({ ...currentSlot, heureFin: e.target.value })}
                          className="bg-card"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">VH (heures)</Label>
                        <Input
                          type="number"
                          value={currentSlot.vh}
                          onChange={(e) => setCurrentSlot({ ...currentSlot, vh: parseInt(e.target.value) || 0 })}
                          className="bg-card"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTimeSlot}
                      className="w-full bg-primary text-black hover:bg-background hover:text-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter ce créneau
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
            onClick={handleSubmit} 
            disabled={loading || timeSlots.length === 0}
            className="bg-primary text-black hover:bg-background hover:text-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                `Créer ${timeSlots.length} Cours`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
