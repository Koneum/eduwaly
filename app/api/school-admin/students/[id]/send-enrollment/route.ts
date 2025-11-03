import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { generateStudentEmail } from '@/lib/email-utils'
import { sendEmail } from '@/lib/brevo-email'

// POST: Envoyer l'ID d'enrôlement et l'email auto-généré à l'étudiant
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

    // Récupérer l'étudiant avec ses infos
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        school: true,
        filiere: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 })
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== student.schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Générer l'email suggéré (si pas encore enrôlé)
    const suggestedEmail = student.user?.email || generateStudentEmail(
      student.user?.name.split(' ')[1] || '',
      student.user?.name.split(' ')[0] || '',
      student.school.name
    )

    // Préparer le contenu de l'email
    const emailContent = {
      to: recipientEmail,
      subject: `Informations d'enrôlement - ${student.school.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bienvenue à ${student.school.name}</h2>
          
          <p>Bonjour,</p>
          
          <p>Voici vos informations d'enrôlement :</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">🎓 Informations de l'étudiant</h3>
            <p><strong>Matricule:</strong> ${student.studentNumber}</p>
            <p><strong>Niveau:</strong> ${student.niveau}</p>
            ${student.filiere ? `<p><strong>Filière:</strong> ${student.filiere.nom}</p>` : ''}
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">🔑 Identifiants d'enrôlement</h3>
            <p><strong>ID d'enrôlement:</strong> <span style="font-size: 18px; color: #2563eb; font-weight: bold;">${student.enrollmentId}</span></p>
            <p><strong>Email suggéré:</strong> ${suggestedEmail}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">📝 Étapes pour créer votre compte</h3>
            <ol style="padding-left: 20px;">
              <li>Rendez-vous sur la page d'enrôlement de votre établissement</li>
              <li>Entrez votre <strong>ID d'enrôlement</strong> : ${student.enrollmentId}</li>
              <li>Sélectionnez "Je suis Étudiant"</li>
              <li>Remplissez le formulaire avec vos informations</li>
              <li>Utilisez l'email suggéré ou votre propre email</li>
              <li>Créez un mot de passe sécurisé (minimum 8 caractères)</li>
            </ol>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">⚠️ Important :</p>
          <ul style="color: #991b1b;">
            <li>Conservez précieusement votre ID d'enrôlement</li>
            <li>Ne partagez pas vos identifiants</li>
            <li>Changez votre mot de passe régulièrement</li>
          </ul>
          
          <p>Si vous avez des questions, n'hésitez pas à contacter l'administration.</p>
          
          <p>Cordialement,<br>
          L'équipe de ${student.school.name}</p>
        </div>
      `
    }

    // Envoyer l'email via Brevo
    console.log('📧 Envoi email à:', emailContent.to)
    
    const emailResult = await sendEmail({
      to: emailContent.to,
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      senderName: student.school.name,
    })

    if (!emailResult.success) {
      console.error('❌ Erreur envoi email:', emailResult.error)
      return NextResponse.json({
        error: emailResult.error || 'Erreur lors de l\'envoi de l\'email',
        details: 'Vérifiez la configuration BREVO_API_KEY dans .env.local'
      }, { status: 500 })
    }

    console.log('✅ Email envoyé avec succès! Message ID:', emailResult.messageId)

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès',
      messageId: emailResult.messageId,
      preview: process.env.NODE_ENV === 'development' ? emailContent : undefined
    })

  } catch (error) {
    console.error('Erreur envoi email:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    )
  }
}
