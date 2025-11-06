import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReportCardGenerator } from '@/components/reports/ReportCardGenerator';
import { CertificateGenerator } from '@/components/reports/CertificateGenerator';

interface PageProps {
  params: Promise<{ schoolId: string }>;
}

export default async function TeacherReportsPage({ params }: PageProps) {
  const { schoolId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const user = session?.user as { schoolId?: string } | undefined;
  if (!session?.user || user?.schoolId !== schoolId) {
    redirect('/unauthorized');
  }

  // Récupérer tous les étudiants de l'école
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

  // Année académique actuelle
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Documents Scolaires</h1>
        <p className="text-muted-foreground mt-2">
          Générez des bulletins et certificats pour vos étudiants
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCardGenerator students={studentsData} academicYear={academicYear} />
        <CertificateGenerator students={studentsData} academicYear={academicYear} />
      </div>
    </div>
  );
}
