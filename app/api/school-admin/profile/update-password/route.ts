import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST - Modifier le mot de passe avec code de vérification
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { code, newPassword } = body

    if (!code || !newPassword) {
      return NextResponse.json(
        { error: 'Code et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Vérifier le code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code,
        type: 'password',
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

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe et marquer le code comme utilisé
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true }
      })
    ])

    return NextResponse.json({
      message: 'Mot de passe modifié avec succès'
    }, { status: 200 })

  } catch (error) {
    console.error('Erreur lors de la modification du mot de passe:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du mot de passe' },
      { status: 500 }
    )
  }
}
