import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
// import * as XLSX from 'xlsx' // Package non installé - nécessite: npm install xlsx

// POST - Importer des salles/classes depuis Excel/CSV
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

    // Récupérer le type d'école
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { schoolType: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Fonctionnalité temporairement désactivée - nécessite l'installation de xlsx
    return NextResponse.json({
      error: 'Fonctionnalité d\'import temporairement désactivée',
      info: 'Pour activer cette fonctionnalité, installez le package xlsx: npm install xlsx @types/xlsx',
      details: 'Cette fonctionnalité sera disponible dans une prochaine mise à jour'
    }, { status: 501 })

    /* Code d'import commenté - nécessite xlsx
    // Parser le fichier Excel/CSV
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]

    if (data.length === 0) {
      return NextResponse.json({ error: 'Le fichier est vide' }, { status: 400 })
    }

    let count = 0
    const errors: string[] = []

    for (const row of data) {
      try {
        const name = row.Nom || row.nom || row.Name || row.name
        const code = row.Code || row.code
        const type = row.Type || row.type
        const capacity = row.Capacité || row.Capacite || row.capacity || row.Capacity
        const building = row.Bâtiment || row.Batiment || row.Building || row.building
        const floor = row.Étage || row.Etage || row.Floor || row.floor
        const niveau = row.Niveau || row.niveau || row.Level || row.level

        if (!name || !code || !capacity) {
          errors.push(`Ligne ignorée: champs manquants (Nom: ${name}, Code: ${code}, Capacité: ${capacity})`)
          continue
        }

        // Créer selon le type d'école
        if (school.schoolType === 'UNIVERSITY') {
          await prisma.room.create({
            data: {
              schoolId,
              name,
              code,
              capacity: parseInt(capacity),
              type: type || 'CLASSROOM',
              building: building || null,
              floor: floor || null
            }
          })
        } else {
          await prisma.class.create({
            data: {
              schoolId,
              name,
              code,
              capacity: parseInt(capacity),
              niveau: niveau || '',
              mainRoom: null
            }
          })
        }

        count++
      } catch (error) {
        errors.push(`Erreur ligne ${count + 1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    }

    return NextResponse.json({
      message: `Import réussi: ${count} ${school.schoolType === 'HIGH_SCHOOL' ? 'classe(s)' : 'salle(s)'} créée(s)`,
      count,
      errors: errors.length > 0 ? errors : undefined
    })
    */

  } catch (error) {
    console.error('Erreur POST import rooms:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
