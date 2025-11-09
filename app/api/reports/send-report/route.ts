import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { sendReportEmail } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { studentId, reportType, recipient, semester, purpose, academicYear } = await request.json();
    
    if (!studentId || !reportType || !recipient) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Récupérer les informations de l'étudiant
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student || !student.userId) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    // Créer une notification pour l'étudiant
    if (recipient === 'student' || recipient === 'both') {
      await prisma.notification.create({
        data: {
          userId: student.userId,
          title: reportType === 'bulletin' ? 'Nouveau bulletin disponible' : 'Nouveau certificat disponible',
          message: reportType === 'bulletin' 
            ? `Votre bulletin pour le ${semester} (${academicYear}) est disponible.`
            : `Votre certificat de scolarité pour ${purpose} est disponible.`,
          type: 'INFO',
          category: 'ANNOUNCEMENT',
        },
      });
    }

    // Envoyer les emails
    const recipients = [];
    const emailsSent = [];

    if (recipient === 'student' || recipient === 'both') {
      if (student.user?.email) {
        recipients.push({ type: 'student', email: student.user.email });
        
        // Générer l'URL du PDF (à adapter selon votre stockage)
        const pdfUrl = reportType === 'bulletin' 
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/report-card?studentId=${studentId}&semester=${semester}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/certificate?studentId=${studentId}`;

        const reportTypeName = reportType === 'bulletin' ? 'Bulletin de notes' : 'Certificat de scolarité';
        
        await sendReportEmail(
          student.user.email,
          student.user.name,
          reportTypeName,
          pdfUrl
        );
        emailsSent.push(student.user.email);
      }
    }

    // Envoyer aux parents si relation existe
    if (recipient === 'parent' || recipient === 'both') {
      const parents = await prisma.parent.findMany({
        where: {
          students: {
            some: { id: studentId }
          }
        },
        include: { user: true }
      });

      for (const parent of parents) {
        if (parent.user?.email) {
          recipients.push({ type: 'parent', email: parent.user.email });
          
          const pdfUrl = reportType === 'bulletin' 
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/report-card?studentId=${studentId}&semester=${semester}`
            : `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/certificate?studentId=${studentId}`;

          const reportTypeName = reportType === 'bulletin' ? 'Bulletin de notes' : 'Certificat de scolarité';
          
          await sendReportEmail(
            parent.user.email,
            parent.user.name,
            reportTypeName,
            pdfUrl
          );
          emailsSent.push(parent.user.email);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      sentTo: emailsSent.length,
      recipients: recipients.map(r => ({ email: r.email, type: r.type }))
    });
  } catch (error) {
    console.error('Erreur envoi rapport:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
