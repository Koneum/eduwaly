'use client'

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaEdit, FaDownload } from 'react-icons/fa';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

// Types
interface Module {
  id: string;
  nom: string;
  type: string;
}

interface Enseignant {
  id: string;
  titre: string;
  prenom: string;
  nom: string;
}

interface Filiere {
  id: string;
  nom: string;
}

interface AnneeUniv {
  id: string;
  annee: string;
}

interface EmploiDuTemps {
  id: string;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  salle: string;
  niveau: string;
  semestre: string;
  vh: number;
  ueCommune: boolean;
  evaluation: boolean;
  jourEvaluation: string;
  joursCours: string;
  module: Module;
  enseignant: Enseignant;
  filiere?: Filiere;
  anneeUniv: AnneeUniv;
}

interface Parametres {
  titre: string;
  chefDepartement: string;
  grade: string;
}

// Fonction pour formater le nom de l'enseignant
const formatEnseignantName = (prenom: string, nom: string) => {
  return `${prenom} ${nom}`;
};

// Fonction pour formater la date
const formatDateForDisplay = (date: Date) => {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Fonction pour vérifier si c'est le jour du cours
const isCoursDay = (emploi: EmploiDuTemps, jour: string) => {
  const joursCours = JSON.parse(emploi.joursCours);
  return joursCours.includes(jour);
};

// Fonction pour vérifier si c'est le jour de l'évaluation
const isEvaluationDay = (emploi: EmploiDuTemps, jour: string) => {
  return emploi.evaluation && emploi.jourEvaluation === jour;
};

// Fonction pour formater l'heure
const formatHeure = (heure: string) => {
  return heure.split(':').slice(0, 2).join(':');
};

export default function EmploiPage() {
  const router = useRouter();
  const params = useParams();
  const [emploi, setEmploi] = useState<EmploiDuTemps | null>(null);
  const [loading, setLoading] = useState(true);
  const [parametres, setParametres] = useState<Parametres | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer l'emploi du temps
        const response = await fetch(`/api/emploi/${params.id}`);
        if (!response.ok) throw new Error('Erreur lors du chargement');
        const data = await response.json();
        setEmploi(data);

        // Récupérer les paramètres
        const paramResponse = await fetch('/api/parametres');
        if (paramResponse.ok) {
          const paramData = await paramResponse.json();
          setParametres(paramData);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/emploi/${params.id}/pdf`);
      if (!response.ok) throw new Error('Erreur lors de la génération du PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emploi-${params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!emploi) {
    return (
      <div className="text-center">
        <p className="text-red-600">Emploi du temps non trouvé</p>
        <Link href="/emploi" className="text-indigo-600 hover:text-indigo-800">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-black">
      {/* En-tête avec logo et boutons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center">
          <Link
            href="/emploi"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 text-responsive-sm"
          >
            <FaArrowLeft className="mr-2" />
            Retour
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <Link
            href={`/emploi/${params.id}/edit`}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-responsive-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FaEdit className="mr-2" />
            Modifier
          </Link>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-responsive-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <FaDownload className="mr-2" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* En-tête de l'emploi du temps */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6 text-center">
        <Image
          src="/logo.png"
          alt="Logo"
          width={60}
          height={60}
          className="mx-auto"
        />
        <h1 className="text-responsive-lg sm:text-responsive-xl font-bold text-gray-900">
          Institut Universitaire de Formation Professionnelle
        </h1>
        <p className="text-responsive-base text-gray-600">FORMATION CONTINUE</p>
        <p className="text-responsive-base font-semibold mt-3 sm:mt-4">
          EDT DU {formatDateForDisplay(new Date(emploi.dateDebut))} AU{' '}
          {formatDateForDisplay(new Date(emploi.dateFin))}
          {emploi.ueCommune && ' - UE'}
        </p>
      </div>

      {/* Informations de l'emploi */}
      <div className="grid text-center grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <p className="font-semibold text-responsive-xs sm:text-responsive-sm">FILIERES :</p>
          <p className="text-responsive-xs sm:text-responsive-sm">{emploi.ueCommune ? 'UE COMMUNE' : emploi.filiere?.nom}</p>
        </div>
        <div>
          <p className="font-semibold text-responsive-xs sm:text-responsive-sm">NIVEAU :</p>
          <p>{emploi.niveau}-{emploi.semestre}</p>
        </div>
        <div>
          <p className="font-semibold text-responsive-xs sm:text-responsive-sm">Salle CM :</p>
          <p>{emploi.salle}</p>
        </div>
        <div>
          <p className="font-semibold text-responsive-xs sm:text-responsive-sm">VH :</p>
          <p>{emploi.vh}</p>
        </div>
        <div>
          <p className="font-semibold text-responsive-xs sm:text-responsive-sm">ANNÉE UNIVERSITAIRE :</p>
          <p>{emploi.anneeUniv.annee}</p>
        </div>
      </div>

      {/* Tableau des horaires */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto text-center text-black mb-4 sm:mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-responsive-xs font-medium text-black uppercase tracking-wider">
                Horaires
              </th>
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(
                (jour) => (
                  <th
                    key={jour}
                    className="px-3 sm:px-6 py-2 sm:py-3 text-center text-responsive-xs font-medium text-black uppercase tracking-wider"
                  >
                    {jour}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="border px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-responsive-xs text-black">
                {formatHeure(emploi.heureDebut)}-{formatHeure(emploi.heureFin)}
              </td>
              {['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].map(
                (jour) => (
                  <td key={jour} className="border px-3 sm:px-6 py-3 sm:py-4 text-responsive-xs text-black">
                    {isCoursDay(emploi, jour) && !isEvaluationDay(emploi, jour) && (
                      <div>
                        <p className="font-semibold">{emploi.module.nom}</p>
                        <p>{emploi.module.type}</p>
                        <p>
                          {emploi.enseignant.titre} {emploi.enseignant.prenom}{' '}
                          {emploi.enseignant.nom}
                        </p>
                      </div>
                    )}
                    {isEvaluationDay(emploi, jour) && (
                      <div>
                        <p className="font-semibold text-red-600">Évaluation</p>
                        <p className="text-red-600">{emploi.module.nom}</p>
                      </div>
                    )}
                  </td>
                )
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div className="mt-4 sm:mt-6 md:mt-8 bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0">
          <div>
            <p className="text-responsive-sm">
              {emploi.enseignant.titre} {emploi.enseignant.prenom}{' '}
              {emploi.enseignant.nom}
            </p>
            <p className="mt-3 sm:mt-4 text-responsive-sm">Ségou, le {formatDateForDisplay(new Date())}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="mt-1 text-responsive-sm">Le Chef de Département</p>
            {parametres && (
              <>
                <p className="text-responsive-sm">{parametres.titre} {parametres.chefDepartement}</p>
                <p className="text-responsive-sm">{parametres.grade}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
