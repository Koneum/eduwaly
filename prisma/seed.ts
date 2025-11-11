import { PrismaClient, UserRole } from '@prisma/client'
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'

const prisma = new PrismaClient()
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
  
  // Créer l'utilisateur
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

  // Créer le compte Better Auth
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

  // Nettoyer la base de données
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

  // 1. Créer Super Admin
  console.log('👤 Création Super Admin...')
  await createUserWithBetterAuth({
    email: 'superadmin@saas.com',
    password: 'password123',
    name: 'Super Administrateur',
    role: 'SUPER_ADMIN',
  })

  // 2. Créer Plans d'abonnement
  console.log('💳 Création des plans...')
  await prisma.plan.create({
    data: {
      name: 'Essai Gratuit',
      description: 'Plan d\'essai gratuit de 30 jours',
      price: 0,
      interval: 'monthly',
      maxStudents: 50,
      maxTeachers: 5,
      features: JSON.stringify(['Gestion étudiants', 'Emplois du temps', 'Notes']),
      isActive: true,
    },
  })

  const basicPlan = await prisma.plan.create({
    data: {
      name: 'Basic',
      description: 'Plan de base pour petites écoles',
      price: 25000,
      interval: 'monthly',
      maxStudents: 100,
      maxTeachers: 10,
      features: JSON.stringify(['Gestion étudiants', 'Emplois du temps', 'Notes']),
      isActive: true,
    },
  })

  const premiumPlan = await prisma.plan.create({
    data: {
      name: 'Premium',
      description: 'Plan complet pour grandes écoles',
      price: 45000,
      interval: 'monthly',
      maxStudents: 500,
      maxTeachers: 50,
      features: JSON.stringify(['Tout Basic', 'Finance', 'Bourses', 'Analytics']),
      isActive: true,
    },
  })

  // 3. Créer École 1
  console.log('🏫 Création École 1...')
  const school1 = await prisma.school.create({
    data: {
      name: 'Lycée Excellence Dakar',
      subdomain: 'excellence-dakar',
      email: 'contact@excellence-dakar.sn',
      phone: '+221 33 123 4567',
      address: 'Rue 10, Dakar, Sénégal',
      schoolType: 'UNIVERSITY',
      maxStudents: 500,
      maxTeachers: 50,
      isActive: true,
    },
  })

  // Abonnement École 1
  await prisma.subscription.create({
    data: {
      schoolId: school1.id,
      planId: premiumPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  // Admin École 1
  const schoolAdmin1 = await createUserWithBetterAuth({
    email: 'admin@excellence-dakar.sn',
    password: 'password123',
    name: 'Amadou Diallo',
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
      nom: 'Licence 1 Sciences',
      schoolId: school1.id,
    },
  })

  const filiereL2 = await prisma.filiere.create({
    data: {
      nom: 'Licence 2 Lettres',
      schoolId: school1.id,
    },
  })

  // Modules
  await prisma.module.create({
    data: {
      nom: 'Mathématiques',
      type: 'Cours Magistral',
      vh: 40,
      semestre: 'S1',
      schoolId: school1.id,
      filiereId: filiereL1.id,
    },
  })

  // Enseignant
  const teacher1User = await createUserWithBetterAuth({
    email: 'teacher@excellence-dakar.sn',
    password: 'password123',
    name: 'Fatou Sow',
    role: 'TEACHER',
    schoolId: school1.id,
  })
  await prisma.enseignant.create({
    data: {
      nom: 'Sow',
      prenom: 'Fatou',
      titre: 'Professeur',
      telephone: '+221 77 123 4567',
      email: 'teacher@excellence-dakar.sn',
      type: 'PERMANENT',
      grade: 'PROFESSEUR',
      schoolId: school1.id,
      userId: teacher1User.id,
    },
  })

  // Étudiants
  const student1User = await createUserWithBetterAuth({
    email: 'student1@excellence-dakar.sn',
    password: 'password123',
    name: 'Moussa Ndiaye',
    role: 'STUDENT',
    schoolId: school1.id,
  })

  const student1 = await prisma.student.create({
    data: {
      userId: student1User.id,
      schoolId: school1.id,
      studentNumber: 'ETU2024001',
      enrollmentId: 'ENR-2024-STU01',
      filiereId: filiereL1.id,
      niveau: 'L1',
      phone: '+221 77 234 5678',
      isEnrolled: true,
    },
  })

  const student2User = await createUserWithBetterAuth({
    email: 'student2@excellence-dakar.sn',
    password: 'password123',
    name: 'Aïssatou Ba',
    role: 'STUDENT',
    schoolId: school1.id,
  })

  const student2 = await prisma.student.create({
    data: {
      userId: student2User.id,
      schoolId: school1.id,
      studentNumber: 'ETU2024002',
      enrollmentId: 'ENR-2024-STU02',
      filiereId: filiereL2.id,
      niveau: 'L2',
      phone: '+221 77 345 6789',
      isEnrolled: true,
    },
  })

  // Parent
  const parent1User = await createUserWithBetterAuth({
    email: 'parent@excellence-dakar.sn',
    password: 'password123',
    name: 'Ibrahima Ndiaye',
    role: 'PARENT',
    schoolId: school1.id,
  })
  await prisma.parent.create({
    data: {
      userId: parent1User.id,
      enrollmentId: 'ENR-2024-STU01',
      phone: '+221 77 456 7890',
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
      amount: 150000,
      type: 'TUITION',
      niveau: 'L1',
      filiereId: filiereL1.id,
      academicYear: '2024-2025',
      dueDate: new Date('2024-11-30'),
      isActive: true,
    },
  })

  const feeStructure2 = await prisma.feeStructure.create({
    data: {
      schoolId: school1.id,
      name: 'Frais de scolarité L2 - 2024/2025',
      amount: 180000,
      type: 'TUITION',
      niveau: 'L2',
      filiereId: filiereL2.id,
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
      amountDue: 150000,
      amountPaid: 150000,
      status: 'PAID',
      dueDate: new Date('2024-11-30'),
      paidAt: new Date('2024-10-15'),
      paymentMethod: 'Mobile Money',
      paidBy: student1User.id,
    },
  })

  await prisma.studentPayment.create({
    data: {
      studentId: student2.id,
      feeStructureId: feeStructure2.id,
      amountDue: 180000,
      amountPaid: 90000,
      status: 'PARTIAL',
      dueDate: new Date('2024-11-30'),
      paidAt: new Date('2024-10-10'),
      paymentMethod: 'Cash',
      paidBy: parent1User.id,
    },
  })

  // Bourses attribuées
  await prisma.scholarship.create({
    data: {
      schoolId: school1.id,
      studentId: student2.id,
      name: 'Bourse d\'excellence',
      type: 'MERIT',
      percentage: 50,
      reason: 'Excellent résultats académiques',
      academicYear: '2024-2025',
      isActive: true,
      approvedBy: schoolAdmin1.id,
      approvedAt: new Date(),
    },
  })

  // Bourses non attribuées (disponibles)
  await prisma.scholarship.create({
    data: {
      schoolId: school1.id,
      name: 'Bourse sportive',
      type: 'MERIT',
      percentage: 30,
      reason: 'Pour étudiants sportifs de haut niveau',
      academicYear: '2024-2025',
      isActive: true,
    },
  })

  await prisma.scholarship.create({
    data: {
      schoolId: school1.id,
      name: 'Bourse sociale',
      type: 'NEED_BASED',
      amount: 75000,
      reason: 'Aide financière pour familles en difficulté',
      academicYear: '2024-2025',
      isActive: true,
    },
  })

  await prisma.scholarship.create({
    data: {
      schoolId: school1.id,
      name: 'Réduction famille nombreuse',
      type: 'DISCOUNT',
      percentage: 20,
      reason: 'Réduction pour familles avec 3 enfants ou plus',
      academicYear: '2024-2025',
      isActive: true,
    },
  })

  // 4. Créer École 2
  console.log('🏫 Création École 2...')
  const school2 = await prisma.school.create({
    data: {
      name: 'Collège Moderne Abidjan',
      subdomain: 'moderne-abidjan',
      email: 'contact@moderne-abidjan.ci',
      phone: '+225 27 123 4567',
      address: 'Cocody, Abidjan, Côte d\'Ivoire',
      schoolType: 'HIGH_SCHOOL',
      maxStudents: 100,
      maxTeachers: 10,
      isActive: true,
    },
  })

  await prisma.subscription.create({
    data: {
      schoolId: school2.id,
      planId: basicPlan.id,
      status: 'TRIAL',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  })

  const schoolAdmin2 = await createUserWithBetterAuth({
    email: 'admin@moderne-abidjan.ci',
    password: 'password123',
    name: 'Kouassi Yao',
    role: 'SCHOOL_ADMIN',
    schoolId: school2.id,
  })

  // Signalements
  await prisma.issueReport.create({
    data: {
      schoolId: school1.id,
      reportedBy: schoolAdmin1.id,
      reporterName: 'Amadou Diallo',
      reporterEmail: 'admin@excellence-dakar.sn',
      title: 'Problème de synchronisation des paiements',
      description: 'Les paiements ne se synchronisent pas correctement avec le système',
      priority: 'HIGH',
      status: 'OPEN',
      category: 'TECHNICAL',
    },
  })

  await prisma.issueReport.create({
    data: {
      schoolId: school2.id,
      reportedBy: schoolAdmin2.id,
      reporterName: 'Kouassi Yao',
      reporterEmail: 'admin@moderne-abidjan.ci',
      title: 'Demande d\'augmentation de quota',
      description: 'Nous avons besoin de plus d\'étudiants dans notre plan',
      priority: 'MEDIUM',
      status: 'OPEN',
      category: 'FEATURE_REQUEST',
    },
  })

  console.log('✅ Seeding terminé!')
  console.log('\n📧 Comptes créés:')
  console.log('Super Admin: superadmin@saas.com / password123')
  console.log('Admin École 1: admin@excellence-dakar.sn / password123')
  console.log('Admin École 2: admin@moderne-abidjan.ci / password123')
  console.log('Enseignant: teacher@excellence-dakar.sn / password123')
  console.log('Étudiant 1: student1@excellence-dakar.sn / password123')
  console.log('Étudiant 2: student2@excellence-dakar.sn / password123')
  console.log('Parent: parent@excellence-dakar.sn / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
