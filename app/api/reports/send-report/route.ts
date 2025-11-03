import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

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

    // TODO: Gérer l'envoi aux parents quand la relation sera clarifiée dans le schéma
    // TODO: Envoyer les emails avec le PDF en pièce jointe via Resend/SendGrid

    const recipients = [];
    if (recipient === 'student' || recipient === 'both') {
      recipients.push({ type: 'student', email: student.user?.email || 'N/A' });
    }
    if (recipient === 'parent' || recipient === 'both') {
      recipients.push({ type: 'parent', email: 'À implémenter' });
    }

    // TODO: Envoyer les emails avec le PDF en pièce jointe
    // Cette partie sera implémentée avec Resend ou SendGrid

    return NextResponse.json({ 
      success: true, 
      sentTo: recipients.length,
      recipients: recipients.map(r => ({ email: r.email, type: r.type }))
    });
  } catch (error) {
    console.error('Erreur envoi rapport:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
