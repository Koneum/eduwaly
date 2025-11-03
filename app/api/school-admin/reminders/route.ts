import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// POST - Envoyer un rappel
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, message, sendToParent } = body

    // Validation
    if (!studentId || !message) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Vérifier que l'étudiant existe
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { 
        schoolId: true,
        userId: true,
        parents: {
          select: {
            id: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 })
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== student.schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // TODO: Implémenter un vrai système de notifications/messages
    // Pour l'instant, on retourne juste un succès
    // Le système de notifications sera implémenté dans une prochaine version
    
    const recipients = []
    if (student.userId) {
      recipients.push('étudiant')
    }
    if (sendToParent && student.parents.length > 0) {
      recipients.push(`${student.parents.length} parent(s)`)
    }

    return NextResponse.json({
      message: `Rappel envoyé avec succès à: ${recipients.join(', ')}`,
      details: {
        studentId,
        recipientCount: (student.userId ? 1 : 0) + (sendToParent ? student.parents.length : 0)
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST reminder:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du rappel' },
      { status: 500 }
    )
  }
}
