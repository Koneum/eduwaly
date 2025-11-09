'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { useToast } from '@/components/ui/use-toast';
import { Module, Filiere } from '@/types/index';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PermissionButton } from '@/components/permission-button';

// Types pour université (SANS Cours, Devoirs, Examen)
const typeModulesUniversite = [
  { value: 'CM', label: 'Cours Magistral' },
  { value: 'TD', label: 'Travaux Dirigés' },
  { value: 'CM_TD', label: 'Cours & TD' },
  { value: 'TP', label: 'Travaux Pratiques' },
  { value: 'PROJET', label: 'Projet' },
  { value: 'STAGE', label: 'Stage' },
];

interface ModuleCardProps {
  module: Module;
  filiere?: Filiere;
  onEdit: (module: Module) => void;
  onDelete: (id: string) => void;
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL';
}

const ModuleCard = ({ module, filiere, onEdit, onDelete, schoolType }: ModuleCardProps) => {
  return (
    <Card className="w-full">
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-responsive-base font-semibold text-foreground">{module.nom}</h3>
            <Badge variant={module.isUeCommune ? "secondary" : "default"} className="text-responsive-xs">
              {module.isUeCommune 
                ? "UE Commune" 
                : filiere?.nom || (schoolType === 'UNIVERSITY' ? 'Sans filière' : 'Sans classe')
              }
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-responsive-sm text-muted-foreground">
            {schoolType === 'UNIVERSITY' && module.type && (
              <Badge 
                className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-responsive-xs" 
                variant="outline">
                {typeModulesUniversite.find(t => t.value === module.type)?.label || module.type}
              </Badge>
            )}
            <span>{module.vh}h</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-1.5 sm:gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PermissionButton
                category="modules"
                action="edit"
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800" 
                variant="outline" 
                size="icon" 
                onClick={() => onEdit(module)}
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
                category="modules"
                action="delete"
                variant="destructive" 
                size="icon" 
                onClick={() => onDelete(module.id)}
              >
                <FaTrash className="h-4 w-4" />
              </PermissionButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Supprimer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default function ModulesPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;
  
  const [modules, setModules] = useState<Module[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [schoolType, setSchoolType] = useState<'UNIVERSITY' | 'HIGH_SCHOOL'>('UNIVERSITY');
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nom: '',
    type: '',
    vh: '',
    isUeCommune: false,
    filiereId: '',
  });

  useEffect(() => {
    fetchSchoolType();
    fetchModules();
    fetchFilieres();
  }, []);

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

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des modules');
      }
      const data = await response.json();
      setModules(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement des modules"
      });
      console.error('Error:', error);
    }
  };

  const fetchFilieres = async () => {
    try {
      const response = await fetch('/api/filieres');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des filières');
      }
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        filiereId: checked ? '' : prev.filiereId,
      }));
    } else if (name === 'vh') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validation des données
      if (!formData.nom || !formData.vh) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez remplir tous les champs requis"
        });
        return;
      }

      // Pour université, le type est requis
      if (schoolType === 'UNIVERSITY' && !formData.type) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez sélectionner un type de module"
        });
        return;
      }

      const url = editingModule 
        ? `/api/modules/${editingModule.id}`
        : '/api/modules';

      const payload: any = {
        nom: formData.nom,
        vh: parseInt(formData.vh.toString()),
        schoolId: schoolId, // ✅ AJOUT DU SCHOOLID
        isUeCommune: formData.isUeCommune,
        filiereId: formData.filiereId || null,
      };

      // Ajouter le type seulement pour université
      if (schoolType === 'UNIVERSITY') {
        payload.type = formData.type;
      }

      const response = await fetch(url, {
        method: editingModule ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Une erreur est survenue');
      }

      const data = await response.json();
      if (editingModule) {
        setModules(modules.map(m => (m.id === data.id ? data : m)));
        toast({
          title: "Succès",
          description: `${schoolType === 'UNIVERSITY' ? 'Module' : 'Matière'} modifié(e) avec succès`
        });
      } else {
        setModules([data, ...modules]);
        toast({
          title: "Succès",
          description: `${schoolType === 'UNIVERSITY' ? 'Module' : 'Matière'} ajouté(e) avec succès`
        });
      }

      setShowModal(false);
      setEditingModule(null);
      setFormData({
        nom: '',
        type: '',
        vh: '',
        isUeCommune: false,
        filiereId: '',
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

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      nom: module.nom,
      type: module.type || '',
      vh: module.vh.toString(),
      isUeCommune: module.isUeCommune,
      filiereId: module.filiereId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce ${schoolType === 'UNIVERSITY' ? 'module' : 'cette matière'} ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/modules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setModules(modules.filter(m => m.id !== id));
      toast({
        title: "Succès",
        description: `${schoolType === 'UNIVERSITY' ? 'Module' : 'Matière'} supprimé(e) avec succès`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la suppression"
      });
      console.error('Error:', error);
    }
  };

  const labels = {
    UNIVERSITY: {
      title: 'Modules',
      add: 'Ajouter un module',
      name: 'Nom du module',
      filiere: 'Filière',
      filiereOptional: 'Filière (optionnel)',
    },
    HIGH_SCHOOL: {
      title: 'Matières',
      add: 'Ajouter une matière',
      name: 'Nom de la matière',
      filiere: 'Classe',
      filiereOptional: 'Classe (optionnel)',
    },
  };

  const currentLabels = labels[schoolType];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="heading-responsive-h1 font-bold text-foreground">{currentLabels.title}</h1>
        <PermissionButton
          category="modules"
          action="create"
          className="bg-indigo-600 hover:bg-indigo-700 text-white btn-responsive w-full sm:w-auto"
          onClick={() => {
            setEditingModule(null);
            setFormData({
              nom: '',
              type: '',
              vh: '',
              isUeCommune: false,
              filiereId: '',
            });
            setShowModal(true);
          }}
        >
          <FaPlus className="mr-2" />
          {currentLabels.add}
        </PermissionButton>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-responsive-lg">
                {editingModule ? 'Modifier' : 'Ajouter'} {schoolType === 'UNIVERSITY' ? 'un module' : 'une matière'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="nom" className="text-responsive-sm">{currentLabels.name} *</Label>
                <Input
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  placeholder={schoolType === 'UNIVERSITY' ? 'Ex: Programmation Web' : 'Ex: Mathématiques'}
                  required
                  className="text-responsive-sm"
                />
              </div>

              {/* Type - Seulement pour université */}
              {schoolType === 'UNIVERSITY' && (
                <div>
                  <Label htmlFor="type" className="text-responsive-sm">Type de module *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="text-responsive-sm">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeModulesUniversite.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-responsive-sm">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="vh" className="text-responsive-sm">Volume horaire (heures) *</Label>
                <Input
                  id="vh"
                  name="vh"
                  type="number"
                  value={formData.vh}
                  onChange={handleInputChange}
                  placeholder="Ex: 40"
                  required
                  className="text-responsive-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUeCommune"
                  name="isUeCommune"
                  checked={formData.isUeCommune}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      isUeCommune: checked as boolean,
                      filiereId: checked ? '' : prev.filiereId 
                    }))
                  }
                />
                <Label htmlFor="isUeCommune" className="cursor-pointer text-responsive-sm">
                  UE Commune (pour toutes les {schoolType === 'UNIVERSITY' ? 'filières' : 'classes'})
                </Label>
              </div>

              {!formData.isUeCommune && (
                <div>
                  <Label htmlFor="filiereId" className="text-responsive-sm">{currentLabels.filiereOptional}</Label>
                  <Select
                    value={formData.filiereId || undefined}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, filiereId: value }))}
                  >
                    <SelectTrigger className="text-responsive-sm">
                      <SelectValue placeholder={`Sélectionnez ${schoolType === 'UNIVERSITY' ? 'une filière' : 'une classe'} (optionnel)`} />
                    </SelectTrigger>
                    <SelectContent>
                      {filieres.map((filiere) => (
                        <SelectItem key={filiere.id} value={filiere.id} className="text-responsive-sm">
                          {filiere.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                >
                  {editingModule ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {modules.map((module) => {
          const filiere = filieres.find(f => f.id === module.filiereId);
          return (
            <ModuleCard
              key={module.id}
              module={module}
              filiere={filiere}
              onEdit={handleEdit}
              onDelete={handleDelete}
              schoolType={schoolType}
            />
          );
        })}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-8 sm:py-12 text-responsive-sm text-muted-foreground">
          Aucun {schoolType === 'UNIVERSITY' ? 'module' : 'matière'} pour le moment. 
          Cliquez sur &quot;{currentLabels.add}&quot; pour commencer.
        </div>
      )}
    </div>
  );
}
