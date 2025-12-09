import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer toutes les classes d'une école (lycée)
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que c'est un lycée
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { schoolType: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    if (school.schoolType !== 'HIGH_SCHOOL') {
      return NextResponse.json({ 
        error: 'Les classes sont réservées aux lycées',
        classes: []
      }, { status: 200 })
    }

    const classes = await prisma.class.findMany({
      where: { schoolId: user.schoolId },
      orderBy: [
        { niveau: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ classes })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle classe
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que c'est un lycée
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { schoolType: true }
    })

    if (!school || school.schoolType !== 'HIGH_SCHOOL') {
      return NextResponse.json({ 
        error: 'Les classes sont réservées aux lycées' 
      }, { status: 400 })
    }

    const body = await request.json()
    const { name, code, niveau, capacity, mainRoom } = body

    if (!name || !code || !niveau) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Vérifier que le code est unique pour cette école
    const existingClass = await prisma.class.findUnique({
      where: {
        code_schoolId: {
          code,
          schoolId: user.schoolId
        }
      }
    })

    if (existingClass) {
      return NextResponse.json({ error: 'Ce code de classe existe déjà' }, { status: 400 })
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        code,
        niveau,
        capacity: capacity || 30,
        mainRoom,
        schoolId: user.schoolId
      }
    })

    return NextResponse.json({ class: newClass }, { status: 201 })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
