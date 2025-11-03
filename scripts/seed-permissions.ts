import { PrismaClient } from '../app/generated/prisma'

const prisma = new PrismaClient()

const defaultPermissions = [
  // Students
  { name: 'students.view', description: 'Voir les étudiants', category: 'students' },
  { name: 'students.create', description: 'Créer des étudiants', category: 'students' },
  { name: 'students.edit', description: 'Modifier des étudiants', category: 'students' },
  { name: 'students.delete', description: 'Supprimer des étudiants', category: 'students' },
  
  // Teachers
  { name: 'teachers.view', description: 'Voir les enseignants', category: 'teachers' },
  { name: 'teachers.create', description: 'Créer des enseignants', category: 'teachers' },
  { name: 'teachers.edit', description: 'Modifier des enseignants', category: 'teachers' },
  { name: 'teachers.delete', description: 'Supprimer des enseignants', category: 'teachers' },
  
  // Modules
  { name: 'modules.view', description: 'Voir les modules', category: 'modules' },
  { name: 'modules.create', description: 'Créer des modules', category: 'modules' },
  { name: 'modules.edit', description: 'Modifier des modules', category: 'modules' },
  { name: 'modules.delete', description: 'Supprimer des modules', category: 'modules' },
  
  // Filieres
  { name: 'filieres.view', description: 'Voir les filières', category: 'filieres' },
  { name: 'filieres.create', description: 'Créer des filières', category: 'filieres' },
  { name: 'filieres.edit', description: 'Modifier des filières', category: 'filieres' },
  { name: 'filieres.delete', description: 'Supprimer des filières', category: 'filieres' },
  
  // Schedule
  { name: 'schedule.view', description: 'Voir les emplois du temps', category: 'schedule' },
  { name: 'schedule.create', description: 'Créer des emplois du temps', category: 'schedule' },
  { name: 'schedule.edit', description: 'Modifier des emplois du temps', category: 'schedule' },
  { name: 'schedule.delete', description: 'Supprimer des emplois du temps', category: 'schedule' },
  
  // Finance
  { name: 'finance.view', description: 'Voir les finances', category: 'finance' },
  { name: 'finance.create', description: 'Créer des transactions', category: 'finance' },
  { name: 'finance.edit', description: 'Modifier des transactions', category: 'finance' },
  { name: 'finance.delete', description: 'Supprimer des transactions', category: 'finance' },
  
  // Absences
  { name: 'absences.view', description: 'Voir les absences', category: 'absences' },
  { name: 'absences.create', description: 'Créer des absences', category: 'absences' },
  { name: 'absences.edit', description: 'Modifier des absences', category: 'absences' },
  { name: 'absences.delete', description: 'Supprimer des absences', category: 'absences' },
  
  // Grades
  { name: 'grades.view', description: 'Voir les notes', category: 'grades' },
  { name: 'grades.create', description: 'Créer des notes', category: 'grades' },
  { name: 'grades.edit', description: 'Modifier des notes', category: 'grades' },
  { name: 'grades.delete', description: 'Supprimer des notes', category: 'grades' },
  
  // Staff
  { name: 'staff.view', description: 'Voir le personnel', category: 'staff' },
  { name: 'staff.create', description: 'Créer du personnel', category: 'staff' },
  { name: 'staff.edit', description: 'Modifier du personnel', category: 'staff' },
  { name: 'staff.delete', description: 'Supprimer du personnel', category: 'staff' },
  
  // Settings
  { name: 'settings.view', description: 'Voir les paramètres', category: 'settings' },
  { name: 'settings.edit', description: 'Modifier les paramètres', category: 'settings' },
]

async function seedPermissions() {
  console.log('🌱 Seeding permissions...')
  
  let created = 0
  let updated = 0
  
  for (const permission of defaultPermissions) {
    const result = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        description: permission.description,
        category: permission.category
      },
      create: permission
    })
    
    // Check if it was created or updated
    const existing = await prisma.permission.findUnique({
      where: { name: permission.name }
    })
    
    if (existing) {
      updated++
    } else {
      created++
    }
  }
  
  console.log('✅ Permissions seeded successfully!')
  console.log(`📊 Total permissions: ${defaultPermissions.length}`)
  console.log(`✨ Created: ${created}`)
  console.log(`🔄 Updated: ${updated}`)
}

seedPermissions()
  .catch((e) => {
    console.error('❌ Error seeding permissions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
