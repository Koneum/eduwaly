import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// Générer un code de vérification à 6 chiffres
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST - Envoyer un code de vérification
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body // 'email' ou 'password'

    if (!type || !['email', 'password'].includes(type)) {
      return NextResponse.json(
        { error: 'Type invalide' },
        { status: 400 }
      )
    }

    // Générer le code
    const code = generateVerificationCode()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // Expire dans 15 minutes

    // Stocker le code dans la base de données en utilisant le modèle `Verification`
    // (identifier = userId, value = code)
    await prisma.verification.create({
      data: {
        id: `${user.id}-${Date.now()}`,
        identifier: user.id,
        value: code,
        expiresAt,
      }
    })

    // TODO: Envoyer le code par email
    // Pour l'instant, on retourne le code (à supprimer en production)
    console.log(`Code de vérification pour ${user.email}: ${code}`)

    return NextResponse.json({
      message: 'Code de vérification envoyé',
      // À supprimer en production:
      code: process.env.NODE_ENV === 'development' ? code : undefined
    }, { status: 200 })

  } catch (error) {
    console.error('Erreur lors de l\'envoi du code:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du code' },
      { status: 500 }
    )
  }
}
