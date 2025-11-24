import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser()

    if (!user || user.role !== 'SCHOOL_ADMIN' || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    const bulletin = await prisma.bulletin.findUnique({
      where: { id },
    })

    if (!bulletin || bulletin.schoolId !== user.schoolId) {
      // Ne pas révéler si l'ID existe pour une autre école
      return NextResponse.json({ error: 'Bulletin introuvable' }, { status: 404 })
    }

    return new NextResponse(bulletin.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du bulletin:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du bulletin' },
      { status: 500 },
    )
  }
}
