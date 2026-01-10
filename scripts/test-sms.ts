/**
 * Script de test SMS Brevo
 * Usage: npx tsx scripts/test-sms.ts
 */

import 'dotenv/config'

// Utiliser une clé spécifique SMS si disponible, sinon la clé principale
const BREVO_API_KEY = process.env.BREVO_SMS_API_KEY || process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY
const BREVO_SMS_SENDER = process.env.BREVO_SMS_SENDER || 'Eduwaly'

async function testSms() {
  const testPhone = '+22393439653'
  const testMessage = 'Test SMS Schooly - Configuration reussie! Bienvenue sur la plateforme.'

  console.log('=== TEST SMS BREVO ===')
  console.log('API Key:', BREVO_API_KEY ? '✅ Configurée' : '❌ Manquante')
  console.log('Sender:', BREVO_SMS_SENDER)
  console.log('Destinataire:', testPhone)
  console.log('Message:', testMessage)
  console.log('')

  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY non configurée dans .env')
    process.exit(1)
  }

  try {
    console.log('Envoi en cours...')
    
    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: BREVO_SMS_SENDER,
        recipient: testPhone,
        content: testMessage,
        type: 'transactional',
        unicodeEnabled: true,
      }),
    })

    const responseText = await response.text()
    console.log('')
    console.log('Status:', response.status)
    console.log('Response:', responseText)

    if (response.ok) {
      const data = JSON.parse(responseText)
      console.log('')
      console.log('✅ SMS ENVOYÉ AVEC SUCCÈS!')
      console.log('Message ID:', data.messageId)
      console.log('Reference:', data.reference)
    } else {
      console.log('')
      console.log('❌ ERREUR ENVOI SMS')
      console.log('Vérifiez votre configuration Brevo')
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

testSms()
