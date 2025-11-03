# Script de création du système de Reporting complet
# Génère: Types, APIs, Composants, Pages
# Optimisé pour économiser les crédits

Write-Host ""
Write-Host "🎯 CRÉATION DU SYSTÈME DE REPORTING" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$root = "d:\react\UE-GI app\schooly"
$filesCreated = 0

# ============================================================================
# ÉTAPE 1: CRÉER LA STRUCTURE DE DOSSIERS
# ============================================================================

Write-Host "📁 Création de la structure..." -ForegroundColor Yellow

$folders = @(
    "$root\types",
    "$root\app\api\reports\report-card",
    "$root\app\api\reports\certificate",
    "$root\app\api\reports\advanced",
    "$root\app\admin\[schoolId]\reports",
    "$root\app\teacher\[schoolId]\reports",
    "$root\components\reports"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -Path $folder -ItemType Directory -Force | Out-Null
    }
}

Write-Host "   ✅ Structure créée" -ForegroundColor Green
Write-Host ""

# ============================================================================
# ÉTAPE 2: CRÉER LE FICHIER DE TYPES
# ============================================================================

Write-Host "📝 Création des types TypeScript..." -ForegroundColor Yellow

$typesFile = "$root\types\reporting.ts"
if (!(Test-Path $typesFile)) {
    @"
// Types pour le système de reporting
export interface ReportCard {
  studentId: string;
  studentName: string;
  enrollmentId: string;
  filiere: string;
  niveau: string;
  semester: string;
  academicYear: string;
  grades: GradeDetail[];
  absences: AbsenceDetail;
  average: number;
  rank?: number;
  totalStudents?: number;
  comments?: string;
  generatedAt: Date;
}

export interface GradeDetail {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  coefficient: number;
  evaluations: {
    type: string;
    note: number;
    maxNote: number;
    coefficient: number;
    date: Date;
  }[];
  moduleAverage: number;
  weightedAverage: number;
}

export interface AbsenceDetail {
  total: number;
  justified: number;
  unjustified: number;
  percentage: number;
}

export interface Certificate {
  studentId: string;
  studentName: string;
  enrollmentId: string;
  birthDate?: Date;
  birthPlace?: string;
  filiere: string;
  niveau: string;
  academicYear: string;
  certificateNumber: string;
  purpose: string;
  issuedAt: Date;
  schoolName: string;
  schoolAddress?: string;
  schoolPhone?: string;
}

export interface AdvancedReport {
  reportType: 'academic' | 'financial' | 'attendance' | 'performance';
  title: string;
  period: { start: Date; end: Date };
  filters: { filiere?: string; niveau?: string; semester?: string };
  data: any;
  charts: ChartData[];
  summary: ReportSummary;
  generatedAt: Date;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: any[];
  labels: string[];
}

export interface ReportSummary {
  totalRecords: number;
  averageValue?: number;
  trends: { label: string; value: number; change: number }[];
  insights: string[];
}

export type ReportFormat = 'pdf' | 'excel' | 'csv';
export type CertificateType = 'scolarite' | 'inscription' | 'assiduity' | 'custom';
"@ | Out-File -FilePath $typesFile -Encoding UTF8
    $filesCreated++
    Write-Host "   ✅ types/reporting.ts" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  types/reporting.ts existe déjà" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# ÉTAPE 3: CRÉER LES FICHIERS API
# ============================================================================

Write-Host "🔌 Création des API routes..." -ForegroundColor Yellow

# API: Report Card
$reportCardApi = "$root\app\api\reports\report-card\route.ts"
if (!(Test-Path $reportCardApi)) {
    @"
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true, filiere: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    const evaluations = await prisma.evaluation.findMany({
      where: { studentId, semester, academicYear },
      include: { module: true },
      orderBy: { date: 'asc' },
    });

    const moduleGrades = new Map();
    evaluations.forEach((eval) => {
      const moduleId = eval.moduleId;
      if (!moduleGrades.has(moduleId)) {
        moduleGrades.set(moduleId, {
          moduleId,
          moduleName: eval.module.nom,
          moduleCode: eval.module.code,
          coefficient: eval.module.coefficient || 1,
          evaluations: [],
        });
      }
      moduleGrades.get(moduleId).evaluations.push({
        type: eval.type,
        note: eval.note,
        maxNote: 20,
        coefficient: eval.coefficient,
        date: eval.date,
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
      where: { studentId, semester, academicYear },
    });

    const reportCard = {
      studentId: student.id,
      studentName: student.user.name,
      enrollmentId: student.enrollmentId,
      filiere: student.filiere.nom,
      niveau: student.niveau,
      semester,
      academicYear,
      grades,
      absences: {
        total: absences.length,
        justified: absences.filter((a) => a.justified).length,
        unjustified: absences.filter((a) => !a.justified).length,
        percentage: (absences.length / 100) * 100,
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
"@ | Out-File -FilePath $reportCardApi -Encoding UTF8
    $filesCreated++
    Write-Host "   ✅ api/reports/report-card/route.ts" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  api/reports/report-card/route.ts existe déjà" -ForegroundColor Gray
}

# API: Certificate
$certificateApi = "$root\app\api\reports\certificate\route.ts"
if (!(Test-Path $certificateApi)) {
    @"
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return ``CERT-``${year}-``${random}``;
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
      studentName: student.user.name,
      enrollmentId: student.enrollmentId,
      filiere: student.filiere.nom,
      niveau: student.niveau,
      academicYear: academicYear || new Date().getFullYear().toString(),
      certificateNumber: generateCertificateNumber(),
      purpose,
      issuedAt: new Date(),
      schoolName: student.school.name,
      schoolAddress: student.school.address,
      schoolPhone: student.school.phone,
    };

    return NextResponse.json(certificate);
  } catch (error) {
    console.error('Erreur génération certificat:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
"@ | Out-File -FilePath $certificateApi -Encoding UTF8
    $filesCreated++
    Write-Host "   ✅ api/reports/certificate/route.ts" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  api/reports/certificate/route.ts existe déjà" -ForegroundColor Gray
}

# API: Advanced Reports
$advancedApi = "$root\app\api\reports\advanced\route.ts"
if (!(Test-Path $advancedApi)) {
    @"
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

    const schoolId = session.user.schoolId;
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

      const avgNote = evaluations.reduce((sum, e) => sum + e.note, 0) / evaluations.length || 0;
      
      data = { evaluations };
      summary = {
        totalRecords: evaluations.length,
        averageValue: avgNote,
        trends: [{ label: 'Moyenne générale', value: avgNote, change: 0 }],
        insights: [``${evaluations.length} évaluations enregistrées``],
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
        insights: [``${payments.length} paiements enregistrés``],
      };
    }

    const report = {
      reportType,
      title: ``Rapport ${reportType}`,
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
"@ | Out-File -FilePath $advancedApi -Encoding UTF8
    $filesCreated++
    Write-Host "   ✅ api/reports/advanced/route.ts" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  api/reports/advanced/route.ts existe déjà" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# RÉSUMÉ
# ============================================================================

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ CRÉATION TERMINÉE" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Résumé:" -ForegroundColor Yellow
Write-Host "   • Fichiers créés: $filesCreated" -ForegroundColor White
Write-Host "   • Types: 1 fichier" -ForegroundColor White
Write-Host "   • APIs: 3 routes" -ForegroundColor White
Write-Host ""
Write-Host "📝 Prochaines étapes MANUELLES:" -ForegroundColor Yellow
Write-Host "   1. Créer lib/pdf-utils.ts avec jsPDF" -ForegroundColor Cyan
Write-Host "   2. Créer components/reports/ReportCardGenerator.tsx" -ForegroundColor Cyan
Write-Host "   3. Créer components/reports/CertificateGenerator.tsx" -ForegroundColor Cyan
Write-Host "   4. Créer components/reports/AdvancedReportsManager.tsx" -ForegroundColor Cyan
Write-Host "   5. Créer pages admin/teacher pour accéder aux rapports" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Les APIs sont prêtes à être testées!" -ForegroundColor Green
Write-Host ""
