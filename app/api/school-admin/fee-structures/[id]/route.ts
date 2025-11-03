import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// PUT - Modifier une structure de frais
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { name, amount, type, niveau, filiereId, dueDate } = body

    // Vérifier que la structure existe et appartient à l'école
    const existing = await prisma.feeStructure.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Structure de frais non trouvée' }, { status: 404 })
    }

    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== existing.schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const updated = await prisma.feeStructure.update({
      where: { id },
      data: {
        name: name || existing.name,
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        type: type || existing.type,
        niveau: niveau !== undefined ? niveau : existing.niveau,
        filiereId: filiereId !== undefined ? filiereId : existing.filiereId,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
      },
      include: {
        filiere: {
          select: {
            nom: true
          }
        }
      }
    })

    // Convertir le Decimal en number pour la sérialisation JSON
    const serializedFee = {
      ...updated,
      amount: Number(updated.amount)
    }

    return NextResponse.json(serializedFee)
  } catch (error) {
    console.error('Erreur PUT fee-structure:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du frais' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une structure de frais
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Vérifier que la structure existe et appartient à l'école
    const existing = await prisma.feeStructure.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Structure de frais non trouvée' }, { status: 404 })
    }

    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== existing.schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await prisma.feeStructure.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Structure de frais supprimée' })
  } catch (error) {
    console.error('Erreur DELETE fee-structure:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du frais' },
      { status: 500 }
    )
  }
}
