'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave } from 'react-icons/fa';
import { toast } from 'sonner'
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { use } from 'react';

interface FormData {
  titre: string;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  salle: string;
  niveau: string;
  semestre: string;
  vh: number;
  joursCours: string; // JSON string
  evaluation: boolean;
  jourEvaluation: string;
  ueCommune: boolean;
  moduleId: string;
  enseignantId: string;
  filiereId: string;
  anneeUnivId: string;
}

interface Module {
  id: string;
  nom: string;
  vh: number;
  isUeCommune: boolean;
}

interface AnneeUniversitaire {
  id: string;
  annee: string;
}

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'] as const;

export default function EditEmploiPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [loading, setLoading] = useState(true);
  const [filieres, setFilieres] = useState([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [enseignants, setEnseignants] = useState([]);
  const [anneesUniv, setAnneesUniv] = useState<AnneeUniversitaire[]>([]);
  const [formData, setFormData] = useState<FormData>({
    titre: '',
    dateDebut: '',
    dateFin: '',
    heureDebut: '',
    heureFin: '',
    salle: '',
    niveau: '',
    semestre: '',
    vh: 0,
    joursCours: '[]',
    evaluation: false,
    jourEvaluation: '',
    ueCommune: false,
    moduleId: '',
    enseignantId: '',
    filiereId: '',
    anneeUnivId: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filieresRes, modulesRes, enseignantsRes, anneesRes, emploiRes] = await Promise.all([
          fetch('/api/filieres'),
          fetch('/api/modules'),
          fetch('/api/enseignants'),
          fetch('/api/annee-universitaire'),
          fetch(`/api/emploi/${id}`)
        ]);

        const [filieresData, modulesData, enseignantsData, anneesData, emploiData] = await Promise.all([
          filieresRes.json(),
          modulesRes.json(),
          enseignantsRes.json(),
          anneesRes.json(),
          emploiRes.json()
        ]);

        if (!filieresData || !modulesData || !enseignantsData || !anneesData || !emploiData) {
          throw new Error('Données manquantes');
        }

        setFilieres(filieresData);
        setModules(modulesData);
        setEnseignants(enseignantsData);
        setAnneesUniv(anneesData);

        // Format dates for input fields
        const formattedEmploi = {
          ...emploiData,
          dateDebut: new Date(emploiData.dateDebut).toISOString().split('T')[0],
          dateFin: new Date(emploiData.dateFin).toISOString().split('T')[0],
          joursCours: emploiData.joursCours || '[]',
          jourEvaluation: emploiData.jourEvaluation || '',
          evaluation: !!emploiData.jourEvaluation
        };

        // Determine if it's a UE commune
        const selectedModule = modulesData.find((m: Module) => m.id === emploiData.moduleId);
        formattedEmploi.ueCommune = selectedModule?.isUeCommune || false;

        setFormData(formattedEmploi);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.anneeUnivId) {
        toast.error('Veuillez sélectionner une année universitaire');
        return;
      }

      if (!formData.moduleId) {
        toast.error('Veuillez sélectionner un module');
        return;
      }

      if (!formData.enseignantId) {
        toast.error('Veuillez sélectionner un enseignant');
        return;
      }

      if (!formData.ueCommune && !formData.filiereId) {
        toast.error('Veuillez sélectionner une filière');
        return;
      }

      const joursCours = JSON.parse(formData.joursCours);
      if (!joursCours || joursCours.length === 0) {
        toast.error('Veuillez sélectionner au moins un jour de cours');
        return;
      }

      const dataToSend = {
        ...formData,
        joursCours: JSON.stringify(joursCours),
        filiereId: formData.ueCommune ? null : (formData.filiereId || null),
        anneeUnivId: formData.anneeUnivId
      };

      const response = await fetch(`/api/emploi/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la modification de l\'emploi');
      }

      toast.success('Emploi modifié avec succès');
      router.push('/emploi/' + id);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  const handleJourSelection = (jour: string) => {
    try {
      const joursCours = JSON.parse(formData.joursCours);
      const newJoursCours = joursCours.includes(jour)
        ? joursCours.filter((j: string) => j !== jour)
        : [...joursCours, jour];
      
      setFormData(prev => ({
        ...prev,
        joursCours: JSON.stringify(newJoursCours)
      }));
    } catch (error) {
      console.error('Error parsing joursCours:', error);
      setFormData(prev => ({
        ...prev,
        joursCours: '[]'
      }));
    }
  };

  const handleModuleChange = (value: string) => {
    const selectedModule = modules.find(m => m.id === value);
    
    if (selectedModule) {
      setFormData(prev => ({
        ...prev,
        moduleId: value,
        vh: selectedModule.vh,
        ueCommune: selectedModule.isUeCommune,
        filiereId: selectedModule.isUeCommune ? '' : prev.filiereId
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        moduleId: '',
        vh: 0,
        ueCommune: false
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 text-black">
      <h1 className="text-2xl font-bold mb-6">Modifier l&apos;emploi du temps</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Titre */}
          <div>
            <Label>Titre</Label>
            <Input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              className=""
            />
          </div>

          {/* Date de début */}
          <div>
            <Label>Date de début</Label>
            <Input
              type="date"
              value={formData.dateDebut}
              onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
              className=""
            />
          </div>

          {/* Date de fin */}
          <div>
            <Label>Date de fin</Label>
            <Input
              type="date"
              value={formData.dateFin}
              onChange={(e) => setFormData(prev => ({ ...prev, dateFin: e.target.value }))}
              className=""
            />
          </div>

          {/* Heure de début */}
          <div>
            <Label>Heure de début</Label>
            <Input
              type="time"
              value={formData.heureDebut}
              onChange={(e) => setFormData(prev => ({ ...prev, heureDebut: e.target.value }))}
              className=""
            />
          </div>

          {/* Heure de fin */}
          <div>
            <Label>Heure de fin</Label>
            <Input
              type="time"
              value={formData.heureFin}
              onChange={(e) => setFormData(prev => ({ ...prev, heureFin: e.target.value }))}
              className=""
            />
          </div>

          {/* Salle */}
          <div>
            <Label>Salle</Label>
            <Input
              type="text"
              value={formData.salle}
              onChange={(e) => setFormData(prev => ({ ...prev, salle: e.target.value }))}
              className=""            />
          </div>

          {/* Niveau */}
          <div>
            <Label>Niveau</Label>
            <Select value={formData.niveau} onValueChange={(value) => setFormData(prev => ({ ...prev, niveau: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un niveau" />
              </SelectTrigger>
              <SelectContent>
                {['L1', 'L2', 'L3', 'M1', 'M2'].map((niveau) => (
                  <SelectItem key={niveau} value={niveau}>
                    {niveau}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semestre */}
          <div>
            <Label>Semestre</Label>
            <Select value={formData.semestre} onValueChange={(value) => setFormData(prev => ({ ...prev, semestre: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un semestre" />
              </SelectTrigger>
              <SelectContent>
                {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Module */}
          <div>
            <Label>Module</Label>
            <Select value={formData.moduleId} onValueChange={handleModuleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.nom} ({module.vh}h)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Volume Horaire */}
          <div>
            <Label>Volume Horaire</Label>
            <Input
              type="number"
              value={formData.vh}
              disabled
              className="bg-gray-100"
            />
            <p className="mt-1 text-sm text-gray-500">Le volume horaire est automatiquement défini par le module sélectionné</p>
          </div>

          {/* Enseignant */}
          <div>
            <Label>Enseignant</Label>
            <Select value={formData.enseignantId} onValueChange={(value) => setFormData(prev => ({ ...prev, enseignantId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un enseignant" />
              </SelectTrigger>
              <SelectContent>
                {enseignants.map((enseignant: any) => (
                  <SelectItem key={enseignant.id} value={enseignant.id}>
                    {enseignant.nom} {enseignant.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filière */}
          <div>
            <Label>Filière</Label>
            <Select 
              value={formData.filiereId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, filiereId: value }))}
              disabled={formData.ueCommune}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une filière" />
              </SelectTrigger>
              <SelectContent>
                {filieres.map((filiere: any) => (
                  <SelectItem key={filiere.id} value={filiere.id}>
                    {filiere.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.ueCommune && (
              <p className="mt-1 text-sm text-gray-500">La filière n&apos;est pas requise pour une UE Commune</p>
            )}
          </div>

          {/* Année universitaire */}
          <div>
            <Label>Année universitaire</Label>
            <Select value={formData.anneeUnivId} onValueChange={(value) => setFormData(prev => ({ ...prev, anneeUnivId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une année universitaire" />
              </SelectTrigger>
              <SelectContent>
                {anneesUniv.map((annee) => (
                  <SelectItem key={annee.id} value={annee.id}>
                    {annee.annee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Jours de cours */}
        <div>
          <Label>Jours de cours</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-2">
            {JOURS.map((jour) => {
              const isSelected = JSON.parse(formData.joursCours).includes(jour);
              return (
                <div
                  key={jour}
                  onClick={() => handleJourSelection(jour)}
                  className={`p-4 rounded-lg border cursor-pointer text-center transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {jour}
                </div>
              );
            })}
          </div>
        </div>

        {/* Évaluation */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="evaluation"
              checked={formData.evaluation}
              onCheckedChange={(checked: boolean) => 
                setFormData(prev => ({ ...prev, evaluation: checked }))
              }
            />
            <Label htmlFor="evaluation">Évaluation</Label>
          </div>

          {formData.evaluation && (
            <div>
              <Label>Jour d&apos;évaluation</Label>
              <Select 
                value={formData.jourEvaluation} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, jourEvaluation: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un jour" />
                </SelectTrigger>
                <SelectContent>
                  {JOURS.map((jour) => (
                    <SelectItem key={jour} value={jour}>
                      {jour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Boutons */}
        <div className="flex items-center space-x-4">
        <Button 
            type="button" 
            variant="outline" 
            className="w-full md:w-auto bg-white text-red-500 hover:bg-red-500 hover:text-white"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button type="submit" className="w-full md:w-auto bg-indigo-600 text-white">
            <FaSave className="mr-2" />
            Enregistrer les modifications
          </Button>

        </div>
      </form>
    </div>
  );
}
