import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Récupérer le template actif d'une école
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId requis' },
        { status: 400 }
      )
    }

    const template = await prisma.receiptTemplate.findFirst({
      where: { 
        schoolId,
        isActive: true 
      }
    })

    // Si aucun template actif, retourner un template par défaut
    if (!template) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { 
          name: true, 
          logo: true,
          primaryColor: true 
        }
      })

      return NextResponse.json({
        id: 'default',
        schoolId,
        name: 'Template par défaut',
        logoUrl: school?.logo || null,
        headerText: 'REÇU DE PAIEMENT',
        footerText: 'Merci pour votre paiement',
        showLogo: true,
        showStamp: false,
        stampUrl: null,
        primaryColor: school?.primaryColor || '#4F46E5',
        isActive: false
      })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Erreur lors de la récupération du template actif:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du template actif' },
      { status: 500 }
    )
  }
}
