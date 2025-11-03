import { ReactNode } from "react";

export interface Filiere {
  id: string;
  nom: string;
  modules?: Module[];
  emplois?: EmploiDuTemps[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Enseignant {
  id: string;
  nom: string;
  prenom: string;
  titre: string;
  telephone: string;
  email: string;
  type: TypeEnseignant;
  grade: Grade;
  emplois?: EmploiDuTemps[];
  createdAt: Date;
  updatedAt: Date;
}

export type TypeEnseignant = 'PERMANENT' | 'VACATAIRE' | 'ADMINISTRATEUR';
export type Grade = 'PROFESSEUR' | 'MAITRE_CONFERENCE' | 'MAITRE_ASSISTANT' | 'ASSISTANT';

export const TYPE_ENSEIGNANTS = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'VACATAIRE', label: 'Vacataire' },
  { value: 'ADMINISTRATEUR', label: 'Administrateur' },
] as const;

export const GRADES = [
  { value: 'PROFESSEUR', label: 'Professeur' },
  { value: 'MAITRE_CONFERENCE', label: 'Maître de conférence' },
  { value: 'MAITRE_ASSISTANT', label: 'Maître assistant' },
  { value: 'ASSISTANT', label: 'Assistant' },
] as const;

export interface Module {
  id: string;
  nom: string;
  type: 'CM' | 'TD' | 'CM_TD' | 'TP' | 'PROJET' | 'STAGE';
  vh: number;
  isUeCommune: boolean;
  filiereId?: string;
  filiere?: Filiere;
  emplois?: EmploiDuTemps[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmploiDuTemps {
  [x: string]: any;
  vh: ReactNode;
  id: string;
  titre: string;
  dateDebut: Date;
  dateFin: Date;
  heureDebut: string;
  heureFin: string;
  evaluation: boolean;
  dateEval?: Date;
  salle: string;
  niveau: string;
  semestre: string;
  ueCommune: boolean;
  moduleId: string;
  module: Module;
  enseignantId: string;
  enseignant: Enseignant;
  filiereId?: string;
  filiere?: Filiere;
  createdAt: Date;
  updatedAt: Date;
}

export const typeModules = [
  { value: 'CM', label: 'Cours Magistral' },
  { value: 'TD', label: 'Travaux Dirigés' },
  { value: 'CM_TD', label: 'Cours + TD' },
  { value: 'TP', label: 'Travaux Pratiques' },
  { value: 'PROJET', label: 'Projet' },
  { value: 'STAGE', label: 'Stage' },
] as const;

export interface Parametre {
  id: string;
  chefDepartement: string;
  titre: string;
  grade: Grade;
  synchroniserDate: boolean;
  createdAt: Date;
  updatedAt: Date;
}
