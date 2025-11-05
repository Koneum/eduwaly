/**
 * Script pour corriger le compte superadmin
 * Supprime et recrée le compte avec le bon hash de mot de passe
 * 
 * Usage: npx tsx scripts/fix-superadmin.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const SUPERADMIN_EMAIL = 'superadmin@saas.com'
const SUPERADMIN_PASSWORD = 'password123'

async function main() {
  console.log('🔧 Correction du compte Super Admin...\n')
  console.log(`📡 API URL: ${BASE_URL}`)
  console.log(`📧 Email: ${SUPERADMIN_EMAIL}`)
  console.log(`🔑 Mot de passe: ${SUPERADMIN_PASSWORD}\n`)

  // Étape 1: Vérifier si l'utilisateur existe
  const existingUser = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL }
  })

  if (existingUser) {
    console.log('👤 Utilisateur trouvé, suppression...')
    
    // Supprimer les sessions
    await prisma.session.deleteMany({
      where: { userId: existingUser.id }
    })
    
    // Supprimer les comptes
    await prisma.account.deleteMany({
      where: { userId: existingUser.id }
    })
    
    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: existingUser.id }
    })
    
    console.log('✅ Ancien compte supprimé\n')
  } else {
    console.log('ℹ️  Aucun compte existant\n')
  }

  // Étape 2: Créer le nouveau compte via BetterAuth API
  console.log('🔐 Création du nouveau compte...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: SUPERADMIN_EMAIL,
        password: SUPERADMIN_PASSWORD,
        name: 'Super Admin',
      }),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      console.error('❌ Erreur lors de la création:', data.error?.message || data.message || 'Erreur inconnue')
      process.exit(1)
    }

    console.log('✅ Compte créé via BetterAuth\n')

    // Étape 3: Mettre à jour le rôle
    const newUser = await prisma.user.findUnique({
      where: { email: SUPERADMIN_EMAIL }
    })

    if (!newUser) {
      console.error('❌ Utilisateur non trouvé après création')
      process.exit(1)
    }

    await prisma.user.update({
      where: { id: newUser.id },
      data: {
        role: 'SUPER_ADMIN',
        schoolId: null,
      }
    })

    console.log('✅ Rôle mis à jour: SUPER_ADMIN')
    
    // Vérifier le compte Account
    const account = await prisma.account.findFirst({
      where: { userId: newUser.id }
    })

    if (account) {
      console.log('✅ Compte Account créé avec hash valide')
    } else {
      console.log('⚠️  Aucun compte Account trouvé')
    }

    console.log('\n🎉 Super Admin prêt!')
    console.log(`\n📧 Email: ${SUPERADMIN_EMAIL}`)
    console.log(`🔑 Mot de passe: ${SUPERADMIN_PASSWORD}`)
    console.log('\n✅ Vous pouvez maintenant vous connecter!')

  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
