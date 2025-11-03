import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

// GET - Récupérer un membre du staff par ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const staff = await prisma.user.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Erreur GET staff:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du staff' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un membre du staff
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, password, role, permissions } = body

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Cet email existe déjà' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour l'utilisateur
    const updateData: {
      name?: string
      email?: string
      role?: 'MANAGER' | 'PERSONNEL' | 'ASSISTANT' | 'SECRETARY'
    } = {}

    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role && ['MANAGER', 'PERSONNEL', 'ASSISTANT', 'SECRETARY'].includes(role)) {
      updateData.role = role as 'MANAGER' | 'PERSONNEL' | 'ASSISTANT' | 'SECRETARY'
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    // Mettre à jour le mot de passe si fourni
    if (password && password.length >= 6) {
      // TODO: Implémenter la mise à jour du mot de passe via BetterAuth
      // Pour l'instant, on skip cette partie
    }

    // Mettre à jour les permissions
    if (permissions && Array.isArray(permissions)) {
      // Supprimer les anciennes permissions
      await prisma.userPermission.deleteMany({
        where: { userId: id }
      })

      // Créer les nouvelles permissions
      if (permissions.length > 0) {
        await prisma.userPermission.createMany({
          data: permissions.map((perm: {
            permissionId: string
            canView: boolean
            canCreate: boolean
            canEdit: boolean
            canDelete: boolean
          }) => ({
            userId: id,
            permissionId: perm.permissionId,
            canView: perm.canView || false,
            canCreate: perm.canCreate || false,
            canEdit: perm.canEdit || false,
            canDelete: perm.canDelete || false,
          }))
        })
      }
    }

    // Récupérer l'utilisateur avec ses permissions
    const staffWithPermissions = await prisma.user.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    return NextResponse.json(staffWithPermissions)
  } catch (error) {
    console.error('Erreur PUT staff:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la modification du staff' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un membre du staff
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Supprimer l'utilisateur (les permissions seront supprimées en cascade)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' })
  } catch (error) {
    console.error('Erreur DELETE staff:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du staff' },
      { status: 500 }
    )
  }
}
