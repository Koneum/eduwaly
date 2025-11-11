import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// PUT - Mettre à jour un abonnement (renouveler, suspendre)
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { subscriptionId, action, planId, months, features } = body

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'renew':
        // Renouveler l'abonnement
        const currentSub = await prisma.subscription.findUnique({
          where: { id: subscriptionId }
        })

        if (!currentSub) {
          return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 404 })
        }

        const extensionMonths = months || 1
        const newEndDate = new Date(currentSub.currentPeriodEnd)
        newEndDate.setMonth(newEndDate.getMonth() + extensionMonths)

        updateData = {
          status: 'ACTIVE',
          currentPeriodEnd: newEndDate,
          trialEndsAt: null,
          ...(planId && { planId })
        }
        break

      case 'suspend':
        // Suspendre l'abonnement
        updateData = {
          status: 'CANCELED',
          canceledAt: new Date()
        }
        break

      case 'activate':
        // Activer l'abonnement
        updateData = {
          status: 'ACTIVE',
          canceledAt: null
        }
        break

      case 'change_plan':
        // Changer le plan
        if (!planId) {
          return NextResponse.json({ error: 'Plan ID manquant' }, { status: 400 })
        }
        updateData = {
          planId
        }
        break

      case 'customize':
        // Customiser les fonctionnalités (pour plans Enterprise)
        if (features === undefined) {
          return NextResponse.json({ error: 'Features manquantes' }, { status: 400 })
        }
        // Valider que c'est du JSON valide
        try {
          if (features) JSON.parse(features)
        } catch {
          return NextResponse.json({ error: 'Format JSON invalide' }, { status: 400 })
        }
        updateData = {
          features: features || null
        }
        break

      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        plan: true,
        school: true
      }
    })

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un abonnement
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    await prisma.subscription.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
