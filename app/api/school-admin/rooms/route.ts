import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// GET - Récupérer toutes les salles/classes
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const type = searchParams.get('type') // 'room' ou 'class'

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer le type d'école
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { schoolType: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Récupérer les salles (université) ou classes (lycée)
    if (school.schoolType === 'UNIVERSITY' || type === 'room') {
      const rooms = await prisma.room.findMany({
        where: { schoolId },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json(rooms)
    } else {
      const classes = await prisma.class.findMany({
        where: { schoolId },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json(classes)
    }
  } catch (error) {
    console.error('Erreur GET rooms/classes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

// POST - Créer une salle/classe
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { schoolId, name, code, capacity, type, building, floor, niveau, mainRoom } = body

    // Validation
    if (!schoolId || !name || !code || !capacity) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer le type d'école
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { schoolType: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Créer une salle (université) ou classe (lycée)
    if (school.schoolType === 'UNIVERSITY') {
      const room = await prisma.room.create({
        data: {
          schoolId,
          name,
          code,
          capacity: parseInt(capacity),
          type: type || 'CLASSROOM',
          building: building || null,
          floor: floor || null
        }
      })
      return NextResponse.json(room, { status: 201 })
    } else {
      const classe = await prisma.class.create({
        data: {
          schoolId,
          name,
          code,
          capacity: parseInt(capacity),
          niveau: niveau || '',
          mainRoom: mainRoom || null
        }
      })
      return NextResponse.json(classe, { status: 201 })
    }
  } catch (error) {
    console.error('Erreur POST room/class:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}
