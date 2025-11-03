/**
 * Script pour créer les comptes utilisateurs via Better Auth API
 * À exécuter APRÈS le seed Prisma
 * 
 * Usage: npx tsx scripts/create-auth-accounts.ts
 */

import { PrismaClient } from '../app/generated/prisma'

const prisma = new PrismaClient()

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function createAuthAccount(email: string, password: string, name: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      console.log(`⚠️  ${email}: ${data.error?.message || data.message || 'Erreur'}`)
      return false
    }

    console.log(`✅ Compte créé: ${email}`)
    return true
  } catch (error: any) {
    console.error(`❌ Erreur pour ${email}:`, error.message || error)
    return false
  }
}

async function main() {
  console.log('🔐 Création des comptes Better Auth...\n')
  console.log(`📡 API URL: ${BASE_URL}\n`)

  // Récupérer tous les utilisateurs de la base
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
    },
  })

  console.log(`👥 ${users.length} utilisateurs trouvés dans la base\n`)

  const password = 'password123'

  for (const user of users) {
    await createAuthAccount(user.email, password, user.name)
    // Petit délai pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n✅ Création des comptes terminée!')
  console.log('\n📧 Tous les comptes utilisent le mot de passe: password123')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
