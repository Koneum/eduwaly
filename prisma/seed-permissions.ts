import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

// Pour le seed, utiliser DIRECT_DATABASE_URL
const directUrl = process.env.DIRECT_DATABASE_URL
if (!directUrl) {
  console.error('❌ DIRECT_DATABASE_URL manquant dans .env')
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: directUrl })
const prisma = new PrismaClient({ adapter })

/**
 * Permissions organisées par structure (UNIVERSITY / HIGH_SCHOOL / BOTH)
 * Chaque permission indique si elle s'applique à:
 * - 'BOTH': Lycée et Université
 * - 'UNIVERSITY': Université uniquement
 * - 'HIGH_SCHOOL': Lycée uniquement
 */
const defaultPermissions = [
  // ============================================================
  // 📚 GESTION ACADÉMIQUE (COMMUN)
  // ============================================================
  
  // --- Étudiants / Élèves ---
  { name: 'students.view', description: 'Voir les étudiants/élèves', category: 'students', schoolTypes: 'BOTH' },
  { name: 'students.create', description: 'Créer des étudiants/élèves', category: 'students', schoolTypes: 'BOTH' },
  { name: 'students.edit', description: 'Modifier des étudiants/élèves', category: 'students', schoolTypes: 'BOTH' },
  { name: 'students.delete', description: 'Supprimer des étudiants/élèves', category: 'students', schoolTypes: 'BOTH' },
  { name: 'students.import', description: 'Importer des étudiants/élèves', category: 'students', schoolTypes: 'BOTH' },
  { name: 'students.export', description: 'Exporter des étudiants/élèves', category: 'students', schoolTypes: 'BOTH' },

  // --- Enseignants ---
  { name: 'teachers.view', description: 'Voir les enseignants', category: 'teachers', schoolTypes: 'BOTH' },
  { name: 'teachers.create', description: 'Créer des enseignants', category: 'teachers', schoolTypes: 'BOTH' },
  { name: 'teachers.edit', description: 'Modifier des enseignants', category: 'teachers', schoolTypes: 'BOTH' },
  { name: 'teachers.delete', description: 'Supprimer des enseignants', category: 'teachers', schoolTypes: 'BOTH' },
  { name: 'teachers.statistics', description: 'Voir les statistiques enseignants', category: 'teachers', schoolTypes: 'BOTH' },

  // --- Personnel / Staff ---
  { name: 'staff.view', description: 'Voir le personnel', category: 'staff', schoolTypes: 'BOTH' },
  { name: 'staff.create', description: 'Créer du personnel', category: 'staff', schoolTypes: 'BOTH' },
  { name: 'staff.edit', description: 'Modifier du personnel', category: 'staff', schoolTypes: 'BOTH' },
  { name: 'staff.delete', description: 'Supprimer du personnel', category: 'staff', schoolTypes: 'BOTH' },

  // --- Modules / Matières ---
  { name: 'modules.view', description: 'Voir les modules/matières', category: 'modules', schoolTypes: 'BOTH' },
  { name: 'modules.create', description: 'Créer des modules/matières', category: 'modules', schoolTypes: 'BOTH' },
  { name: 'modules.edit', description: 'Modifier des modules/matières', category: 'modules', schoolTypes: 'BOTH' },
  { name: 'modules.delete', description: 'Supprimer des modules/matières', category: 'modules', schoolTypes: 'BOTH' },

  // --- Filières / Séries ---
  { name: 'filieres.view', description: 'Voir les filières/séries', category: 'filieres', schoolTypes: 'BOTH' },
  { name: 'filieres.create', description: 'Créer des filières/séries', category: 'filieres', schoolTypes: 'BOTH' },
  { name: 'filieres.edit', description: 'Modifier des filières/séries', category: 'filieres', schoolTypes: 'BOTH' },
  { name: 'filieres.delete', description: 'Supprimer des filières/séries', category: 'filieres', schoolTypes: 'BOTH' },

  // --- Emploi du temps ---
  { name: 'timetable.view', description: 'Voir les emplois du temps', category: 'timetable', schoolTypes: 'BOTH' },
  { name: 'timetable.create', description: 'Créer des emplois du temps', category: 'timetable', schoolTypes: 'BOTH' },
  { name: 'timetable.edit', description: 'Modifier des emplois du temps', category: 'timetable', schoolTypes: 'BOTH' },
  { name: 'timetable.delete', description: 'Supprimer des emplois du temps', category: 'timetable', schoolTypes: 'BOTH' },
  { name: 'timetable.export', description: 'Exporter les emplois du temps PDF', category: 'timetable', schoolTypes: 'BOTH' },

  // ============================================================
  // 💰 FINANCE (COMMUN)
  // ============================================================
  { name: 'finance.view', description: 'Voir les finances', category: 'finance', schoolTypes: 'BOTH' },
  { name: 'finance.create', description: 'Créer des frais/paiements', category: 'finance', schoolTypes: 'BOTH' },
  { name: 'finance.edit', description: 'Modifier des frais/paiements', category: 'finance', schoolTypes: 'BOTH' },
  { name: 'finance.delete', description: 'Supprimer des frais/paiements', category: 'finance', schoolTypes: 'BOTH' },
  { name: 'finance.scholarships', description: 'Gérer les bourses', category: 'finance', schoolTypes: 'BOTH' },
  { name: 'finance.reports', description: 'Voir les rapports financiers', category: 'finance', schoolTypes: 'BOTH' },

  // ============================================================
  // 📊 NOTES & ÉVALUATIONS (COMMUN)
  // ============================================================
  { name: 'grades.view', description: 'Voir les notes', category: 'grades', schoolTypes: 'BOTH' },
  { name: 'grades.create', description: 'Créer des évaluations', category: 'grades', schoolTypes: 'BOTH' },
  { name: 'grades.edit', description: 'Modifier des notes', category: 'grades', schoolTypes: 'BOTH' },
  { name: 'grades.delete', description: 'Supprimer des notes', category: 'grades', schoolTypes: 'BOTH' },
  { name: 'grades.config', description: 'Configurer les barèmes', category: 'grades', schoolTypes: 'BOTH' },

  // ============================================================
  // 📋 PRÉSENCES & ABSENCES (COMMUN)
  // ============================================================
  { name: 'attendance.view', description: 'Voir les présences/absences', category: 'attendance', schoolTypes: 'BOTH' },
  { name: 'attendance.create', description: 'Enregistrer des présences/absences', category: 'attendance', schoolTypes: 'BOTH' },
  { name: 'attendance.edit', description: 'Modifier des présences/absences', category: 'attendance', schoolTypes: 'BOTH' },
  { name: 'attendance.delete', description: 'Supprimer des présences/absences', category: 'attendance', schoolTypes: 'BOTH' },

  // ============================================================
  // 📝 DEVOIRS & SOUMISSIONS (COMMUN)
  // ============================================================
  { name: 'homework.view', description: 'Voir les devoirs', category: 'homework', schoolTypes: 'BOTH' },
  { name: 'homework.create', description: 'Créer des devoirs', category: 'homework', schoolTypes: 'BOTH' },
  { name: 'homework.edit', description: 'Modifier des devoirs', category: 'homework', schoolTypes: 'BOTH' },
  { name: 'homework.delete', description: 'Supprimer des devoirs', category: 'homework', schoolTypes: 'BOTH' },
  { name: 'homework.grade', description: 'Noter les devoirs', category: 'homework', schoolTypes: 'BOTH' },

  // ============================================================
  // 📄 BULLETINS & RAPPORTS (COMMUN)
  // ============================================================
  { name: 'reporting.view', description: 'Voir les bulletins/rapports', category: 'reporting', schoolTypes: 'BOTH' },
  { name: 'reporting.create', description: 'Générer des bulletins', category: 'reporting', schoolTypes: 'BOTH' },
  { name: 'reporting.edit', description: 'Modifier la configuration', category: 'reporting', schoolTypes: 'BOTH' },
  { name: 'reporting.delete', description: 'Supprimer des rapports', category: 'reporting', schoolTypes: 'BOTH' },

  // ============================================================
  // 💬 COMMUNICATION (COMMUN)
  // ============================================================
  { name: 'communication.view', description: 'Voir les messages', category: 'communication', schoolTypes: 'BOTH' },
  { name: 'communication.create', description: 'Envoyer des messages', category: 'communication', schoolTypes: 'BOTH' },
  { name: 'communication.announcements', description: 'Créer des annonces', category: 'communication', schoolTypes: 'BOTH' },
  { name: 'communication.delete', description: 'Supprimer des messages', category: 'communication', schoolTypes: 'BOTH' },

  // ============================================================
  // 📅 AGENDA & ÉVÉNEMENTS (COMMUN)
  // ============================================================
  { name: 'calendar.view', description: 'Voir l\'agenda', category: 'calendar', schoolTypes: 'BOTH' },
  { name: 'calendar.create', description: 'Créer des événements', category: 'calendar', schoolTypes: 'BOTH' },
  { name: 'calendar.edit', description: 'Modifier des événements', category: 'calendar', schoolTypes: 'BOTH' },
  { name: 'calendar.delete', description: 'Supprimer des événements', category: 'calendar', schoolTypes: 'BOTH' },

  // ============================================================
  // 📊 SONDAGES (COMMUN)
  // ============================================================
  { name: 'polls.view', description: 'Voir les sondages', category: 'polls', schoolTypes: 'BOTH' },
  { name: 'polls.create', description: 'Créer des sondages', category: 'polls', schoolTypes: 'BOTH' },
  { name: 'polls.edit', description: 'Modifier des sondages', category: 'polls', schoolTypes: 'BOTH' },
  { name: 'polls.delete', description: 'Supprimer des sondages', category: 'polls', schoolTypes: 'BOTH' },
  { name: 'polls.vote', description: 'Voter aux sondages', category: 'polls', schoolTypes: 'BOTH' },

  // ============================================================
  // ⚙️ PARAMÈTRES (COMMUN)
  // ============================================================
  { name: 'settings.view', description: 'Voir les paramètres', category: 'settings', schoolTypes: 'BOTH' },
  { name: 'settings.edit', description: 'Modifier les paramètres', category: 'settings', schoolTypes: 'BOTH' },
  { name: 'settings.permissions', description: 'Gérer les permissions', category: 'settings', schoolTypes: 'BOTH' },

  // ============================================================
  // 🏫 SPÉCIFIQUE LYCÉE (HIGH_SCHOOL)
  // ============================================================
  
  // --- Parents (obligatoire pour lycée) ---
  { name: 'parents.view', description: 'Voir les parents', category: 'parents', schoolTypes: 'HIGH_SCHOOL' },
  { name: 'parents.create', description: 'Créer des parents', category: 'parents', schoolTypes: 'HIGH_SCHOOL' },
  { name: 'parents.edit', description: 'Modifier des parents', category: 'parents', schoolTypes: 'HIGH_SCHOOL' },
  { name: 'parents.delete', description: 'Supprimer des parents', category: 'parents', schoolTypes: 'HIGH_SCHOOL' },

  // --- RDV Parent-Prof ---
  { name: 'appointments.view', description: 'Voir les rendez-vous parent-prof', category: 'appointments', schoolTypes: 'HIGH_SCHOOL' },
  { name: 'appointments.create', description: 'Demander un RDV', category: 'appointments', schoolTypes: 'HIGH_SCHOOL' },
  { name: 'appointments.manage', description: 'Gérer les RDV', category: 'appointments', schoolTypes: 'HIGH_SCHOOL' },

  // --- Carnet de correspondance ---
  { name: 'correspondence.view', description: 'Voir le carnet de correspondance', category: 'correspondence', schoolTypes: 'HIGH_SCHOOL' },
  { name: 'correspondence.create', description: 'Écrire dans le carnet', category: 'correspondence', schoolTypes: 'HIGH_SCHOOL' },

  // --- Prof Principal ---
  { name: 'headteacher.view', description: 'Voir les profs principaux', category: 'headteacher', schoolTypes: 'HIGH_SCHOOL' },
  { name: 'headteacher.assign', description: 'Assigner un prof principal', category: 'headteacher', schoolTypes: 'HIGH_SCHOOL' },

  // --- Bulletin de classe ---
  { name: 'classreport.view', description: 'Voir le bulletin de classe', category: 'classreport', schoolTypes: 'HIGH_SCHOOL' },
  { name: 'classreport.export', description: 'Exporter le bulletin de classe', category: 'classreport', schoolTypes: 'HIGH_SCHOOL' },

  // --- Incidents disciplinaires ---
  { name: 'incidents.view', description: 'Voir les incidents', category: 'incidents', schoolTypes: 'HIGH_SCHOOL' },
  { name: 'incidents.create', description: 'Créer un incident', category: 'incidents', schoolTypes: 'HIGH_SCHOOL' },
  { name: 'incidents.manage', description: 'Gérer les incidents', category: 'incidents', schoolTypes: 'HIGH_SCHOOL' },

  // ============================================================
  // 🎓 SPÉCIFIQUE UNIVERSITÉ (UNIVERSITY)
  // ============================================================
  
  // --- Parents (optionnel pour université) ---
  { name: 'parents.view_uni', description: 'Voir les parents (optionnel)', category: 'parents_uni', schoolTypes: 'UNIVERSITY' },
  { name: 'parents.manage_uni', description: 'Gérer les parents', category: 'parents_uni', schoolTypes: 'UNIVERSITY' },

  // --- Statistiques enseignants avancées ---
  { name: 'teachers.statistics_advanced', description: 'Statistiques avancées enseignants', category: 'teachers_stats', schoolTypes: 'UNIVERSITY' },
  { name: 'teachers.salary', description: 'Voir les données salariales', category: 'teachers_stats', schoolTypes: 'UNIVERSITY' },
  { name: 'teachers.export_pdf', description: 'Exporter PDF enseignant', category: 'teachers_stats', schoolTypes: 'UNIVERSITY' },

  // --- Gestion des salles ---
  { name: 'rooms.view', description: 'Voir les salles', category: 'rooms', schoolTypes: 'UNIVERSITY' },
  { name: 'rooms.create', description: 'Créer des salles', category: 'rooms', schoolTypes: 'UNIVERSITY' },
  { name: 'rooms.edit', description: 'Modifier des salles', category: 'rooms', schoolTypes: 'UNIVERSITY' },
  { name: 'rooms.delete', description: 'Supprimer des salles', category: 'rooms', schoolTypes: 'UNIVERSITY' },

  // --- Année universitaire ---
  { name: 'academic_year.view', description: 'Voir les années universitaires', category: 'academic', schoolTypes: 'UNIVERSITY' },
  { name: 'academic_year.create', description: 'Créer une année universitaire', category: 'academic', schoolTypes: 'UNIVERSITY' },
  { name: 'academic_year.manage', description: 'Gérer les années universitaires', category: 'academic', schoolTypes: 'UNIVERSITY' },

  // --- Cours du soir ---
  { name: 'evening_courses.view', description: 'Voir les cours du soir', category: 'evening', schoolTypes: 'UNIVERSITY' },
  { name: 'evening_courses.manage', description: 'Gérer les cours du soir', category: 'evening', schoolTypes: 'UNIVERSITY' },
]

async function seedPermissions() {
  console.log('🌱 Seeding permissions...')
  console.log('')
  
  // Compter par catégorie
  const categories = new Map<string, number>()
  
  for (const permission of defaultPermissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        description: permission.description,
        category: permission.category,
      },
      create: {
        name: permission.name,
        description: permission.description,
        category: permission.category,
      }
    })
    
    categories.set(permission.category, (categories.get(permission.category) || 0) + 1)
  }
  
  console.log('📊 Permissions par catégorie:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  for (const [cat, count] of categories) {
    console.log(`   ${cat}: ${count}`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   Total: ${defaultPermissions.length} permissions`)
  console.log('')
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
