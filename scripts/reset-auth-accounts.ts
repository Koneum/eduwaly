/**
 * Script pour réinitialiser et recréer les comptes BetterAuth
 * 1. Supprime tous les comptes Account existants
 * 2. Supprime tous les utilisateurs User existants
 * 3. Recrée les utilisateurs via l'API BetterAuth
 * 
 * Usage: npx tsx scripts/reset-auth-accounts.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const DEFAULT_PASSWORD = 'password123'

// Utilisateurs à créer
const users = [
  {
    email: 'superadmin@saas.com',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    schoolId: null,
  },
  {
    email: 'admin@excellence-dakar.sn',
    name: 'Admin Excellence',
    role: 'SCHOOL_ADMIN',
    schoolName: 'Excellence Dakar',
  },
  {
    email: 'teacher@excellence-dakar.sn',
    name: 'Prof Diallo',
    role: 'TEACHER',
    schoolName: 'Excellence Dakar',
  },
  {
    email: 'student1@excellence-dakar.sn',
    name: 'Fatou Sall',
    role: 'STUDENT',
    schoolName: 'Excellence Dakar',
  },
  {
    email: 'student2@excellence-dakar.sn',
    name: 'Moussa Ndiaye',
    role: 'STUDENT',
    schoolName: 'Excellence Dakar',
  },
  {
    email: 'parent@excellence-dakar.sn',
    name: 'Parent Sall',
    role: 'PARENT',
    schoolName: 'Excellence Dakar',
  },
  {
    email: 'admin@moderne-abidjan.ci',
    name: 'Admin Moderne',
    role: 'SCHOOL_ADMIN',
    schoolName: 'Moderne Abidjan',
  },
]

async function createUserViaBetterAuth(email: string, password: string, name: string, role: string, schoolId: string | null) {
  try {
    // Créer le compte via BetterAuth API
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
      return null
    }

    // Récupérer l'utilisateur créé
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log(`⚠️  ${email}: Utilisateur non trouvé après création`)
      return null
    }

    // Mettre à jour le rôle et schoolId
    type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: role as UserRole,
        schoolId: schoolId,
      }
    })

    console.log(`✅ ${email} (${role})`)
    return user
  } catch (error) {
    console.error(`❌ ${email}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

async function main() {
  console.log('🔄 Réinitialisation des comptes BetterAuth...\n')
  console.log(`📡 API URL: ${BASE_URL}`)
  console.log(`🔑 Mot de passe: ${DEFAULT_PASSWORD}\n`)

  // Étape 1: Supprimer tous les comptes et sessions
  console.log('🗑️  Suppression des comptes existants...')
  await prisma.session.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.user.deleteMany({})
  console.log('✅ Comptes supprimés\n')

  // Étape 2: Récupérer les écoles
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
    }
  })

  const schoolMap = new Map(schools.map(s => [s.name, s.id]))

  // Étape 3: Créer les utilisateurs via BetterAuth
  console.log('👥 Création des utilisateurs...\n')
  
  let successCount = 0
  for (const userData of users) {
    const schoolId = userData.schoolName ? schoolMap.get(userData.schoolName) || null : null
    
    const user = await createUserViaBetterAuth(
      userData.email,
      DEFAULT_PASSWORD,
      userData.name,
      userData.role,
      schoolId
    )
    
    if (user) successCount++
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log(`\n✅ Création terminée: ${successCount}/${users.length} comptes`)
  console.log(`\n📧 Tous les comptes utilisent le mot de passe: ${DEFAULT_PASSWORD}`)
  console.log('\n🎉 Vous pouvez maintenant vous connecter!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
