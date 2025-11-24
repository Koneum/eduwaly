import { customAlphabet } from 'nanoid'

/**
 * Génère un ID d'enrôlement unique
 * Format: ENR-YYYY-XXXXX (ex: ENR-2024-A3B5C)
 */
export function generateEnrollmentId(): string {
  const year = new Date().getFullYear()
  const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5)
  return `ENR-${year}-${nanoid()}`
}

/**
 * Génère un email automatique pour un étudiant
 * Format: prenom.nom@school-subdomain.edu
 */
export function generateEmail(
  prenom: string,
  nom: string,
  schoolSubdomain: string
): string {
  const cleanPrenom = prenom.toLowerCase().replace(/\s+/g, '')
  const cleanNom = nom.toLowerCase().replace(/\s+/g, '')
  return `${cleanPrenom}.${cleanNom}@${schoolSubdomain}.edu`
}

/**
 * Génère un mot de passe aléatoire sécurisé
 * Format: 12 caractères avec majuscules, minuscules, chiffres et symboles
 */
export function generatePassword(): string {
  const length = 12
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'
  const numbers = '23456789'
  const symbols = '!@#$%&*'
  
  const all = uppercase + lowercase + numbers + symbols
  const nanoid = customAlphabet(all, length - 4)
  
  // Garantir au moins 1 de chaque type
  const password = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    ...nanoid().split('')
  ]
  
  // Mélanger le tableau
  return password.sort(() => Math.random() - 0.5).join('')
}

/**
 * Génère un numéro étudiant unique
 * Format: STU-YYYY-NNNN (ex: STU-2024-0001)
 */
export function generateStudentNumber(year?: number): string {
  const currentYear = year || new Date().getFullYear()
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `STU-${currentYear}-${random}`
}

/**
 * Valide un ID d'enrôlement
 */
export function validateEnrollmentId(id: string): boolean {
  // Ancien format: ENR-YYYY-ABCDE (ex: ENR-2024-A3B5C)
  const oldPattern = /^ENR-\d{4}-[A-Z0-9]{5}$/

  // Nouveau format: SIGLE-YYYY-XXXX (ex: LED-2025-0002)
  // SIGLE = 2 à 10 lettres majuscules
  const newPattern = /^[A-Z]{2,10}-\d{4}-\d{4}$/

  return oldPattern.test(id) || newPattern.test(id)
}

/**
 * Génère des identifiants complets pour un utilisateur
 */
export interface GeneratedCredentials {
  email: string
  password: string
  enrollmentId: string
  studentNumber?: string
}

export function generateUserCredentials(
  prenom: string,
  nom: string,
  schoolSubdomain: string,
  includeStudentNumber: boolean = false
): GeneratedCredentials {
  const credentials: GeneratedCredentials = {
    email: generateEmail(prenom, nom, schoolSubdomain),
    password: generatePassword(),
    enrollmentId: generateEnrollmentId()
  }
  
  if (includeStudentNumber) {
    credentials.studentNumber = generateStudentNumber()
  }
  
  return credentials
}

/**
 * Formate les identifiants pour l'affichage ou l'envoi
 */
export function formatCredentialsMessage(
  credentials: GeneratedCredentials,
  schoolName: string,
  userName: string
): string {
  return `
Bonjour ${userName},

Bienvenue à ${schoolName} !

Vos identifiants de connexion ont été créés :

📧 Email: ${credentials.email}
🔑 Mot de passe: ${credentials.password}
${credentials.studentNumber ? `🎓 Numéro étudiant: ${credentials.studentNumber}\n` : ''}
🆔 ID d'enrôlement: ${credentials.enrollmentId}

Pour vous connecter :
1. Rendez-vous sur la page d'enrôlement
2. Entrez votre ID d'enrôlement
3. Complétez vos informations
4. Utilisez vos identifiants pour vous connecter

⚠️ Important : Changez votre mot de passe lors de votre première connexion.

Cordialement,
L'administration de ${schoolName}
  `.trim()
}
