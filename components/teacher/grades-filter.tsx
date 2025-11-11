"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface GradesFilterProps {
  filieres: Array<{ id: string; nom: string }>
  isHighSchool: boolean
  onFilterChange: (filters: {
    filiereId: string
    searchTerm: string
  }) => void
}

export default function GradesFilter({ filieres, isHighSchool, onFilterChange }: GradesFilterProps) {
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const handleFiliereChange = (value: string) => {
    setSelectedFiliere(value)
    onFilterChange({
      filiereId: value,
      searchTerm
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onFilterChange({
      filiereId: selectedFiliere,
      searchTerm: value
    })
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="text-responsive-base sm:text-responsive-lg">Filtres</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Filtre Filière/Classe */}
          <div>
            <Label className="text-responsive-sm">
              {isHighSchool ? 'Classe' : 'Filière'}
            </Label>
            <Select value={selectedFiliere} onValueChange={handleFiliereChange}>
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
            <Label className="text-responsive-sm">Rechercher un étudiant</Label>
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Nom de l'étudiant..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 sm:pl-9 bg-card text-responsive-sm"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
