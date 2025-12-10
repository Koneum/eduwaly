'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Trash2, BookOpen } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from "sonner"

interface Module {
  id: string
  nom: string
  vh: number
  isUeCommune?: boolean
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
  initialData?: {
    id?: string
    moduleId: string
    enseignantId: string
    filiereId: string
    niveau: string
    semestre: string
    salle: string
    heureDebut: string
    heureFin: string
    joursCours: string
    vh: number
    schoolId?: string
  }
  isEditing?: boolean
  onCancel?: () => void
  externalOpen?: boolean
  onOpenChange?: (open: boolean) => void
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
// const SALLES_PREDEFINIES = [
//   'A101', 'A102', 'A103', 'A104', 'A105',
//   'B201', 'B202', 'B203', 'B204', 'B205',
//   'C301', 'C302', 'C303', 'C304', 'C305',
//   'Amphi 1', 'Amphi 2', 'Amphi 3',
//   'Labo Info 1', 'Labo Info 2', 'Labo Physique', 'Labo Chimie',
//   'Salle des Profs', 'Bibliothèque'
// ]

export function ScheduleCreatorV2({ 
  modules, 
  enseignants, 
  filieres, 
  schoolId, 
  schoolType, 
  onSuccess,
  initialData,
  isEditing = false,
  onCancel,
  externalOpen,
  onOpenChange
}: ScheduleCreatorProps) {
  const [loading, setLoading] = useState(false)
  const [salles, setSalles] = useState<string[]>([])
  const [internalOpen, setInternalOpen] = useState(false)

  // Utiliser externalOpen si fourni, sinon internalOpen
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value)
    } else {
      setInternalOpen(value)
    }
  }

  // Ouvrir le dialog UNIQUEMENT si on est en mode édition avec des données initiales
  useEffect(() => {
    if (isEditing && initialData) {
      setOpen(true)
    }
  }, [isEditing, initialData])

  // Fonction pour ouvrir le dialog en mode création
  const handleOpenDialog = () => {
    setOpen(true)
  }

  // Synchroniser les états du formulaire avec initialData (édition OU duplication)
  useEffect(() => {
    if (initialData) {
      console.log('InitialData reçu:', initialData, 'isEditing:', isEditing)
      setEnseignantId(initialData.enseignantId || '')
      setFiliereId(initialData.filiereId || '')
      setNiveau(initialData.niveau || '')
      setSemestre(initialData.semestre || (schoolType === 'UNIVERSITY' ? 'S1' : 'Trimestre 1'))
      setSelectedSalle(initialData.salle || '')
      setSelectedJours(initialData.joursCours ? JSON.parse(initialData.joursCours) : [])
    }
  }, [initialData, schoolType, isEditing])
  
  // Form state avec initialisation depuis initialData si en mode édition
  const [enseignantId, setEnseignantId] = useState(initialData?.enseignantId || '')
  const [filiereId, setFiliereId] = useState(initialData?.filiereId || '')
  const [niveau, setNiveau] = useState(initialData?.niveau || '')
  const [semestre, setSemestre] = useState(
    initialData?.semestre || (schoolType === 'UNIVERSITY' ? 'S1' : 'Trimestre 1')
  )
  
  // Labels dynamiques selon le type d'établissement
  const periodeLabel = schoolType === 'UNIVERSITY' ? 'Semestre' : 'Trimestre'
  const periodeOptions = schoolType === 'UNIVERSITY' ? SEMESTRES : TRIMESTRES
  const niveauxOptions = schoolType === 'UNIVERSITY' ? NIVEAUX_UNIVERSITE : NIVEAUX_LYCEE
  
  // Initialiser les jours sélectionnés
  const [selectedJours, setSelectedJours] = useState<string[]>(
    initialData?.joursCours ? JSON.parse(initialData.joursCours) : []
  )
  
  // Gestion des créneaux horaires
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  
  // Initialiser timeSlots avec les données d'édition/duplication si disponibles
  useEffect(() => {
    if (initialData && initialData.moduleId) {
      // Pour la duplication, heureDebut/heureFin peuvent être vides
      // On crée quand même le créneau pour pré-remplir le module
      setTimeSlots([{
        id: '1',
        moduleId: initialData.moduleId,
        heureDebut: initialData.heureDebut || '',
        heureFin: initialData.heureFin || '',
        vh: initialData.vh || 1
      }])
      // Mettre à jour currentSlot aussi
      setCurrentSlot({
        moduleId: initialData.moduleId,
        heureDebut: initialData.heureDebut || '',
        heureFin: initialData.heureFin || '',
        vh: initialData.vh || 1
      })
    } else if (!initialData) {
      setTimeSlots([])
    }
  }, [initialData])

  // Gestion des salles
  const [salleMode, setSalleMode] = useState<'select' | 'create'>('select')
  const [selectedSalle, setSelectedSalle] = useState(initialData?.salle || '')
  const [nouvelleSalle, setNouvelleSalle] = useState('')
  
  // Pour la compatibilité avec le code existant
  const [currentSlot, setCurrentSlot] = useState<Partial<TimeSlot>>({
    moduleId: initialData?.moduleId || '',
    heureDebut: initialData?.heureDebut || '',
    heureFin: initialData?.heureFin || '',
    vh: initialData?.vh || 0
  })

  // Charger les salles existantes depuis l'API
  useEffect(() => {
    const fetchSalles = async () => {
      try {
        const response = await fetch(`/api/admin/salles?schoolId=${schoolId}`)
        if (response.ok) {
          const data = await response.json()
          // Extraire les noms des salles depuis la réponse
          const nomsSalles = data.map((s: { nom: string }) => s.nom)
          setSalles(nomsSalles)
          
          // Si on est en mode édition et que la salle n'existe pas, l'ajouter
          if (isEditing && initialData?.salle && !nomsSalles.includes(initialData.salle)) {
            setSalles([...nomsSalles, initialData.salle])
          }
        } else {
          console.error('Erreur lors du chargement des salles:', await response.text())
          setSalles([]) // Tableau vide en cas d'erreur
        }
      } catch (error) {
        console.error('Erreur lors du chargement des salles:', error)
        setSalles([]) // Tableau vide en cas d'erreur
      }
    }
    
    fetchSalles()
  }, [schoolId, isEditing, initialData?.salle])

  // State pour tracker si le module sélectionné est une UE Commune
  const [isCurrentModuleUeCommune, setIsCurrentModuleUeCommune] = useState(false)

  // Auto-fill VH when module is selected et détecter UE Commune
  useEffect(() => {
    if (currentSlot.moduleId) {
      const selectedModule = modules.find(m => m.id === currentSlot.moduleId)
      if (selectedModule) {
        setCurrentSlot(prev => ({ ...prev, vh: selectedModule.vh }))
        
        // Vérifier si c'est une UE Commune
        setIsCurrentModuleUeCommune(selectedModule.isUeCommune === true)
        
        // Pour les UE Communes, vider la filière
        if (selectedModule.isUeCommune) {
          setFiliereId('')
        } else if (selectedModule.filiere && !filiereId) {
          setFiliereId(selectedModule.filiere.id)
        }
      }
    } else {
      setIsCurrentModuleUeCommune(false)
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
    // Vérifier si le module sélectionné est une UE Commune
    const selectedModule = timeSlots.length > 0 ? modules.find(m => m.id === timeSlots[0].moduleId) : null
    const isUeCommune = selectedModule?.isUeCommune === true

    // Validation - filiereId n'est pas requis pour les UE Communes
    if (!enseignantId || (!isUeCommune && !filiereId) || !niveau || !semestre || selectedJours.length === 0) {
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
      if (isEditing && initialData?.id) {
        // Mode édition - mettre à jour l'emploi existant
        const response = await fetch(`/api/admin/schedule/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId,
            moduleId: timeSlots[0].moduleId,
            enseignantId,
            filiereId,
            niveau,
            semestre,
            salle,
            heureDebut: timeSlots[0].heureDebut,
            heureFin: timeSlots[0].heureFin,
            joursCours: selectedJours,
            vh: timeSlots[0].vh,
          }),
        })

        if (response.ok) {
          toast.success('Emploi du temps mis à jour avec succès')
          setOpen(false)
          onSuccess()
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur lors de la mise à jour')
        }
      } else {
        // Mode création - créer de nouveaux emplois
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
          setOpen(false)
          if (!isEditing) {
            resetForm()
          }
          onSuccess()
        } else {
          toast.error(`${failedCount} cours n'ont pas pu être créés`)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEnseignantId('')
    setFiliereId('')
    setNiveau('')
    setSemestre(schoolType === 'UNIVERSITY' ? 'S1' : 'Trimestre 1')
    setSelectedSalle('')
    setNouvelleSalle('')
    setSelectedJours([])
    setTimeSlots([{
      id: '1',
      moduleId: '',
      heureDebut: '08:00',
      heureFin: '09:00',
      vh: 1
    }])
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
    <div className="space-y-6">
      {/* Si on n'est pas dans un contexte parent (pas de onCancel), afficher un bouton pour créer */}
      {!onCancel && (
        <div className="flex justify-center">
          <Button onClick={handleOpenDialog} className="bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4 mr-2" />
            Nouveau cours
          </Button>
        </div>
      )}

      {/* Si on est dans un contexte parent (avec onCancel), afficher seulement le dialog */}
      {onCancel ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-black">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Modifier un Cours dans l\'Emploi du Temps' : 'Ajouter des Cours à l\'Emploi du Temps'}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? 'Modifiez les informations du cours sélectionné'
                  : 'Planifiez plusieurs cours avec différents modules et horaires'
                }
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

                  {/* Filière - Optionnel pour UE Communes */}
                  <div>
                    <Label>
                      Filière / Classe {!isCurrentModuleUeCommune && '*'}
                      {isCurrentModuleUeCommune && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">
                          (UE Commune - Toutes filières)
                        </span>
                      )}
                    </Label>
                    {isCurrentModuleUeCommune ? (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          📚 Ce module est une <strong>UE Commune</strong>. Il sera affiché pour toutes les filières.
                        </p>
                      </div>
                    ) : (
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
                    )}
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
                      <TabsList className="grid w-full grid-cols-2 bg-foreground">
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
                            className="text-primary border-foreground dark:border-primary"
                          />
                          <label
                            htmlFor={jour.value}
                            className="text-responsive-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Fermer
                </Button>
              )}
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (onCancel) onCancel()
                    setOpen(false)
                  }}
                  disabled={loading}
                >
                  Annuler
                </Button>
              )}
              <Button 
                onClick={handleSubmit} 
                disabled={loading || timeSlots.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? 'Mise à jour...' : 'Création...'}
                  </>
                ) : isEditing ? (
                  'Mettre à jour'
                ) : (
                  `Créer ${timeSlots.length} Cours`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <>
          

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-black">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? 'Modifier un Cours dans l\'Emploi du Temps' : 'Ajouter des Cours à l\'Emploi du Temps'}
                </DialogTitle>
                <DialogDescription>
                  {isEditing 
                    ? 'Modifiez les informations du cours sélectionné'
                    : 'Planifiez plusieurs cours avec différents modules et horaires'
                  }
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

                    {/* Filière - Optionnel pour UE Communes */}
                    <div>
                      <Label>
                        Filière / Classe {!isCurrentModuleUeCommune && '*'}
                        {isCurrentModuleUeCommune && (
                          <span className="ml-2 text-xs text-blue-600 font-normal">
                            (UE Commune - Toutes filières)
                          </span>
                        )}
                      </Label>
                      {isCurrentModuleUeCommune ? (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            📚 Ce module est une <strong>UE Commune</strong>. Il sera affiché pour toutes les filières.
                          </p>
                        </div>
                      ) : (
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
                      )}
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
                        <TabsList className="grid w-full grid-cols-2 bg-foreground">
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
                              className="text-primary border-foreground dark:border-primary"
                            />
                            <label
                              htmlFor={jour.value}
                              className="text-responsive-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Fermer
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || timeSlots.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEditing ? 'Mise à jour...' : 'Création...'}
                    </>
                  ) : isEditing ? (
                    'Mettre à jour'
                  ) : (
                    `Créer ${timeSlots.length} Cours`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
