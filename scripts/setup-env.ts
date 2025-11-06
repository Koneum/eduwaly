/**
 * Script interactif pour créer le fichier .env.local
 * Usage: npx tsx scripts/setup-env.ts
 */

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { randomBytes } from 'crypto'

const ENV_PATH = join(process.cwd(), '.env.local')
const TEMPLATE_PATH = join(process.cwd(), 'env.template')

console.log('🚀 Configuration des Variables d\'Environnement\n')

// Vérifier si .env.local existe déjà
if (existsSync(ENV_PATH)) {
  console.log('⚠️  Le fichier .env.local existe déjà.')
  console.log('📝 Pour éviter d\'écraser vos données, ce script va s\'arrêter.')
  console.log('\n💡 Options:')
  console.log('   1. Supprimez .env.local et relancez ce script')
  console.log('   2. Modifiez manuellement .env.local')
  console.log('   3. Consultez SETUP_ENV_LOCAL.md pour les instructions\n')
  process.exit(0)
}

// Générer automatiquement une clé sécurisée
const generateSecret = () => {
  return randomBytes(32).toString('hex')
}

console.log('📋 Configuration Minimale Requise\n')

// Lire le template
let envContent = ''
if (existsSync(TEMPLATE_PATH)) {
  envContent = readFileSync(TEMPLATE_PATH, 'utf-8')
} else {
  // Créer un contenu minimal si le template n'existe pas
  envContent = `# Configuration générée automatiquement
# Date: ${new Date().toISOString()}

# Base de données
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Better Auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="${generateSecret()}"

# Application
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# INSTRUCTIONS:
# 1. Remplacez DATABASE_URL par votre vraie URL PostgreSQL
# 2. Si vous déployez sur Vercel, changez les URLs pour votre domaine
# 3. Redémarrez le serveur: npm run dev
`
}

// Remplacer le placeholder de BETTER_AUTH_SECRET par une vraie clé générée
const generatedSecret = generateSecret()
envContent = envContent.replace(
  /BETTER_AUTH_SECRET=".*"/,
  `BETTER_AUTH_SECRET="${generatedSecret}"`
)

// Écrire le fichier .env.local
writeFileSync(ENV_PATH, envContent, 'utf-8')

console.log('✅ Fichier .env.local créé avec succès!\n')
console.log('📝 IMPORTANT: Vous devez maintenant:')
console.log('\n1️⃣  Ouvrir le fichier .env.local')
console.log('2️⃣  Remplacer DATABASE_URL par votre vraie URL PostgreSQL')
console.log('3️⃣  Vérifier que BETTER_AUTH_URL est correct (http://localhost:3000 en local)')
console.log('4️⃣  Sauvegarder le fichier')
console.log('5️⃣  Lancer: npm run check-env pour vérifier')
console.log('6️⃣  Redémarrer: npm run dev\n')

console.log('🔐 Clé de sécurité générée automatiquement:')
console.log(`   BETTER_AUTH_SECRET="${generatedSecret}"\n`)

console.log('📚 Besoin d\'aide? Consultez SETUP_ENV_LOCAL.md\n')
console.log('🎉 Configuration prête! N\'oubliez pas de configurer DATABASE_URL.\n')
