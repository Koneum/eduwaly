import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/appointments
 * Récupérer les rendez-vous
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    let appointments

    if (user.role === 'PARENT') {
      // Récupérer les RDV du parent
      const parent = await prisma.parent.findFirst({
        where: { userId: user.id }
      })

      if (!parent) {
        return NextResponse.json({ error: 'Parent non trouvé' }, { status: 404 })
      }

      appointments = await prisma.appointment.findMany({
        where: {
          parentId: parent.id,
          schoolId
        },
        include: {
          enseignant: {
            include: { user: true }
          },
          student: {
            include: { user: true }
          }
        },
        orderBy: { date: 'asc' }
      })
    } else if (user.role === 'TEACHER') {
      // Récupérer les RDV de l'enseignant
      const teacher = await prisma.enseignant.findFirst({
        where: { userId: user.id }
      })

      if (!teacher) {
        return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 })
      }

      appointments = await prisma.appointment.findMany({
        where: {
          enseignantId: teacher.id,
          schoolId
        },
        include: {
          parent: {
            include: { user: true }
          },
          student: {
            include: { user: true }
          }
        },
        orderBy: { date: 'asc' }
      })
    } else if (['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      // Admin voit tous les RDV
      appointments = await prisma.appointment.findMany({
        where: { schoolId },
        include: {
          parent: {
            include: { user: true }
          },
          enseignant: {
            include: { user: true }
          },
          student: {
            include: { user: true }
          }
        },
        orderBy: { date: 'asc' }
      })
    } else {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Erreur lors de la récupération des RDV:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des RDV' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/appointments
 * Créer un nouveau RDV
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!['PARENT', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { 
      enseignantId, 
      parentId,
      studentId, 
      date, 
      duration,
      location,
      subject,
      notes,
      schoolId 
    } = body

    if (!studentId || !date || !schoolId) {
      return NextResponse.json(
        { error: 'Champs requis: studentId, date, schoolId' },
        { status: 400 }
      )
    }

    let finalParentId = parentId
    let finalEnseignantId = enseignantId
    let initiatedBy = 'PARENT'

    if (user.role === 'PARENT') {
      // Le parent crée le RDV
      const parent = await prisma.parent.findFirst({
        where: { userId: user.id }
      })
      if (!parent) {
        return NextResponse.json({ error: 'Parent non trouvé' }, { status: 404 })
      }
      finalParentId = parent.id
      initiatedBy = 'PARENT'

      if (!enseignantId) {
        return NextResponse.json({ error: 'enseignantId requis' }, { status: 400 })
      }
    } else if (user.role === 'TEACHER') {
      // L'enseignant crée le RDV
      const teacher = await prisma.enseignant.findFirst({
        where: { userId: user.id }
      })
      if (!teacher) {
        return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 })
      }
      finalEnseignantId = teacher.id
      initiatedBy = 'TEACHER'

      if (!parentId) {
        return NextResponse.json({ error: 'parentId requis' }, { status: 400 })
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        parentId: finalParentId,
        enseignantId: finalEnseignantId,
        studentId,
        date: new Date(date),
        duration: duration || 15,
        location,
        subject,
        notes,
        schoolId,
        initiatedBy,
        status: 'PENDING'
      },
      include: {
        parent: { include: { user: true } },
        enseignant: { include: { user: true } },
        student: { include: { user: true } }
      }
    })

    // Créer une notification pour le destinataire
    const notifUserId = user.role === 'PARENT' 
      ? appointment.enseignant.userId 
      : appointment.parent.userId

    if (notifUserId) {
      await prisma.notification.create({
        data: {
          userId: notifUserId,
          schoolId,
          title: 'Nouvelle demande de RDV',
          message: `${user.name || 'Un utilisateur'} souhaite prendre rendez-vous concernant ${appointment.student.user?.name || 'un élève'}`,
          type: 'INFO',
          category: 'OTHER',
          actionUrl: user.role === 'PARENT' 
            ? `/teacher/${schoolId}/appointments` 
            : `/parent/${schoolId}/appointments`
        }
      })
    }

    return NextResponse.json({ success: true, appointment }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du RDV:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du RDV' },
      { status: 500 }
    )
  }
}
