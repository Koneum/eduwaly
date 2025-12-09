// Import dynamique pour contourner les problèmes ESM
const { PrismaClient } = await import('../lib/generated/prisma/client.ts')
const { PrismaPg } = await import('@prisma/adapter-pg')
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'
import 'dotenv/config'

// Pour le seed, utiliser DIRECT_DATABASE_URL (connexion directe sans Accelerate)
const directUrl = process.env.DIRECT_DATABASE_URL
if (!directUrl) {
  console.error('❌ DIRECT_DATABASE_URL manquant dans .env')
  console.error('   Ajoutez l\'URL directe de votre base PostgreSQL (sans Accelerate)')
  console.error('   Exemple: DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db"')
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: directUrl })
const prisma = new PrismaClient({ adapter })
const scryptAsync = promisify(scrypt)

// Helper pour hasher un mot de passe avec scrypt (comme Better Auth)
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

// Helper pour générer un ID unique
function generateId() {
  return randomBytes(16).toString('hex')
}

// Helper pour créer un utilisateur avec Better Auth scrypt hashing
async function createUserWithBetterAuth(data) {
  const hashedPassword = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      emailVerified: true,
      accounts: {
        create: {
          id: generateId(),
          providerId: 'credential',
          accountId: data.email,
          password: hashedPassword,
        },
      },
    },
    include: { accounts: true },
  })

  return user
}

async function main() {
  console.log('🌱 Début du seeding...')

  // ========================================
  // NETTOYAGE DE LA BASE
  // ========================================
  console.log('🧹 Nettoyage de la base...')
  
  // Ordre important: supprimer les dépendances d'abord
  await prisma.studentPayment.deleteMany()
  await prisma.scholarship.deleteMany()
  await prisma.feeStructure.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.homework.deleteMany()
  await prisma.evaluation.deleteMany()
  await prisma.absence.deleteMany()
  await prisma.student.deleteMany()
  await prisma.parent.deleteMany()
  await prisma.enseignant.deleteMany()
  await prisma.emploiDuTemps.deleteMany()
  await prisma.module.deleteMany()
  await prisma.filiere.deleteMany()
  await prisma.anneeUniversitaire.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.planComparisonValue.deleteMany()
  await prisma.comparisonRow.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.parametre.deleteMany()
  await prisma.userPermission.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.school.deleteMany()
  
  console.log('✓ Base nettoyée')

  // ========================================
  // 1. SUPER ADMIN (mdp: Saas@2025)
  // ========================================
  console.log('👤 Création Super Admin...')
  await createUserWithBetterAuth({
    email: 'superadmin@eduwaly.com',
    password: 'Saas@2025',
    name: 'Super Administrateur',
    role: 'SUPER_ADMIN',
  })

  // ========================================
  // 2. PLANS D'ABONNEMENT (5 par structure)
  // ========================================
  console.log('📦 Création des Plans...')
  
  // --- PLANS LYCÉE ---
  const lyceeEssai = await prisma.plan.create({
    data: {
      name: 'lycee-essai',
      displayName: 'Lycée - Essai Gratuit',
      price: 0,
      interval: 'MONTHLY',
      maxStudents: 50,
      maxTeachers: 5,
      description: 'Essai gratuit 14 jours pour les lycées',
      features: JSON.stringify(['Gestion basique des élèves', 'Emploi du temps', 'Notes', 'Support email']),
      isActive: true,
      isPopular: false,
      schoolType: 'HIGH_SCHOOL',
    },
  })

  const lyceeStarter = await prisma.plan.create({
    data: {
      name: 'lycee-starter',
      displayName: 'Lycée - Starter',
      price: 10000,
      interval: 'MONTHLY',
      maxStudents: 200,
      maxTeachers: 15,
      description: 'Pour les petits lycées',
      features: JSON.stringify(['Gestion complète des élèves', 'Emploi du temps', 'Notes et bulletins', 'Communication parents', 'Support email prioritaire']),
      isActive: true,
      isPopular: false,
      schoolType: 'HIGH_SCHOOL',
    },
  })

  const lyceeBasic = await prisma.plan.create({
    data: {
      name: 'lycee-basic',
      displayName: 'Lycée - Basic',
      price: 25000,
      interval: 'MONTHLY',
      maxStudents: 500,
      maxTeachers: 30,
      description: 'Pour les lycées moyens',
      features: JSON.stringify(['Toutes les fonctionnalités Starter', 'Gestion financière', 'Rapports avancés', 'API accès limité', 'Support téléphone']),
      isActive: true,
      isPopular: true,
      schoolType: 'HIGH_SCHOOL',
    },
  })

  const lyceePremium = await prisma.plan.create({
    data: {
      name: 'lycee-premium',
      displayName: 'Lycée - Premium',
      price: 45000,
      interval: 'MONTHLY',
      maxStudents: 2000,
      maxTeachers: 100,
      description: 'Pour les grands lycées',
      features: JSON.stringify(['Toutes les fonctionnalités Basic', 'Multi-campus', 'Intégrations tierces', 'API illimité', 'Manager dédié', 'Formation incluse']),
      isActive: true,
      isPopular: false,
      schoolType: 'HIGH_SCHOOL',
    },
  })

  const lyceeCustom = await prisma.plan.create({
    data: {
      name: 'lycee-custom',
      displayName: 'Lycée - Sur Mesure',
      price: 0,
      interval: 'MONTHLY',
      maxStudents: 99999,
      maxTeachers: 9999,
      description: 'Solution personnalisée - Contactez-nous',
      features: JSON.stringify(['Toutes les fonctionnalités Premium', 'Personnalisation complète', 'Développement sur mesure', 'SLA garantie', 'Support 24/7']),
      isActive: true,
      isPopular: false,
      schoolType: 'HIGH_SCHOOL',
    },
  })

  // --- PLANS UNIVERSITÉ ---
  const uniEssai = await prisma.plan.create({
    data: {
      name: 'universite-essai',
      displayName: 'Université - Essai Gratuit',
      price: 0,
      interval: 'MONTHLY',
      maxStudents: 100,
      maxTeachers: 10,
      description: 'Essai gratuit 14 jours pour les universités',
      features: JSON.stringify(['Gestion basique des étudiants', 'Emploi du temps', 'Notes', 'Support email']),
      isActive: true,
      isPopular: false,
      schoolType: 'UNIVERSITY',
    },
  })

  const uniStarter = await prisma.plan.create({
    data: {
      name: 'universite-starter',
      displayName: 'Université - Starter',
      price: 20000,
      interval: 'MONTHLY',
      maxStudents: 500,
      maxTeachers: 30,
      description: 'Pour les petites universités',
      features: JSON.stringify(['Gestion complète des étudiants', 'Filières et modules', 'Emploi du temps', 'Notes et relevés', 'Communication', 'Support prioritaire']),
      isActive: true,
      isPopular: false,
      schoolType: 'UNIVERSITY',
    },
  })

  const uniBasic = await prisma.plan.create({
    data: {
      name: 'universite-basic',
      displayName: 'Université - Basic',
      price: 40000,
      interval: 'MONTHLY',
      maxStudents: 2000,
      maxTeachers: 100,
      description: 'Pour les universités moyennes',
      features: JSON.stringify(['Toutes les fonctionnalités Starter', 'Gestion financière avancée', 'Bourses et scholarships', 'Rapports analytiques', 'API accès', 'Support téléphone']),
      isActive: true,
      isPopular: true,
      schoolType: 'UNIVERSITY',
    },
  })

  const uniPremium = await prisma.plan.create({
    data: {
      name: 'universite-premium',
      displayName: 'Université - Premium',
      price: 75000,
      interval: 'MONTHLY',
      maxStudents: 10000,
      maxTeachers: 500,
      description: 'Pour les grandes universités',
      features: JSON.stringify(['Toutes les fonctionnalités Basic', 'Multi-campus', 'Intégrations ERP', 'API illimité', 'Manager dédié', 'Formation sur site']),
      isActive: true,
      isPopular: false,
      schoolType: 'UNIVERSITY',
    },
  })

  const uniCustom = await prisma.plan.create({
    data: {
      name: 'universite-custom',
      displayName: 'Université - Sur Mesure',
      price: 0,
      interval: 'MONTHLY',
      maxStudents: 99999,
      maxTeachers: 9999,
      description: 'Solution personnalisée - Contactez-nous',
      features: JSON.stringify(['Toutes les fonctionnalités Premium', 'Personnalisation complète', 'Développement sur mesure', 'SLA garantie', 'Support 24/7', 'Infrastructure dédiée']),
      isActive: true,
      isPopular: false,
      schoolType: 'UNIVERSITY',
    },
  })

  // ========================================
  // 3. ÉCOLE TEST #1: UNIVERSITÉ (Mali)
  // ========================================
  console.log('🏛️ Création Université des Sciences de Bamako...')
  
  const school1 = await prisma.school.create({
    data: {
      name: 'Université des Sciences de Bamako',
      subdomain: 'usb',
      shortName: 'USB',
      email: 'contact@usb.ml',
      phone: '+223 20 22 33 44',
      address: 'Avenue de l\'Indépendance, Bamako, Mali',
      schoolType: 'UNIVERSITY',
      isActive: true,
      subscription: {
        create: {
          planId: uniPremium.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  // Admin Université
  console.log('  👤 Admin USB...')
  const admin1User = await createUserWithBetterAuth({
    email: 'admin@usb.ml',
    password: 'Admin@2025',
    name: 'Ibrahima Traoré',
    role: 'SCHOOL_ADMIN',
  })
  await prisma.user.update({
    where: { id: admin1User.id },
    data: { schoolId: school1.id },
  })

  // Année universitaire
  const annee = await prisma.anneeUniversitaire.create({
    data: {
      schoolId: school1.id,
      annee: '2024-2025',
      dateDebut: new Date('2024-09-01'),
      dateFin: new Date('2025-06-30'),
      estActive: true,
    },
  })

  // Filières
  const filiereL1 = await prisma.filiere.create({
    data: {
      nom: 'Licence 1 Informatique',
      schoolId: school1.id,
    },
  })

  const filiereL2 = await prisma.filiere.create({
    data: {
      nom: 'Licence 2 Informatique',
      schoolId: school1.id,
    },
  })

  // Modules
  await prisma.module.createMany({
    data: [
      { nom: 'Algorithmes', type: 'CM', vh: 60, schoolId: school1.id, filiereId: filiereL1.id },
      { nom: 'Programmation C', type: 'TP', vh: 80, schoolId: school1.id, filiereId: filiereL1.id },
      { nom: 'Mathématiques', type: 'CM', vh: 60, schoolId: school1.id, filiereId: filiereL1.id },
    ],
  })

  // Enseignant Université
  console.log('  👤 Prof USB...')
  const teacher1User = await createUserWithBetterAuth({
    email: 'prof@usb.ml',
    password: 'Prof@2025',
    name: 'Dr. Amadou Diallo',
    role: 'TEACHER',
  })
  await prisma.user.update({
    where: { id: teacher1User.id },
    data: { schoolId: school1.id },
  })
  await prisma.enseignant.create({
    data: {
      nom: 'Diallo',
      prenom: 'Amadou',
      titre: 'Docteur',
      telephone: '+223 76 12 34 56',
      email: 'prof@usb.ml',
      type: 'PERMANENT',
      grade: 'MAITRE_ASSISTANT',
      schoolId: school1.id,
      userId: teacher1User.id,
    },
  })

  // Étudiant Université
  console.log('  👤 Étudiant USB...')
  const student1User = await createUserWithBetterAuth({
    email: 'etudiant@usb.ml',
    password: 'Etudiant@2025',
    name: 'Fatoumata Keita',
    role: 'STUDENT',
  })
  await prisma.user.update({
    where: { id: student1User.id },
    data: { schoolId: school1.id },
  })
  const student1 = await prisma.student.create({
    data: {
      userId: student1User.id,
      schoolId: school1.id,
      filiereId: filiereL1.id,
      studentNumber: 'USB-2024-001',
      enrollmentId: 'ENR-USB-001',
      niveau: 'L1',
      dateOfBirth: new Date('2002-05-15'),
      courseSchedule: 'DAY',
      isEnrolled: true,
    },
  })

  // Parent Université
  console.log('  👤 Parent USB...')
  const parent1User = await createUserWithBetterAuth({
    email: 'parent@usb.ml',
    password: 'Parent@2025',
    name: 'Moussa Keita',
    role: 'PARENT',
  })
  await prisma.user.update({
    where: { id: parent1User.id },
    data: { schoolId: school1.id },
  })
  await prisma.parent.create({
    data: {
      userId: parent1User.id,
      enrollmentId: 'ENR-USB-001',
      phone: '+223 66 78 90 12',
      isEnrolled: true,
      students: { connect: { id: student1.id } },
    },
  })

  // ========================================
  // 4. ÉCOLE TEST #2: LYCÉE (Mali)
  // ========================================
  console.log('🏫 Création Lycée Prosper Kamara...')
  
  const school2 = await prisma.school.create({
    data: {
      name: 'Lycée Prosper Kamara',
      subdomain: 'lpk',
      shortName: 'LPK',
      email: 'contact@lpk.ml',
      phone: '+223 20 33 44 55',
      address: 'Rue du Commerce, Sikasso, Mali',
      schoolType: 'HIGH_SCHOOL',
      isActive: true,
      subscription: {
        create: {
          planId: lyceePremium.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  // Admin Lycée
  console.log('  👤 Admin LPK...')
  const admin2User = await createUserWithBetterAuth({
    email: 'admin@lpk.ml',
    password: 'Admin@2025',
    name: 'Mariam Coulibaly',
    role: 'SCHOOL_ADMIN',
  })
  await prisma.user.update({
    where: { id: admin2User.id },
    data: { schoolId: school2.id },
  })

  // Séries (pour lycée)
  const serieS = await prisma.filiere.create({
    data: {
      nom: 'Terminale S',
      schoolId: school2.id,
    },
  })

  const serieL = await prisma.filiere.create({
    data: {
      nom: 'Terminale L',
      schoolId: school2.id,
    },
  })

  // Enseignant Lycée (Prof principal)
  console.log('  👤 Prof LPK...')
  const teacher2User = await createUserWithBetterAuth({
    email: 'prof@lpk.ml',
    password: 'Prof@2025',
    name: 'Mamadou Sangaré',
    role: 'TEACHER',
  })
  await prisma.user.update({
    where: { id: teacher2User.id },
    data: { schoolId: school2.id },
  })
  await prisma.enseignant.create({
    data: {
      nom: 'Sangaré',
      prenom: 'Mamadou',
      titre: 'Monsieur',
      telephone: '+223 66 77 88 99',
      email: 'prof@lpk.ml',
      type: 'PERMANENT',
      grade: 'PROFESSEUR',
      // isPrincipal: true, // Prof principal - décommenter après prisma generate
      schoolId: school2.id,
      userId: teacher2User.id,
    },
  })

  // Élève Lycée
  console.log('  👤 Élève LPK...')
  const eleve1User = await createUserWithBetterAuth({
    email: 'eleve@lpk.ml',
    password: 'Eleve@2025',
    name: 'Aminata Sidibé',
    role: 'STUDENT',
  })
  await prisma.user.update({
    where: { id: eleve1User.id },
    data: { schoolId: school2.id },
  })
  const eleve1 = await prisma.student.create({
    data: {
      userId: eleve1User.id,
      schoolId: school2.id,
      filiereId: serieS.id,
      studentNumber: 'LPK-2024-001',
      enrollmentId: 'ENR-LPK-001',
      niveau: 'Terminale',
      dateOfBirth: new Date('2006-08-20'),
      courseSchedule: 'DAY',
      isEnrolled: true,
    },
  })

  // Parent Lycée
  console.log('  👤 Parent LPK...')
  const parent2User = await createUserWithBetterAuth({
    email: 'parent@lpk.ml',
    password: 'Parent@2025',
    name: 'Bakary Sidibé',
    role: 'PARENT',
  })
  await prisma.user.update({
    where: { id: parent2User.id },
    data: { schoolId: school2.id },
  })
  await prisma.parent.create({
    data: {
      userId: parent2User.id,
      enrollmentId: 'ENR-LPK-001',
      phone: '+223 65 43 21 09',
      isEnrolled: true,
      students: { connect: { id: eleve1.id } },
    },
  })

  // ========================================
  // FIN DU SEEDING
  // ========================================
  console.log('')
  console.log('✅ Seeding terminé avec succès!')
  console.log('')
  console.log('📋 Comptes créés:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👑 Super Admin:    superadmin@eduwaly.com / Saas@2025')
  console.log('')
  console.log('🏛️ Université des Sciences de Bamako (USB):')
  console.log('   Admin:          admin@usb.ml / Admin@2025')
  console.log('   Professeur:     prof@usb.ml / Prof@2025')
  console.log('   Étudiant:       etudiant@usb.ml / Etudiant@2025')
  console.log('   Parent:         parent@usb.ml / Parent@2025')
  console.log('')
  console.log('🏫 Lycée Prosper Kamara (LPK):')
  console.log('   Admin:          admin@lpk.ml / Admin@2025')
  console.log('   Professeur:     prof@lpk.ml / Prof@2025')
  console.log('   Élève:          eleve@lpk.ml / Eleve@2025')
  console.log('   Parent:         parent@lpk.ml / Parent@2025')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
