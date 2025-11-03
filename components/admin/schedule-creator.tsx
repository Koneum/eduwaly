'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'

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

interface ScheduleCreatorProps {
  modules: Module[]
  enseignants: Enseignant[]
  filieres: Filiere[]
  schoolId: string
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

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale']
const SEMESTRES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

export function ScheduleCreator({ modules, enseignants, filieres, schoolId, onSuccess }: ScheduleCreatorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [moduleId, setModuleId] = useState('')
  const [enseignantId, setEnseignantId] = useState('')
  const [filiereId, setFiliereId] = useState('')
  const [niveau, setNiveau] = useState('')
  const [semestre, setSemestre] = useState('S1')
  const [salle, setSalle] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [selectedJours, setSelectedJours] = useState<string[]>([])
  const [vh, setVh] = useState('')

  // Auto-fill VH when module is selected
  useEffect(() => {
    if (moduleId) {
      const module = modules.find(m => m.id === moduleId)
      if (module) {
        setVh(module.vh.toString())
        if (module.filiere) {
          setFiliereId(module.filiere.id)
        }
      }
    }
  }, [moduleId, modules])

  const handleSubmit = async () => {
    // Validation
    if (!moduleId || !enseignantId || !filiereId || !niveau || !semestre || !salle || !heureDebut || !heureFin || selectedJours.length === 0) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          moduleId,
          enseignantId,
          filiereId,
          niveau,
          semestre,
          salle,
          heureDebut,
          heureFin,
          joursCours: selectedJours,
          vh: parseInt(vh) || 0,
        }),
      })

      if (response.ok) {
        toast.success('Cours ajouté à l\'emploi du temps')
        resetForm()
        setOpen(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création du cours')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setModuleId('')
    setEnseignantId('')
    setFiliereId('')
    setNiveau('')
    setSemestre('S1')
    setSalle('')
    setHeureDebut('')
    setHeureFin('')
    setSelectedJours([])
    setVh('')
  }

  const toggleJour = (jour: string) => {
    setSelectedJours(prev =>
      prev.includes(jour)
        ? prev.filter(j => j !== jour)
        : [...prev, jour]
    )
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nouveau Cours
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-black">
          <DialogHeader>
            <DialogTitle>Ajouter un Cours à l&apos;Emploi du Temps</DialogTitle>
            <DialogDescription>
              Planifiez un nouveau cours dans l&apos;emploi du temps
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Module */}
            <div>
              <Label>Module / Matière *</Label>
              <Select value={moduleId} onValueChange={setModuleId}>
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

            {/* Niveau */}
            <div>
              <Label>Niveau *</Label>
              <Select value={niveau} onValueChange={setNiveau}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Sélectionnez un niveau" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {NIVEAUX.map((niv) => (
                    <SelectItem key={niv} value={niv}>
                      {niv}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semestre */}
            <div>
              <Label>Semestre *</Label>
              <Select value={semestre} onValueChange={setSemestre}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {SEMESTRES.map((sem) => (
                    <SelectItem key={sem} value={sem}>
                      {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salle */}
            <div>
              <Label>Salle *</Label>
              <Input
                value={salle}
                onChange={(e) => setSalle(e.target.value)}
                placeholder="Ex: Salle A101"
                className="bg-card"
              />
            </div>

            {/* Horaires */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heure de début *</Label>
                <Input
                  type="time"
                  value={heureDebut}
                  onChange={(e) => setHeureDebut(e.target.value)}
                  className="bg-card"
                />
              </div>
              <div>
                <Label>Heure de fin *</Label>
                <Input
                  type="time"
                  value={heureFin}
                  onChange={(e) => setHeureFin(e.target.value)}
                  className="bg-card"
                />
              </div>
            </div>

            {/* Volume horaire */}
            <div>
              <Label>Volume Horaire (heures) *</Label>
              <Input
                type="number"
                value={vh}
                onChange={(e) => setVh(e.target.value)}
                placeholder="Ex: 2"
                className="bg-card"
              />
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
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le Cours'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
