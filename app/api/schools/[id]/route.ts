import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schools/[id]
 * Récupérer les informations d'une école
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const school = await prisma.school.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logo: true,
        stamp: true,
        address: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        primaryColor: true,
        secondaryColor: true,
        schoolType: true,
        _count: {
          select: {
            students: true,
            enseignants: true
          }
        }
      }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
