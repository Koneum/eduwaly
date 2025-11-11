import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedGradingSystem() {
  console.log('🌱 Démarrage du seed du système de notation...')
  
  try {
    // Récupérer toutes les écoles
    const schools = await prisma.school.findMany()
    
    console.log(`📚 ${schools.length} école(s) trouvée(s)`)
    
    for (const school of schools) {
      const isHighSchool = school.schoolType === 'HIGH_SCHOOL'
      console.log(`\n🏫 Traitement de l'école: ${school.name} (${isHighSchool ? 'Lycée' : 'Université'})`)
      
      // 1. Définir le système de notation et la formule
      const gradingSystem = isHighSchool ? 'TRIMESTER' : 'SEMESTER'
      const gradingFormula = isHighSchool 
        ? '(examens + devoirs * 2) / 3'
        : '(examens + devoirs + projets) / 3'
      
      await prisma.school.update({
        where: { id: school.id },
        data: {
          gradingSystem,
          gradingFormula
        }
      })
      
      console.log(`  ✅ Système: ${gradingSystem}, Formule: ${gradingFormula}`)
      
      // 2. Créer les types d'évaluations par défaut
      const existingTypes = await prisma.evaluationType.findMany({
        where: { schoolId: school.id }
      })
      
      if (existingTypes.length === 0) {
        const evaluationTypes = isHighSchool ? [
          { schoolId: school.id, name: 'Devoir', category: 'HOMEWORK', weight: 2.0 },
          { schoolId: school.id, name: 'Examen', category: 'EXAM', weight: 1.0 }
        ] : [
          { schoolId: school.id, name: 'Devoir', category: 'HOMEWORK', weight: 1.0 },
          { schoolId: school.id, name: 'Examen', category: 'EXAM', weight: 1.0 },
          { schoolId: school.id, name: 'Projet', category: 'HOMEWORK', weight: 1.0 },
          { schoolId: school.id, name: 'TP', category: 'HOMEWORK', weight: 1.0 }
        ]
        
        await prisma.evaluationType.createMany({
          data: evaluationTypes
        })
        
        console.log(`  ✅ ${evaluationTypes.length} types d'évaluations créés`)
      } else {
        console.log(`  ⏭️  ${existingTypes.length} types d'évaluations déjà existants`)
      }
      
      // 3. Créer les périodes de notation par défaut
      const existingPeriods = await prisma.gradingPeriod.findMany({
        where: { schoolId: school.id }
      })
      
      if (existingPeriods.length === 0) {
        const currentYear = new Date().getFullYear()
        const nextYear = currentYear + 1
        
        const periods = isHighSchool ? [
          {
            schoolId: school.id,
            name: 'Trimestre 1',
            startDate: new Date(`${currentYear}-09-01`),
            endDate: new Date(`${currentYear}-12-15`)
          },
          {
            schoolId: school.id,
            name: 'Trimestre 2',
            startDate: new Date(`${nextYear}-01-05`),
            endDate: new Date(`${nextYear}-03-31`)
          },
          {
            schoolId: school.id,
            name: 'Trimestre 3',
            startDate: new Date(`${nextYear}-04-01`),
            endDate: new Date(`${nextYear}-06-30`)
          }
        ] : [
          {
            schoolId: school.id,
            name: 'Semestre 1',
            startDate: new Date(`${currentYear}-09-01`),
            endDate: new Date(`${nextYear}-01-31`)
          },
          {
            schoolId: school.id,
            name: 'Semestre 2',
            startDate: new Date(`${nextYear}-02-01`),
            endDate: new Date(`${nextYear}-06-30`)
          }
        ]
        
        await prisma.gradingPeriod.createMany({
          data: periods
        })
        
        console.log(`  ✅ ${periods.length} périodes créées`)
      } else {
        console.log(`  ⏭️  ${existingPeriods.length} périodes déjà existantes`)
      }
      
      // 4. Mettre à jour les étudiants sans enrollmentYear
      const studentsWithoutYear = await prisma.student.findMany({
        where: { 
          schoolId: school.id,
          enrollmentYear: null 
        }
      })
      
      if (studentsWithoutYear.length > 0) {
        const currentYear = new Date().getFullYear()
        
        for (const student of studentsWithoutYear) {
          // Calculer année d'inscription basée sur niveau
          let enrollmentYear = currentYear
          
          if (isHighSchool) {
            // Lycée: 10E, 11E, 12E
            if (student.niveau === '11E') enrollmentYear = currentYear - 1
            else if (student.niveau === '12E') enrollmentYear = currentYear - 2
          } else {
            // Université: L1, L2, L3, M1, M2
            if (student.niveau === 'L2') enrollmentYear = currentYear - 1
            else if (student.niveau === 'L3') enrollmentYear = currentYear - 2
            else if (student.niveau === 'M1') enrollmentYear = currentYear - 3
            else if (student.niveau === 'M2') enrollmentYear = currentYear - 4
          }
          
          await prisma.student.update({
            where: { id: student.id },
            data: { 
              enrollmentYear,
              courseSchedule: 'DAY' // Par défaut
            }
          })
        }
        
        console.log(`  ✅ ${studentsWithoutYear.length} étudiants mis à jour avec enrollmentYear`)
      } else {
        console.log(`  ⏭️  Tous les étudiants ont déjà un enrollmentYear`)
      }
    }
    
    console.log('\n✅ Seed terminé avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le seed
seedGradingSystem()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
