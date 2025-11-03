import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import bcrypt from 'bcryptjs'

// POST - Créer une nouvelle école
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      subdomain, 
      email, 
      phone, 
      address,
      schoolType,
      planId,
      adminName,
      adminEmail,
      adminPassword 
    } = body

    if (!name || !subdomain || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier si le sous-domaine existe déjà
    const existingSchool = await prisma.school.findUnique({
      where: { subdomain }
    })

    if (existingSchool) {
      return NextResponse.json({ error: 'Ce sous-domaine existe déjà' }, { status: 400 })
    }

    // Vérifier si l'email admin existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Cet email existe déjà' }, { status: 400 })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // Créer l'école avec son admin et son abonnement
    const school = await prisma.school.create({
      data: {
        name,
        subdomain,
        email,
        phone,
        address,
        schoolType: schoolType || 'UNIVERSITY',
        users: {
          create: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName || 'Administrateur',
            role: 'SCHOOL_ADMIN'
          }
        },
        ...(planId && {
          subscription: {
            create: {
              planId,
              status: 'TRIAL',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
              trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      },
      include: {
        subscription: {
          include: { plan: true }
        },
        users: true
      }
    })

    return NextResponse.json({ school }, { status: 201 })
  } catch (error) {
    console.error('Error creating school:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une ou plusieurs écoles
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')

    if (!ids) {
      return NextResponse.json({ error: 'IDs manquants' }, { status: 400 })
    }

    const schoolIds = ids.split(',')

    await prisma.school.deleteMany({
      where: {
        id: {
          in: schoolIds
        }
      }
    })

    return NextResponse.json({ success: true, deleted: schoolIds.length })
  } catch (error) {
    console.error('Error deleting schools:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
