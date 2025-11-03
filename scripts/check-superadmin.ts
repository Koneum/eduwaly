/**
 * Script pour vérifier l'état du compte Super Admin
 * 
 * Usage: npx tsx scripts/check-superadmin.ts
 */

import { PrismaClient } from '../app/generated/prisma'

const prisma = new PrismaClient()
const SUPERADMIN_EMAIL = 'superadmin@saas.com'

async function main() {
  console.log('🔍 Vérification du compte Super Admin...\n')
  console.log(`📧 Email: ${SUPERADMIN_EMAIL}\n`)

  // Vérifier l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      schoolId: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
    }
  })

  if (!user) {
    console.log('❌ Utilisateur non trouvé dans la table User')
    console.log('\n💡 Solution: Exécutez `npx tsx scripts/fix-superadmin.ts`')
    return
  }

  console.log('✅ Utilisateur trouvé:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Nom: ${user.name}`)
  console.log(`   Rôle: ${user.role}`)
  console.log(`   School ID: ${user.schoolId || 'null (correct pour SUPER_ADMIN)'}`)
  console.log(`   Actif: ${user.isActive}`)
  console.log(`   Email vérifié: ${user.emailVerified}`)
  console.log(`   Créé le: ${user.createdAt.toLocaleString('fr-FR')}\n`)

  // Vérifier le compte Account
  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      accountId: true,
      providerId: true,
      password: true,
      createdAt: true,
    }
  })

  if (accounts.length === 0) {
    console.log('❌ Aucun compte Account trouvé')
    console.log('   Le compte User existe mais pas de Account BetterAuth')
    console.log('\n💡 Solution: Exécutez `npx tsx scripts/fix-superadmin.ts`')
    return
  }

  console.log(`✅ ${accounts.length} compte(s) Account trouvé(s):`)
  accounts.forEach((account, index) => {
    console.log(`\n   Compte ${index + 1}:`)
    console.log(`   ID: ${account.id}`)
    console.log(`   Account ID: ${account.accountId}`)
    console.log(`   Provider: ${account.providerId}`)
    console.log(`   Hash présent: ${account.password ? 'Oui' : 'Non'}`)
    console.log(`   Hash valide: ${account.password && account.password.startsWith('$2') ? 'Probablement' : 'Non (format invalide)'}`)
    console.log(`   Créé le: ${account.createdAt.toLocaleString('fr-FR')}`)
  })

  // Vérifier les sessions
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
    }
  })

  console.log(`\n📊 Sessions actives: ${sessions.length}`)
  if (sessions.length > 0) {
    sessions.forEach((session, index) => {
      const isExpired = new Date(session.expiresAt) < new Date()
      console.log(`   Session ${index + 1}: ${isExpired ? '❌ Expirée' : '✅ Active'} (expire le ${new Date(session.expiresAt).toLocaleString('fr-FR')})`)
    })
  }

  // Vérifier si le rôle est correct
  if (user.role !== 'SUPER_ADMIN') {
    console.log(`\n⚠️  Rôle incorrect: ${user.role} (devrait être SUPER_ADMIN)`)
    console.log('💡 Solution: Exécutez `npx tsx scripts/fix-superadmin.ts`')
    return
  }

  // Vérifier si le compte a un hash valide
  const validAccount = accounts.find(a => a.password && a.password.startsWith('$2'))
  if (!validAccount) {
    console.log('\n❌ Aucun hash de mot de passe valide trouvé')
    console.log('💡 Solution: Exécutez `npx tsx scripts/fix-superadmin.ts`')
    return
  }

  console.log('\n✅ Compte Super Admin configuré correctement!')
  console.log('\n📝 Informations de connexion:')
  console.log(`   Email: ${SUPERADMIN_EMAIL}`)
  console.log(`   Mot de passe: password123`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
