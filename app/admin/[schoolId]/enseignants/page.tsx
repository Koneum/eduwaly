"use client"

import { Suspense } from 'react';
import { use } from 'react';

// Importation des dépendances nécessaires
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Enseignant, TYPE_ENSEIGNANTS, GRADES, TypeEnseignant, Grade } from '@/types';

import { FaEdit, FaTrash } from 'react-icons/fa';
import { useToast } from '@/components/ui/use-toast'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import { PermissionButton } from '@/components/permission-button';
import { Mail } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { DialogDescription } from '@/components/ui/dialog';

// Définition du type de clé de tri
type SortKey = keyof Enseignant;

// Définition de la configuration de tri
interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

// Extension du type Teacher pour inclure les propriétés manquantes
interface EnhancedTeacher extends Teacher {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type: string;
  titre: string;
  grade: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

// Composant Card pour les enseignants
const TeacherCard = ({ enseignant, onEdit, onDelete, onViewInfo }: { 
  enseignant: EnhancedTeacher;
  onEdit: () => void;
  onDelete: () => void;
  onViewInfo: () => void;
}) => {
  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/enseignants/${enseignant.id}/emploi-pdf`);
      if (!response.ok) throw new Error('Erreur lors de l\'exportation');
      
      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      
      // Créer une URL pour le blob
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien temporaire et cliquer dessus pour télécharger
      const a = document.createElement('a');
      a.href = url;
      a.download = `emploi-${enseignant.nom}-${enseignant.prenom}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
    }
  };

  return (
    <Card className="shadow-md rounded-lg p-4 hover:bg-accent/50 transition-all duration-200">
      <div className="flex flex-row items-center gap-4 p-0 mb-4">
        <Avatar className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900">
          <AvatarFallback>{enseignant.nom[0] + enseignant.prenom[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            {enseignant.titre} {enseignant.nom} {enseignant.prenom}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={enseignant.type === 'PERMANENT' ? 'default' : 'secondary'} className="bg-indigo-50 dark:bg-indigo-800 dark:text-white">
              {enseignant.type}
            </Badge>
            <Badge className="bg-indigo-50 text-indigo-700" variant="outline">{enseignant.grade}</Badge>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 mt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>{enseignant.telephone || 'Non renseigné'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span>{enseignant.email || 'Non renseigné'}</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PermissionButton
                category="enseignants"
                action="view"
                className="bg-white dark:bg-gray-800 text-blue-500 dark:text-blue-400" 
                variant="outline" 
                size="sm" 
                onClick={onViewInfo}
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Infos
              </PermissionButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voir les informations</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PermissionButton
                category="enseignants"
                action="edit"
                className="bg-white dark:bg-gray-800 text-indigo-500 dark:text-indigo-400" 
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
                category="enseignants"
                action="delete"
                className="bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500" 
                variant="outline" 
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

// Composant principal
export default function EnseignantsPage({ params }: { params: Promise<{ id?: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: teachersData, isLoading } = useTeachers();
  
  // Conversion des données en EnhancedTeacher
  const teachers = useMemo(() => 
    teachersData?.map((teacher: Teacher): EnhancedTeacher => ({
      ...teacher,
      createdAt: new Date(),
      updatedAt: new Date()
    })) || [],
    [teachersData]
  );

  // État et hooks
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    type: "ALL",
    status: "ALL",
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedEnseignant, setSelectedEnseignant] = useState<EnhancedTeacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    titre: "",
    telephone: "",
    email: "",
    type: "",
    grade: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    telephone: '',
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [newTeacherCredentials, setNewTeacherCredentials] = useState<{
    email: string;
    password: string;
    nom: string;
    prenom: string;
  } | null>(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [selectedTeacherInfo, setSelectedTeacherInfo] = useState<EnhancedTeacher | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');

  // Validation des champs
  const validateField = (name: string, value: string) => {
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Format d\'email invalide'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          email: ''
        }));
      }
    }
    
    if (name === 'telephone') {
      const phoneRegex = /^[0-9+\s-]{8,}$/;
      if (!phoneRegex.test(value)) {
        setValidationErrors(prev => ({
          ...prev,
          telephone: 'Format de téléphone invalide (minimum 8 chiffres)'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          telephone: ''
        }));
      }
    }
  };

  // Réinitialisation du formulaire
  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      titre: '',
      telephone: '',
      email: '',
      type: '',
      grade: '',
    });
    setSelectedEnseignant(null);
    setValidationErrors({
      email: '',
      telephone: '',
    });
  };

  // Gestionnaire de modification d'un enseignant
  const handleEdit = (enseignant: EnhancedTeacher) => {
    setSelectedEnseignant(enseignant);
    setFormData({
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      titre: enseignant.titre,
      telephone: enseignant.telephone,
      email: enseignant.email,
      type: enseignant.type,
      grade: enseignant.grade,
    });
    setShowModal(true);
  };

  // Gestionnaire de suppression d'un enseignant
  const handleDelete = async (enseignant: EnhancedTeacher) => {
    setSelectedEnseignant(enseignant);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEnseignant) return;

    try {
      const response = await fetch(`/api/enseignants/${selectedEnseignant.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Une erreur est survenue');
      }

      router.refresh();
      setDeleteDialogOpen(false);
      setSelectedEnseignant(null);
      
      toast({
        title: 'Enseignant supprimé',
        description: 'L\'enseignant a été supprimé avec succès',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  // Composants de filtrage et recherche
  const SearchAndFilters = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Input
        placeholder="Rechercher un enseignant..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1"
      />
      <Select
        value={selectedFilters.type}
        onValueChange={(value) =>
          setSelectedFilters((prev) => ({ ...prev, type: value }))
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Type d'enseignant" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tous</SelectItem>
          <SelectItem value="PERMANENT">Permanent</SelectItem>
          <SelectItem value="VACATAIRE">Vacataire</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // Affichage en cards
  const TeacherCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTeachers.map((teacher: EnhancedTeacher) => (
        <TeacherCard
          key={teacher.id}
          enseignant={teacher}
          onEdit={() => handleEdit(teacher)}
          onDelete={() => handleDelete(teacher)}
          onViewInfo={() => {
            setSelectedTeacherInfo(teacher);
            setShowInfoDialog(true);
          }}
        />
      ))}
    </div>
  );

  // Filtrage des enseignants
  const filteredTeachers = teachers.filter((teacher: EnhancedTeacher) => {
    const matchesSearch =
      searchQuery === "" ||
      `${teacher.nom} ${teacher.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedFilters.type === "ALL" || teacher.type === selectedFilters.type;

    return matchesSearch && matchesType;
  });

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation de tous les champs requis
      const requiredFields = ['nom', 'prenom', 'titre', 'telephone', 'email', 'type', 'grade'];
      const emptyFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (emptyFields.length > 0) {
        throw new Error(`Les champs suivants sont requis : ${emptyFields.join(', ')}`);
      }

      // Validation du format email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Format d\'email invalide');
      }

      // Validation du format téléphone
      if (!/^[0-9+\s-]{8,}$/.test(formData.telephone)) {
        throw new Error('Le numéro de téléphone doit contenir au moins 8 chiffres');
      }

      const url = selectedEnseignant 
        ? `/api/enseignants/${selectedEnseignant.id}`
        : '/api/enseignants';
      
      const response = await fetch(url, {
        method: selectedEnseignant ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Une erreur est survenue');
      }

      const result = await response.json();

      router.refresh();
      setShowModal(false);
      setFormData({
        nom: "",
        prenom: "",
        titre: "",
        telephone: "",
        email: "",
        type: "",
        grade: "",
      });

      // Si c'est une création, afficher les identifiants
      if (!selectedEnseignant && result.defaultPassword) {
        setNewTeacherCredentials({
          email: formData.email,
          password: result.defaultPassword,
          nom: formData.nom,
          prenom: formData.prenom,
        });
        setShowCredentialsDialog(true);
      } else {
        toast({
          title: selectedEnseignant ? 'Enseignant modifié' : 'Enseignant ajouté',
          description: selectedEnseignant ? 'L\'enseignant a été modifié avec succès' : 'L\'enseignant a été ajouté avec succès',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return <div>Chargement...</div>;
  }

  const handleAdd = () => {
    setSelectedEnseignant(null);
    setFormData({
      nom: '',
      prenom: '',
      titre: '',
      telephone: '',
      email: '',
      type: '',
      grade: '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEnseignant(null);
  };

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <div className="container mx-auto px-4 py-8">
        {/* En-tête avec titre et bouton d'ajout */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Enseignants</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-white">Gérez la liste des enseignants et leurs informations</p>
          </div>
          <PermissionButton
            category="enseignants"
            action="create"
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/50 text-black"
          >
            Ajouter un enseignant
          </PermissionButton>
        </div>

        {/* Filtres et recherche */}
        <SearchAndFilters />
        
        {/* Liste des enseignants */}
        <TeacherCards />

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Cela supprimera définitivement l&apos;enseignant
                {selectedEnseignant && ` ${selectedEnseignant.titre} ${selectedEnseignant.nom} ${selectedEnseignant.prenom}`}
                et toutes les données associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de modification */}
        <Dialog open={showModal} onOpenChange={(isOpen) => {
          setShowModal(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedEnseignant ? 'Modifier l\'enseignant' : 'Ajouter un enseignant'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="titre">Titre</Label>
                  <Input
                    id="titre"
                    value={formData.titre}
                    onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, telephone: e.target.value }));
                      validateField('telephone', e.target.value);
                    }}
                    required
                  />
                  {validationErrors.telephone && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.telephone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      validateField('email', e.target.value);
                    }}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as TypeEnseignant }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_ENSEIGNANTS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Select 
                    value={formData.grade} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value as Grade }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((grade) => (
                        <SelectItem key={grade.value} value={grade.value}>
                          {grade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button  
                className='bg-indigo-500 text-white'
                  type="submit" 
                  disabled={isSubmitting}>
                  {selectedEnseignant ? 'Modifier' : 'Ajouter'}
                </Button>

                <Button 
                  type="button"
                  variant="destructive"
                  onClick={handleCloseModal}
                >
                  Annuler
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog des informations de l'enseignant */}
        <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Informations de l&apos;enseignant
              </DialogTitle>
            </DialogHeader>
            {selectedTeacherInfo && (
              <div className="space-y-6">
                {/* Informations personnelles */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Informations personnelles</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nom complet</Label>
                      <p className="font-medium">{selectedTeacherInfo.titre} {selectedTeacherInfo.prenom} {selectedTeacherInfo.nom}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="font-medium break-all">{selectedTeacherInfo.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Téléphone</Label>
                      <p className="font-medium">{selectedTeacherInfo.telephone}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Badge variant={selectedTeacherInfo.type === 'PERMANENT' ? 'default' : 'secondary'}>
                        {selectedTeacherInfo.type}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Grade</Label>
                      <Badge variant="outline">{selectedTeacherInfo.grade}</Badge>
                    </div>
                  </div>
                </div>

                {/* Informations de connexion */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Compte utilisateur</h3>
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-2">Identifiants de connexion</p>
                        <div className="space-y-1 text-sm">
                          <p><strong>Email :</strong> <span className="font-bold">{selectedTeacherInfo.email}</span></p>
                          <p><strong>Mot de passe initial :</strong> <span className="font-bold">password123</span></p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          L&apos;enseignant peut se connecter avec son email et modifier son mot de passe depuis son profil.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note sur le mot de passe */}
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    💡 <strong>Réinitialisation du mot de passe :</strong> Si l&apos;enseignant a oublié son mot de passe, 
                    vous pouvez le réinitialiser depuis la page de gestion des utilisateurs.
                  </p>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex gap-2 sm:justify-between">
              <Button 
                onClick={() => {
                  setEmailRecipient(selectedTeacherInfo?.email || '');
                  setShowSendEmailDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!selectedTeacherInfo?.user}
              >
                <Mail className="h-4 w-4 mr-2" />
                Envoyer identifiants
              </Button>
              <Button 
                onClick={() => setShowInfoDialog(false)}
                variant="outline"
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog d'envoi des identifiants par email */}
        <Dialog open={showSendEmailDialog} onOpenChange={setShowSendEmailDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Envoyer les identifiants</DialogTitle>
              <DialogDescription>
                Enseignant: {selectedTeacherInfo?.titre} {selectedTeacherInfo?.prenom} {selectedTeacherInfo?.nom}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <p className="font-semibold text-sm">Informations à envoyer</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p>Email de connexion: <span className="font-bold"><strong>{selectedTeacherInfo?.email}</strong></span></p>
                  <p>Mot de passe initial: <span className="font-bold"><strong>password123</strong></span></p>
                  <p>Type: <span className="font-bold"><strong>{selectedTeacherInfo?.type}</strong></span></p>
                  <p>Grade: <span className="font-bold"><strong>{selectedTeacherInfo?.grade}</strong></span></p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Email du destinataire *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="enseignant@example.com"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Un email professionnel sera envoyé avec les identifiants de connexion et les instructions.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSendEmailDialog(false);
                  setEmailRecipient('');
                }}
                disabled={isSendingEmail}
              >
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  if (!emailRecipient) {
                    sonnerToast.error('Veuillez entrer l\'email du destinataire');
                    return;
                  }

                  if (!selectedTeacherInfo?.id) {
                    sonnerToast.error('Enseignant non sélectionné');
                    return;
                  }

                  setIsSendingEmail(true);

                  try {
                    const response = await fetch(`/api/school-admin/enseignants/${selectedTeacherInfo.id}/send-credentials`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ recipientEmail: emailRecipient })
                    });

                    if (response.ok) {
                      sonnerToast.success('Identifiants envoyés par email avec succès');
                      setShowSendEmailDialog(false);
                      setEmailRecipient('');
                    } else {
                      const error = await response.json();
                      sonnerToast.error(error.error || 'Erreur lors de l\'envoi');
                    }
                  } catch (error) {
                    console.error('Erreur:', error);
                    sonnerToast.error('Erreur lors de l\'envoi de l\'email');
                  } finally {
                    setIsSendingEmail(false);
                  }
                }}
                disabled={isSendingEmail || !emailRecipient}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSendingEmail ? 'Envoi...' : 'Envoyer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog des identifiants de connexion */}
        <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
          <DialogContent className="bg-white text-black max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-green-600">
                ✅ Enseignant créé avec succès !
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Un compte a été créé pour <strong>{newTeacherCredentials?.prenom} {newTeacherCredentials?.nom}</strong>. 
                Voici les identifiants de connexion :
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-200">
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      value={newTeacherCredentials?.email || ''} 
                      readOnly 
                      className="bg-white font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(newTeacherCredentials?.email || '');
                        toast({ title: 'Email copié !' });
                      }}
                    >
                      Copier
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-500">Mot de passe temporaire</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      value={newTeacherCredentials?.password || ''} 
                      readOnly 
                      className="bg-white font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(newTeacherCredentials?.password || '');
                        toast({ title: 'Mot de passe copié !' });
                      }}
                    >
                      Copier
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Important :</strong> Communiquez ces identifiants à l&apos;enseignant. 
                  Il pourra modifier son mot de passe après sa première connexion.
                </p>
              </div>
            </div>

            {/* Dialog pour envoyer les identifiants par email */}
            <div >
              <form className='flex flex-col justify-center items-center w-full gap-2'>
                <Input type="email" className="bg-zinc-300 dark:bg-zinc-700 text-black dark:text-white" placeholder="Renseignez l'email" />
                <Button
                className="bg-gray-600 hover:bg-green-600 text-white "
                >
                  Envoyer l&apos;identifiant par email</Button>
              </form>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => {
                  setShowCredentialsDialog(false);
                  setNewTeacherCredentials(null);
                  toast({
                    title: 'Enseignant ajouté',
                    description: 'L\'enseignant a été ajouté avec succès',
                  });
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
              >
                J&apos;ai noté les identifiants
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
