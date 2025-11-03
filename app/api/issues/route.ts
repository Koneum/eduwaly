import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// GET: Récupérer les rapports de problèmes
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')
    const status = searchParams.get('status')

    // Construire la requête
    const where: any = {}
    
    if (schoolId) {
      where.schoolId = schoolId
    }
    
    if (status) {
      where.status = status
    }

    // Récupérer les rapports
    const issues = await prisma.issueReport.findMany({
      where,
      include: {
        school: {
          select: { name: true },
        },
        reportedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ issues })
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST: Créer un nouveau rapport de problème
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, priority, category, schoolId } = body

    if (!title || !description || !priority || !category || !schoolId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Créer le rapport
    const issue = await prisma.issueReport.create({
      data: {
        title,
        description,
        priority,
        category,
        schoolId,
        reportedById: user.id as string,
        status: 'OPEN',
      },
      include: {
        school: {
          select: { name: true },
        },
        reportedBy: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ issue }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du rapport:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH: Mettre à jour un rapport de problème
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { issueId, status, resolution } = body

    if (!issueId) {
      return NextResponse.json(
        { error: 'issueId requis' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'RESOLVED') {
        updateData.resolvedAt = new Date()
      }
    }
    if (resolution) updateData.resolution = resolution

    // Mettre à jour le rapport
    const issue = await prisma.issueReport.update({
      where: { id: issueId },
      data: updateData,
      include: {
        school: {
          select: { name: true },
        },
        reportedBy: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ issue })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rapport:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer un rapport de problème
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const issueId = searchParams.get('issueId')

    if (!issueId) {
      return NextResponse.json(
        { error: 'issueId requis' },
        { status: 400 }
      )
    }

    await prisma.issueReport.delete({
      where: { id: issueId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression du rapport:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
