import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer les permissions d'un utilisateur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Récupérer l'utilisateur cible avec ses permissions
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Règles d'accès :
    // - SUPER_ADMIN : accès à tous
    // - SCHOOL_ADMIN : seulement utilisateurs de sa propre école
    // - autres rôles : seulement à leurs propres permissions
    if (user.role === 'SUPER_ADMIN') {
      // ok
    } else if (user.role === 'SCHOOL_ADMIN') {
      if (user.schoolId && targetUser.schoolId && user.schoolId !== targetUser.schoolId) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }
    } else {
      // autres rôles : uniquement soi-même
      if (user.id !== targetUser.id) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }
    }

    return NextResponse.json({
      userId: targetUser.id,
      role: targetUser.role,
      permissions: targetUser.permissions,
    })
  } catch (error) {
    console.error('Erreur GET /api/permissions/user/[id]:', error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des permissions de l'utilisateur" },
      { status: 500 }
    )
  }
}
