import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// PUT - Mettre à jour une ligne de comparaison
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { category, label, order, values } = body

    // Mettre à jour la ligne
    const row = await prisma.comparisonRow.update({
      where: { id },
      data: {
        category,
        label,
        order
      }
    })

    // Mettre à jour les valeurs si fournies
    if (values && Array.isArray(values)) {
      // Supprimer les anciennes valeurs
      await prisma.planComparisonValue.deleteMany({
        where: { comparisonRowId: id }
      })

      // Créer les nouvelles valeurs
      await Promise.all(
        values.map((v: { planId: string; value: string }) =>
          prisma.planComparisonValue.create({
            data: {
              planId: v.planId,
              comparisonRowId: id,
              value: v.value
            }
          })
        )
      )
    }

    return NextResponse.json({ row })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une ligne de comparaison
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    await prisma.comparisonRow.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
