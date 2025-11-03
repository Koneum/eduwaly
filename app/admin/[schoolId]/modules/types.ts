export interface Module {
  id: string;
  nom: string;
  type: 'CM' | 'TD' | 'CM_TD' | 'TP' | 'PROJET' | 'STAGE' | 'COURS'| 'DEVOIRES' | 'EXAMEN' ;
  vh: number;
  filiereId?: string;
  filiere?: {
    id: string;
    nom: string;
  };
}

export interface Filiere {
  id: string;
  nom: string;
}

export const typeModules = [
  { value: 'CM', label: 'Cours Magistral' },
  { value: 'TD', label: 'Travaux Dirigés' },
  { value: 'CM_TD', label: 'Cours + TD' },
  { value: 'TP', label: 'Travaux Pratiques' },
  { value: 'PROJET', label: 'Projet' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'COURS', label: 'Cours' },
  { value: 'DEVOIRES', label: 'Devoires' },
  { value: 'EXAMEN', label: 'Examen' },
] as const;
