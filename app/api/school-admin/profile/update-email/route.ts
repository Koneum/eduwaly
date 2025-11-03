import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// POST - Modifier l'email avec code de vérification
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { code, newEmail } = body

    if (!code || !newEmail) {
      return NextResponse.json(
        { error: 'Code et nouvel email requis' },
        { status: 400 }
      )
    }

    // Vérifier le code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code,
        type: 'email',
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Code invalide ou expiré' },
        { status: 400 }
      )
    }

    // Vérifier que le nouvel email n'est pas déjà utilisé
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail }
    })

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Mettre à jour l'email et marquer le code comme utilisé
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail }
      }),
      prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true }
      })
    ])

    return NextResponse.json({
      message: 'Email modifié avec succès'
    }, { status: 200 })

  } catch (error) {
    console.error('Erreur lors de la modification de l\'email:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'email' },
      { status: 500 }
    )
  }
}
