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

    const { reportType, period, filters } = await request.json();
    if (!reportType || !period) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const schoolId = session.user.schoolId as string;
    let data: any = {};
    let summary: any = {};

    // Rapport académique
    if (reportType === 'academic') {
      const evaluations = await prisma.evaluation.findMany({
        where: {
          module: { schoolId },
          date: { gte: new Date(period.start), lte: new Date(period.end) },
          ...(filters.filiere && { student: { filiereId: filters.filiere } }),
          ...(filters.niveau && { student: { niveau: filters.niveau } }),
        },
        include: { student: { include: { user: true } }, module: true },
      });

      const avgNote = evaluations.reduce((sum, evaluation) => sum + evaluation.note, 0) / evaluations.length || 0;
      
      data = { evaluations };
      summary = {
        totalRecords: evaluations.length,
        averageValue: avgNote,
        trends: [{ label: 'Moyenne générale', value: avgNote, change: 0 }],
        insights: [`${evaluations.length} évaluations enregistrées`],
      };
    }

    // Rapport financier
    if (reportType === 'financial') {
      const payments = await prisma.studentPayment.findMany({
        where: {
          student: { schoolId },
          createdAt: { gte: new Date(period.start), lte: new Date(period.end) },
        },
        include: { student: { include: { user: true } } },
      });

      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      
      data = { payments };
      summary = {
        totalRecords: payments.length,
        averageValue: totalPaid / payments.length || 0,
        trends: [{ label: 'Total encaissé', value: totalPaid, change: 0 }],
        insights: [`${payments.length} paiements enregistrés`],
      };
    }

    const report = {
      reportType,
      title: `Rapport ${reportType}`,
      period,
      filters,
      data,
      summary,
      charts: [],
      generatedAt: new Date(),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Erreur génération rapport:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
