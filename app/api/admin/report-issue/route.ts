import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user as { role?: string; schoolId?: string } | undefined;
    
    if (!session?.user || user?.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { type, message } = await request.json();
    
    if (!type || !message) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Récupérer l'école de l'admin
    const school = await prisma.school.findUnique({
      where: { id: user?.schoolId as string },
      select: { name: true },
    });

    const typeLabels: Record<string, string> = {
      bug: '🐛 Bug',
      suggestion: '💡 Suggestion',
      question: '❓ Question',
      other: '📝 Autre',
    };

    // Mapper les types vers les catégories Prisma
    const categoryMap: Record<string, string> = {
      bug: 'BUG',
      suggestion: 'FEATURE_REQUEST',
      question: 'SUPPORT',
      other: 'OTHER',
    };

    // Mapper les types vers les priorités
    const priorityMap: Record<string, string> = {
      bug: 'HIGH',
      suggestion: 'MEDIUM',
      question: 'LOW',
      other: 'LOW',
    };

    // Notifier tous les super-admins
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true, name: true, email: true },
    });

    console.log('Super admins trouvés:', superAdmins.length, superAdmins);

    if (superAdmins.length > 0) {
      const notifications = await Promise.all(
        superAdmins.map((admin: { id: string; name?: string | null; email?: string | null }) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: `${typeLabels[type] || type} - ${school?.name || 'École'}`,
              message: message.substring(0, 200),
              type: 'WARNING',
              category: 'SYSTEM',
              actionUrl: '/super-admin/notifications',
              actionLabel: 'Voir les signalements',
            },
          })
        )
      );
      console.log('Notifications créées:', notifications.length);
    } else {
      console.warn('Aucun super admin trouvé dans la base de données');
    }

    // Créer le signalement dans la base de données
    const issueReport = await prisma.issueReport.create({
      data: {
        schoolId: user?.schoolId as string,
        reportedBy: session.user.id,
        reporterName: session.user.name || 'Inconnu',
        reporterEmail: session.user.email || '',
        title: `${typeLabels[type] || type} - ${school?.name || 'École'}`,
        description: message,
        priority: (priorityMap[type] || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        category: (categoryMap[type] || 'OTHER') as 'TECHNICAL' | 'BILLING' | 'FEATURE_REQUEST' | 'BUG' | 'SUPPORT' | 'OTHER',
        status: 'OPEN',
      },
    });

    console.log('IssueReport créé:', issueReport.id);
    
    return NextResponse.json({ 
      success: true, 
      notified: superAdmins.length,
      issueId: issueReport.id,
      superAdmins: superAdmins.map((sa: { id: string; name?: string | null; email?: string | null }) => ({ id: sa.id, name: sa.name, email: sa.email }))
    });
  } catch (error) {
    console.error('Erreur signalement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
