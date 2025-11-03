import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// GET - Récupérer toutes les permissions
export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Seuls les SCHOOL_ADMIN peuvent voir les permissions
    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Erreur GET permissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des permissions' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle permission (SUPER_ADMIN uniquement)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category } = body

    if (!name || !description || !category) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        description,
        category
      }
    })

    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    console.error('Erreur POST permission:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la permission' },
      { status: 500 }
    )
  }
}
