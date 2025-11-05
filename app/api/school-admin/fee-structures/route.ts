import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// GET - Récupérer toutes les structures de frais
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const feeStructures = await prisma.feeStructure.findMany({
      where: { schoolId },
      include: {
        filiere: {
          select: {
            nom: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Convertir les Decimal en number pour la sérialisation JSON
    const serializedFees = feeStructures.map((fee: { amount: unknown; filiere?: { nom?: string } | null }) => ({
      ...fee,
      amount: Number(fee.amount)
    }))

    return NextResponse.json(serializedFees)
  } catch (error) {
    console.error('Erreur GET fee-structures:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des frais' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle structure de frais
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
    const { schoolId, name, amount, type, niveau, filiereId, dueDate } = body

    // Validation
    if (!schoolId || !name || !amount || !type) {
      const missing = []
      if (!schoolId) missing.push('schoolId')
      if (!name) missing.push('name')
      if (!amount) missing.push('amount')
      if (!type) missing.push('type')
      
      return NextResponse.json(
        { 
          error: 'Champs obligatoires manquants',
          missing,
          received: { schoolId, name, amount, type }
        },
        { status: 400 }
      )
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer l'année universitaire actuelle ou la plus récente
    const currentYear = await prisma.anneeUniversitaire.findFirst({
      where: { schoolId },
      orderBy: { createdAt: 'desc' }
    })

    if (!currentYear) {
      return NextResponse.json(
        { error: 'Aucune année universitaire trouvée pour cette école' },
        { status: 400 }
      )
    }

    const feeStructure = await prisma.feeStructure.create({
      data: {
        schoolId,
        name,
        amount: amount,
        type,
        niveau: niveau || null,
        filiereId: filiereId || null,
        academicYear: currentYear.annee,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        filiere: {
          select: {
            nom: true
          }
        }
      }
    })

    // Convertir le Decimal en number pour la sérialisation JSON
    const serializedFee = {
      ...feeStructure,
      amount: Number(feeStructure.amount)
    }

    return NextResponse.json(serializedFee, { status: 201 })
  } catch (error) {
    // Éviter les erreurs de console.log
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du frais',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
