import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Récupérer tous les templates de reçu d'une école
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

    const templates = await prisma.receiptTemplate.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Erreur lors de la récupération des templates:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des templates' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      schoolId, 
      name, 
      logoUrl, 
      headerText, 
      footerText, 
      showLogo, 
      showStamp, 
      stampUrl,
      primaryColor,
      isActive 
    } = body

    if (!schoolId || !name) {
      return NextResponse.json(
        { error: 'schoolId et name sont requis' },
        { status: 400 }
      )
    }

    // Si ce template doit être actif, désactiver tous les autres
    if (isActive) {
      await prisma.receiptTemplate.updateMany({
        where: { schoolId, isActive: true },
        data: { isActive: false }
      })
    }

    const template = await prisma.receiptTemplate.create({
      data: {
        schoolId,
        name,
        logoUrl,
        headerText,
        footerText,
        showLogo: showLogo ?? true,
        showStamp: showStamp ?? false,
        stampUrl,
        primaryColor: primaryColor || '#4F46E5',
        isActive: isActive ?? false
      }
    })

    return NextResponse.json({ 
      message: 'Template créé avec succès', 
      template 
    })
  } catch (error) {
    console.error('Erreur lors de la création du template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du template' },
      { status: 500 }
    )
  }
}
