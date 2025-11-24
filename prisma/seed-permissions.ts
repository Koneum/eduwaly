import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultPermissions = [
  // Étudiants (commun lycée / université)
  { name: 'students.view', description: 'Voir les étudiants', category: 'students' },
  { name: 'students.create', description: 'Créer des étudiants', category: 'students' },
  { name: 'students.edit', description: 'Modifier des étudiants', category: 'students' },
  { name: 'students.delete', description: 'Supprimer des étudiants', category: 'students' },

  // Parents
  { name: 'parents.view', description: 'Voir les parents', category: 'parents' },
  { name: 'parents.create', description: 'Créer des parents', category: 'parents' },
  { name: 'parents.edit', description: 'Modifier des parents', category: 'parents' },
  { name: 'parents.delete', description: 'Supprimer des parents', category: 'parents' },

  // Personnel & Staff (sur toutes les écoles)
  { name: 'staff.view', description: 'Voir le personnel', category: 'staff' },
  { name: 'staff.create', description: 'Créer du personnel', category: 'staff' },
  { name: 'staff.edit', description: 'Modifier du personnel', category: 'staff' },
  { name: 'staff.delete', description: 'Supprimer du personnel', category: 'staff' },

  // Enseignants (sous-catégorie technique, conservée pour compat)
  { name: 'teachers.view', description: 'Voir les enseignants', category: 'teachers' },
  { name: 'teachers.create', description: 'Créer des enseignants', category: 'teachers' },
  { name: 'teachers.edit', description: 'Modifier des enseignants', category: 'teachers' },
  { name: 'teachers.delete', description: 'Supprimer des enseignants', category: 'teachers' },

  // Cours & Modules (université, mais aussi utilisable en lycée)
  { name: 'courses.view', description: 'Voir les cours / modules', category: 'courses' },
  { name: 'courses.create', description: 'Créer des cours / modules', category: 'courses' },
  { name: 'courses.edit', description: 'Modifier des cours / modules', category: 'courses' },
  { name: 'courses.delete', description: 'Supprimer des cours / modules', category: 'courses' },

  // Modules (ancienne catégorie conservée pour compatibilité)
  { name: 'modules.view', description: 'Voir les modules', category: 'modules' },
  { name: 'modules.create', description: 'Créer des modules', category: 'modules' },
  { name: 'modules.edit', description: 'Modifier des modules', category: 'modules' },
  { name: 'modules.delete', description: 'Supprimer des modules', category: 'modules' },

  // Filières / Séries
  { name: 'filieres.view', description: 'Voir les filières', category: 'filieres' },
  { name: 'filieres.create', description: 'Créer des filières', category: 'filieres' },
  { name: 'filieres.edit', description: 'Modifier des filières', category: 'filieres' },
  { name: 'filieres.delete', description: 'Supprimer des filières', category: 'filieres' },

  // Emploi du temps (timetable)
  { name: 'timetable.view', description: 'Voir les emplois du temps', category: 'timetable' },
  { name: 'timetable.create', description: 'Créer des emplois du temps', category: 'timetable' },
  { name: 'timetable.edit', description: 'Modifier des emplois du temps', category: 'timetable' },
  { name: 'timetable.delete', description: 'Supprimer des emplois du temps', category: 'timetable' },

  // Ancienne catégorie schedule (compat)
  { name: 'schedule.view', description: 'Voir les emplois du temps', category: 'schedule' },
  { name: 'schedule.create', description: 'Créer des emplois du temps', category: 'schedule' },
  { name: 'schedule.edit', description: 'Modifier des emplois du temps', category: 'schedule' },
  { name: 'schedule.delete', description: 'Supprimer des emplois du temps', category: 'schedule' },

  // Finance & Scolarité
  { name: 'finance.view', description: 'Voir les finances et la scolarité', category: 'finance' },
  { name: 'finance.create', description: 'Créer des transactions / frais', category: 'finance' },
  { name: 'finance.edit', description: 'Modifier des transactions / frais', category: 'finance' },
  { name: 'finance.delete', description: 'Supprimer des transactions / frais', category: 'finance' },

  // Présences & Absences
  { name: 'attendance.view', description: 'Voir les présences / absences', category: 'attendance' },
  { name: 'attendance.create', description: 'Enregistrer des présences / absences', category: 'attendance' },
  { name: 'attendance.edit', description: 'Modifier des présences / absences', category: 'attendance' },
  { name: 'attendance.delete', description: 'Supprimer des présences / absences', category: 'attendance' },

  // Ancienne catégorie absences (compat)
  { name: 'absences.view', description: 'Voir les absences', category: 'absences' },
  { name: 'absences.create', description: 'Créer des absences', category: 'absences' },
  { name: 'absences.edit', description: 'Modifier des absences', category: 'absences' },
  { name: 'absences.delete', description: 'Supprimer des absences', category: 'absences' },

  // Devoirs & Soumissions
  { name: 'homework.view', description: 'Voir les devoirs et soumissions', category: 'homework' },
  { name: 'homework.create', description: 'Créer des devoirs', category: 'homework' },
  { name: 'homework.edit', description: 'Modifier des devoirs', category: 'homework' },
  { name: 'homework.delete', description: 'Supprimer des devoirs', category: 'homework' },

  // Notes / Bulletins / Reporting
  { name: 'reporting.view', description: 'Voir les rapports et bulletins', category: 'reporting' },
  { name: 'reporting.create', description: 'Générer des rapports et bulletins', category: 'reporting' },
  { name: 'reporting.edit', description: 'Modifier la configuration des rapports', category: 'reporting' },
  { name: 'reporting.delete', description: 'Supprimer des rapports générés', category: 'reporting' },

  // Ancienne catégorie grades (compat)
  { name: 'grades.view', description: 'Voir les notes', category: 'grades' },
  { name: 'grades.create', description: 'Créer des notes', category: 'grades' },
  { name: 'grades.edit', description: 'Modifier des notes', category: 'grades' },
  { name: 'grades.delete', description: 'Supprimer des notes', category: 'grades' },

  // Communication & Messages (portail, messagerie interne)
  { name: 'communication.view', description: 'Voir les communications et messages', category: 'communication' },
  { name: 'communication.create', description: 'Créer des messages / annonces', category: 'communication' },
  { name: 'communication.edit', description: 'Modifier des messages / annonces', category: 'communication' },
  { name: 'communication.delete', description: 'Supprimer des messages / annonces', category: 'communication' },

  // Paramètres d’établissement
  { name: 'settings.view', description: 'Voir les paramètres', category: 'settings' },
  { name: 'settings.edit', description: 'Modifier les paramètres', category: 'settings' },
]

async function seedPermissions() {
  console.log('🌱 Seeding permissions...')
  
  for (const permission of defaultPermissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission
    })
  }
  
  console.log('✅ Permissions seeded successfully!')
}

seedPermissions()
  .catch((e) => {
    console.error('❌ Error seeding permissions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
