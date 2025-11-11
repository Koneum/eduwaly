import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReportCardGenerator } from '@/components/reports/ReportCardGenerator';
import { CertificateGenerator } from '@/components/reports/CertificateGenerator';
import { AdvancedReportsManager } from '@/components/reports/AdvancedReportsManager';
import { checkFeatureAccess } from '@/lib/check-plan-limit';
import { FeatureGate } from '@/components/feature-gate';

interface PageProps {
  params: Promise<{ schoolId: string }>;
}

export default async function ReportsPage({ params }: PageProps) {
  const { schoolId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const user = session?.user as { schoolId?: string } | undefined;
  if (!session?.user || user?.schoolId !== schoolId) {
    redirect('/unauthorized');
  }

  // Vérifier si les rapports avancés sont disponibles
  const hasAdvancedReports = await checkFeatureAccess(schoolId, 'advancedReports');

  // Récupérer les étudiants
  const students = await prisma.student.findMany({
    where: { schoolId },
    include: { user: true },
    orderBy: { user: { name: 'asc' } },
  });

  const studentsData = students.map((s) => ({
    id: s.id,
    name: s.user?.name || '',
    enrollmentId: s.enrollmentId,
  }));

  // Récupérer les filières
  const filieres = await prisma.filiere.findMany({
    where: { schoolId },
    orderBy: { nom: 'asc' },
  });

  const filieresData = filieres.map((f) => ({
    id: f.id,
    nom: f.nom,
  }));

  // Année académique actuelle
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rapports et Documents</h1>
        <p className="text-muted-foreground mt-2">
          Générez des bulletins, certificats et rapports statistiques
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCardGenerator students={studentsData} academicYear={academicYear} />
        <CertificateGenerator students={studentsData} academicYear={academicYear} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {hasAdvancedReports.allowed ? (
          <AdvancedReportsManager filieres={filieresData} schoolId={schoolId} />
        ) : (
          <FeatureGate feature="advancedReports" requiredPlan="Basic">
            <AdvancedReportsManager filieres={filieresData} schoolId={schoolId} />
          </FeatureGate>
        )}
      </div>
    </div>
  );
}
