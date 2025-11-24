import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

// PUT - Mettre à jour un template de bulletin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN' || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.pDFTemplate.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Template introuvable' }, { status: 404 })
    }

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

    // Si ce template doit être actif, désactiver les autres de l'école
    if (isActive) {
      await prisma.pDFTemplate.updateMany({
        where: { schoolId: existing.schoolId, isActive: true, NOT: { id } },
        data: { isActive: false },
      })
    }

    const updated = await prisma.pDFTemplate.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        showLogo: showLogo ?? existing.showLogo,
        logoPosition: logoPosition ?? existing.logoPosition,
        headerColor: headerColor ?? existing.headerColor,
        schoolNameSize: schoolNameSize ?? existing.schoolNameSize,
        showAddress: showAddress ?? existing.showAddress,
        showPhone: showPhone ?? existing.showPhone,
        showEmail: showEmail ?? existing.showEmail,
        showStamp: showStamp ?? existing.showStamp,
        gradeTableStyle: gradeTableStyle ?? existing.gradeTableStyle,
        footerText: footerText ?? existing.footerText,
        showSignatures: showSignatures ?? existing.showSignatures,
        isActive: isActive ?? existing.isActive,
      },
    })

    return NextResponse.json({
      message: 'Template de bulletin mis à jour avec succès',
      template: updated,
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du template bulletin:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du template bulletin' },
      { status: 500 },
    )
  }
}

// DELETE - Supprimer un template de bulletin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN' || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { id } = await params

    const existing = await prisma.pDFTemplate.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Template introuvable' }, { status: 404 })
    }

    if (existing.isActive) {
      return NextResponse.json(
        { error: 'Impossible de supprimer le template actif. Veuillez d\'abord en activer un autre.' },
        { status: 400 },
      )
    }

    await prisma.pDFTemplate.delete({ where: { id } })

    return NextResponse.json({ message: 'Template de bulletin supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du template bulletin:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du template bulletin' },
      { status: 500 },
    )
  }
}
