'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave } from 'react-icons/fa';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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

export default function NouvelEmploiPage() {
  const router = useRouter();
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
    niveau: 'placeholder',
    semestre: 'placeholder',
    vh: 0,
    joursCours: '[]',
    evaluation: false,
    jourEvaluation: 'placeholder',
    ueCommune: false,
    moduleId: 'placeholder',
    enseignantId: 'placeholder',
    filiereId: 'placeholder',
    anneeUnivId: 'placeholder'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filieresRes, modulesRes, enseignantsRes, anneesRes] = await Promise.all([
          fetch('/api/filieres'),
          fetch('/api/modules'),
          fetch('/api/enseignants'),
          fetch('/api/annee-universitaire')
        ]);

        const [filieresData, modulesData, enseignantsData, anneesData] = await Promise.all([
          filieresRes.json(),
          modulesRes.json(),
          enseignantsRes.json(),
          anneesRes.json()
        ]);

        if (!filieresData || !modulesData || !enseignantsData || !anneesData) {
          throw new Error('Données manquantes');
        }

        setFilieres(filieresData);
        setModules(modulesData);
        setEnseignants(enseignantsData);
        setAnneesUniv(anneesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.anneeUnivId || formData.anneeUnivId === 'placeholder') {
        toast.error('Veuillez sélectionner une année universitaire');
        return;
      }

      if (!formData.moduleId || formData.moduleId === 'placeholder') {
        toast.error('Veuillez sélectionner un module');
        return;
      }

      if (!formData.enseignantId || formData.enseignantId === 'placeholder') {
        toast.error('Veuillez sélectionner un enseignant');
        return;
      }

      if (!formData.ueCommune && (!formData.filiereId || formData.filiereId === 'placeholder')) {
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
        joursCours: JSON.stringify(joursCours), // Stringify the array before sending
        filiereId: formData.ueCommune ? null : (formData.filiereId || null),
        anneeUnivId: formData.anneeUnivId
      };

      const response = await fetch('/api/emploi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de l\'emploi');
      }

      const data = await response.json();
      toast.success('Emploi créé avec succès');
      router.push('/emploi/' + data.id);
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

  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModuleId = e.target.value;
    const selectedModule = modules.find(m => m.id === selectedModuleId);
    
    if (selectedModule) {
      setFormData(prev => ({
        ...prev,
        moduleId: selectedModuleId,
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

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 text-black">
      <h1 className="text-responsive-xl font-bold mb-4 sm:mb-6">Nouvel Emploi du Temps</h1>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Champs de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-responsive-sm font-medium text-gray-700">
              Titre
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-responsive-sm"
            />
          </div>

          <div>
            <label className="block text-responsive-sm font-medium text-gray-700">
              Date de début
            </label>
            <input
              type="date"
              value={formData.dateDebut}
              onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date de fin
            </label>
            <input
              type="date"
              value={formData.dateFin}
              onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Heure de début
            </label>
            <input
              type="time"
              value={formData.heureDebut}
              onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Heure de fin
            </label>
            <input
              type="time"
              value={formData.heureFin}
              onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Salle
            </label>
            <input
              type="text"
              value={formData.salle}
              onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Niveau
            </label>
            <select
              value={formData.niveau}
              onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="placeholder" disabled>Niveau</option>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
              <option value="M1">M1</option>
              <option value="M2">M2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Semestre
            </label>
            <select
              value={formData.semestre}
              onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="placeholder" disabled>Sélectionner un semestre</option>
              {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Module
            </label>
            <select
              value={formData.moduleId}
              onChange={handleModuleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="placeholder" disabled>Sélectionner un module</option>
              {modules.map((module: Module) => (
                <option key={module.id} value={module.id}>
                  {module.nom} ({module.vh}h)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Volume Horaire
            </label>
            <input
              type="number"
              value={formData.vh}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
            />
            <p className="mt-1 text-responsive-xs text-gray-500">Le volume horaire est automatiquement défini par le module sélectionné</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Enseignant
            </label>
            <select
              value={formData.enseignantId}
              onChange={(e) => setFormData({ ...formData, enseignantId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="placeholder" disabled>Sélectionner un enseignant</option>
              {enseignants.map((enseignant: any) => (
                <option key={enseignant.id} value={enseignant.id}>
                  {enseignant.nom} {enseignant.prenom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Filière
            </label>
            <select
              value={formData.filiereId}
              onChange={(e) => setFormData({ ...formData, filiereId: e.target.value })}
              disabled={formData.ueCommune}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="placeholder" disabled>Sélectionner une filière</option>
              {filieres.map((filiere: any) => (
                <option key={filiere.id} value={filiere.id}>
                  {filiere.nom}
                </option>
              ))}
            </select>
            {formData.ueCommune && (
              <p className="mt-1 text-responsive-xs text-gray-500">La filière n&apos;est pas requise pour une UE Commune</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Année universitaire
            </label>
            <select
              value={formData.anneeUnivId}
              onChange={(e) => setFormData({ ...formData, anneeUnivId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="placeholder" disabled>Sélectionner une année universitaire</option>
              {anneesUniv.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.annee}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.ueCommune}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    ueCommune: e.target.checked,
                    filiereId: e.target.checked ? '' : formData.filiereId
                  });
                }}
                className="rounded border-gray-300 text-indigo-600"
              />
              <span>UE Commune</span>
            </label>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-responsive-sm font-medium text-gray-700 mb-2"> 
              Jours de cours
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-2">
              {JOURS.map((jour) => {
                const isSelected = JSON.parse(formData.joursCours).includes(jour);
                return (
                  <button
                    key={jour}
                    type="button"
                    onClick={() => handleJourSelection(jour)}
                    className={`${isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-indigo-600 hover:bg-accent hover:text-accent-foreground'
                    } px-3 sm:px-4 py-2 border rounded-md shadow-sm text-responsive-xs font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
                  >
                    {jour}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.evaluation}
                onChange={(e) => setFormData({ ...formData, evaluation: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600"
              />
              <span>Évaluation</span>
            </label>

            {formData.evaluation && (
              <div>
                <label className="block text-responsive-sm font-medium text-gray-700">
                  Jour de l&apos;évaluation
                </label>
                <select
                  value={formData.jourEvaluation}
                  onChange={(e) => setFormData({ ...formData, jourEvaluation: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="placeholder" disabled>Sélectionner un jour</option>
                  {JSON.parse(formData.joursCours).map((jour: string) => (
                    <option key={jour} value={jour}>
                      {jour}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full sm:w-auto bg-white text-red-700 hover:bg-accent hover:text-accent-foreground text-responsive-sm"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          
          <Button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white text-responsive-sm">
            <FaSave className="mr-2" />
            Créer l&apos;emploi du temps
          </Button>
        </div>
      </form>
    </div>
  );
}
