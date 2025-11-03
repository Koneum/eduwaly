import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { sendEmail } from '@/lib/brevo-email'

// POST: Envoyer les identifiants de connexion à un enseignant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    
    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { recipientEmail } = body // Email où envoyer les infos

    // Récupérer l'enseignant avec ses infos
    const enseignant = await prisma.enseignant.findUnique({
      where: { id },
      include: {
        school: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!enseignant) {
      return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 })
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== enseignant.schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Vérifier si l'enseignant a un compte utilisateur
    if (!enseignant.user || !enseignant.user.email) {
      return NextResponse.json({ 
        error: 'Cet enseignant n\'a pas encore de compte utilisateur',
        details: 'Créez d\'abord un compte utilisateur pour cet enseignant'
      }, { status: 400 })
    }

    // Préparer le contenu de l'email
    const emailContent = {
      to: recipientEmail,
      subject: `Identifiants de connexion - ${enseignant.school.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bienvenue à ${enseignant.school.name}</h2>
          
          <p>Bonjour ${enseignant.titre} ${enseignant.prenom} ${enseignant.nom},</p>
          
          <p>Votre compte enseignant a été créé avec succès. Voici vos informations de connexion :</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">👨‍🏫 Informations de l'enseignant</h3>
            <p><strong>Nom:</strong> ${enseignant.titre} ${enseignant.prenom} ${enseignant.nom}</p>
            <p><strong>Type:</strong> ${enseignant.type}</p>
            <p><strong>Grade:</strong> ${enseignant.grade}</p>
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">🔑 Identifiants de connexion</h3>
            <p><strong>Email:</strong> <span style="font-size: 16px; color: #2563eb; font-weight: bold;">${enseignant.user.email}</span></p>
            <p><strong>Mot de passe initial:</strong> <span style="font-size: 16px; color: #2563eb; font-weight: bold;">password123</span></p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">📝 Étapes pour vous connecter</h3>
            <ol style="padding-left: 20px;">
              <li>Rendez-vous sur la page de connexion de votre établissement</li>
              <li>Entrez votre <strong>email</strong> : ${enseignant.user.email}</li>
              <li>Entrez le <strong>mot de passe initial</strong> : password123</li>
              <li>Une fois connecté, changez immédiatement votre mot de passe depuis votre profil</li>
            </ol>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">⚠️ Important :</p>
          <ul style="color: #991b1b;">
            <li>Changez votre mot de passe dès votre première connexion</li>
            <li>Ne partagez jamais vos identifiants</li>
            <li>Utilisez un mot de passe fort (minimum 8 caractères)</li>
          </ul>
          
          <p>Si vous avez des questions, n'hésitez pas à contacter l'administration.</p>
          
          <p>Cordialement,<br>
          L'équipe de ${enseignant.school.name}</p>
        </div>
      `
    }

    // Envoyer l'email via Brevo
    console.log('📧 Envoi email enseignant à:', emailContent.to)
    
    const emailResult = await sendEmail({
      to: emailContent.to,
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      senderName: enseignant.school.name,
    })

    if (!emailResult.success) {
      console.error('❌ Erreur envoi email:', emailResult.error)
      return NextResponse.json({
        error: emailResult.error || 'Erreur lors de l\'envoi de l\'email',
        details: 'Vérifiez la configuration BREVO_API_KEY dans .env.local'
      }, { status: 500 })
    }

    console.log('✅ Email enseignant envoyé avec succès! Message ID:', emailResult.messageId)

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès',
      messageId: emailResult.messageId,
      preview: process.env.NODE_ENV === 'development' ? emailContent : undefined
    })

  } catch (error) {
    console.error('Erreur envoi email enseignant:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    )
  }
}
