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

    type UserSelect = {
      id: string
      name: string
      email?: string | null
      role?: string
      image?: string | null
      schoolId?: string | null
      school?: { name?: string | null } | null
    }

    const userRole = session.user.role;
    let availableUsers: Array<{ id: string; name: string; email?: string | null; role?: string; image?: string | null }> = [];

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
      availableUsers = users.map((user: UserSelect) => ({
        id: user.id,
        name: user.name,
        email: user.email ?? null,
        role: user.school?.name || 'SCHOOL_ADMIN', // Afficher le nom de l'école au lieu du rôle
        image: user.image ?? null,
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
      availableUsers = users.map((user: UserSelect) => ({
        id: user.id,
        name: user.name,
        email: user.email ?? null,
        role: user.role === 'SCHOOL_ADMIN' && user.school?.name 
          ? user.school.name 
          : user.role,
        image: user.image ?? null,
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
      availableUsers = users.map((user: UserSelect) => ({
        id: user.id,
        name: user.name,
        email: user.email ?? null,
        role: user.role === 'SCHOOL_ADMIN' && user.school?.name 
          ? user.school.name 
          : user.role,
        image: user.image ?? null,
      }));
    }

    // STUDENT: Récupérer tous les utilisateurs disponibles en 1 requête
    else if (userRole === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { 
          id: true,
          schoolId: true, 
          filiereId: true, 
          niveau: true 
        }
      })

      if (!student) {
        return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 })
      }

      // ✅ 1 seule requête optimisée avec OR
      const users = await prisma.user.findMany({
        where: {
          id: { not: session.user.id },
          OR: [
            // Camarades de classe
            {
              student: {
                schoolId: student.schoolId,
                filiereId: student.filiereId,
                niveau: student.niveau
              }
            },
            // Enseignants de l'école
            {
              role: 'TEACHER',
              schoolId: student.schoolId
            },
            // Admins de l'école
            {
              role: 'SCHOOL_ADMIN',
              schoolId: student.schoolId
            },
            // Parent de l'étudiant
            {
              role: 'PARENT',
              parent: {
                students: {
                  some: { id: student.id }
                }
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' }
        ]
      })

      availableUsers = users.map((user: UserSelect) => ({
        id: user.id,
        name: user.name,
        email: user.email ?? null,
        role: user.role,
        image: user.image ?? null,
      }));
    }

    // PARENT: Récupérer tous les utilisateurs disponibles en 1 requête
    else if (userRole === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          students: {
            select: {
              id: true,
              schoolId: true,
              userId: true
            },
            take: 1
          }
        }
      })

      if (!parent || !parent.students[0]) {
        return NextResponse.json({ error: 'Parent non trouvé' }, { status: 404 })
      }

      const schoolId = parent.students[0].schoolId
      const studentUserIds = parent.students.map(s => s.userId).filter((id): id is string => id !== null)

      // ✅ 1 seule requête optimisée
      const users = await prisma.user.findMany({
        where: {
          OR: [
            // Ses enfants
            { id: { in: studentUserIds } },
            // Enseignants de l'école
            { role: 'TEACHER', schoolId },
            // Admins de l'école
            { role: 'SCHOOL_ADMIN', schoolId }
          ],
          id: { not: session.user.id }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' }
        ]
      })

      availableUsers = users.map((user: UserSelect) => ({
        id: user.id,
        name: user.name,
        email: user.email ?? null,
        role: user.role,
        image: user.image ?? null,
      }));
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
