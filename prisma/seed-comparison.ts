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

type PlanType = { 
  id: string
  name: string
  displayName: string
  maxStudents: number
  maxTeachers: number
  schoolType: string | null
}

async function seedComparisonRows() {
  console.log('🌱 Seeding comparison rows...')

  // Supprimer les anciennes comparaisons
  await prisma.planComparisonValue.deleteMany()
  await prisma.comparisonRow.deleteMany()

  // Récupérer tous les plans actifs
  const allPlans: PlanType[] = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })

  if (allPlans.length === 0) {
    console.log('⚠️  Aucun plan trouvé. Créez d\'abord des plans.')
    return
  }

  // Séparer les plans par type de structure
  const universityPlans = allPlans.filter(p => p.schoolType === 'UNIVERSITY')
  const highSchoolPlans = allPlans.filter(p => p.schoolType === 'HIGH_SCHOOL')

  console.log(`📊 Plans trouvés:`)
  console.log(`   🎓 Université: ${universityPlans.length}`)
  console.log(`   🏫 Lycée: ${highSchoolPlans.length}`)

  // Helper pour déterminer le niveau du plan
  const getPlanLevel = (name: string): number => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('essai')) return 0
    if (nameLower.includes('starter')) return 1
    if (nameLower.includes('basic')) return 2
    if (nameLower.includes('premium')) return 3
    if (nameLower.includes('custom') || nameLower.includes('mesure')) return 4
    return 1
  }

  // Fonction pour créer les comparaisons pour un type de structure
  const createComparisonForSchoolType = async (plans: PlanType[], schoolType: string) => {
    const prefix = schoolType === 'UNIVERSITY' ? '🎓' : '🏫'
    const typeName = schoolType === 'UNIVERSITY' ? 'Université' : 'Lycée'
    
    console.log(`\n${prefix} Création des comparaisons pour ${typeName}...`)

    const comparisonData = [
      // --- LIMITES ---
      {
        category: `Limites - ${typeName}`,
        label: schoolType === 'UNIVERSITY' ? 'Étudiants max' : 'Élèves max',
        order: 1,
        values: plans.map(p => ({
          planId: p.id,
          value: p.maxStudents >= 99999 ? 'Illimité' : p.maxStudents.toString()
        }))
      },
      {
        category: `Limites - ${typeName}`,
        label: 'Enseignants max',
        order: 2,
        values: plans.map(p => ({
          planId: p.id,
          value: p.maxTeachers >= 9999 ? 'Illimité' : p.maxTeachers.toString()
        }))
      },

      // --- GESTION SCOLAIRE ---
      {
        category: `Gestion Scolaire - ${typeName}`,
        label: schoolType === 'UNIVERSITY' ? 'Gestion étudiants' : 'Gestion élèves',
        order: 3,
        values: plans.map(p => ({ planId: p.id, value: '✓' }))
      },
      {
        category: `Gestion Scolaire - ${typeName}`,
        label: 'Emplois du temps',
        order: 4,
        values: plans.map(p => ({ planId: p.id, value: '✓' }))
      },
      {
        category: `Gestion Scolaire - ${typeName}`,
        label: 'Export PDF emploi du temps',
        order: 5,
        values: plans.map(p => ({
          planId: p.id,
          value: getPlanLevel(p.name) >= 1 ? '✓' : '✗'
        }))
      },
      {
        category: `Gestion Scolaire - ${typeName}`,
        label: schoolType === 'UNIVERSITY' ? 'Notes & relevés' : 'Notes & bulletins',
        order: 6,
        values: plans.map(p => ({ planId: p.id, value: '✓' }))
      },
      {
        category: `Gestion Scolaire - ${typeName}`,
        label: 'Absences & présences',
        order: 7,
        values: plans.map(p => ({ planId: p.id, value: '✓' }))
      },

      // --- FONCTIONNALITÉS AVANCÉES ---
      {
        category: `Fonctionnalités - ${typeName}`,
        label: 'Messagerie interne',
        order: 8,
        values: plans.map(p => ({
          planId: p.id,
          value: getPlanLevel(p.name) >= 1 ? '✓' : '✗'
        }))
      },
      {
        category: `Fonctionnalités - ${typeName}`,
        label: schoolType === 'HIGH_SCHOOL' ? 'RDV parent-prof' : 'Communication parents (optionnel)',
        order: 9,
        values: plans.map(p => ({
          planId: p.id,
          value: getPlanLevel(p.name) >= 1 ? '✓' : '✗'
        }))
      },
      {
        category: `Fonctionnalités - ${typeName}`,
        label: 'Agenda événements',
        order: 10,
        values: plans.map(p => ({
          planId: p.id,
          value: getPlanLevel(p.name) >= 1 ? '✓' : '✗'
        }))
      },
      {
        category: `Fonctionnalités - ${typeName}`,
        label: 'Devoirs en ligne',
        order: 11,
        values: plans.map(p => ({
          planId: p.id,
          value: getPlanLevel(p.name) >= 1 ? '✓' : '✗'
        }))
      },

      // --- SPÉCIFIQUE AU TYPE ---
      ...(schoolType === 'UNIVERSITY' ? [
        {
          category: `Fonctionnalités - ${typeName}`,
          label: 'Statistiques enseignants',
          order: 12,
          values: plans.map(p => ({
            planId: p.id,
            value: getPlanLevel(p.name) >= 2 ? '✓' : '✗'
          }))
        },
        {
          category: `Fonctionnalités - ${typeName}`,
          label: 'Export PDF enseignants',
          order: 13,
          values: plans.map(p => ({
            planId: p.id,
            value: getPlanLevel(p.name) >= 2 ? '✓' : '✗'
          }))
        },
        {
          category: `Fonctionnalités - ${typeName}`,
          label: 'Gestion cours du soir',
          order: 14,
          values: plans.map(p => ({
            planId: p.id,
            value: getPlanLevel(p.name) >= 2 ? '✓' : '✗'
          }))
        },
      ] : [
        {
          category: `Fonctionnalités - ${typeName}`,
          label: 'Carnet de correspondance',
          order: 12,
          values: plans.map(p => ({
            planId: p.id,
            value: getPlanLevel(p.name) >= 1 ? '✓' : '✗'
          }))
        },
        {
          category: `Fonctionnalités - ${typeName}`,
          label: 'Prof principal',
          order: 13,
          values: plans.map(p => ({
            planId: p.id,
            value: getPlanLevel(p.name) >= 1 ? '✓' : '✗'
          }))
        },
        {
          category: `Fonctionnalités - ${typeName}`,
          label: 'Incidents disciplinaires',
          order: 14,
          values: plans.map(p => ({
            planId: p.id,
            value: getPlanLevel(p.name) >= 2 ? '✓' : '✗'
          }))
        },
      ]),

      // --- FINANCE ---
      {
        category: `Finance - ${typeName}`,
        label: 'Gestion des paiements',
        order: 15,
        values: plans.map(p => ({
          planId: p.id,
          value: getPlanLevel(p.name) >= 2 ? '✓' : '✗'
        }))
      },
      {
        category: `Finance - ${typeName}`,
        label: 'Bourses & réductions',
        order: 16,
        values: plans.map(p => ({
          planId: p.id,
          value: getPlanLevel(p.name) >= 2 ? '✓' : '✗'
        }))
      },
      {
        category: `Finance - ${typeName}`,
        label: 'Paiement mobile (VitePay)',
        order: 17,
        values: plans.map(p => ({
          planId: p.id,
          value: getPlanLevel(p.name) >= 2 ? '✓' : '✗'
        }))
      },

      // --- SUPPORT ---
      {
        category: `Support - ${typeName}`,
        label: 'Support technique',
        order: 18,
        values: plans.map(p => {
          const level = getPlanLevel(p.name)
          if (level === 0) return { planId: p.id, value: 'Email' }
          if (level === 1) return { planId: p.id, value: 'Email + Chat' }
          if (level === 2) return { planId: p.id, value: 'Prioritaire' }
          return { planId: p.id, value: '24/7 Dédié' }
        })
      },
      {
        category: `Support - ${typeName}`,
        label: 'Formation',
        order: 19,
        values: plans.map(p => {
          const level = getPlanLevel(p.name)
          if (level <= 1) return { planId: p.id, value: '✗' }
          if (level === 2) return { planId: p.id, value: 'En ligne' }
          return { planId: p.id, value: 'Sur site' }
        })
      }
    ]

    // Créer les lignes
    for (const data of comparisonData) {
      const row = await prisma.comparisonRow.create({
        data: {
          category: data.category,
          label: data.label,
          order: data.order,
          isActive: true
        }
      })

      for (const value of data.values) {
        await prisma.planComparisonValue.create({
          data: {
            comparisonRowId: row.id,
            planId: value.planId,
            value: value.value
          }
        })
      }

      console.log(`   ✅ ${data.label}`)
    }
  }

  // Créer les comparaisons pour chaque type
  if (universityPlans.length > 0) {
    await createComparisonForSchoolType(universityPlans, 'UNIVERSITY')
  }
  
  if (highSchoolPlans.length > 0) {
    await createComparisonForSchoolType(highSchoolPlans, 'HIGH_SCHOOL')
  }

  console.log('\n✨ Seeding terminé!')
}

seedComparisonRows()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
