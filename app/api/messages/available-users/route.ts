import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    const userRole = session.user.role;
    let availableUsers: any[] = [];

    // SUPER_ADMIN: Récupère tous les admins d'école (pas besoin de schoolId)
    if (userRole === 'SUPER_ADMIN') {
      const users = await prisma.user.findMany({
        where: {
          role: 'SCHOOL_ADMIN',
          id: { not: session.user.id },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          schoolId: true,
          school: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Enrichir avec le nom de l'école
      availableUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.school?.name || 'SCHOOL_ADMIN', // Afficher le nom de l'école au lieu du rôle
        image: user.image,
      }));
    }

    // ADMIN: Récupère tout le monde de l'école + Super Admins
    else if (userRole === 'SCHOOL_ADMIN') {
      if (!schoolId) {
        return NextResponse.json({ error: 'schoolId requis' }, { status: 400 });
      }

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { schoolId },
            { role: 'SUPER_ADMIN' }, // Ajouter les super admins
            { 
              student: {
                schoolId
              }
            },
            {
              enseignant: {
                schoolId
              }
            },
            {
              parent: {
                students: {
                  some: { schoolId }
                }
              }
            }
          ],
          id: { not: session.user.id }, // Exclure soi-même
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          schoolId: true,
          school: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Enrichir avec le nom de l'école pour les admins d'école
      availableUsers = users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === 'SCHOOL_ADMIN' && user.school?.name 
          ? user.school.name 
          : user.role,
        image: user.image,
      }));
    }

    // TEACHER: Récupère tout le monde de l'école
    else if (userRole === 'TEACHER') {
      if (!schoolId) {
        return NextResponse.json({ error: 'schoolId requis' }, { status: 400 });
      }

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { schoolId },
            { 
              student: {
                schoolId
              }
            },
            {
              enseignant: {
                schoolId
              }
            },
            {
              parent: {
                students: {
                  some: { schoolId }
                }
              }
            }
          ],
          id: { not: session.user.id },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          schoolId: true,
          school: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Enrichir avec le nom de l'école pour les admins d'école
      availableUsers = users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === 'SCHOOL_ADMIN' && user.school?.name 
          ? user.school.name 
          : user.role,
        image: user.image,
      }));
    }

    // STUDENT: Récupère étudiants de la même classe/filière, parents et teachers
    else if (userRole === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
        select: { 
          id: true,
          filiereId: true,
          niveau: true,
          schoolId: true,
        },
      });

      if (!student) {
        return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
      }

      // Étudiants de la même filière et niveau
      const classmates = await prisma.student.findMany({
        where: {
          schoolId: student.schoolId,
          filiereId: student.filiereId,
          niveau: student.niveau,
          userId: { not: session.user.id },
          user: { isNot: null },
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
            },
          },
        },
      });

      // Teachers de l'école
      const teachers = await prisma.user.findMany({
        where: {
          role: 'TEACHER',
          enseignant: {
            schoolId: student.schoolId
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      });

      // Parents (TODO: à implémenter quand la relation sera clarifiée)
      
      // Admins de l'école
      const admins = await prisma.user.findMany({
        where: {
          role: 'SCHOOL_ADMIN',
          schoolId: student.schoolId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      });

      availableUsers = [
        ...classmates.map(c => c.user).filter(Boolean),
        ...teachers,
        ...admins,
      ];
    }

    // PARENT: Récupère étudiants liés, teachers des étudiants et admin
    else if (userRole === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { userId: session.user.id },
        select: { 
          id: true,
          students: {
            select: {
              id: true,
              schoolId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!parent || parent.students.length === 0) {
        return NextResponse.json({ error: 'Parent sans enfants' }, { status: 404 });
      }

      const schoolIds = parent.students.map((s: any) => s.schoolId);
      const studentUsers = parent.students.map((s: any) => s.user).filter(Boolean);

      // Teachers des écoles des enfants
      const teachers = await prisma.user.findMany({
        where: {
          role: 'TEACHER',
          enseignant: {
            schoolId: { in: schoolIds }
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      });

      // Admins des écoles des enfants
      const admins = await prisma.user.findMany({
        where: {
          role: 'SCHOOL_ADMIN',
          schoolId: { in: schoolIds },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      });

      availableUsers = [
        ...studentUsers,
        ...teachers,
        ...admins,
      ];
    }

    // Dédupliquer par ID
    const uniqueUsers = Array.from(
      new Map(availableUsers.map(user => [user.id, user])).values()
    );

    return NextResponse.json({ users: uniqueUsers });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
