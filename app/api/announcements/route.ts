import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer les annonces visibles pour l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const now = new Date()
    
    // Construire la requête selon le rôle
    let where: any = {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } }
      ]
    }

    // Super Admin voit toutes les annonces
    if (user.role === 'SUPER_ADMIN') {
      // Pas de filtre supplémentaire
    } 
    // Admin voit ses annonces + annonces globales
    else if (user.role === 'SCHOOL_ADMIN') {
      where.OR = [
        { schoolId: user.schoolId },
        { schoolId: null }
      ]
    }
    // Autres rôles voient annonces de leur école + annonces globales qui les ciblent
    else {
      where.AND = [
        {
          OR: [
            { schoolId: user.schoolId },
            { schoolId: null }
          ]
        },
        {
          OR: [
            { targetAudience: { has: user.role } },
            { targetAudience: { has: 'ALL' } }
          ]
        }
      ]
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: 50
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Erreur récupération annonces:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
