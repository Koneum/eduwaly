// Constantes pour les semestres
export const SEMESTRES = {
  'S1': {
    DEBUT_MOIS: 0, // Janvier (0-indexé)
    FIN_MOIS: 7,   // Août
    LABEL: 'Semestre 1'
  },
  'S2': {
    DEBUT_MOIS: 8, // Septembre (0-indexé)
    FIN_MOIS: 11,  // Décembre
    LABEL: 'Semestre 2'
  }
};

// Constantes pour les heures dues par semestre
export const HEURES_DUES = {
  'PERMANENT': 96, // 96h par semestre
  'VACATAIRE': 48  // 48h par semestre
};

// Types d'enseignants
export const TYPE_ENSEIGNANT = {
  'PERMANENT': 'Permanent',
  'VACATAIRE': 'Vacataire',
  'ADMINISTRATEUR': 'Administrateur'
};
