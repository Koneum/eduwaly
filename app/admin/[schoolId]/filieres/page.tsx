'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FaEdit, FaTrash, FaPlus, FaGraduationCap } from 'react-icons/fa';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PermissionButton } from '@/components/permission-button';

interface Filiere {
  id: string;
  nom: string;
  createdAt: string;
  updatedAt: string;
}

// Composant Card pour les filières
const FiliereCard = ({ 
  filiere, 
  onEdit, 
  onDelete 
}: {
  filiere: Filiere;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <Card className="shadow-md rounded-lg p-3 sm:p-4 hover:bg-accent/50 transition-all duration-200">
      <div className="flex flex-row items-center gap-3 sm:gap-4 p-0 mb-3 sm:mb-4">
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 bg-indigo-100 dark:bg-indigo-900">
          <AvatarFallback className="text-indigo-700 dark:text-indigo-300">
            <FaGraduationCap className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-responsive-base font-semibold text-foreground">{filiere.nom}</h3>
          <p className="text-responsive-sm text-muted-foreground">
            Créée le {new Date(filiere.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-1.5 sm:gap-2 mt-3 sm:mt-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PermissionButton
                category="filieres"
                action="edit"
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800" 
                variant="outline" 
                size="icon" 
                onClick={onEdit}
              >
                <FaEdit className="h-4 w-4" />
              </PermissionButton>
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
                category="filieres"
                action="delete"
                variant="destructive"
                size="icon"
                onClick={onDelete}
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

export default function FilieresPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;
  
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [schoolType, setSchoolType] = useState<'UNIVERSITY' | 'HIGH_SCHOOL'>('UNIVERSITY');
  const [showModal, setShowModal] = useState(false);
  const [editingFiliere, setEditingFiliere] = useState<Filiere | null>(null);
  const [nomFiliere, setNomFiliere] = useState('');
  const { toast } = useToast();

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

    const fetchFilieres = async () => {
      try {
        const response = await fetch('/api/filieres');
        if (!response.ok) throw new Error('Erreur lors du chargement');
        const data = await response.json();
        setFilieres(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: `Erreur lors du chargement des ${schoolType === 'UNIVERSITY' ? 'filières' : 'classes'}`
        });
        console.error('Error:', error);
      }
    };

    fetchSchoolType();
    fetchFilieres();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/filieres', {
        method: editingFiliere ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingFiliere?.id,
          nom: nomFiliere,
          schoolId: schoolId, // ✅ AJOUT DU SCHOOLID
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'enregistrement');

      const data = await response.json();
      if (editingFiliere) {
        setFilieres(filieres.map(f => f.id === data.id ? data : f));
        toast({
          title: "Succès",
          description: `${schoolType === 'UNIVERSITY' ? 'Filière' : 'Classe'} modifiée avec succès`
        });
      } else {
        setFilieres([...filieres, data]);
        toast({
          title: "Succès",
          description: `${schoolType === 'UNIVERSITY' ? 'Filière' : 'Classe'} ajoutée avec succès`
        });
      }
      
      setShowModal(false);
      setEditingFiliere(null);
      setNomFiliere('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue"
      });
      console.error('Error:', error);
    }
  };

  const handleEdit = (filiere: Filiere) => {
    setEditingFiliere(filiere);
    setNomFiliere(filiere.nom);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette ${schoolType === 'UNIVERSITY' ? 'filière' : 'classe'} ?`)) return;

    try {
      const response = await fetch(`/api/filieres/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setFilieres(filieres.filter(f => f.id !== id));
      toast({
        title: "Succès",
        description: `${schoolType === 'UNIVERSITY' ? 'Filière' : 'Classe'} supprimée avec succès`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue"
      });
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="sm:flex-auto">
          <h1 className="heading-responsive-h1 font-semibold text-foreground">
            {schoolType === 'UNIVERSITY' ? 'Filières' : 'Classes'}
          </h1>
          <p className="mt-2 text-responsive-sm text-muted-foreground">
            Liste des {schoolType === 'UNIVERSITY' ? 'filières' : 'classes'} disponibles
          </p>
        </div>
        <div className="sm:ml-4 lg:ml-16 shrink-0">
          <PermissionButton
            category="filieres"
            action="create"
            type="button"
            className="bg-primary hover:bg-primary/80 text-white btn-responsive w-full sm:w-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Bouton cliqué - ouverture du modal');
              setEditingFiliere(null);
              setNomFiliere('');
              setShowModal(true);
            }}
          >
            <FaPlus className="mr-2 -ml-1 h-4 w-4" />
            Nouvelle {schoolType === 'UNIVERSITY' ? 'filière' : 'classe'}
          </PermissionButton>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filieres.map((filiere) => (
          <FiliereCard
            key={filiere.id}
            filiere={filiere}
            onEdit={() => handleEdit(filiere)}
            onDelete={() => handleDelete(filiere.id)}
          />
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-responsive-lg">
                {editingFiliere 
                  ? `Modifier ${schoolType === 'UNIVERSITY' ? 'la filière' : 'la classe'}` 
                  : `Nouvelle ${schoolType === 'UNIVERSITY' ? 'filière' : 'classe'}`
                }
              </CardTitle>
              <CardDescription className="text-responsive-sm">
                {editingFiliere 
                  ? `Modifiez les informations ${schoolType === 'UNIVERSITY' ? 'de la filière' : 'de la classe'}`
                  : `Ajoutez ${schoolType === 'UNIVERSITY' ? 'une nouvelle filière' : 'une nouvelle classe'} à votre établissement`
                }
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="nom" className="text-responsive-sm">
                    Nom {schoolType === 'UNIVERSITY' ? 'de la filière' : 'de la classe'}
                  </Label>
                  <Input
                    id="nom"
                    type="text"
                    value={nomFiliere}
                    onChange={(e) => setNomFiliere(e.target.value)}
                    placeholder={`Ex: ${schoolType === 'UNIVERSITY' ? 'Informatique, Génie Civil...' : 'Terminale S, Première L...'}`}
                    required
                    autoFocus
                    className="text-responsive-sm"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingFiliere(null);
                    setNomFiliere('');
                  }}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  {editingFiliere ? 'Modifier' : 'Ajouter'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
