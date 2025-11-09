'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEdit, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'sonner'
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PermissionButton } from '@/components/permission-button';

interface Emploi {
  id: string;
  titre: string;
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
  dateEvaluation?: string;
  createdAt: string;
  enseignant: {
    id: string;
    nom: string;
    prenom: string;
  };
  module: {
    id: string;
    nom: string;
  };
  filiere?: {
    id: string;
    nom: string;
  };
  anneeUniv: {
    annee: string;
  };
}

interface Annee {
  id: string;
  annee: string;
}

interface Filiere {
  id: string;
  nom: string;
}

const EmploiCard = ({ emploi, onDelete }: { emploi: Emploi; onDelete: (emploi: Emploi) => void }) => {
  const params = useParams();
  const schoolId = params.schoolId as string;
  
  return (
    <Card className="shadow-md rounded-lg p-3 sm:p-4 hover:shadow-xl transition-all duration-200 bg-card2">
      <div className="flex flex-row items-center gap-3 sm:gap-4 p-0 mb-3 sm:mb-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
          <FaCalendarAlt className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-responsive-base font-semibold text-foreground">{emploi.titre}</h3>
              <p className="text-responsive-xs text-muted-foreground">{emploi.module.nom}</p>
            </div>
            <Badge variant="secondary" className="text-responsive-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300">
              {emploi.anneeUniv?.annee || 'Année en cours'}
            </Badge>
          </div>
          <p className="text-responsive-xs text-muted-foreground mt-1">
            Du {format(new Date(emploi.dateDebut), 'dd MMMM yyyy', { locale: fr })} au {format(new Date(emploi.dateFin), 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">{emploi.niveau}</Badge>
          <Badge className='bg-indigo-100 text-indigo-700' variant="outline">{emploi.filiere?.nom || 'UE Commune'}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <div className="text-responsive-xs text-muted-foreground">
            <span className="font-medium">Horaire:</span>{' '}
            {emploi.heureDebut} - {emploi.heureFin}
          </div>
          <div className="text-responsive-xs text-muted-foreground">
            <span className="font-medium">Salle:</span>{' '}
            {emploi.salle}
          </div>
          <div className="sm:col-span-2 text-responsive-xs text-gray-500">
            <span className="font-medium">Enseignant:</span>{' '}
            {emploi.enseignant.nom} {emploi.enseignant.prenom}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-3 sm:mt-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/${schoolId}/schedule`}>
                <PermissionButton
                  category="emploi"
                  action="view"
                  className="bg-white dark:bg-gray-800 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950" 
                  variant="outline" 
                  size="icon"
                >
                  <FaEye className="h-4 w-4" />
                </PermissionButton>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voir les détails</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/${schoolId}/schedule`}>
                <PermissionButton
                  category="emploi"
                  action="edit"
                  className="bg-white dark:bg-gray-800 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950" 
                  variant="outline" 
                  size="icon"
                >
                  <FaEdit className="h-4 w-4" />
                </PermissionButton>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Modifier</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PermissionButton
                category="emploi"
                action="delete"
                variant="outline" 
                size="icon" 
                onClick={() => onDelete(emploi)}
                className="bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
              >
                <FaTrash className="h-4 w-4" />
              </PermissionButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Supprimer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

      </div>
    </Card>
  );
};

export default function EmploisPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;
  
  const [emplois, setEmplois] = useState<Emploi[]>([]);
  const [annees, setAnnees] = useState<Annee[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [schoolType, setSchoolType] = useState<'UNIVERSITY' | 'HIGH_SCHOOL'>('UNIVERSITY');
  const [searchTerm, setSearchTerm] = useState('');
  const [anneeFilter, setAnneeFilter] = useState('all');
  const [filiereFilter, setFiliereFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emploiToDelete, setEmploiToDelete] = useState<Emploi | null>(null);

  useEffect(() => {
    const fetchSchoolType = async () => {
      try {
        const response = await fetch(`/api/schools/${schoolId}`);
        if (response.ok) {
          const school = await response.json();
          setSchoolType(school.schoolType || 'UNIVERSITY');
        }
      } catch (error) {
        console.error('Error fetching school type:', error);
      }
    };

    const fetchEmplois = async () => {
      try {
        const response = await fetch(`/api/emploi?schoolId=${schoolId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des emplois du temps');
        const data = await response.json();
        setEmplois(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Erreur lors du chargement des emplois du temps');
      }
    };

    const fetchAnnees = async () => {
      try {
        const response = await fetch(`/api/annee-universitaire?schoolId=${schoolId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des années universitaires');
        const data = await response.json();
        setAnnees(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Erreur lors du chargement des années universitaires');
      }
    };

    const fetchFilieres = async () => {
      try {
        const response = await fetch(`/api/filieres?schoolId=${schoolId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des filières');
        const data = await response.json();
        setFilieres(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Erreur lors du chargement des filières');
      }
    };

    fetchSchoolType();
    fetchEmplois();
    fetchAnnees();
    fetchFilieres();
  }, [schoolId]);

  const filteredData = () => {
    let data = emplois;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      data = data.filter((emploi) => {
        return (
          emploi.titre.toLowerCase().includes(searchLower) ||
          emploi.module.nom.toLowerCase().includes(searchLower) ||
          emploi.enseignant.nom.toLowerCase().includes(searchLower) ||
          emploi.enseignant.prenom.toLowerCase().includes(searchLower) ||
          emploi.filiere?.nom?.toLowerCase().includes(searchLower) ||
          emploi.anneeUniv?.annee?.toLowerCase().includes(searchLower) ||
          emploi.niveau.toLowerCase().includes(searchLower) ||
          emploi.salle.toLowerCase().includes(searchLower)
        );
      });
    }

    if (anneeFilter !== 'all') {
      data = data.filter((emploi) => emploi.anneeUniv?.annee === annees.find((annee) => annee.id === anneeFilter)?.annee);
    }

    if (filiereFilter !== 'all') {
      data = data.filter((emploi) => emploi.filiere?.id === filiereFilter);
    }

    return data;
  };

  // Grouper les emplois par filière et module
  const groupedEmplois = () => {
    const filtered = filteredData();
    const grouped: Record<string, Record<string, Emploi[]>> = {};

    filtered.forEach((emploi) => {
      const filiereKey = emploi.filiere?.nom || 'UE Commune';
      const moduleKey = emploi.module.nom;

      if (!grouped[filiereKey]) {
        grouped[filiereKey] = {};
      }

      if (!grouped[filiereKey][moduleKey]) {
        grouped[filiereKey][moduleKey] = [];
      }

      grouped[filiereKey][moduleKey].push(emploi);
    });

    return grouped;
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleDelete = (emploi: Emploi) => {
    setEmploiToDelete(emploi);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/emploi/${emploiToDelete?.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setEmplois(emplois.filter((e) => e.id !== emploiToDelete?.id));
      toast.success('Emploi du temps supprimé avec succès');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Une erreur est survenue lors de la suppression');
    } finally {
      setDeleteDialogOpen(false);
      setEmploiToDelete(null);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-responsive-xl font-bold text-foreground">Gestion des Emplois du Temps</h1>
          <p className="mt-1 sm:mt-2 text-responsive-sm text-muted-foreground">
            Gérez les emplois du temps des enseignants et des {schoolType === 'UNIVERSITY' ? 'filières' : 'classes'}
          </p>
        </div>
        <Link href={`/admin/${schoolId}/schedule`}>
          <PermissionButton
            category="emploi"
            action="create"
            className="bg-primary hover:bg-primary/90 text-white text-responsive-sm w-full sm:w-auto"
          >
            Créer un emploi du temps
          </PermissionButton>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full text-responsive-sm"
            />
          </div>
          <div>
            <Select value={anneeFilter} onValueChange={setAnneeFilter}>
              <SelectTrigger className="text-responsive-sm">
                <SelectValue placeholder="Année universitaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-responsive-sm">Toutes les années</SelectItem>
                {annees?.map((annee) => (
                  <SelectItem key={annee.id} value={annee.id} className="text-responsive-sm">
                    {annee.annee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={filiereFilter} onValueChange={setFiliereFilter}>
              <SelectTrigger className="text-responsive-sm">
                <SelectValue placeholder={schoolType === 'UNIVERSITY' ? 'Filière' : 'Classe'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-responsive-sm">Toutes les {schoolType === 'UNIVERSITY' ? 'filières' : 'classes'}</SelectItem>
                {filieres?.map((filiere) => (
                  <SelectItem key={filiere.id} value={filiere.id} className="text-responsive-sm">
                    {filiere.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredData().length > 0 && (
          <p className="text-responsive-sm text-muted-foreground mb-3 sm:mb-4">
            {filteredData().length} emploi{filteredData().length > 1 ? 's' : ''} du temps trouvé{filteredData().length > 1 ? 's' : ''}
          </p>
        )}

        {/* Affichage groupé par filière et module */}
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(groupedEmplois()).map(([filiereName, modules]) => (
            <div key={filiereName} className="space-y-3 sm:space-y-4">
              {/* En-tête de filière */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-primary/10">
                  <FaCalendarAlt className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-responsive-lg font-bold text-foreground">{filiereName}</h2>
                  <p className="text-responsive-xs text-muted-foreground">
                    {Object.values(modules).flat().length} emploi{Object.values(modules).flat().length > 1 ? 's' : ''} du temps
                  </p>
                </div>
              </div>

              {/* Modules de cette filière */}
              {Object.entries(modules).map(([moduleName, emploisModule]) => (
                <div key={moduleName} className="ml-3 sm:ml-6 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 border-l-4 border-primary/30 pl-3 sm:pl-4">
                    <Badge variant="outline" className="text-responsive-xs font-semibold">
                      {moduleName}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({emploisModule.length} cours)
                    </span>
                  </div>

                  {/* Emplois du temps pour ce module */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ml-3 sm:ml-6">
                    {emploisModule.map((emploi) => (
                      <EmploiCard
                        key={emploi.id}
                        emploi={emploi}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Message si aucun résultat */}
          {Object.keys(groupedEmplois()).length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <FaCalendarAlt className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-responsive-sm text-muted-foreground">Aucun emploi du temps trouvé</p>
            </div>
          )}
        </div>

      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-responsive-base">Êtes-vous sûr de vouloir supprimer cet emploi du temps ?</AlertDialogTitle>
            <AlertDialogDescription className="text-responsive-sm">
              Cette action est irréversible. Toutes les données associées à cet emploi du temps seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="text-responsive-sm w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-responsive-sm w-full sm:w-auto">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
