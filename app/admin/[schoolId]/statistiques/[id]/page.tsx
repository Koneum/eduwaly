'use client'

import { useEffect, useState, use } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { FiDownload } from 'react-icons/fi'
import { toast } from 'sonner'

interface Module {
  id: string
  nom: string
  type: string
  vh: number
  filiere: {
    nom: string
  } | null
  semestre?: 'S1' | 'S2'
}

interface EmploiDuTemps {
  id: string
  dateDebut: string
  dateFin: string
  heureDebut: string
  heureFin: string
  vh: number
  module: Module
  evaluation: boolean
  jourEvaluation: string | null
  joursCours: string | null
  anneeUniv: {
    annee: string
  } | null
}

interface Enseignant {
  id: string
  nom: string
  prenom: string
  titre: string
  grade: string
  type: string
  emplois: EmploiDuTemps[]
}

export default function EnseignantDetailsPage({ params }: { params: Promise<{ schoolId: string; id: string }> }) {
  const [enseignant, setEnseignant] = useState<Enseignant | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSemestre, setSelectedSemestre] = useState<'S1' | 'S2'>('S1')
  const [selectedType, setSelectedType] = useState<'all' | 'CM' | 'TD' | 'TP'>('all')

  // Utiliser le hook use pour accéder aux paramètres de manière asynchrone
  const { id } = use(params);

  // Fonction pour formater le type d'enseignant
  const formatType = (type: string) => {
    switch (type) {
      case 'PERMANENT':
        return 'Enseignant Permanent'
      case 'VACATAIRE':
        return 'Enseignant Vacataire'
      default:
        return type
    }
  }

  // Fonction pour formater le grade
  const formatGrade = (grade: string) => {
    switch (grade) {
      case 'PROFESSEUR':
        return 'Professeur'
      case 'MAITRE_CONFERENCE':
        return 'Maître de Conférences'
      case 'MAITRE_ASSISTANT':
        return 'Maître Assistant'
      case 'ASSISTANT':
        return 'Assistant'
      default:
        return grade
    }
  }

  // Fonction pour obtenir la couleur du badge selon le type
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'CM':
        return 'bg-blue-100 text-blue-800'
      case 'TD':
        return 'bg-green-100 text-green-800'
      case 'TP':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Fonction pour calculer le total des heures
  const calculateTotalHours = (emplois: EmploiDuTemps[]) => {
    return emplois
      .filter(emploi => emploi.module.semestre === selectedSemestre)
      .filter(emploi => selectedType === 'all' || emploi.module.type === selectedType)
      .reduce((sum, emploi) => sum + emploi.vh, 0)
  }

  // Fonction pour calculer les heures dues par semestre
  const getHeuresDues = (type: string) => {
    const heuresAnnuelles = type === 'PERMANENT' ? 192 : 96
    return heuresAnnuelles / 2 // Diviser par 2 pour obtenir les heures par semestre
  }

  useEffect(() => {
    const fetchEnseignant = async () => {
      try {
        const response = await fetch(`/api/enseignants/${id}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        
        // Toujours recalculer le semestre selon la nouvelle logique
        const enseignantWithSemestre = {
          ...data,
          emplois: data.emplois.map((emploi: EmploiDuTemps) => ({
            ...emploi,
            module: {
              ...emploi.module,
              semestre: getSemestreFromDate(emploi.dateDebut)
            }
          }))
        };
        
        setEnseignant(enseignantWithSemestre);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchEnseignant();
  }, [id]);

  const getSemestreFromDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // Les mois commencent à 0
    return month >= 8 && month <= 12 ? 'S2' : 'S1';
  };

  const handleExportPDF = async () => {
    try {
      // Désactiver le bouton pendant le téléchargement
      const button = document.querySelector('button[data-export-pdf]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="animate-spin mr-2">↻</span> Génération...';
      }

      const response = await fetch(`/api/enseignants/${id}/pdf`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          semestre: selectedSemestre
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `emploi-du-temps-${enseignant?.nom}-${enseignant?.prenom}.pdf`;
      
      // Utiliser setTimeout pour éviter les clics multiples
      document.body.appendChild(a);
      setTimeout(() => {
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Réactiver le bouton après le téléchargement
        if (button) {
          button.disabled = false;
          button.innerHTML = '<svg class="mr-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Exporter PDF';
        }
      }, 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
      
      // Réactiver le bouton en cas d'erreur
      const button = document.querySelector('button[data-export-pdf]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="mr-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Exporter PDF';
      }
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!enseignant) {
    return <div>Enseignant non trouvé</div>;
  }

  return (
    <div className="p-4 space-y-6 text-black">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {enseignant.prenom} {enseignant.nom}
          </h1>
          <p className="text-gray-600">
            {formatGrade(enseignant.grade)} - {formatType(enseignant.type)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="semestre" className="text-sm font-medium text-gray-600">
              Semestre :
            </label>
            <select
              id="semestre"
              value={selectedSemestre}
              onChange={(e) => setSelectedSemestre(e.target.value as 'S1' | 'S2')}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="S1">Semestre 1</option>
              <option value="S2">Semestre 2</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="type" className="text-sm font-medium text-gray-600">
              Type :
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'all' | 'CM' | 'TD' | 'TP')}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tous</option>
              <option value="CM">CM</option>
              <option value="TD">TD</option>
              <option value="TP">TP</option>
            </select>
          </div>
          <Button data-export-pdf onClick={handleExportPDF} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <FiDownload className="mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total heures dispensées</p>
              <p className="text-lg font-semibold">
                {calculateTotalHours(enseignant.emplois)}h
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Heures dues ({selectedSemestre})</p>
              <p className="text-lg font-semibold">
                {getHeuresDues(enseignant.type)}h
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Heures supplémentaires</p>
              <p className="text-lg font-semibold">
                {Math.max(0, calculateTotalHours(enseignant.emplois) - getHeuresDues(enseignant.type))}h
              </p>
            </div>
          </div>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                Module
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Filière
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                Période
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Volume Horaire
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enseignant.emplois
              .filter(emploi => emploi.module.semestre === selectedSemestre)
              .filter(emploi => selectedType === 'all' || emploi.module.type === selectedType)
              .map((emploi) => (
                <tr key={emploi.id} className={emploi.evaluation ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900">{emploi.module.nom}</div>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(emploi.module.type)}`}>
                            {emploi.module.type}
                          </span>
                          
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {emploi.module.filiere?.nom || (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        UE Commune
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      Du {format(new Date(emploi.dateDebut.split('/').reverse().join('-')), 'dd MMMM', { locale: fr })} au{' '}
                      {format(new Date(emploi.dateFin.split('/').reverse().join('-')), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                    
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {emploi.vh}h
                  </td>
                </tr>
              ))}
            {enseignant.emplois.filter(emploi => emploi.module.semestre === selectedSemestre).filter(emploi => selectedType === 'all' || emploi.module.type === selectedType).length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Aucun module pour ce semestre
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
