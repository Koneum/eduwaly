/**
 * Script pour synchroniser les utilisateurs existants avec BetterAuth
 * Crée les entrées Account manquantes
 * 
 * Usage: npx tsx scripts/sync-auth-accounts.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'password123'

async function syncUser(userId: string, email: string) {
  try {
    // Vérifier si le compte existe déjà
    const existingAccount = await prisma.account.findFirst({
      where: { userId }
    })

    if (existingAccount) {
      console.log(`⏭️  ${email}: Compte déjà synchronisé`)
      return true
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    // Créer le compte BetterAuth
    await prisma.account.create({
      data: {
        id: nanoid(),
        accountId: nanoid(),
        providerId: 'credential',
        userId: userId,
        password: hashedPassword,
      }
    })

    console.log(`✅ ${email}: Compte synchronisé`)
    return true
  } catch (error) {
    console.error(`❌ ${email}: Erreur -`, error instanceof Error ? error.message : String(error))
    return false
  }
}

async function main() {
  console.log('🔄 Synchronisation des comptes avec BetterAuth...\n')
  console.log(`🔑 Mot de passe par défaut: ${DEFAULT_PASSWORD}\n`)

  // Récupérer tous les utilisateurs
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    }
  })

  console.log(`👥 ${users.length} utilisateurs trouvés\n`)

  let successCount = 0
  for (const user of users) {
    const success = await syncUser(user.id, user.email)
    if (success) successCount++
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`\n✅ Synchronisation terminée: ${successCount}/${users.length} comptes`)
  console.log(`\n📧 Tous les comptes utilisent le mot de passe: ${DEFAULT_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
