import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CERT-${year}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { studentId, purpose, academicYear } = await request.json();
    if (!studentId || !purpose) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true, filiere: true, school: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    const certificate = {
      studentId: student.id,
      studentName: student.user?.name || 'N/A',
      enrollmentId: student.enrollmentId,
      filiere: student.filiere?.nom || 'N/A',
      niveau: student.niveau,
      academicYear: academicYear || new Date().getFullYear().toString(),
      certificateNumber: generateCertificateNumber(),
      purpose,
      issuedAt: new Date(),
      schoolName: student.school?.name || 'N/A',
      schoolAddress: student.school?.address || undefined,
      schoolPhone: student.school?.phone || undefined,
    };

    return NextResponse.json(certificate);
  } catch (error) {
    console.error('Erreur génération certificat:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
