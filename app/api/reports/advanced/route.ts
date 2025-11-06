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

  const user = session.user as { schoolId?: string };
  const schoolId = user.schoolId as string;
  let data: Record<string, unknown> = {};
  let summary: Record<string, unknown> = {};

    // Rapport académique
    if (reportType === 'academic') {
      type EvaluationRow = { note: number }
      const evaluations = await prisma.evaluation.findMany({
        where: {
          module: { schoolId },
          date: { gte: new Date(period.start), lte: new Date(period.end) },
          ...(filters.filiere && { student: { filiereId: filters.filiere } }),
          ...(filters.niveau && { student: { niveau: filters.niveau } }),
        },
        include: { student: { include: { user: true } }, module: true },
      });
      const evals = evaluations as EvaluationRow[]
      const avgNote = evals.length > 0 ? evals.reduce<number>((sum, evaluation) => sum + (Number(evaluation.note) || 0), 0) / evals.length : 0;
      
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
      type PaymentRow = { amountPaid: number | string }
      const payments = await prisma.studentPayment.findMany({
        where: {
          student: { schoolId },
          createdAt: { gte: new Date(period.start), lte: new Date(period.end) },
        },
        include: { student: { include: { user: true } } },
      });
      const payRows: PaymentRow[] = payments.map((payment: typeof payments[number]): PaymentRow => ({
        amountPaid: payment.amountPaid.toString()
      }))
      const totalPaid = payRows.reduce<number>((sum, payment) => sum + Number(payment.amountPaid || 0), 0);
      
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
