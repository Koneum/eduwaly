import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer les annonces de l'école
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: any = {
      schoolId: user.schoolId
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' }
      ]
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Erreur récupération annonces:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une annonce pour l'école
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    const body = await request.json()
    const { title, content, priority, targetAudience, expiresAt } = body

    if (!title || !content || !targetAudience) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que targetAudience ne contient que TEACHER, STUDENT, PARENT
    const allowedAudience = ['TEACHER', 'STUDENT', 'PARENT', 'ALL']
    const isValid = targetAudience.every((a: string) => allowedAudience.includes(a))
    if (!isValid) {
      return NextResponse.json({ error: 'Audience invalide' }, { status: 400 })
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || 'NORMAL',
        targetAudience,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        authorId: user.id,
        authorName: user.name || 'Admin',
        authorRole: user.role,
        schoolId: user.schoolId,
      }
    })

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('Erreur création annonce:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour une annonce
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, content, priority, targetAudience, isActive, expiresAt } = body

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    // Vérifier que l'annonce appartient à l'école
    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: { schoolId: true }
    })

    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (priority !== undefined) updateData.priority = priority
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience
    if (isActive !== undefined) updateData.isActive = isActive
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Erreur mise à jour annonce:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une annonce
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    // Vérifier que l'annonce appartient à l'école
    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: { schoolId: true }
    })

    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 })
    }

    await prisma.announcement.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression annonce:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
