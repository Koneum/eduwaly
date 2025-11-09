"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, BookOpen, Filter } from "lucide-react"
import { SchedulePageWrapper } from "./schedule-page-wrapper"

type EmploiModel = {
  id: string
  module: { nom: string }
  enseignant: { nom: string; prenom: string }
  filiere?: { id: string; nom?: string } | null
  vh: number
  joursCours?: string | null
  heureDebut: string
  heureFin: string
  salle: string
  niveau: string
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
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 text-responsive-sm font-medium">
              <Filter className="h-4 w-4" />
              <span>Filtrer par filière:</span>
            </div>
            <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
              <SelectTrigger className="w-full sm:w-[300px] text-responsive-sm">
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
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Total Cours</p>
                <p className="text-responsive-2xl font-bold text-foreground mt-2">{filteredEmplois.length}</p>
              </div>
              <div className="bg-blue-100 p-2 md:p-3 rounded-xl">
                <Calendar className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Enseignants</p>
                <p className="text-responsive-2xl font-bold text-foreground mt-2">{enseignants.length}</p>
              </div>
              <div className="bg-green-100 p-2 md:p-3 rounded-xl">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Modules</p>
                <p className="text-responsive-2xl font-bold text-foreground mt-2">{modules.length}</p>
              </div>
              <div className="bg-purple-100 p-2 md:p-3 rounded-xl">
                <BookOpen className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Heures/Semaine</p>
                <p className="text-responsive-2xl font-bold text-foreground mt-2">
                  {filteredEmplois.reduce<number>((sum, e: EmploiModel) => sum + e.vh, 0)}h
                </p>
              </div>
              <div className="bg-orange-100 p-2 md:p-3 rounded-xl">
                <Clock className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning par jour */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Planning Hebdomadaire</CardTitle>
          <CardDescription className="text-responsive-sm">
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
                  <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                  <Badge variant="outline" className="text-responsive-xs">{dayEmplois.length} cours</Badge>
                </h3>
                
                {dayEmplois.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {dayEmplois.map((emploi) => (
                      <Card key={emploi.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2 sm:pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-responsive-sm truncate">{emploi.module.nom}</CardTitle>
                              <p className="text-responsive-xs text-muted-foreground mt-1 truncate">
                                {emploi.enseignant.nom} {emploi.enseignant.prenom}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-responsive-xs shrink-0">{emploi.niveau}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                          <div className="flex items-center gap-2 text-responsive-sm">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                            <span className="text-foreground">{emploi.heureDebut} - {emploi.heureFin}</span>
                          </div>
                          <div className="flex items-center gap-2 text-responsive-sm">
                            <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                            <span className="text-foreground truncate">{emploi.salle}</span>
                          </div>
                          {emploi.filiere && (
                            <Badge className="bg-blue-100 text-blue-700 text-responsive-xs">{emploi.filiere.nom}</Badge>
                          )}
                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1 text-responsive-xs">
                              Modifier
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1 text-responsive-xs">
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
    </div>
  )
}
