import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')
    const studentId = searchParams.get('studentId')

    const where: Record<string, unknown> = {}
    if (moduleId) where.moduleId = moduleId

    // ✅ OPTIMISÉ: Retirer submissions include, utiliser _count
    const homework = await prisma.homework.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        dueDate: true,
        maxPoints: true,
        moduleId: true,
        enseignantId: true,
        createdAt: true,
        updatedAt: true,
        module: {
          select: {
            id: true,
            nom: true
          }
        },
        enseignant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            titre: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        },
        // Inclure submissions seulement si studentId fourni
        ...(studentId && {
          submissions: {
            where: { studentId },
            select: {
              id: true,
              status: true,
              submittedAt: true,
              grade: true,
              feedback: true
            }
          }
        })
      },
      orderBy: { dueDate: 'desc' }
    })

    return NextResponse.json({ homework })
  } catch (error) {
    console.error('Error fetching homework:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { moduleId, enseignantId, title, description, dueDate, type } = body

    if (!moduleId || !enseignantId || !title || !dueDate || !type) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const homework = await prisma.homework.create({
      data: {
        moduleId,
        enseignantId,
        title,
        description: description || '',
        type,
        dueDate: new Date(dueDate)
      },
      include: {
        module: true,
        enseignant: true
      }
    })

    return NextResponse.json({ homework }, { status: 201 })
  } catch (error) {
    console.error('Error creating homework:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
