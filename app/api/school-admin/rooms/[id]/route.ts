import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// DELETE - Supprimer une salle/classe
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'room' ou 'class'

    // Vérifier et supprimer
    if (type === 'room') {
      const existing = await prisma.room.findUnique({ where: { id } })
      
      if (!existing) {
        return NextResponse.json({ error: 'Salle non trouvée' }, { status: 404 })
      }

      if (user.role !== 'SUPER_ADMIN' && user.schoolId !== existing.schoolId) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }

      await prisma.room.delete({ where: { id } })
    } else {
      const existing = await prisma.class.findUnique({ where: { id } })
      
      if (!existing) {
        return NextResponse.json({ error: 'Classe non trouvée' }, { status: 404 })
      }

      if (user.role !== 'SUPER_ADMIN' && user.schoolId !== existing.schoolId) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }

      await prisma.class.delete({ where: { id } })
    }

    return NextResponse.json({ message: 'Supprimé avec succès' })
  } catch (error) {
    console.error('Erreur DELETE room/class:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
