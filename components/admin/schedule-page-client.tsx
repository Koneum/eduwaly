"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, BookOpen, Filter, Edit, Plus, Loader2 } from "lucide-react"
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
  const [isDuplicating, setIsDuplicating] = useState(false)
  
  // États pour le dialog d'édition/création
  const [editingData, setEditingData] = useState<{
    id: string
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
    console.log('handleCreate appelé')
    setEditingData(null)
    setIsEditing(false)
    
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

  

  const handleDuplicate = async (emploi: EmploiModel) => {
    if (isDuplicating) return;
    
    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/admin/schedule/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emploiId: emploi.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la duplication du cours');
      }

      // On ne stocke pas la réponse car on recharge la page
      await response.json();
      
      // Rafraîchir la page pour afficher le nouveau cours
      window.location.reload();
      
      toast.success('Cours dupliqué avec succès');
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
      toast.error('Erreur lors de la duplication du cours');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async (emploi: EmploiModel) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        const response = await fetch(`/api/admin/schedule/${emploi.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la suppression du cours');
        }

        // Afficher un message de succès
        toast.success('Cours supprimé avec succès');
        
        // Rafraîchir la page pour afficher les changements
        window.location.reload();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression du cours');
      }
    }
  };

  
  // Filtrer les emplois par filière
  const filteredEmplois = useMemo(() => {
    if (!selectedFiliere || selectedFiliere === "all") return emplois
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-responsive-h1 font-bold text-foreground">Gestion des Emplois du Temps</h1>
          <p className="text-responsive-sm text-muted-foreground mt-2">
            Planifiez et assignez les cours aux {schoolType === 'UNIVERSITY' ? 'salles' : 'classes'}
          </p>
        </div>
        <SchedulePageWrapper 
          modules={modules}
          enseignants={enseignants}
          filieres={filieres}
          schoolId={schoolId}
          schoolType={schoolType}
        />
      </div>

      {/* Filtre par filière */}
      <Card className="border border-foreground/20 bg-foreground text-background">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 text-responsive-sm font-medium text-background">
              <Filter className="h-4 w-4" />
              <span>Filtrer par filière:</span>
            </div>
            <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
              <SelectTrigger className="w-full sm:w-[300px] text-responsive-sm bg-foreground text-background">
                <SelectValue placeholder="Toutes les filières" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-responsive-sm">Toutes les filières</SelectItem>
                {filieres.map((filiere) => (
                  <SelectItem key={filiere.id} value={filiere.id} className="text-responsive-sm">
                    {filiere.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFiliere && selectedFiliere !== "all" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedFiliere("all")}
                className="w-full sm:w-auto"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="border border-foreground/20 bg-foreground text-background">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-background/80">Total Cours</p>
                <p className="text-responsive-2xl font-bold text-background mt-2">{filteredEmplois.length}</p>
              </div>
              <div className="bg-blue-500/10 p-2 md:p-3 rounded-xl">
                <Calendar className="h-4 w-4 md:h-6 md:w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-foreground/20 bg-foreground text-background">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-background/80">Enseignants</p>
                <p className="text-responsive-2xl font-bold text-background mt-2">{enseignants.length}</p>
              </div>
              <div className="bg-green-500/10 p-2 md:p-3 rounded-xl">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-foreground/20 bg-foreground text-background">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-background/80">Modules</p>
                <p className="text-responsive-2xl font-bold text-background mt-2">{modules.length}</p>
              </div>
              <div className="bg-purple-500/10 p-2 md:p-3 rounded-xl">
                <BookOpen className="h-4 w-4 md:h-6 md:w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-foreground/20 bg-foreground text-background">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-background/80">Heures/Semaine</p>
                <p className="text-responsive-2xl font-bold text-background mt-2">
                  {filteredEmplois.reduce<number>((sum, e: EmploiModel) => sum + e.vh, 0)}h
                </p>
              </div>
              <div className="bg-orange-500/10 p-2 md:p-3 rounded-xl">
                <Clock className="h-4 w-4 md:h-6 md:w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning par jour */}
      <Card className="border border-foreground/20 text-foreground ">
        <CardHeader>
          <CardTitle className="text-responsive-lg text-foreground">Planning Hebdomadaire</CardTitle>
          <CardDescription className="text-responsive-sm text-foreground/80">
            Vue d&apos;ensemble des cours de la semaine
            {selectedFiliere && ` - ${filieres.find(f => f.id === selectedFiliere)?.nom}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {daysOfWeek.map((day) => {
            const dayEmplois = emploisByDay[day] || []
            
            return (
              <div key={day}>
                <h3 className="text-responsive-base font-semibold text-foreground mb-3 sm:mb-4 flex flex-wrap items-center gap-2">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                  <Badge variant="outline" className="text-responsive-xs bg-background/10 border-background/20text-foreground">{dayEmplois.length} cours</Badge>
                </h3>
                
                {dayEmplois.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {dayEmplois.map((emploi) => (
                      <Card key={emploi.id} className="border border-foreground/20 bg-foreground text-background shadow-lg hover:shadow-lg transition-shadow hover:shadow-foreground/10">
                        <CardHeader className="pb-2 sm:pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-responsive-sm truncate text-background">{emploi.module.nom}</CardTitle>
                              <p className="text-responsive-xs text-background/70 mt-1 truncate">
                                {emploi.enseignant.nom} {emploi.enseignant.prenom}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-responsive-xs shrink-0 bg-background/10 border-background/20 text-background">{emploi.niveau}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                          <div className="flex items-center gap-2 text-responsive-sm">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-background/70 shrink-0" />
                            <span className="text-background">{emploi.heureDebut} - {emploi.heureFin}</span>
                          </div>
                          <div className="flex items-center gap-2 text-responsive-sm">
                            <MapPin className="h-3 w-3 md:h-4 md:w-4 text-background/70 shrink-0" />
                            <span className="text-background">{emploi.salle}</span>
                          </div>
                          {emploi.filiere && (
                            <Badge className="bg-gray-500 text-primary text-responsive-xs">{emploi.filiere.nom}</Badge>
                          )}
                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs bg-background/10 border-background/20 text-background hover:bg-background/20"
                              onClick={() => handleEdit(emploi)}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                              onClick={() => handleDuplicate(emploi)}
                              disabled={isDuplicating}
                            >
                              {isDuplicating ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                  Duplication...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Dupliquer
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20 hover:text-destructive"
                              onClick={() => handleDelete(emploi)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 border border-dashed rounded-lg">
                    <p className="text-responsive-sm text-muted-foreground">Aucun cours planifié pour ce jour</p>
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
      />
    </div>
  )
}
