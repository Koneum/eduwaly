import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

// GET - Récupérer tous les templates de bulletins d'une école
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN' || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const schoolId = searchParams.get('schoolId') || user.schoolId

    if (!schoolId || schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const templates = await prisma.pDFTemplate.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Erreur lors de la récupération des templates bulletins:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des templates bulletins' },
      { status: 500 },
    )
  }
}

// POST - Créer un nouveau template de bulletin
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN' || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      showLogo,
      logoPosition,
      headerColor,
      schoolNameSize,
      showAddress,
      showPhone,
      showEmail,
      showStamp,
      gradeTableStyle,
      footerText,
      showSignatures,
      isActive,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom du template est requis' },
        { status: 400 },
      )
    }

    const schoolId = user.schoolId

    // Si ce template doit être actif, désactiver les autres de l'école
    if (isActive) {
      await prisma.pDFTemplate.updateMany({
        where: { schoolId, isActive: true },
        data: { isActive: false },
      })
    }

    const template = await prisma.pDFTemplate.create({
      data: {
        schoolId,
        name,
        showLogo: showLogo ?? true,
        logoPosition: logoPosition ?? 'left',
        headerColor: headerColor || '#4F46E5',
        schoolNameSize: schoolNameSize ?? 24,
        showAddress: showAddress ?? true,
        showPhone: showPhone ?? true,
        showEmail: showEmail ?? true,
        showStamp: showStamp ?? true,
        gradeTableStyle: gradeTableStyle || 'detailed',
        footerText: footerText || 'Ce document est officiel et certifié conforme.',
        showSignatures: showSignatures ?? true,
        isActive: isActive ?? false,
      },
    })

    return NextResponse.json({
      message: 'Template de bulletin créé avec succès',
      template,
    })
  } catch (error) {
    console.error('Erreur lors de la création du template bulletin:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du template bulletin' },
      { status: 500 },
    )
  }
}
