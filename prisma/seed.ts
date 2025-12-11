import { PrismaClient } from '../lib/generated/prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'
import 'dotenv/config'

// Types pour les rôles
type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT' | 'PARENT'

// Prisma avec Accelerate
const prisma = new PrismaClient().$extends(withAccelerate())
const scryptAsync = promisify(scrypt)

// Helper pour hasher un mot de passe avec scrypt (comme Better Auth)
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

// Helper pour créer un utilisateur avec Better Auth scrypt hashing
async function createUserWithBetterAuth(data: {
  email: string
  password: string
  name: string
  role: UserRole
  schoolId?: string
}) {
  const hashedPassword = await hashPassword(data.password)
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      schoolId: data.schoolId,
      isActive: true,
      emailVerified: true,
    },
  })

  await prisma.account.create({
    data: {
      id: randomBytes(16).toString('hex'),
      userId: user.id,
      accountId: randomBytes(16).toString('hex'),
      providerId: 'credential',
      password: hashedPassword,
    },
  })

  return user
}

async function main() {
  console.log('🌱 Début du seeding...')

  // Note: Les deleteMany sont commentés car la DB a été réinitialisée avec --force-reset
  // Si vous relancez le seed sans --force-reset, décommentez ces lignes
  /*
  await prisma.pollResponse.deleteMany()
  await prisma.pollOption.deleteMany()
  await prisma.poll.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.studentPayment.deleteMany()
  await prisma.scholarship.deleteMany()
  await prisma.feeStructure.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.homework.deleteMany()
  await prisma.evaluation.deleteMany()
  await prisma.absence.deleteMany()
  await prisma.student.deleteMany()
  await prisma.parent.deleteMany()
  await prisma.issueReport.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.planComparisonValue.deleteMany()
  await prisma.comparisonRow.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.emploiDuTemps.deleteMany()
  await prisma.enseignant.deleteMany()
  await prisma.module.deleteMany()
  await prisma.filiere.deleteMany()
  await prisma.anneeUniversitaire.deleteMany()
  await prisma.parametre.deleteMany()
  await prisma.userPermission.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.school.deleteMany()
  */

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
  // 2. PLANS D'ABONNEMENT - 4 par structure + 1 Custom
  // ========================================
  console.log('💳 Création des plans...')

  // Modules par niveau de plan
  const MODULES_ESSAI = ['etudiants', 'enseignants', 'emploiDuTemps', 'notes']
  const MODULES_STARTER = [...MODULES_ESSAI, 'messagerie', 'vieScolaire']
  const MODULES_BASIC = [...MODULES_STARTER, 'devoirs', 'documents']
  const MODULES_PREMIUM = [...MODULES_BASIC, 'facturation', 'rapports']
  const MODULES_CUSTOM = [...MODULES_PREMIUM, 'rolesPerso', 'multiEtablissement', 'apiAccess', 'supportPrioritaire']

  // ============ PLANS LYCÉE (4 + Custom) ============
  const lyceeEssai = await prisma.plan.create({
    data: {
      name: 'Lycée - Essai Gratuit',
      description: 'Essai gratuit 14 jours pour lycées',
      price: 0,
      interval: 'monthly',
      maxStudents: 50,
      maxTeachers: 5,
      features: JSON.stringify([
        'Jusqu\'à 50 élèves',
        'Jusqu\'à 5 enseignants',
        'Étudiants (Liste, Inscriptions, Filières, Groupes)',
        'Enseignants (Liste, Emplois assignés)',
        'Emploi du temps (Planning, Salles, Années)',
        'Notes & Évaluations (Saisie, Bulletins, Périodes)'
      ]),
      modulesIncluded: JSON.stringify(MODULES_ESSAI),
      isActive: true,
    },
  })

  const lyceeStarter = await prisma.plan.create({
    data: {
      name: 'Lycée - Starter',
      description: 'Pour petits lycées (< 200 élèves)',
      price: 10000,
      interval: 'monthly',
      maxStudents: 200,
      maxTeachers: 15,
      features: JSON.stringify([
        'Jusqu\'à 200 élèves',
        'Jusqu\'à 15 enseignants',
        'Tous modules Essai Gratuit',
        'Messagerie (Annonces, Sondages)',
        'Vie scolaire (Absences, Incidents, Agenda, RDV parents)',
        'Support email'
      ]),
      modulesIncluded: JSON.stringify(MODULES_STARTER),
      isActive: true,
    },
  })

  const lyceeBasic = await prisma.plan.create({
    data: {
      name: 'Lycée - Basic',
      description: 'Pour lycées moyens (< 500 élèves)',
      price: 25000,
      interval: 'monthly',
      maxStudents: 500,
      maxTeachers: 35,
      features: JSON.stringify([
        'Jusqu\'à 500 élèves',
        'Jusqu\'à 35 enseignants',
        'Tous modules Starter',
        'Devoirs (Liste, Soumissions)',
        'Documents (Ressources, Templates PDF)',
        'Support chat'
      ]),
      modulesIncluded: JSON.stringify(MODULES_BASIC),
      isActive: true,
    },
  })

  const lyceePremium = await prisma.plan.create({
    data: {
      name: 'Lycée - Premium',
      description: 'Pour grands lycées (< 1000 élèves)',
      price: 45000,
      interval: 'monthly',
      maxStudents: 1000,
      maxTeachers: 60,
      features: JSON.stringify([
        'Jusqu\'à 1000 élèves',
        'Jusqu\'à 60 enseignants',
        'Tous modules Basic',
        'Facturation (Paiements, Frais, Bourses)',
        'Rapports (Statistiques, Export)',
        'Paiement mobile (OrangeMoney/MoovMoney)',
        'Support prioritaire 24/7'
      ]),
      modulesIncluded: JSON.stringify(MODULES_PREMIUM),
      isActive: true,
      isPopular: true,
    },
  })

  const lyceeCustom = await prisma.plan.create({
    data: {
      name: 'Lycée - Sur Mesure',
      description: 'Plan personnalisé pour très grands lycées',
      price: 0,
      interval: 'monthly',
      maxStudents: -1,
      maxTeachers: -1,
      features: JSON.stringify([
        'Élèves illimités',
        'Enseignants illimités',
        'Tous modules Premium',
        'Rôles personnalisés',
        'Multi-établissements',
        'Accès API',
        'Support prioritaire 24/7',
        'Formation sur site',
        'Gestionnaire de compte dédié'
      ]),
      modulesIncluded: JSON.stringify(MODULES_CUSTOM),
      isActive: true,
    },
  })

  // ============ PLANS UNIVERSITÉ (4 + Custom) ============
  const uniEssai = await prisma.plan.create({
    data: {
      name: 'Université - Essai Gratuit',
      description: 'Essai gratuit 14 jours pour universités',
      price: 0,
      interval: 'monthly',
      maxStudents: 100,
      maxTeachers: 10,
      features: JSON.stringify([
        'Jusqu\'à 100 étudiants',
        'Jusqu\'à 10 enseignants',
        'Étudiants (Liste, Inscriptions, Filières, Groupes)',
        'Enseignants (Liste, Emplois assignés)',
        'Emploi du temps (Planning, Salles, Années)',
        'Notes & Évaluations (Saisie, Bulletins, Périodes)'
      ]),
      modulesIncluded: JSON.stringify(MODULES_ESSAI),
      isActive: true,
      schoolType: 'UNIVERSITY',
    },
  })

  const uniStarter = await prisma.plan.create({
    data: {
      name: 'Université - Starter',
      description: 'Pour petites universités (< 300 étudiants)',
      price: 20000,
      interval: 'monthly',
      maxStudents: 300,
      maxTeachers: 20,
      features: JSON.stringify([
        'Jusqu\'à 300 étudiants',
        'Jusqu\'à 20 enseignants',
        'Tous modules Essai Gratuit',
        'Messagerie (Annonces, Sondages)',
        'Vie scolaire (Absences, Incidents, Agenda)',
        'Support email'
      ]),
      modulesIncluded: JSON.stringify(MODULES_STARTER),
      isActive: true,
      schoolType: 'UNIVERSITY',
    },
  })

  const uniBasic = await prisma.plan.create({
    data: {
      name: 'Université - Basic',
      description: 'Pour universités moyennes (< 800 étudiants)',
      price: 40000,
      interval: 'monthly',
      maxStudents: 800,
      maxTeachers: 50,
      features: JSON.stringify([
        'Jusqu\'à 800 étudiants',
        'Jusqu\'à 50 enseignants',
        'Tous modules Starter',
        'Devoirs (Liste, Soumissions)',
        'Documents (Ressources, Templates PDF)',
        'Support chat'
      ]),
      modulesIncluded: JSON.stringify(MODULES_BASIC),
      isActive: true,
      schoolType: 'UNIVERSITY',
    },
  })

  const uniPremium = await prisma.plan.create({
    data: {
      name: 'Université - Premium',
      description: 'Pour grandes universités (< 2000 étudiants)',
      price: 75000,
      interval: 'monthly',
      maxStudents: 2000,
      maxTeachers: 100,
      features: JSON.stringify([
        'Jusqu\'à 2000 étudiants',
        'Jusqu\'à 100 enseignants',
        'Tous modules Basic',
        'Facturation (Paiements, Frais, Bourses)',
        'Rapports (Statistiques, Export)',
        'Paiement mobile (OrangeMoney/MoovMoney)',
        'Support prioritaire 24/7'
      ]),
      modulesIncluded: JSON.stringify(MODULES_PREMIUM),
      isActive: true,
      isPopular: true,
      schoolType: 'UNIVERSITY',
    },
  })

  const uniCustom = await prisma.plan.create({
    data: {
      name: 'Université - Sur Mesure',
      description: 'Plan personnalisé pour très grandes universités',
      price: 0,
      interval: 'monthly',
      maxStudents: -1,
      maxTeachers: -1,
      features: JSON.stringify([
        'Étudiants illimités',
        'Enseignants illimités',
        'Tous modules Premium',
        'Rôles personnalisés',
        'Multi-campus',
        'Accès API',
        'Support prioritaire 24/7',
        'Formation sur site',
        'Gestionnaire de compte dédié'
      ]),
      modulesIncluded: JSON.stringify(MODULES_CUSTOM),
      isActive: true,
      schoolType: 'UNIVERSITY',
    },
  })

  // ========================================
  // 3. UNIVERSITÉ DE TEST (Mali)
  // ========================================
  console.log('🏫 Création Université (Mali)...')
  const school1 = await prisma.school.create({
    data: {
      name: 'Université des Sciences de Bamako',
      subdomain: 'usb-bamako',
      email: 'contact@usb.ml',
      phone: '+223 20 22 33 44',
      address: 'Avenue de l\'OUA, Bamako, Mali',
      schoolType: 'UNIVERSITY',
      maxStudents: 2000,
      maxTeachers: 100,
      isActive: true,
    },
  })

  // Abonnement Université Premium
  await prisma.subscription.create({
    data: {
      schoolId: school1.id,
      planId: uniPremium.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  // Admin Université
  await createUserWithBetterAuth({
    email: 'admin@usb.ml',
    password: 'Admin@2025',
    name: 'Amadou Traoré',
    role: 'SCHOOL_ADMIN',
    schoolId: school1.id,
  })

  // Année universitaire
  await prisma.anneeUniversitaire.create({
    data: {
      annee: '2024-2025',
      schoolId: school1.id,
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
      nom: 'Licence 2 Gestion',
      schoolId: school1.id,
    },
  })

  // Modules
  await prisma.module.create({
    data: {
      nom: 'Algorithmique',
      type: 'Cours Magistral',
      vh: 40,
      semestre: 'S1',
      schoolId: school1.id,
      filiereId: filiereL1.id,
    },
  })

  await prisma.module.create({
    data: {
      nom: 'Programmation Python',
      type: 'TD',
      vh: 30,
      semestre: 'S1',
      schoolId: school1.id,
      filiereId: filiereL1.id,
    },
  })

  // Enseignant Université
  const teacher1User = await createUserWithBetterAuth({
    email: 'prof@usb.ml',
    password: 'Prof@2025',
    name: 'Fatoumata Diarra',
    role: 'TEACHER',
    schoolId: school1.id,
  })
  await prisma.enseignant.create({
    data: {
      nom: 'Diarra',
      prenom: 'Fatoumata',
      titre: 'Professeur',
      telephone: '+223 76 12 34 56',
      email: 'prof@usb.ml',
      type: 'PERMANENT',
      grade: 'PROFESSEUR',
      schoolId: school1.id,
      userId: teacher1User.id,
    },
  })

  // Étudiant Université
  const student1User = await createUserWithBetterAuth({
    email: 'etudiant@usb.ml',
    password: 'Etudiant@2025',
    name: 'Moussa Keita',
    role: 'STUDENT',
    schoolId: school1.id,
  })

  const student1 = await prisma.student.create({
    data: {
      userId: student1User.id,
      schoolId: school1.id,
      studentNumber: 'USB-2024-0001',
      enrollmentId: 'ENR-2024-USB01',
      filiereId: filiereL1.id,
      niveau: 'L1',
      phone: '+223 78 11 22 33',
      isEnrolled: true,
    },
  })

  // Parent Université (optionnel pour université mais on le garde pour test)
  const parent1User = await createUserWithBetterAuth({
    email: 'parent@usb.ml',
    password: 'Parent@2025',
    name: 'Ibrahim Keita',
    role: 'PARENT',
    schoolId: school1.id,
  })
  await prisma.parent.create({
    data: {
      userId: parent1User.id,
      enrollmentId: 'ENR-2024-USB01',
      phone: '+223 79 44 55 66',
      occupation: 'Commerçant',
      isEnrolled: true,
      students: {
        connect: [{ id: student1.id }],
      },
    },
  })

  // Structure des frais
  const feeStructure1 = await prisma.feeStructure.create({
    data: {
      schoolId: school1.id,
      name: 'Frais de scolarité L1 - 2024/2025',
      amount: 250000,
      type: 'TUITION',
      niveau: 'L1',
      filiereId: filiereL1.id,
      academicYear: '2024-2025',
      dueDate: new Date('2024-11-30'),
      isActive: true,
    },
  })

  // Paiements étudiants
  await prisma.studentPayment.create({
    data: {
      studentId: student1.id,
      feeStructureId: feeStructure1.id,
      amountDue: 250000,
      amountPaid: 250000,
      status: 'PAID',
      dueDate: new Date('2024-11-30'),
      paidAt: new Date('2024-10-15'),
      paymentMethod: 'OrangeMoney',
      paidBy: student1User.id,
    },
  })

  // Bourses disponibles pour l'université
  await prisma.scholarship.create({
    data: {
      schoolId: school1.id,
      name: 'Bourse d\'excellence',
      type: 'MERIT',
      percentage: 50,
      reason: 'Pour étudiants avec moyenne supérieure à 16/20',
      academicYear: '2024-2025',
      isActive: true,
    },
  })

  await prisma.scholarship.create({
    data: {
      schoolId: school1.id,
      name: 'Aide sociale',
      type: 'NEED_BASED',
      amount: 125000,
      reason: 'Aide financière pour familles en difficulté',
      academicYear: '2024-2025',
      isActive: true,
    },
  })

  // ========================================
  // 4. LYCÉE DE TEST (Mali)
  // ========================================
  console.log('🏫 Création Lycée (Mali)...')
  const school2 = await prisma.school.create({
    data: {
      name: 'Lycée Prosper Kamara',
      subdomain: 'lycee-prosper-kamara',
      email: 'contact@lpk.ml',
      phone: '+223 20 33 44 55',
      address: 'Quartier du Fleuve, Bamako, Mali',
      schoolType: 'HIGH_SCHOOL',
      maxStudents: 1000,
      maxTeachers: 60,
      isActive: true,
    },
  })

  // Abonnement Lycée Premium
  await prisma.subscription.create({
    data: {
      schoolId: school2.id,
      planId: lyceePremium.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  // Admin Lycée
  await createUserWithBetterAuth({
    email: 'admin@lpk.ml',
    password: 'Admin@2025',
    name: 'Awa Coulibaly',
    role: 'SCHOOL_ADMIN',
    schoolId: school2.id,
  })

  // Année scolaire Lycée
  await prisma.anneeUniversitaire.create({
    data: {
      annee: '2024-2025',
      schoolId: school2.id,
    },
  })

  // Filières Lycée (Séries)
  const serieS = await prisma.filiere.create({
    data: {
      nom: 'Terminale Sciences (TSE)',
      schoolId: school2.id,
    },
  })

  const serieL = await prisma.filiere.create({
    data: {
      nom: 'Terminale Lettres (TLL)',
      schoolId: school2.id,
    },
  })

  // Modules Lycée
  await prisma.module.create({
    data: {
      nom: 'Mathématiques',
      type: 'Cours',
      vh: 6,
      semestre: 'Annuel',
      schoolId: school2.id,
      filiereId: serieS.id,
    },
  })

  await prisma.module.create({
    data: {
      nom: 'Physique-Chimie',
      type: 'Cours',
      vh: 5,
      semestre: 'Annuel',
      schoolId: school2.id,
      filiereId: serieS.id,
    },
  })

  // Enseignant Lycée
  const teacher2User = await createUserWithBetterAuth({
    email: 'prof@lpk.ml',
    password: 'Prof@2025',
    name: 'Mamadou Sangaré',
    role: 'TEACHER',
    schoolId: school2.id,
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
  const eleve1User = await createUserWithBetterAuth({
    email: 'eleve@lpk.ml',
    password: 'Eleve@2025',
    name: 'Aminata Sidibé',
    role: 'STUDENT',
    schoolId: school2.id,
  })

  const eleve1 = await prisma.student.create({
    data: {
      userId: eleve1User.id,
      schoolId: school2.id,
      studentNumber: 'LPK-2024-0001',
      enrollmentId: 'ENR-2024-LPK01',
      filiereId: serieS.id,
      niveau: 'Terminale',
      phone: '+223 77 88 99 00',
      isEnrolled: true,
    },
  })

  // Parent Lycée (obligatoire pour lycée)
  const parent2User = await createUserWithBetterAuth({
    email: 'parent@lpk.ml',
    password: 'Parent@2025',
    name: 'Oumar Sidibé',
    role: 'PARENT',
    schoolId: school2.id,
  })
  await prisma.parent.create({
    data: {
      userId: parent2User.id,
      enrollmentId: 'ENR-2024-LPK01',
      phone: '+223 65 43 21 00',
      occupation: 'Fonctionnaire',
      isEnrolled: true,
      students: {
        connect: [{ id: eleve1.id }],
      },
    },
  })

  // Structure frais Lycée
  const feeStructureLycee = await prisma.feeStructure.create({
    data: {
      schoolId: school2.id,
      name: 'Frais de scolarité Terminale - 2024/2025',
      amount: 150000,
      type: 'TUITION',
      niveau: 'Terminale',
      filiereId: serieS.id,
      academicYear: '2024-2025',
      dueDate: new Date('2024-11-30'),
      isActive: true,
    },
  })

  await prisma.studentPayment.create({
    data: {
      studentId: eleve1.id,
      feeStructureId: feeStructureLycee.id,
      amountDue: 150000,
      amountPaid: 75000,
      status: 'PARTIAL',
      dueDate: new Date('2024-11-30'),
      paidAt: new Date('2024-10-01'),
      paymentMethod: 'MoovMoney',
      paidBy: parent2User.id,
    },
  })

  // Bourses Lycée
  await prisma.scholarship.create({
    data: {
      schoolId: school2.id,
      name: 'Bourse au mérite',
      type: 'MERIT',
      percentage: 30,
      reason: 'Pour élèves avec moyenne supérieure à 15/20',
      academicYear: '2024-2025',
      isActive: true,
    },
  })

  // ========================================
  // RÉSUMÉ DES COMPTES
  // ========================================
  console.log('\n✅ Seeding terminé!')
  console.log('\n📧 === COMPTES CRÉÉS (Mali) ===')
  console.log('\n👑 SUPER ADMIN:')
  console.log('   superadmin@eduwaly.com / Saas@2025')
  console.log('\n🏛️  UNIVERSITÉ (Sciences de Bamako):')
  console.log('   Admin:     admin@usb.ml / Admin@2025')
  console.log('   Professeur: prof@usb.ml / Prof@2025')
  console.log('   Étudiant:  etudiant@usb.ml / Etudiant@2025')
  console.log('   Parent:    parent@usb.ml / Parent@2025')
  console.log('\n🏫 LYCÉE (Prosper Kamara):')
  console.log('   Admin:     admin@lpk.ml / Admin@2025')
  console.log('   Professeur: prof@lpk.ml / Prof@2025')
  console.log('   Élève:     eleve@lpk.ml / Eleve@2025')
  console.log('   Parent:    parent@lpk.ml / Parent@2025')
  console.log('\n💳 PLANS CRÉÉS:')
  console.log('   Lycée:     Essai, Starter, Basic, Premium, Sur Mesure')
  console.log('   Université: Essai, Starter, Basic, Premium, Sur Mesure')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
