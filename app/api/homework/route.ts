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

    const homework = await prisma.homework.findMany({
      where,
      include: {
        module: true,
        enseignant: true,
        submissions: studentId ? {
          where: { studentId }
        } : true
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
