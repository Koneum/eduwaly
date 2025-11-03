/**
 * Utilitaire de génération d'email pour les étudiants
 * Format: N.Prenom@nom-etablissement.com
 */

/**
 * Génère un email pour un étudiant
 * @param firstName - Prénom de l'étudiant
 * @param lastName - Nom de l'étudiant
 * @param schoolName - Nom de l'établissement
 * @returns Email généré
 */
export function generateStudentEmail(
  firstName: string,
  lastName: string,
  schoolName: string
): string {
  // Nettoyer et normaliser les chaînes
  const cleanFirstName = firstName.trim().toLowerCase()
  const cleanLastName = lastName.trim().toLowerCase()
  const cleanSchoolName = schoolName.trim().toLowerCase()
  
  // Première lettre du nom
  const firstLetterLastName = cleanLastName.charAt(0)
  
  // Créer le domaine à partir du nom de l'école
  // Remplacer espaces et caractères spéciaux par des tirets
  const domain = cleanSchoolName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer caractères spéciaux par tirets
    .replace(/^-+|-+$/g, '') // Enlever tirets au début/fin
  
  // Construire l'email
  return `${firstLetterLastName}.${cleanFirstName}@${domain}.com`
}

/**
 * Valide un email
 * @param email - Email à valider
 * @returns true si valide
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Génère le contenu de l'email d'enrôlement
 * @param studentName - Nom de l'étudiant
 * @param email - Email généré
 * @param enrollmentCode - Code d'inscription
 * @param enrollmentUrl - URL d'enrôlement
 * @param schoolName - Nom de l'école
 * @returns Contenu HTML de l'email
 */
export function generateEnrollmentEmailContent(
  studentName: string,
  email: string,
  enrollmentCode: string,
  enrollmentUrl: string,
  schoolName: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .credentials { background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; }
    .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenue à ${schoolName}</h1>
    </div>
    
    <div class="content">
      <h2>Bonjour ${studentName},</h2>
      
      <p>Votre compte étudiant a été créé avec succès. Voici vos identifiants de connexion :</p>
      
      <div class="credentials">
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Code d'inscription :</strong> ${enrollmentCode}</p>
      </div>
      
      <p>Pour activer votre compte et définir votre mot de passe, veuillez cliquer sur le bouton ci-dessous :</p>
      
      <div style="text-align: center;">
        <a href="${enrollmentUrl}" class="button">Activer mon compte</a>
      </div>
      
      <p>Ou copiez ce lien dans votre navigateur :</p>
      <p style="word-break: break-all; color: #4F46E5;">${enrollmentUrl}</p>
      
      <p><strong>Important :</strong> Ce lien est valide pendant 30 jours. Après activation, vous pourrez vous connecter avec votre email et le mot de passe que vous aurez défini.</p>
    </div>
    
    <div class="footer">
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
      <p>&copy; ${new Date().getFullYear()} ${schoolName}. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
