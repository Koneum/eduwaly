import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Récupérer un template spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await prisma.receiptTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Erreur lors de la récupération du template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du template' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
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

    // Si ce template doit être actif, désactiver tous les autres de la même école
    if (isActive) {
      const currentTemplate = await prisma.receiptTemplate.findUnique({
        where: { id },
        select: { schoolId: true }
      })

      if (currentTemplate) {
        await prisma.receiptTemplate.updateMany({
          where: { 
            schoolId: currentTemplate.schoolId, 
            isActive: true,
            id: { not: id }
          },
          data: { isActive: false }
        })
      }
    }

    const template = await prisma.receiptTemplate.update({
      where: { id },
      data: {
        name,
        logoUrl,
        headerText,
        footerText,
        showLogo,
        showStamp,
        stampUrl,
        primaryColor,
        isActive
      }
    })

    return NextResponse.json({ 
      message: 'Template mis à jour avec succès', 
      template 
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du template' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.receiptTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Template supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du template' },
      { status: 500 }
    )
  }
}
