/**
 * Script pour vérifier les comptes BetterAuth
 * Usage: npx tsx scripts/check-auth-accounts.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Vérification des comptes...\n')

  // Compter les utilisateurs
  const usersCount = await prisma.user.count()
  console.log(`👥 Utilisateurs dans la table User: ${usersCount}`)

  // Compter les comptes BetterAuth
  const accountsCount = await prisma.account.count()
  console.log(`🔐 Comptes dans la table Account: ${accountsCount}`)

  // Compter les sessions
  const sessionsCount = await prisma.session.count()
  console.log(`📝 Sessions actives: ${sessionsCount}\n`)

  // Lister les utilisateurs avec leurs comptes
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accounts: {
        select: {
          id: true,
          providerId: true,
        }
      }
    }
  })

  console.log('📋 Détails des utilisateurs:\n')
  for (const user of users) {
    const hasAccount = user.accounts.length > 0
    const status = hasAccount ? '✅' : '❌'
    console.log(`${status} ${user.email} (${user.role})`)
    if (hasAccount) {
      console.log(`   └─ Account ID: ${user.accounts[0].id}`)
    } else {
      console.log(`   └─ ⚠️  Pas de compte BetterAuth`)
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
