import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/pdf-templates
 * Récupérer la configuration du template PDF
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    // Récupérer le template existant ou créer avec valeurs par défaut
    let template = await prisma.pDFTemplate.findUnique({
      where: { schoolId }
    })

    if (!template) {
      // Créer un template par défaut
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { primaryColor: true }
      })

      template = await prisma.pDFTemplate.create({
        data: {
          schoolId,
          headerColor: school?.primaryColor || '#4F46E5'
        }
      })
    }

    return NextResponse.json({
      config: {
        showLogo: template.showLogo,
        logoPosition: template.logoPosition,
        headerColor: template.headerColor,
        schoolNameSize: template.schoolNameSize,
        showAddress: template.showAddress,
        showPhone: template.showPhone,
        showEmail: template.showEmail,
        showStamp: template.showStamp,
        footerText: template.footerText,
        gradeTableStyle: template.gradeTableStyle,
        showSignatures: template.showSignatures
      }
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/admin/pdf-templates
 * Sauvegarder la configuration du template PDF
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { schoolId, config } = body

    if (!schoolId || user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Upsert (créer ou mettre à jour) le template
    const template = await prisma.pDFTemplate.upsert({
      where: { schoolId },
      create: {
        schoolId,
        showLogo: config.showLogo,
        logoPosition: config.logoPosition,
        headerColor: config.headerColor,
        schoolNameSize: config.schoolNameSize,
        showAddress: config.showAddress,
        showPhone: config.showPhone,
        showEmail: config.showEmail,
        showStamp: config.showStamp,
        footerText: config.footerText,
        gradeTableStyle: config.gradeTableStyle,
        showSignatures: config.showSignatures
      },
      update: {
        showLogo: config.showLogo,
        logoPosition: config.logoPosition,
        headerColor: config.headerColor,
        schoolNameSize: config.schoolNameSize,
        showAddress: config.showAddress,
        showPhone: config.showPhone,
        showEmail: config.showEmail,
        showStamp: config.showStamp,
        footerText: config.footerText,
        gradeTableStyle: config.gradeTableStyle,
        showSignatures: config.showSignatures
      }
    })
    
    return NextResponse.json({
      message: 'Template sauvegardé avec succès',
      config: template
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
