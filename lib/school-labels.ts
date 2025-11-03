/**
 * Helper pour adapter les labels selon le type d'école
 */

export type SchoolType = 'UNIVERSITY' | 'HIGH_SCHOOL'

export function getModuleLabel(schoolType: SchoolType, plural: boolean = false): string {
  if (schoolType === 'HIGH_SCHOOL') {
    return plural ? 'Matières' : 'Matière'
  }
  return plural ? 'Modules' : 'Module'
}

export function getNiveauLabel(schoolType: SchoolType): string {
  if (schoolType === 'HIGH_SCHOOL') {
    return 'Classe'
  }
  return 'Niveau'
}

export function getNiveaux(schoolType: SchoolType): Array<{ value: string; label: string }> {
  if (schoolType === 'HIGH_SCHOOL') {
    return [
      { value: '10E', label: '10E (Seconde)' },
      { value: '11E', label: '11E (Première)' },
      { value: '12E', label: '12E (Terminale)' },
    ]
  }
  
  return [
    { value: 'L1', label: 'L1 (Licence 1)' },
    { value: 'L2', label: 'L2 (Licence 2)' },
    { value: 'L3', label: 'L3 (Licence 3)' },
    { value: 'M1', label: 'M1 (Master 1)' },
    { value: 'M2', label: 'M2 (Master 2)' },
  ]
}

export function getFiliereLabel(schoolType: SchoolType, plural: boolean = false): string {
  if (schoolType === 'HIGH_SCHOOL') {
    return plural ? 'Séries' : 'Série'
  }
  return plural ? 'Filières' : 'Filière'
}
