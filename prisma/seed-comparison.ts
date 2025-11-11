import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedComparisonRows() {
  console.log('🌱 Seeding comparison rows...')

  // Récupérer tous les plans actifs
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })

  if (plans.length === 0) {
    console.log('⚠️  Aucun plan trouvé. Créez d\'abord des plans.')
    return
  }

  console.log(`📊 ${plans.length} plans trouvés`)

  // Lignes de comparaison par défaut
  const comparisonData = [
    {
      category: 'Tarifs & Limites',
      label: 'Étudiants',
      order: 1,
      values: plans.map(p => ({
        planId: p.id,
        value: p.maxStudents === -1 ? 'Illimité' : p.maxStudents.toString()
      }))
    },
    {
      category: 'Tarifs & Limites',
      label: 'Enseignants',
      order: 2,
      values: plans.map(p => ({
        planId: p.id,
        value: p.maxTeachers === -1 ? 'Illimité' : p.maxTeachers.toString()
      }))
    },
    {
      category: 'Fonctionnalités',
      label: 'Gestion des présences',
      order: 3,
      values: plans.map((p, idx) => ({
        planId: p.id,
        value: '✓' // Tous les plans ont cette fonctionnalité
      }))
    },
    {
      category: 'Fonctionnalités',
      label: 'Gestion des notes',
      order: 4,
      values: plans.map((p, idx) => ({
        planId: p.id,
        value: '✓'
      }))
    },
    {
      category: 'Fonctionnalités',
      label: 'Emploi du temps',
      order: 5,
      values: plans.map((p, idx) => ({
        planId: p.id,
        value: '✓'
      }))
    },
    {
      category: 'Fonctionnalités',
      label: 'Messagerie interne',
      order: 6,
      values: plans.map((p, idx) => ({
        planId: p.id,
        value: idx === 0 ? '✗' : '✓' // Pas dans le premier plan
      }))
    },
    {
      category: 'Fonctionnalités',
      label: 'Rapports avancés',
      order: 7,
      values: plans.map((p, idx) => ({
        planId: p.id,
        value: idx < 2 ? '✗' : '✓' // Seulement dans les plans supérieurs
      }))
    },
    {
      category: 'Support',
      label: 'Support technique',
      order: 8,
      values: plans.map((p, idx) => ({
        planId: p.id,
        value: idx === 0 ? 'Email' : idx === 1 ? 'Email + Chat' : '24/7 Prioritaire'
      }))
    },
    {
      category: 'Support',
      label: 'Formation',
      order: 9,
      values: plans.map((p, idx) => ({
        planId: p.id,
        value: idx === 0 ? '✗' : idx === 1 ? 'En ligne' : 'En ligne + Sur site'
      }))
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

    // Créer les valeurs pour chaque plan
    for (const value of data.values) {
      await prisma.planComparisonValue.create({
        data: {
          comparisonRowId: row.id,
          planId: value.planId,
          value: value.value
        }
      })
    }

    console.log(`✅ Créé: ${data.category} - ${data.label}`)
  }

  console.log('✨ Seeding terminé!')
}

seedComparisonRows()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
