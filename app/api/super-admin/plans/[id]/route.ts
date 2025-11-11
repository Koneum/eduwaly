import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

// PUT - Mettre à jour un plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      displayName,
      price,
      interval,
      description,
      features,
      maxStudents,
      maxTeachers,
      isActive,
      isPopular
    } = body

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        displayName,
        price,
        interval,
        description,
        features,
        maxStudents,
        maxTeachers,
        isActive,
        isPopular
      }
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier si le plan est utilisé par des abonnements actifs
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        planId: id,
        status: { in: ['ACTIVE', 'TRIAL'] }
      }
    })

    if (activeSubscriptions.length > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer ce plan. ${activeSubscriptions.length} abonnement(s) actif(s) l'utilisent.` },
        { status: 400 }
      )
    }

    await prisma.plan.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Plan supprimé avec succès' })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
