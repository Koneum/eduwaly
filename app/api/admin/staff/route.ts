import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// GET - Récupérer tous les membres du staff
export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Seuls les SCHOOL_ADMIN peuvent voir le staff
    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const schoolId = user.schoolId

    if (!schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    // Récupérer les utilisateurs staff de l'école
    const staff = await prisma.user.findMany({
      where: {
        schoolId: schoolId || undefined,
        role: {
          in: ['MANAGER', 'PERSONNEL', 'ASSISTANT', 'SECRETARY']
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Erreur GET staff:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du staff' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau membre du staff
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role, permissions } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Vérifier que le rôle est bien un rôle staff
    if (!['MANAGER', 'PERSONNEL', 'ASSISTANT', 'SECRETARY'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      )
    }

    const schoolId = user.schoolId

    if (!schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email existe déjà' },
        { status: 400 }
      )
    }

    // Créer l'utilisateur via BetterAuth
    const signUpResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    })

    if (!signUpResponse.ok) {
      const errorData = await signUpResponse.json()
      throw new Error(errorData.error?.message || 'Erreur lors de la création du compte')
    }

    const signUpData = await signUpResponse.json()
    const userId = signUpData.user?.id

    if (!userId) {
      throw new Error('Erreur: ID utilisateur non retourné')
    }

    // Mettre à jour l'utilisateur avec le rôle et schoolId
    const createdUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        schoolId,
        isActive: true,
      }
    })

    // Créer les permissions si fournies
    if (permissions && Array.isArray(permissions)) {
      await prisma.userPermission.createMany({
        data: permissions.map((perm: { permissionId: string; canView?: boolean; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean }) => ({
          userId: createdUser.id,
          permissionId: perm.permissionId,
          canView: perm.canView || false,
          canCreate: perm.canCreate || false,
          canEdit: perm.canEdit || false,
          canDelete: perm.canDelete || false,
        }))
      })
    }

    // Récupérer l'utilisateur avec ses permissions
    const staffWithPermissions = await prisma.user.findUnique({
      where: { id: createdUser.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    return NextResponse.json(staffWithPermissions, { status: 201 })
  } catch (error) {
    console.error('Erreur POST staff:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création du staff' },
      { status: 500 }
    )
  }
}
