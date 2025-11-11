import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/grading/evaluation-types
 * Créer un type d'évaluation
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { schoolId, name, category, weight } = body

    if (!schoolId || !name || !category || weight === undefined) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    if (user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const evaluationType = await prisma.evaluationType.create({
      data: {
        schoolId,
        name,
        category,
        weight
      }
    })

    return NextResponse.json(evaluationType)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
