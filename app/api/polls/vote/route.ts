import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// POST - Voter sur un sondage
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { pollId, optionIds } = body

    if (!pollId || !optionIds || optionIds.length === 0) {
      return NextResponse.json({ error: 'pollId et optionIds requis' }, { status: 400 })
    }

    // Récupérer le sondage
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true
      }
    })

    if (!poll) {
      return NextResponse.json({ error: 'Sondage non trouvé' }, { status: 404 })
    }

    // Vérifier que le sondage est actif
    const now = new Date()
    if (!poll.isActive || now < poll.startDate || now > poll.endDate) {
      return NextResponse.json({ error: 'Ce sondage n\'est plus actif' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est autorisé à voter (targetRoles)
    const targetRoles = JSON.parse(poll.targetRoles)
    if (!targetRoles.includes(user.role) && !targetRoles.includes('ALL')) {
      return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à voter sur ce sondage' }, { status: 403 })
    }

    // Vérifier si l'utilisateur a déjà voté
    const existingVotes = await prisma.pollResponse.findMany({
      where: {
        pollId,
        userId: user.id
      }
    })

    if (existingVotes.length > 0 && !poll.allowMultiple) {
      return NextResponse.json({ error: 'Vous avez déjà voté sur ce sondage' }, { status: 400 })
    }

    // Si allowMultiple est false, on ne peut voter que pour une option
    if (!poll.allowMultiple && optionIds.length > 1) {
      return NextResponse.json({ error: 'Vous ne pouvez voter que pour une seule option' }, { status: 400 })
    }

    // Vérifier que les options existent
    const validOptionIds = poll.options.map(o => o.id)
    const invalidOptions = optionIds.filter((id: string) => !validOptionIds.includes(id))
    if (invalidOptions.length > 0) {
      return NextResponse.json({ error: 'Options invalides' }, { status: 400 })
    }

    // Si allowMultiple, supprimer les votes existants pour éviter les doublons
    if (poll.allowMultiple && existingVotes.length > 0) {
      await prisma.pollResponse.deleteMany({
        where: {
          pollId,
          userId: user.id
        }
      })
    }

    // Créer les votes
    const responses = await Promise.all(
      optionIds.map((optionId: string) =>
        prisma.pollResponse.create({
          data: {
            pollId,
            optionId,
            userId: user.id
          }
        })
      )
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Vote enregistré',
      responses 
    })
  } catch (error) {
    console.error('Error voting on poll:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Retirer son vote (si autorisé)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pollId = searchParams.get('pollId')

    if (!pollId) {
      return NextResponse.json({ error: 'pollId requis' }, { status: 400 })
    }

    // Vérifier que le sondage existe et est toujours actif
    const poll = await prisma.poll.findUnique({
      where: { id: pollId }
    })

    if (!poll) {
      return NextResponse.json({ error: 'Sondage non trouvé' }, { status: 404 })
    }

    const now = new Date()
    if (!poll.isActive || now > poll.endDate) {
      return NextResponse.json({ error: 'Vous ne pouvez plus modifier votre vote' }, { status: 400 })
    }

    // Supprimer les votes de l'utilisateur
    await prisma.pollResponse.deleteMany({
      where: {
        pollId,
        userId: user.id
      }
    })

    return NextResponse.json({ success: true, message: 'Vote retiré' })
  } catch (error) {
    console.error('Error removing vote:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
