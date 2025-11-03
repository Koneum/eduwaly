import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// POST - Importer des étudiants depuis Excel/CSV
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const schoolId = formData.get('schoolId') as string

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId manquant' }, { status: 400 })
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // TODO: Parser le fichier Excel/CSV
    // Pour l'instant, on retourne une erreur indiquant que la fonctionnalité est en développement
    // Il faudra installer une bibliothèque comme 'xlsx' ou 'papaparse'
    
    /*
    Exemple d'implémentation future:
    
    import * as XLSX from 'xlsx'
    
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet)
    
    let count = 0
    for (const row of data) {
      // Créer chaque étudiant
      await prisma.student.create({
        data: {
          studentNumber: row.Matricule,
          niveau: row.Niveau,
          phone: row.Téléphone,
          schoolId,
          filiereId: // Trouver la filière par nom
          enrollmentId: crypto.randomUUID()
        }
      })
      count++
    }
    
    return NextResponse.json({
      message: 'Import réussi',
      count
    })
    */

    return NextResponse.json({
      error: 'Fonctionnalité d\'import en cours de développement. Veuillez installer la bibliothèque xlsx pour activer cette fonctionnalité.',
      info: 'Commande: npm install xlsx @types/xlsx'
    }, { status: 501 })

  } catch (error) {
    console.error('Erreur POST import:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import' },
      { status: 500 }
    )
  }
}
