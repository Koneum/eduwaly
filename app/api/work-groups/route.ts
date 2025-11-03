import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/work-groups
 * Récupérer les groupes de travail
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    const filiereId = searchParams.get('filiereId')

    const where: any = {
      schoolId: user.schoolId,
    }

    if (moduleId) {
      where.moduleId = moduleId
    }

    if (filiereId) {
      where.filiereId = filiereId
    }

    const workGroups = await prisma.workGroup.findMany({
      where,
      include: {
        members: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
        module: true,
        filiere: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(workGroups)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des groupes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/work-groups
 * Créer un groupe de travail
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { name, moduleId, filiereId, memberIds } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nom du groupe requis' },
        { status: 400 }
      )
    }

    // Créer le groupe
    const workGroup = await prisma.workGroup.create({
      data: {
        name,
        schoolId: user.schoolId,
        moduleId,
        filiereId,
        createdBy: user.id,
        creatorRole: user.role || 'STUDENT',
        members: {
          create: (memberIds || []).map((studentId: string, index: number) => ({
            studentId,
            role: index === 0 ? 'LEADER' : 'MEMBER',
          })),
        },
      },
      include: {
        members: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(workGroup)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du groupe' },
      { status: 500 }
    )
  }
}
