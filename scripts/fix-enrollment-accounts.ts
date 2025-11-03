/**
 * Script pour corriger les comptes créés sans Better Auth Account
 * Supprime les utilisateurs qui n'ont pas de compte Better Auth
 */

import { PrismaClient } from '../app/generated/prisma'

const prisma = new PrismaClient()

async function fixEnrollmentAccounts() {
  try {
    console.log('🔍 Recherche des utilisateurs sans compte Better Auth...\n')

    // Trouver tous les utilisateurs sans compte Better Auth
    const usersWithoutAccount = await prisma.user.findMany({
      where: {
        accounts: {
          none: {}
        }
      },
      include: {
        student: true,
        parent: true
      }
    })

    console.log(`📊 Trouvé ${usersWithoutAccount.length} utilisateur(s) sans compte Better Auth\n`)

    for (const user of usersWithoutAccount) {
      console.log(`👤 Utilisateur: ${user.name} (${user.email})`)
      console.log(`   Role: ${user.role}`)
      
      if (user.student) {
        console.log(`   📚 Étudiant ID: ${user.student.id}`)
        console.log(`   📝 Matricule: ${user.student.studentNumber}`)
        console.log(`   🔑 Enrollment ID: ${user.student.enrollmentId}`)
        
        // Remettre l'étudiant en état non-enrôlé
        await prisma.student.update({
          where: { id: user.student.id },
          data: {
            userId: null,
            isEnrolled: false
          }
        })
        console.log(`   ✅ Étudiant remis en état non-enrôlé`)
      }
      
      if (user.parent) {
        console.log(`   👨‍👩‍👧 Parent ID: ${user.parent.id}`)
        console.log(`   🔑 Enrollment ID: ${user.parent.enrollmentId}`)
        
        // Remettre le parent en état non-enrôlé
        await prisma.parent.update({
          where: { id: user.parent.id },
          data: {
            userId: null,
            isEnrolled: false
          }
        })
        console.log(`   ✅ Parent remis en état non-enrôlé`)
      }
      
      // Supprimer l'utilisateur
      await prisma.user.delete({
        where: { id: user.id }
      })
      console.log(`   🗑️  Utilisateur supprimé\n`)
    }

    console.log('✅ Correction terminée!')
    console.log('💡 Les utilisateurs peuvent maintenant se ré-enrôler avec le même enrollment ID')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixEnrollmentAccounts()
