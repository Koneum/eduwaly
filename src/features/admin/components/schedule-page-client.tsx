"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, BookOpen, Filter, Edit, Eye, Trash2, User, GraduationCap, Copy, Printer, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { SchedulePageWrapper } from "./schedule-page-wrapper"
import { ScheduleCreatorV2 } from "./schedule-creator-v2"
import { toast } from "sonner"


type EmploiModel = {
  id: string
  module: { 
    id: string
    nom: string 
  }
  enseignant: { 
    id: string
    nom: string
    prenom: string 
  }
  filiere?: { 
    id: string
    nom?: string 
  } | null
  vh: number
  semestre?: string
  schoolId: string
  moduleId: string
  enseignantId: string
  niveau: string
  salle: string
  heureDebut: string
  heureFin: string
  joursCours: string
  dateDebut?: string
  dateFin?: string
}

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

interface SchedulePageClientProps {
  emplois: EmploiModel[]
  modules: Module[]
  enseignants: Enseignant[]
  filieres: Filiere[]
  schoolId: string
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
}

export function SchedulePageClient({
  emplois,
  modules,
  enseignants,
  filieres,
  schoolId,
  schoolType
}: SchedulePageClientProps) {
  const [selectedFiliere, setSelectedFiliere] = useState<string>("all")
  
  // États pour le dialog d'édition/création
  const [editingData, setEditingData] = useState<{
    id?: string  // Optionnel pour la duplication (création sans ID)
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
    schoolId: string
  } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  // État pour le modal de visualisation
  const [viewingEmploi, setViewingEmploi] = useState<EmploiModel | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isPrintingPDF, setIsPrintingPDF] = useState(false)

  // Fonction pour voir les détails d'un emploi
  const handleView = (emploi: EmploiModel) => {
    setViewingEmploi(emploi)
    setIsViewDialogOpen(true)
  }

  // Fonction pour éditer un emploi
  const handleEdit = (emploi: EmploiModel) => {
    console.log('handleEdit appelé avec:', emploi)
    // Préparer les données pour le formulaire d'édition
    const editData = {
      id: emploi.id,
      moduleId: emploi.module.id,
      enseignantId: emploi.enseignant.id,
      filiereId: emploi.filiere?.id || '',
      niveau: emploi.niveau,
      semestre: emploi.semestre || (schoolType === 'UNIVERSITY' ? 'S1' : 'Trimestre 1'),
      salle: emploi.salle,
      heureDebut: emploi.heureDebut,
      heureFin: emploi.heureFin,
      joursCours: emploi.joursCours,
      vh: emploi.vh || 1,
      schoolId: emploi.schoolId
    }

    // Ouvrir le dialog avec les données d'édition
    console.log('Données d\'édition préparées:', editData)
    setEditingData(editData)
    setIsEditing(true)
    console.log('États après setEditingData:', { editingData: editData, isEditing: true })
  }

  // Fonction pour créer un nouvel emploi
  const handleCreate = () => {
    setEditingData(null)
    setIsEditing(false)
    setIsCreateDialogOpen(true)
  }

  // Fonction appelée après succès
  const handleSuccess = () => {
    // Rafraîchir la page ou les données
    window.location.reload()
  }

  // Fonction pour annuler
  const handleCancel = () => {
    setEditingData(null)
    setIsEditing(false)
  }

  const handleDelete = async (emploi: EmploiModel) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        const response = await fetch(`/api/admin/schedule/${emploi.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la suppression du cours');
        }

        toast.success('Cours supprimé avec succès');
        window.location.reload();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression du cours');
      }
    }
  };

  // Fonction pour dupliquer un emploi
  const handleDuplicate = (emploi: EmploiModel) => {
    // Parser joursCours si c'est une string JSON
    let joursCoursString: string;
    if (typeof emploi.joursCours === 'string') {
      joursCoursString = emploi.joursCours;
    } else if (Array.isArray(emploi.joursCours)) {
      joursCoursString = JSON.stringify(emploi.joursCours);
    } else {
      joursCoursString = '[]';
    }

    // Ouvrir le formulaire de création avec les données pré-remplies
    // MAIS avec les horaires vidés pour éviter les conflits
    const duplicateData = {
      // Pas d'ID = mode création (pas édition)
      moduleId: emploi.module.id,
      enseignantId: emploi.enseignant.id,
      filiereId: emploi.filiere?.id || '',
      niveau: emploi.niveau,
      semestre: emploi.semestre || (schoolType === 'UNIVERSITY' ? 'S1' : 'Trimestre 1'),
      salle: emploi.salle + ' (copie)',
      heureDebut: '', // Vider les horaires pour éviter les conflits
      heureFin: '',   // Vider les horaires pour éviter les conflits
      joursCours: joursCoursString,
      vh: emploi.vh || 1,
      schoolId: emploi.schoolId
    };
    
    setEditingData(duplicateData);
    setIsEditing(false); // Mode création, pas édition
    setIsCreateDialogOpen(true);
    toast.info('Définissez les nouveaux horaires pour le cours dupliqué');
  };

  // Fonction pour imprimer l'emploi du temps en PDF
  const handlePrintPDF = async (filiereIdToPrint?: string) => {
    setIsPrintingPDF(true);
    try {
      const targetFiliereId: string | null = filiereIdToPrint || (selectedFiliere !== 'all' ? selectedFiliere : null);
      
      // Gérer le cas spécial "ue-commune" - envoyer null à l'API pour filtrer uniquement les UE communes
      const isUeCommune = targetFiliereId === 'ue-commune';
      const apiFilereId = isUeCommune ? null : targetFiliereId;
      
      const response = await fetch('/api/admin/schedule/print-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          filiereId: apiFilereId,
          ueCommuneOnly: isUeCommune, // Nouveau paramètre pour l'API
          schoolType
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filiereName = isUeCommune 
        ? 'UE-Communes'
        : (targetFiliereId ? filieres.find(f => f.id === targetFiliereId)?.nom || 'filiere' : 'global');
      a.download = `emploi-du-temps-${filiereName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsPrintingPDF(false);
    }
  };

  
  // Filtrer les emplois par filière
  const filteredEmplois = useMemo(() => {
    if (!selectedFiliere || selectedFiliere === "all") return emplois
    // Filtre spécial pour les UE Communes (emplois sans filière)
    if (selectedFiliere === "ue-commune") {
      return emplois.filter(emploi => !emploi.filiere)
    }
    return emplois.filter(emploi => emploi.filiere?.id === selectedFiliere)
  }, [emplois, selectedFiliere])

  // Grouper par jour
  const emploisByDay = useMemo(() => {
    return filteredEmplois.reduce((acc: Record<string, EmploiModel[]>, emploi: EmploiModel) => {
      const jours = JSON.parse(emploi.joursCours || '[]')
      jours.forEach((jour: string) => {
        if (!acc[jour]) {
          acc[jour] = []
        }
        acc[jour].push(emploi)
      })
      return acc
    }, {} as Record<string, EmploiModel[]>)
  }, [filteredEmplois])

  const daysOfWeek = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header moderne avec gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 dark:from-indigo-800 dark:via-blue-800 dark:to-blue-900 p-6 sm:p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Gestion des Emplois du Temps</h1>
              <p className="text-white/80 mt-1 text-sm sm:text-base">
                Planifiez et assignez les cours aux {schoolType === 'UNIVERSITY' ? 'salles' : 'classes'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handlePrintPDF()}
              disabled={isPrintingPDF}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              {isPrintingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Imprimer PDF
            </Button>
            <SchedulePageWrapper 
              modules={modules}
              enseignants={enseignants}
              filieres={filieres}
              schoolId={schoolId}
              schoolType={schoolType}
            />
          </div>
        </div>
      </div>

      {/* Filtre par filière - Design moderne */}
      <Card className="border-0 shadow-md bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 text-responsive-sm font-medium">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span>Filtrer par {schoolType === 'UNIVERSITY' ? 'filière' : 'classe'}:</span>
            </div>
            <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
              <SelectTrigger className="w-full sm:w-[300px] text-responsive-sm">
                <SelectValue placeholder={`Toutes les ${schoolType === 'UNIVERSITY' ? 'filières' : 'classes'}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-responsive-sm">Toutes les {schoolType === 'UNIVERSITY' ? 'filières' : 'classes'}</SelectItem>
                {schoolType === 'UNIVERSITY' && (
                  <SelectItem value="ue-commune" className="text-responsive-sm font-medium text-blue-600">
                    📚 UE Communes uniquement
                  </SelectItem>
                )}
                {filieres.map((filiere) => (
                  <SelectItem key={filiere.id} value={filiere.id} className="text-responsive-sm">
                    {filiere.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Bouton imprimer tout (global) */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePrintPDF()}
              disabled={isPrintingPDF}
              className="w-full sm:w-auto"
            >
              {isPrintingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Imprimer tout
            </Button>
            
            {selectedFiliere && selectedFiliere !== "all" && (
              <>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => handlePrintPDF(selectedFiliere === "ue-commune" ? "ue-commune" : selectedFiliere)}
                  disabled={isPrintingPDF}
                  className="w-full sm:w-auto"
                >
                  {isPrintingPDF ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2" />
                  )}
                  Imprimer: {selectedFiliere === "ue-commune" ? "UE Communes" : (filieres.find(f => f.id === selectedFiliere)?.nom || 'filière')}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedFiliere("all")}
                  className="w-full sm:w-auto"
                >
                  Réinitialiser
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats - Design moderne avec bordures colorées */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 dark:border-l-blue-400 bg-card shadow-md hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-50 dark:from-blue-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Cours</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{filteredEmplois.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500 dark:border-l-emerald-400 bg-card shadow-md hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-50 dark:from-emerald-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Enseignants</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{enseignants.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 dark:border-l-purple-400 bg-card shadow-md hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-50 dark:from-purple-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Modules</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{modules.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-l-4 border-l-amber-500 dark:border-l-amber-400 bg-card shadow-md hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-50 dark:from-amber-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Heures/Sem.</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">
                  {filteredEmplois.reduce<number>((sum, e: EmploiModel) => sum + e.vh, 0)}h
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning par jour */}
      <Card className="border-0 shadow-md bg-card">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Planning Hebdomadaire</CardTitle>
              <CardDescription className="text-sm">
                Vue d&apos;ensemble des cours de la semaine
                {selectedFiliere && selectedFiliere !== "all" && ` - ${filieres.find(f => f.id === selectedFiliere)?.nom}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {daysOfWeek.map((day) => {
            const dayEmplois = emploisByDay[day] || []
            
            return (
              <div key={day}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-1 h-8 rounded-full ${
                    dayEmplois.length > 0 ? 'bg-indigo-500' : 'bg-muted'
                  }`} />
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-3">
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                    <Badge variant={dayEmplois.length > 0 ? "default" : "secondary"} className="text-xs">
                      {dayEmplois.length} cours
                    </Badge>
                  </h3>
                </div>
                
                {dayEmplois.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                    {dayEmplois.map((emploi) => (
                      <Card 
                        key={emploi.id} 
                        className="group relative overflow-hidden border-l-4 border-l-indigo-500 dark:border-l-indigo-400 bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Gradient décoratif */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 dark:from-indigo-900/20 to-transparent rounded-bl-full opacity-50" />
                        
                        <CardHeader className="pb-2 relative">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-semibold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {emploi.module.nom}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {emploi.enseignant.nom} {emploi.enseignant.prenom}
                              </p>
                            </div>
                            <Badge className="shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-0 text-xs">
                              {emploi.niveau}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0 relative">
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{emploi.heureDebut} - {emploi.heureFin}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{emploi.salle}</span>
                            </div>
                          </div>
                          
                          <Badge variant="outline" className="text-xs">
                              {emploi.filiere ? emploi.filiere.nom : (schoolType === 'UNIVERSITY' ? 'UE Commune' : 'Toutes classes')}
                            </Badge>
                          
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1 sm:flex-none bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                              onClick={() => handleView(emploi)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Voir
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1 sm:flex-none bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                              onClick={() => handleEdit(emploi)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1 sm:flex-none bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                              onClick={() => handleDuplicate(emploi)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Dupliquer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1 sm:flex-none bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                              onClick={() => handleDelete(emploi)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 ml-4 border border-dashed rounded-lg bg-muted/20">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucun cours planifié pour ce jour</p>
                  </div>
                )}
              </div>
            )
          })}

          {filteredEmplois.length === 0 && (
            <div className="text-center py-8 sm:py-12 border border-dashed rounded-lg">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-responsive-base font-medium text-foreground">Aucun cours trouvé</p>
              <p className="text-responsive-sm text-muted-foreground mt-2">
                {selectedFiliere 
                  ? "Aucun cours n'est programmé pour cette filière"
                  : "Aucun cours n'a été créé"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bouton pour créer un nouvel emploi */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={handleCreate}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          size="lg"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Nouveau cours
        </Button>
      </div>

      {/* Dialog pour créer/éditer un emploi */}
      <ScheduleCreatorV2
        modules={modules}
        enseignants={enseignants}
        filieres={filieres}
        schoolId={schoolId}
        schoolType={schoolType}
        initialData={editingData || undefined}
        isEditing={isEditing}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        externalOpen={isCreateDialogOpen || isEditing}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            setIsEditing(false)
            setEditingData(null)
          }
        }}
      />

      {/* Modal de visualisation des détails */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Détails du cours
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur le cours sélectionné
            </DialogDescription>
          </DialogHeader>

          {viewingEmploi && (
            <div className="space-y-4">
              {/* Module */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800">
                <h3 className="font-semibold text-lg text-indigo-900 dark:text-indigo-100">
                  {viewingEmploi.module.nom}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-0">
                    {viewingEmploi.niveau}
                  </Badge>
                  <Badge variant="outline">
                    {viewingEmploi.filiere ? viewingEmploi.filiere.nom : (schoolType === 'UNIVERSITY' ? 'UE Commune' : 'Toutes classes')}
                  </Badge>
                </div>
              </div>

              {/* Infos détaillées */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Enseignant</p>
                      <p className="font-medium text-sm">
                        {viewingEmploi.enseignant.nom} {viewingEmploi.enseignant.prenom}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Horaire</p>
                      <p className="font-medium text-sm">
                        {viewingEmploi.heureDebut} - {viewingEmploi.heureFin}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Salle</p>
                      <p className="font-medium text-sm">{viewingEmploi.salle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Volume horaire</p>
                      <p className="font-medium text-sm">{viewingEmploi.vh}h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Jours de cours */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Jours de cours
                </p>
                <div className="flex flex-wrap gap-2">
                  {viewingEmploi.joursCours && JSON.parse(viewingEmploi.joursCours).map((jour: string) => (
                    <Badge key={jour} variant="secondary" className="text-xs">
                      {jour.charAt(0) + jour.slice(1).toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Semestre */}
              {viewingEmploi.semestre && (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm text-muted-foreground">
                    {schoolType === 'UNIVERSITY' ? 'Semestre' : 'Trimestre'}
                  </span>
                  <Badge>{viewingEmploi.semestre}</Badge>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
            <Button 
              onClick={() => {
                setIsViewDialogOpen(false)
                if (viewingEmploi) handleEdit(viewingEmploi)
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
