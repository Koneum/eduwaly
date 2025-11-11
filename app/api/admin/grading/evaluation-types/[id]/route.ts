import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/grading/evaluation-types/[id]
 * Modifier un type d'évaluation
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, category, weight } = body

    const evaluationType = await prisma.evaluationType.update({
      where: { id },
      data: { name, category, weight }
    })

    return NextResponse.json(evaluationType)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/grading/evaluation-types/[id]
 * Supprimer un type d'évaluation
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    await prisma.evaluationType.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Type supprimé' })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
