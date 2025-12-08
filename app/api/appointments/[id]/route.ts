import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/appointments/[id]
 * Mettre à jour le statut d'un RDV
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, teacherNotes, parentNotes, date, location } = body

    // Vérifier que le RDV existe
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        parent: true,
        enseignant: true
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })
    }

    // Vérifier les droits
    const isParent = user.role === 'PARENT' && appointment.parent.userId === user.id
    const isTeacher = user.role === 'TEACHER' && appointment.enseignant.userId === user.id
    const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)

    if (!isParent && !isTeacher && !isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Construire les données de mise à jour
    const updateData: Record<string, unknown> = {}

    if (status) {
      // Seul le destinataire peut accepter/refuser
      if (status === 'CONFIRMED' || status === 'CANCELLED') {
        if (appointment.initiatedBy === 'PARENT' && !isTeacher && !isAdmin) {
          return NextResponse.json({ error: 'Seul l\'enseignant peut confirmer/annuler' }, { status: 403 })
        }
        if (appointment.initiatedBy === 'TEACHER' && !isParent && !isAdmin) {
          return NextResponse.json({ error: 'Seul le parent peut confirmer/annuler' }, { status: 403 })
        }
      }
      updateData.status = status
    }

    if (teacherNotes && isTeacher) {
      updateData.teacherNotes = teacherNotes
    }

    if (parentNotes && isParent) {
      updateData.parentNotes = parentNotes
    }

    if (date && (isAdmin || (isTeacher && appointment.initiatedBy === 'TEACHER') || (isParent && appointment.initiatedBy === 'PARENT'))) {
      updateData.date = new Date(date)
    }

    if (location) {
      updateData.location = location
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        parent: { include: { user: true } },
        enseignant: { include: { user: true } },
        student: { include: { user: true } }
      }
    })

    // Notifier le changement de statut
    if (status) {
      const notifUserId = isParent 
        ? appointment.enseignant.userId 
        : appointment.parent.userId

      if (notifUserId) {
        const statusMessages: Record<string, string> = {
          'CONFIRMED': 'a été confirmé',
          'CANCELLED': 'a été annulé',
          'COMPLETED': 'a été marqué comme terminé'
        }

        await prisma.notification.create({
          data: {
            userId: notifUserId,
            schoolId: appointment.schoolId,
            title: 'Mise à jour RDV',
            message: `Votre rendez-vous ${statusMessages[status] || 'a été mis à jour'}`,
            type: status === 'CANCELLED' ? 'WARNING' : 'INFO',
            category: 'OTHER'
          }
        })
      }
    }

    return NextResponse.json({ success: true, appointment: updatedAppointment })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du RDV:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du RDV' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/appointments/[id]
 * Supprimer un RDV
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        parent: true,
        enseignant: true
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })
    }

    // Seul l'initiateur ou un admin peut supprimer
    const isInitiator = (appointment.initiatedBy === 'PARENT' && appointment.parent.userId === user.id)
      || (appointment.initiatedBy === 'TEACHER' && appointment.enseignant.userId === user.id)
    const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)

    if (!isInitiator && !isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.appointment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression du RDV:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du RDV' },
      { status: 500 }
    )
  }
}
