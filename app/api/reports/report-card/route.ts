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

    const { studentId, semester, academicYear } = await request.json();
    if (!studentId || !semester || !academicYear) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // ✅ OPTIMISÉ: Select précis
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentNumber: true,
        enrollmentId: true,
        niveau: true,
        user: {
          select: {
            id: true,
            name: true
          }
        },
        filiere: {
          select: {
            id: true,
            nom: true
          }
        }
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    const evaluations = await prisma.evaluation.findMany({
      where: { studentId },
      select: {
        id: true,
        note: true,
        coefficient: true,
        type: true,
        date: true,
        moduleId: true,
        module: {
          select: {
            id: true,
            nom: true
          }
        }
      },
      orderBy: { date: 'asc' },
    });

    const moduleGrades = new Map();
    evaluations.forEach((evaluation: any) => {
      const moduleId = evaluation.moduleId;
      if (!moduleGrades.has(moduleId)) {
        moduleGrades.set(moduleId, {
          moduleId,
          moduleName: evaluation.module.nom,
          moduleCode: evaluation.module.code,
          coefficient: evaluation.module.coefficient || 1,
          evaluations: [],
        });
      }
      moduleGrades.get(moduleId).evaluations.push({
        type: evaluation.type,
        note: evaluation.note,
        maxNote: 20,
        coefficient: evaluation.coefficient,
        date: evaluation.date,
      });
    });

    const grades = Array.from(moduleGrades.values()).map((module) => {
      let totalWeighted = 0;
      let totalCoef = 0;
      module.evaluations.forEach((evaluation: any) => {
        totalWeighted += evaluation.note * evaluation.coefficient;
        totalCoef += evaluation.coefficient;
      });
      const moduleAverage = totalCoef > 0 ? totalWeighted / totalCoef : 0;
      const weightedAverage = moduleAverage * module.coefficient;
      return { ...module, moduleAverage, weightedAverage };
    });

    let totalWeighted = 0;
    let totalCoef = 0;
    grades.forEach((grade) => {
      totalWeighted += grade.weightedAverage;
      totalCoef += grade.coefficient;
    });
    const average = totalCoef > 0 ? totalWeighted / totalCoef : 0;

    const absences = await prisma.absence.findMany({
      where: { studentId },
    });

    const totalAbsences = absences.length;
    const justifiedAbsences = absences.filter((a: any) => a.justified).length;
    const unjustifiedAbsences = absences.filter((a: any) => !a.justified).length;

    const reportCard = {
      studentId: student.id,
      studentName: student.user?.name || 'N/A',
      enrollmentId: student.enrollmentId,
      filiere: student.filiere?.nom || 'N/A',
      niveau: student.niveau,
      semester,
      academicYear,
      grades,
      absences: {
        total: totalAbsences,
        justified: justifiedAbsences,
        unjustified: unjustifiedAbsences,
        percentage: (totalAbsences / 100) * 100,
      },
      average,
      generatedAt: new Date(),
    };

    return NextResponse.json(reportCard);
  } catch (error) {
    console.error('Erreur génération bulletin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
