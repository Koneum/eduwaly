import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { jobTitle } = await request.json()

    if (!jobTitle || typeof jobTitle !== 'string') {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      )
    }

    // Mettre à jour le jobTitle de l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: { jobTitle: jobTitle.trim() }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Titre mis à jour avec succès' 
    })
  } catch (error) {
    console.error('Error updating job title:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du titre' },
      { status: 500 }
    )
  }
}
