import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import {
  canManagePermissions,
  validatePermissionGrant,
  createCustomPermissions,
  type UserRole,
  type UploadCategory,
} from '@/lib/upload-permissions-manager'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/upload-permissions
 * Récupérer les permissions d'upload personnalisées
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    // Si un userId est spécifié, récupérer ses permissions
    if (userId) {
      const permission = await prisma.userUploadPermission.findFirst({
        where: {
          userId,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      })

      return NextResponse.json(permission)
    }

    // Sinon, récupérer toutes les permissions de l'école
    const permissions = await prisma.userUploadPermission.findMany({
      where: {
        user: {
          schoolId: user.schoolId,
        },
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des permissions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/upload-permissions
 * Accorder des permissions d'upload personnalisées
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, categories, maxSizes, expiresInDays, reason } = body

    if (!userId || !categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'userId et categories sont requis' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur cible
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, schoolId: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier que l'utilisateur appartient à la même école
    if (targetUser.schoolId !== user.schoolId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez gérer que les utilisateurs de votre école' },
        { status: 403 }
      )
    }

    // Valider la demande
    const validation = validatePermissionGrant(
      user.role as UserRole,
      targetUser.role as UserRole,
      categories as UploadCategory[]
    )

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 403 })
    }

    // Désactiver les permissions existantes
    await prisma.userUploadPermission.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // Créer les nouvelles permissions
    const customPermissions = createCustomPermissions(
      userId,
      user.id,
      categories as UploadCategory[],
      maxSizes,
      expiresInDays,
      reason
    )

    const permission = await prisma.userUploadPermission.create({
      data: {
        userId: customPermissions.userId,
        grantedBy: customPermissions.grantedBy,
        grantedAt: customPermissions.grantedAt,
        customCategories: customPermissions.customCategories || [],
        customMaxSizes: customPermissions.customMaxSizes || {},
        expiresAt: customPermissions.expiresAt,
        reason: customPermissions.reason,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(permission)
  } catch (error) {
    console.error('Erreur lors de l\'octroi des permissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'octroi des permissions' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/upload-permissions
 * Révoquer des permissions d'upload personnalisées
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const permissionId = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!permissionId && !userId) {
      return NextResponse.json(
        { error: 'id ou userId requis' },
        { status: 400 }
      )
    }

    // Désactiver les permissions
    const where: any = { isActive: true }
    if (permissionId) {
      where.id = permissionId
    } else {
      where.userId = userId
    }

    // Vérifier que les permissions appartiennent à l'école
    const permission = await prisma.userUploadPermission.findFirst({
      where,
      include: {
        user: {
          select: { schoolId: true, role: true },
        },
      },
    })

    if (!permission) {
      return NextResponse.json({ error: 'Permission non trouvée' }, { status: 404 })
    }

    if (permission.user.schoolId !== user.schoolId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez gérer que les permissions de votre école' },
        { status: 403 }
      )
    }

    // Vérifier les droits de gestion
    if (!canManagePermissions(user.role as UserRole, permission.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les droits pour révoquer ces permissions' },
        { status: 403 }
      )
    }

    await prisma.userUploadPermission.updateMany({
      where,
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la révocation des permissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la révocation des permissions' },
      { status: 500 }
    )
  }
}
