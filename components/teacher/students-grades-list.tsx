"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, GraduationCap } from 'lucide-react'

interface Student {
  id: string
  user: {
    name: string
    email: string
  } | null
  filiere: {
    nom: string
  } | null
  enrollmentYear: number | null
  niveau: string
  studentNumber: string
}

interface StudentsGradesListProps {
  students: Student[]
  filieres: Array<{ id: string; nom: string }>
  isHighSchool: boolean
}

export default function StudentsGradesList({ students, filieres, isHighSchool }: StudentsGradesListProps) {
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Calculer la promotion
  const getPromotion = (enrollmentYear: number | null) => {
    if (!enrollmentYear) return 'N/A'
    const nextYear = enrollmentYear + 1
    return `${enrollmentYear}-${nextYear}`
  }

  // Filtrer les étudiants
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Filtre par filière
      const matchesFiliere = selectedFiliere === 'all' || student.filiere?.nom === filieres.find(f => f.id === selectedFiliere)?.nom
      
      // Filtre par recherche
      const matchesSearch = searchTerm === '' || 
        student.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesFiliere && matchesSearch
    })
  }, [students, selectedFiliere, searchTerm, filieres])

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="text-responsive-base sm:text-responsive-lg">
          Étudiants ({filteredStudents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4">
        {/* Filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Filtre Filière/Classe */}
          <div>
            <Label className="text-responsive-sm">
              {isHighSchool ? 'Classe' : 'Filière'}
            </Label>
            <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
              <SelectTrigger className="bg-card text-responsive-sm">
                <SelectValue placeholder={`Toutes les ${isHighSchool ? 'classes' : 'filières'}`} />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all" className="text-responsive-sm">
                  Toutes les {isHighSchool ? 'classes' : 'filières'}
                </SelectItem>
                {filieres.map((filiere) => (
                  <SelectItem key={filiere.id} value={filiere.id} className="text-responsive-sm">
                    {filiere.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recherche Étudiant */}
          <div>
            <Label className="text-responsive-sm">Rechercher</Label>
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Nom ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-9 bg-card text-responsive-sm"
              />
            </div>
          </div>
        </div>

        {/* Liste des étudiants */}
        <div className="space-y-2 sm:space-y-3">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                  {/* Info Étudiant */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="bg-primary/10 text-primary font-bold text-responsive-sm sm:text-responsive-base w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0">
                      {student.user?.name?.charAt(0) || 'E'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-responsive-sm sm:text-responsive-base text-foreground truncate">
                        {student.user?.name || 'Étudiant'}
                      </h3>
                      <p className="text-responsive-xs text-muted-foreground">
                        {student.studentNumber}
                      </p>
                    </div>
                  </div>

                  {/* Badges Info */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Filière */}
                    <Badge variant="outline" className="text-[10px] sm:text-responsive-xs">
                      {student.filiere?.nom || 'Non assigné'}
                    </Badge>
                    
                    {/* Niveau */}
                    <Badge variant="secondary" className="text-[10px] sm:text-responsive-xs">
                      {student.niveau}
                    </Badge>
                    
                    {/* Promotion */}
                    <Badge 
                      variant="default" 
                      className="text-[10px] sm:text-responsive-xs bg-primary/20 text-primary hover:bg-primary/30"
                    >
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Promo {getPromotion(student.enrollmentYear)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-responsive-sm">
              Aucun étudiant trouvé
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
