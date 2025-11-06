import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { UserRole } from '@/app/generated/prisma'

// GET - Récupérer tous les utilisateurs de l'école
export async function GET() {
  try {
    const authUser = await getAuthUser()

    if (!authUser || (authUser.role !== 'SCHOOL_ADMIN' && authUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const schoolId = authUser.schoolId
    if (!schoolId) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Récupérer tous les utilisateurs de l'école
    const users = await prisma.user.findMany({
      where: {
        schoolId: schoolId,
        role: {
          not: 'SUPER_ADMIN' // Exclure les super admins
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            studentNumber: true,
            niveau: true,
            filiere: {
              select: {
                nom: true
              }
            }
          }
        },
        enseignant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            titre: true
          }
        },
        parent: {
          select: {
            id: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ users }, { status: 200 })

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()

    if (!authUser || (authUser.role !== 'SCHOOL_ADMIN' && authUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const schoolId = authUser.schoolId
    if (!schoolId) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    const body = await request.json()
    const { name, email, password, role } = body

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que le rôle est autorisé
    const allowedRoles = ['STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rôle non autorisé' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Créer l'utilisateur avec Better Auth (gère le hashing automatiquement)
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        role,
      }
    })

    if (!signUpResult || !signUpResult.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }

    // Mettre à jour l'utilisateur avec schoolId
    await prisma.user.update({
      where: { id: signUpResult.user.id },
      data: { schoolId }
    })

    // Récupérer l'utilisateur complet avec tous les champs
    const user = await prisma.user.findUnique({
      where: { id: signUpResult.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'utilisateur' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Utilisateur créé avec succès',
      user
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser()

    if (!authUser || (authUser.role !== 'SCHOOL_ADMIN' && authUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const schoolId = authUser.schoolId
    if (!schoolId) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    const body = await request.json()
    const { userId, name, isActive, role } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur appartient à l'école
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        schoolId: schoolId
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Empêcher la modification du rôle SUPER_ADMIN
    if (existingUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Impossible de modifier un super administrateur' },
        { status: 403 }
      )
    }

    // Préparer les données de mise à jour
    const updateData: {
      name?: string
      isActive?: boolean
      role?: UserRole
    } = {}
    if (name !== undefined) updateData.name = name
    if (isActive !== undefined) updateData.isActive = isActive
    if (role !== undefined) {
      const allowedRoles: UserRole[] = ['STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN']
      if (!allowedRoles.includes(role as UserRole)) {
        return NextResponse.json(
          { error: 'Rôle non autorisé' },
          { status: 400 }
        )
      }
      updateData.role = role as UserRole
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser
    }, { status: 200 })

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()

    if (!authUser || (authUser.role !== 'SCHOOL_ADMIN' && authUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const schoolId = authUser.schoolId
    if (!schoolId) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur appartient à l'école
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        schoolId: schoolId
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Empêcher la suppression du rôle SUPER_ADMIN
    if (existingUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un super administrateur' },
        { status: 403 }
      )
    }

    // Empêcher l'admin de se supprimer lui-même
    if (existingUser.id === authUser.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 403 }
      )
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      message: 'Utilisateur supprimé avec succès'
    }, { status: 200 })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    )
  }
}
