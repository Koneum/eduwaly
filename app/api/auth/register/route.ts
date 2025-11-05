import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      password, 
      schoolName, 
      schoolType = 'UNIVERSITY',
      schoolEmail,
      schoolPhone,
      schoolAddress
    } = body

    // Validation
    if (!name || !email || !password || !schoolName || !schoolEmail || !schoolType) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Vérifier si l'école existe déjà
    const existingSchool = await prisma.school.findFirst({
      where: { 
        name: schoolName 
      }
    })

    if (existingSchool) {
      return NextResponse.json(
        { error: 'Une école avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    // 1. Créer l'école d'abord
    const subdomain = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()
    
    const school = await prisma.school.create({
      data: {
        name: schoolName,
        email: schoolEmail,
        phone: schoolPhone,
        address: schoolAddress,
        subdomain: subdomain,
        schoolType: schoolType,
        isActive: true,
      }
    })

    // 2. Créer l'utilisateur via l'API BetterAuth sign-up
    const signUpResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    })

    if (!signUpResponse.ok) {
      // Si l'inscription échoue, supprimer l'école créée
      await prisma.school.delete({ where: { id: school.id } })
      const errorData = await signUpResponse.json()
      throw new Error(errorData.error?.message || 'Erreur lors de la création du compte')
    }

    const signUpData = await signUpResponse.json()
    const userId = signUpData.user?.id

    if (!userId) {
      await prisma.school.delete({ where: { id: school.id } })
      throw new Error('Erreur: ID utilisateur non retourné')
    }

    // 3. Mettre à jour l'utilisateur avec le rôle et schoolId
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'SCHOOL_ADMIN',
        schoolId: school.id,
        isActive: true,
      }
    })

  // Créer l'école, l'année scolaire et l'abonnement en une transaction
  await prisma.$transaction(async (prisma) => {

      // 4. Créer l'année scolaire par défaut
      const currentYear = new Date().getFullYear()
      const nextYear = currentYear + 1

      await prisma.anneeUniversitaire.create({
        data: {
          schoolId: school.id,
          annee: `${currentYear}-${nextYear}`,
        }
      })

      // 5. Récupérer le plan d'essai gratuit
      const freePlan = await prisma.plan.findFirst({
        where: { name: 'Essai Gratuit' }
      })

      if (!freePlan) {
        throw new Error('Plan d\'essai gratuit non trouvé')
      }

      // 6. Créer l'abonnement (30 jours d'essai)
      const currentPeriodStart = new Date()
      const currentPeriodEnd = new Date()
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

      await prisma.subscription.create({
        data: {
          schoolId: school.id,
          planId: freePlan.id,
          currentPeriodStart,
          currentPeriodEnd,
          trialEndsAt: currentPeriodEnd,
          status: 'ACTIVE',
        }
      })

    })

    return NextResponse.json({
      message: 'Inscription réussie',
      schoolId: school.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      school: {
        id: school.id,
        name: school.name,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    )
  }
}
