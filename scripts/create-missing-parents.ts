import prisma from '../lib/prisma'

/**
 * Script pour créer automatiquement des parents pour tous les étudiants
 * qui n'ont pas encore de parent associé avec le même enrollmentId
 */
async function createMissingParents() {
  try {
    console.log('🔍 Recherche des étudiants sans parent...')

    // Récupérer tous les étudiants
    const students = await prisma.student.findMany({
      select: {
        id: true,
        enrollmentId: true,
        studentNumber: true
      }
    })

    console.log(`📊 Total d'étudiants: ${students.length}`)

    let created = 0
    let skipped = 0
    let errors = 0

    for (const student of students) {
      try {
        // Vérifier si un parent existe déjà avec cet enrollmentId
        const existingParent = await prisma.parent.findUnique({
          where: { enrollmentId: student.enrollmentId }
        })

        if (existingParent) {
          // Vérifier si le parent est lié à cet étudiant
          const isLinked = await prisma.parent.findFirst({
            where: {
              id: existingParent.id,
              students: {
                some: { id: student.id }
              }
            }
          })

          if (!isLinked) {
            // Lier le parent existant à l'étudiant
            await prisma.parent.update({
              where: { id: existingParent.id },
              data: {
                students: {
                  connect: { id: student.id }
                }
              }
            })
            console.log(`🔗 Parent lié à l'étudiant ${student.studentNumber}`)
          }
          
          skipped++
          continue
        }

        // Créer un nouveau parent avec le même enrollmentId
        await prisma.parent.create({
          data: {
            enrollmentId: student.enrollmentId,
            isEnrolled: false,
            userId: null,
            students: {
              connect: { id: student.id }
            }
          }
        })

        created++
        console.log(`✅ Parent créé pour l'étudiant ${student.studentNumber} (${student.enrollmentId})`)
      } catch (error) {
        errors++
        console.error(`❌ Erreur pour l'étudiant ${student.studentNumber}:`, error)
      }
    }

    console.log('\n📈 Résumé:')
    console.log(`   ✅ Parents créés: ${created}`)
    console.log(`   ⏭️  Ignorés (déjà existants): ${skipped}`)
    console.log(`   ❌ Erreurs: ${errors}`)
    console.log(`   📊 Total traité: ${students.length}`)

  } catch (error) {
    console.error('❌ Erreur globale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
createMissingParents()
  .then(() => {
    console.log('\n✨ Script terminé avec succès!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error)
    process.exit(1)
  })
