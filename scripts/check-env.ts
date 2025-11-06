/**
 * Script pour vérifier les variables d'environnement requises
 * Usage: npx tsx scripts/check-env.ts
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'BETTER_AUTH_URL',
  'BETTER_AUTH_SECRET',
] as const

const optionalEnvVars = [
  'NEXT_PUBLIC_BASE_URL',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
  'VITEPAY_API_KEY',
  'VITEPAY_API_SECRET',
  'VITEPAY_MODE',
] as const

console.log('🔍 Vérification des variables d\'environnement...\n')

// Vérifier les variables requises
console.log('📋 Variables REQUISES:')
let missingRequired = false

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar]
  if (value) {
    console.log(`✅ ${envVar}: ${maskValue(value)}`)
  } else {
    console.log(`❌ ${envVar}: MANQUANT`)
    missingRequired = true
  }
}

// Vérifier les variables optionnelles
console.log('\n📋 Variables OPTIONNELLES:')
for (const envVar of optionalEnvVars) {
  const value = process.env[envVar]
  if (value) {
    console.log(`✅ ${envVar}: ${maskValue(value)}`)
  } else {
    console.log(`⚠️  ${envVar}: Non configuré`)
  }
}

// Informations système
console.log('\n🖥️  Informations Système:')
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
console.log(`VERCEL: ${process.env.VERCEL ? 'Oui' : 'Non'}`)
if (process.env.VERCEL_URL) {
  console.log(`VERCEL_URL: ${process.env.VERCEL_URL}`)
}

// Résultat final
console.log('\n' + '='.repeat(50))
if (missingRequired) {
  console.log('❌ ERREUR: Variables requises manquantes!')
  console.log('\n📝 Consultez VERCEL_FIX_REDIRECT.md pour la configuration complète.')
  process.exit(1)
} else {
  console.log('✅ Toutes les variables requises sont configurées!')
  console.log('\n🚀 Vous pouvez déployer sur Vercel.')
  process.exit(0)
}

/**
 * Masque les valeurs sensibles en ne montrant que les premiers et derniers caractères
 */
function maskValue(value: string): string {
  if (value.length <= 8) {
    return '***'
  }
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
}
