import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer les informations de l'école de l'utilisateur connecté
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: {
        id: true,
        name: true,
        shortName: true,
        schoolType: true,
        gradingSystem: true,
        primaryColor: true,
        secondaryColor: true,
        logo: true,
        stamp: true,
        address: true,
        phone: true,
        email: true,
        isActive: true
      }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error('Error fetching school info:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
