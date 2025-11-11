import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer toutes les lignes de comparaison avec leurs valeurs
export async function GET() {
  try {
    const rows = await prisma.comparisonRow.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ],
      include: {
        values: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ rows })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle ligne de comparaison
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { category, label, order, values } = body

    if (!category || !label) {
      return NextResponse.json({ error: 'Catégorie et label requis' }, { status: 400 })
    }

    // Créer la ligne de comparaison
    const row = await prisma.comparisonRow.create({
      data: {
        category,
        label,
        order: order || 0,
        isActive: true
      }
    })

    // Créer les valeurs pour chaque plan si fournies
    if (values && Array.isArray(values)) {
      await Promise.all(
        values.map((v: { planId: string; value: string }) =>
          prisma.planComparisonValue.create({
            data: {
              planId: v.planId,
              comparisonRowId: row.id,
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
