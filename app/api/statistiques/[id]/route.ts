import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { SEMESTRES } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const enseignant = await prisma.enseignant.findUnique({
      where: { id },
      include: {
        emplois: {
          include: {
            module: {
              include: {
                filiere: true
              }
            }
          }
        }
      }
    })

    if (!enseignant) {
      return NextResponse.json(
        { error: 'Enseignant non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer le semestre de la query string
    const url = new URL(request.url)
    const semestre = url.searchParams.get('semestre') || 'S1'

    // Filtrer les emplois du semestre
    const semestreMois = SEMESTRES[semestre as keyof typeof SEMESTRES]
    const emploisFiltered = enseignant.emplois.filter(emploi => {
      const dateDebut = new Date(emploi.dateDebut)
      const mois = dateDebut.getMonth()
      return mois >= semestreMois.DEBUT_MOIS && mois <= semestreMois.FIN_MOIS
    })

    // Calculer les statistiques
    const stats = {
      enseignant: {
        id: enseignant.id,
        nom: enseignant.nom,
        prenom: enseignant.prenom,
        grade: enseignant.grade,
        type: enseignant.type
      },
      emplois: emploisFiltered.map(emploi => ({
        dateDebut: emploi.dateDebut,
        dateFin: emploi.dateFin,
        vh: emploi.vh,
        module: {
          nom: emploi.module.nom,
          type: emploi.module.type,
          filiere: emploi.module.filiere?.nom || 'UE COMMUNE'
        }
      })),
      totalHeures: emploisFiltered.reduce((total, emploi) => total + emploi.vh, 0)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}